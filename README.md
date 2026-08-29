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

En el dashboard de Convex → Settings → Environment Variables, cargá `AI_GATEWAY_API_KEY`.
Después, desde el dashboard o el front, corré una vez `profiles:seed` para sembrar los cuatro jurados.

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
| `convex/live.ts` | queries que consume el front | back 1 |
| `app/` | sala del pitch + panel del jurado | front 1 y 2 |

## Transcripción

Arrancamos con la **Web Speech API** del browser: nativa, gratis, sin backend.
El cliente llama a `transcript.append` con cada frase. Vapi queda reservado para el
momento en que un jurado hace la pregunta **en voz alta**, que es el que impresiona.

## Pendiente

- [ ] Sala de pitch (mic + timer + transcript en vivo)
- [ ] Panel del jurado (reacciones, preguntas, chat de humanos)
- [ ] Scorecard final
- [ ] Loop que dispara `jury.react` cada `profile.reactEveryMs`
- [ ] Cargar corpus del RAG por tag
