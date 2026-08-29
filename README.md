# FROGL

Evaluador de pitches con jurado híbrido: agentes con RAG y humanos, en vivo.

Presentás. El transcript entra en tiempo real. Cuatro jurados con sesgos distintos
reaccionan mientras hablás, te tiran preguntas y al final te puntúan cada uno con
su propia rúbrica. Si hay humanos disponibles se sientan en el mismo panel y
reaccionan al lado de los agentes.

## La idea de diseño

**No hay cuatro agentes. Hay uno.** Lo que cambia entre jurados son tres perillas
guardadas en la tabla `profiles`, editables sin deploy:

| Perilla | Qué cambia |
|---|---|
| `persona` | cómo habla y qué le importa |
| `retrievalTag` | qué corpus ve en el RAG |
| `contextPolicy` | **qué porción del pitch llega a ver** |

La tercera es la que hace el trabajo pesado:

- `full` — escuchó todo. (la técnica, la de actitud)
- `lateJoin` — entró tarde, solo ve desde `seat.joinedAtMs`. Mide si tu pitch se sostiene solo.
- `window` — solo retiene los últimos `windowMs`. El de atención de TikTok literalmente no recuerda lo de hace medio minuto.

Todo eso vive en `convex/jury.ts::sliceTranscript`, que son diez líneas.

**Humanos y agentes comparten la tabla `seats`.** Escriben en las mismas tablas
(`reactions`, `questions`, `scores`) y el front se suscribe sin distinguir quién es
quién. "Si hay humanos los usamos, si no entran los agentes" no es lógica especial:
es rellenar asientos.

## Setup

```bash
npm install
npx convex dev          # login + crea convex/_generated  <- SIN ESTO NADA COMPILA
```

En el dashboard de Convex → Settings → Environment Variables, cargá `GEMINI_API_KEY`.
Después, desde el dashboard o el front, corré una vez `profiles:seed` y `seed:seedRag`.

```bash
npm run dev
```

## Mapa

| Archivo | Qué es | Dueño |
|---|---|---|
| `convex/schema.ts` | el contrato, todos codean contra esto | todos |
| `convex/profiles.ts` | los 4 jurados: personas, rúbricas, políticas | orquestación |
| `convex/jury.ts` | el agente: reacciona y puntúa | back 2 |
| `convex/rag.ts` | ingest + vector search por tag | back 2 |
| `convex/sessions.ts` `seats.ts` `transcript.ts` | espina dorsal de la sala | back 1 |
| `convex/live.ts` | queries que consume el front + mutaciones de humanos | back 1 |
| `convex/crons.ts` `scheduler.ts` | el loop: dispara `jury.react` cada `reactEveryMs` | back 1 |
| `convex/speak.ts` | cola de TTS: el jurado "habla" vía el front | back 1 |
| `convex/seed.ts` | siembra el corpus del RAG por tag | back 2 |
| `app/` | sala del pitch + panel del jurado | front 1 y 2 |

## Backend: cómo corre el jurado en vivo

Todo arranca en `convex/crons.ts`: un cron llama a `scheduler.tick` cada 5 segundos.
El scheduler barre las sesiones `live` y, por cada asiento de agente, decide si ya
pasó su `profile.reactEveryMs`. Si hay transcript nuevo, agenda `jury.react`. Cuando
la sesión termina, `sessions.end` agenda `jury.score` para cada asiento.

## Transcripción (STT/TTS)

### STT — la voz del presentador (tu área)

La **Web Speech API** del browser es nativa, gratis y sin backend. El cliente llama a
`transcript.append` con cada frase. El backend ya trata los parciales:

- `text` vacío o de < 2 chars se descarta (ruido del mic).
- Los parciales (`final: false`) se **coalescen**: si ya existe un parcial reciente
  de la sesión, se actualiza en vez de insertar duplicados. El transcript en vivo
  no se llena de basura mientras el STT corrige la frase.

Contrato del sink: `transcript.append({ sessionId, text, final })`. El `tMs` lo
calcula el backend desde `session.startedAt`.

### TTS — la voz del jurado (tu área)

El backend **no genera audio**: cuando un jurado hace una pregunta (agente o humano),
se encola un job en `speakJobs` y el front lo reproduce. El contrato:

- `speak.pending({ sessionId })` → jobs pendientes, más viejos primero (suscripción).
- El front (Chrome `speechSynthesis`, Linux Mint) reproduce el texto y llama
  `speak.markDone({ speakJobId })`.
- El agente encola su pregunta en `jury.ts` (vía `saveReaction`); los humanos la
  encolan desde `live.askQuestion`.

Vapi queda reservado para el momento en que la pregunta en voz alta necesita
calidad de producción (el que impresiona).

## Pendiente

- [ ] Sala de pitch (mic + timer + transcript en vivo)
- [ ] Panel del jurado (reacciones, preguntas, chat de humanos)
- [ ] Scorecard final
- [x] Loop que dispara `jury.react` cada `profile.reactEveryMs` (cron + scheduler)
- [x] Cargar corpus del RAG por tag (`seed.seedRag`)
