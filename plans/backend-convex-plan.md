# Plan del Backend en Convex — FROGL

## 1. Contexto y estado actual

FROGL es un evaluador de pitches con jurado híbrido (agentes con RAG + humanos, en vivo).
El front es Next.js 16 + React 19; el backend está **enteramente en Convex** (`convex/`).

### Inventario del backend (lo que YA existe y está sano)

| Archivo | Estado | Contenido |
|---|---|---|
| [`convex/schema.ts`](convex/schema.ts:1) | ✅ | 9 tablas + vector index: `sessions`, `profiles`, `seats`, `transcript`, `reactions`, `questions`, `scores`, `messages`, `chunks` |
| [`convex/profiles.ts`](convex/profiles.ts:1) | ✅ | 4 jurados (persona, rúbrica, `contextPolicy`, `retrievalTag`, `reactEveryMs`) + `list` + `seed` idempotente |
| [`convex/sessions.ts`](convex/sessions.ts:1) | ✅ | `create` (siembra 4 asientos de agente), `start`, `end` |
| [`convex/seats.ts`](convex/seats.ts:1) | ✅ | `list`, `joinHuman`, `leave` |
| [`convex/transcript.ts`](convex/transcript.ts:1) | ✅ | `append` + `live` |
| [`convex/jury.ts`](convex/jury.ts:1) | ✅ | `react` (reacción en vivo) + `score` (scorecard final) como actions + helpers internos |
| [`convex/rag.ts`](convex/rag.ts:1) | ✅ | `ingest` (embedding 1536d) + `retrieve` (vectorSearch por tag) |
| [`convex/live.ts`](convex/live.ts:1) | ✅ | Queries de lectura + `send` (chat) + `answerQuestion` |

### Brechas (lo que falta, todo backend-owned)

1. **El loop de reacción** — nada dispara `jury.react` cada `profile.reactEveryMs`. Es el corazón del producto y no existe.
2. **Scoring al finalizar** — `jury.score` existe pero nada lo ejecuta cuando la sesión termina.
3. **Seed del corpus RAG** — `rag.ingest` existe pero no hay corpus sembrado por tag.
4. **Mutaciones para humanos** — reacciones y preguntas solo tienen camino de agente; los humanos del panel no pueden reaccionar/preguntar.
5. **Pipeline de transcript** — `append` acepta todo sin throttling ni manejo de parciales (`final:false`).
6. **TTS para preguntas habladas** — no hay contrato para que el front (speechSynthesis de Chrome) lea en voz alta las preguntas del jurado.

### Restricciones y entorno

- **Convex es la única opción** de backend. API: `convex@^1.45.0` (cron via `crons.interval` en `schema.ts`).
- **Setup pendiente**: `node_modules` no está instalado y `convex/_generated` no existe. Sin `npx convex dev` nada compila (los imports `./_generated/server` fallan).
- **STT/TTS (tu área)**: Web Speech API de Chrome en Linux Mint para STT del presentador y TTS de las preguntas del jurado. Vapi queda reservado para las preguntas en voz alta (el momento que impresiona).
- **Modelos**: `AI_GATEWAY_API_KEY` en env vars de Convex; `anthropic/claude-sonnet-5` para el jurado, `openai/text-embedding-3-small` (1536d) para el RAG.

## 2. Arquitectura objetivo (a alto nivel)

```
┌─────────────────────────── Browser (Chrome, Linux Mint) ───────────────────────────┐
│                                                                                     │
│  Presentador                    Panel del jurado (front)                             │
│  ┌──────────────┐              ┌───────────────────────────────┐                    │
│  │ Web Speech   │              │  Suscripción Convex:          │                    │
│  │ API (STT)    │──parciales──▶│  transcript, reactions,       │                    │
│  │              │              │  questions, scores, messages  │                    │
│  └──────────────┘              └───────────────────────────────┘                    │
│        │                          │        │                     │                 │
│        │ transcript.append        │        │ speakJobs (TTS)     │ sendReaction/    │
│        ▼                          ▼        ▼                     │ askQuestion      │
└───────┬───────────────────────────┬────────┼─────────────────────┼─────────────────┘
        │                           │        │                     │
        ▼                           ▼        ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONVEX (backend único)                            │
│                                                                               │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐           │
│  │ sessions / │   │ transcript │   │   jury     │   │    rag     │           │
│  │ seats      │   │ (STT sink) │   │ react+score│   │ ingest+    │           │
│  └────────────┘   └────────────┘   └────────────┘   │ retrieve   │           │
│                                                      └────────────┘           │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ Cron (crons.interval) → scheduler → jury.react cada reactEveryMs    │      │
│  │ End de sesión → programa jury.score por asiento                     │      │
│  │ RAG seed → corpus por retrievalTag (4 tags)                         │      │
│  │ speakJobs → cola para TTS (consumida por Chrome speechSynthesis)    │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Decisiones de diseño (tradeoffs)**

| Decisión | Por qué | Tradeoff |
|---|---|---|
| Cron global cada ~5s en vez de `ctx.scheduler.runAfter` por seat | Un solo cron barre las sesiones `live` y decide quién reacciona; no hay que gestionar N jobs ni re-agendar al crear/seating | Latencias de reacción hasta ~5s; aceptable para un pitch |
| Throttle con `lastReactedAtMs` guardado en el seat | Idempotencia del react por seat; el cron no necesita calcular ventanas | Un campo extra en `seats` |
| Voz: no hay modelo de audio en backend | El backend **no genera audio**: encola `speakJobs` y el front (speechSynthesis) los reproduce | Depende del browser/OS; Linux Mint usa voces locales |
| `append` trata parciales (`final:false`) | Evitar spam del STT; solo el texto final entra al transcript definitivo | Complejidad extra en el sink |

## 3. Pasos de implementación (todos en el backend)

### Paso 0 — Setup y verificación
- `npm install`
- `npx convex dev` (login + crea `convex/_generated`; **sin esto nada compila**)
- Cargar `AI_GATEWAY_API_KEY` en Dashboard de Convex → Settings → Environment Variables
- Verificar que `convex/profiles.ts::seed` corre una vez (dashboard o front)

### Paso 1 — Cron para el loop de reacción
**Archivo:** [`convex/schema.ts`](convex/schema.ts:1)
- Exportar `crons = defineCrons(...)` con `crons.interval(..., { minutes: 1 }, internal.scheduler.tick)`
- **Detalle de implementación:** el intervalo del cron debe ser **fino (ej. cada 5 segundos si Convex lo permite con `seconds`)** para que la latencia de reacción sea razonable. Verificar qué unidad mínima soporta la API de `convex@1.45`. Si solo acepta minutos, el plan lo anota y se ajusta el diseño (p.ej. usar `runAfter` encadenado por seat).

### Paso 2 — Scheduler (el loop)
**Archivo nuevo:** `convex/scheduler.ts`
- `tick` (internal mutation): barre `sessions` con `status === "live"`, y por cada `seat` activo con `profileId`:
  - leer `profile.reactEveryMs` y el `lastReactedAtMs` del seat
  - si `Date.now() - lastReactedAtMs >= reactEveryMs` → disparar `jury.react` (vía `ctx.scheduler.runAfter(0, internal.jury.react, { seatId })`)
  - actualizar `lastReactedAtMs` para evitar doble disparo (in-flight dedup)
- Guardas: sesión `ended` → no disparar; seat inactivo → skip; transcript vacío → skip
- **Comportamiento al finalizar:** cuando el cron detecta `status === "ended"`, deja de procesar esa sesión (no programa más `react`).

### Paso 3 — Scoring al finalizar
**Archivo:** [`convex/sessions.ts`](convex/sessions.ts:1)
- En `end`: además de `patch(status: "ended", endedAt)`, agendar `internal.jury.score` por cada seat activo con `profileId`
- Usar `ctx.scheduler.runAfter(0, internal.jury.score, { seatId })` para que corra como acción con LLM fuera del commit de la mutación

### Paso 4 — Seed del corpus RAG
**Archivo nuevo:** `convex/seed.ts`
- `seedRag` (action): corpus por cada `retrievalTag` (`tecnico`, `tiktok`, `generalista`, `actitud`)
- Reutiliza `rag.ingest` internamente (embedding + `internal.rag.save`)
- Contenido de ejemplo mínimo por tag (definido por ti según el dominio) + idempotencia (checksum por `source` o limpiar antes de sembrar)

### Paso 5 — Mutaciones para humanos
**Archivo:** [`convex/live.ts`](convex/live.ts:1)
- `sendReaction` (mutation pública): misma shape que la reacción de agente (`sessionId`, `seatId`, `kind`, `note?`)
- `askQuestion` (mutation pública): misma shape que la pregunta de agente (`sessionId`, `seatId`, `text`)
- El front no distingue humano/agente: mismo stream, mismo shape (filosofía README)

### Paso 6 — Endurecer el transcript (STT sink)
**Archivo:** [`convex/transcript.ts`](convex/transcript.ts:1)
- Throttle: ignorar `append` si el texto está vacío o es muy corto
- Coalescer parciales: si el mismo fragmento provisional ya existe como `final:false` cerca en el tiempo, actualizarlo en vez de insertar duplicado (o agregar campo `interim` y solo commitear `final`)
- Preservar el contrato actual (`sessionId`, `text`, `final`, `tMs` calculado desde `startedAt`)

### Paso 7 — Contrato TTS (hablar al jurado)
**Archivo:** [`convex/transcript.ts`](convex/transcript.ts:1) (o nuevo `convex/speak.ts`)
- `addSpeakJob` (mutation): encola `{ seatId, text, kind }` en una tabla `speakJobs` (o reutiliza `questions` marcando las que requieren audio)
- `speakJobs` query: el front (Chrome `speechSynthesis`) consume la cola, reproduce y marca `done`
- **Orquestación:** cuando `jury.react` produce un `question`, el scheduler/`saveReaction` encola un `speakJob` si `profile.contextPolicy` lo amerita (o siempre para preguntas). Esto queda explícito en el contrato.
- **Nota TTS en Linux Mint:** `speechSynthesis` de Chrome depende de voces locales; se recomienda probar y documentar voces disponibles. Vapi queda reservado para el momento "impresionante" (pregunta en voz alta con calidad).

### Paso 8 — Documentación
**Archivo:** [`README.md`](README.md:1)
- Actualizar el mapa (agregar `scheduler.ts`, `seed.ts`, `speak.ts`, mutaciones de humanos)
- Documentar el contrato STT/TTS: qué envía el front (`transcript.append`), qué consume (`speakJobs`), cómo se orquesta el audio
- Marcar en "Pendiente" lo que pasa a hecho y lo que queda para front

## 4. Contrato de API resultante (resumen)

**Mutaciones (front → backend)**
- `transcript.append({ sessionId, text, final })` — STT del presentador
- `seats.joinHuman({ sessionId, displayName, userId })`
- `live.sendReaction({ sessionId, seatId, kind, note? })` — humanos
- `live.askQuestion({ sessionId, seatId, text })` — humanos
- `live.send({ sessionId, author, text })` — chat
- `speakJobs.add({ seatId, text, kind })` / consume — TTS

**Queries (front → backend, suscripciones)**
- `live.reactions`, `live.questions`, `live.scores`, `live.messages`
- `transcript.live`, `seats.list`, `sessions.get`, `profiles.list`

**Acciones internas (backend → backend, vía cron/scheduler)**
- `jury.react`, `jury.score`, `rag.ingest`, `rag.retrieve`

## 5. Riesgos y notas

- **Cron mínimo de Convex**: verificar si `crons.interval` soporta segundos o solo minutos; de no soportar, usar `runAfter` encadenado por seat (más jobs, misma lógica).
- **Costo de LLM**: el cron dispara reacciones frecuentes (ej. Kevin cada 12s). Considerar límite de reacciones por sesión y guardas de "silencio" (no reaccionar si no hay texto nuevo desde `lastReactedAtMs`).
- **`AI_GATEWAY_API_KEY`** es prerrequisito para cualquier acción LLM (react, score, ingest, retrieve).
- **`_generated` no existe**: el primer `npx convex dev` es bloqueante para compilar y para tipar los imports.
- **Voz en Linux Mint**: `speechSynthesis` puede no tener voces en español instaladas por defecto; documentar instalación de `espeak-ng` / voces de `google-chrome` si hace falta.
