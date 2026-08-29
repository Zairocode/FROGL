# FROGL

Evaluador de pitches con jurado híbrido: agentes con RAG y humanos, en vivo.

Presentás. El transcript entra en tiempo real. Cuatro jurados con sesgos distintos
reaccionan mientras hablás, te tiran preguntas y al final te puntúan cada uno con
su propia rúbrica. Si hay humanos disponibles se sientan en el mismo panel y
reaccionan al lado de los agentes.

## La idea de diseño

**No hay cuatro agentes. Hay uno.** Lo que cambia entre jurados son cuatro perillas
guardadas en la tabla `profiles`, editables sin deploy:

| Perilla | Qué cambia |
|---|---|
| `persona` | cómo habla y qué le importa |
| `retrievalTag` | qué corpus ve en el RAG |
| `contextPolicy` | **qué porción del pitch llega a ver** |
| `voiceId` | la voz de Eleven Labs con la que suena (vacío = no suena) |

La tercera es la que hace el trabajo pesado:

- `full` — escuchó todo. (Elena la técnica, Rosa la de actitud)
- `lateJoin` — entró tarde, solo ve desde `seat.joinedAtMs`. Marco entra a los 90s. Mide si tu pitch se sostiene solo.
- `window` — solo retiene los últimos `windowMs`. Kevin ve 20 segundos: literalmente no recuerda lo de hace medio minuto.

Todo eso vive en `convex/jury.ts::sliceTranscript`, que son diez líneas.

**Humanos y agentes comparten la tabla `seats`.** Escriben en las mismas tablas
(`reactions`, `questions`, `scores`) y el front se suscribe sin distinguir quién es
quién. "Si hay humanos los usamos, si no entran los agentes" no es lógica especial:
es rellenar asientos.

## Setup

Backend compartido del equipo (ya desplegado, con los 4 jurados sembrados):

```
https://colorful-mole-701.convex.cloud
```

### Front — no necesitan `convex dev` para nada

Creás `.env.local` con una línea:

```
NEXT_PUBLIC_CONVEX_URL=https://colorful-mole-701.convex.cloud
```

```bash
npm install
npm run dev
```

Listo. Leen y escriben contra las funciones ya desplegadas y todos ven los mismos datos.

### Back — los que tocan `convex/`

Empujan al deployment compartido con el deploy key del equipo:

```bash
CONVEX_DEPLOY_KEY="dev:colorful-mole-701|..." npx convex deploy
```

> **No corran `npx convex dev` a secas sin la key.** Les crea un backend local
> propio y aislado, y van a pasar horas preguntándose por qué no ven los datos
> de los demás.

### Pendiente de configurar

En el dashboard de Convex → Settings → Environment Variables:

```
AI_GATEWAY_API_KEY=...
```

Sin eso fallan `jury.react`, `jury.score` y `rag.ingest` — las tres que llaman al
modelo. Después, una vez por deployment:

```bash
npx convex run corpus:load
```

## Mapa

| Archivo | Qué es | Dueño |
|---|---|---|
| `convex/schema.ts` | el contrato, todos codean contra esto | todos |
| `convex/profiles.ts` | los 4 jurados: personas, rúbricas, políticas | orquestación |
| `convex/corpus.ts` | motor de errores comunes = el RAG real | orquestación |
| `convex/tuning.ts` | banco de prueba de rúbricas | orquestación |
| `convex/jury.ts` | el agente: `react()` y `score()` | back 2 |
| `convex/rag.ts` | ingest + vector search por tag | back 2 |
| `convex/loop.ts` | latido: dispara `react` cada `reactEveryMs` | back 2 |
| `convex/sessions.ts` `seats.ts` `transcript.ts` | espina dorsal de la sala | back 1 |
| `convex/live.ts` | queries que consume el front | back 1 |
| `app/` | sala del pitch + panel del jurado | front 1 y 2 |

## Backend NestJS (`backend/`)

Servicio auxiliar (esqueleto NestJS v11) para cuando haga falta una API propia
fuera de Convex. Hoy expone solo el healthcheck:

```bash
cd backend
npm install
npm run start:dev   # GET http://localhost:3000/health → { "status": "ok" }
```

Producción apunta a Railway + Docker (`backend/Dockerfile`, `backend/railway.toml`).
La arquitectura principal de FROGL es Convex; este servicio es independiente y
opcional.

## Afinar las rúbricas

```bash
npx convex run tuning:dryRun '{"pitch":"caradura"}'
```

Tres pitches de prueba: `fuerte`, `flojo`, `caradura`. El `caradura` tiene contenido
pésimo y entrega impecable — existe para verificar que **Rosa diverja de Elena**.
Si las dos le ponen la misma nota, los perfiles no discriminan y el producto no
tiene sentido. Ese es el test que importa, no la nota en sí.

## Captura del pitch (para el front)

Del **mismo** stream de micrófono salen dos cosas en paralelo, sin backend,
sin créditos y sin dependencias nuevas:

| Fuente | Da | Va a |
|---|---|---|
| Web Speech API | **qué** dijo | `transcript.append` |
| Web Audio `AnalyserNode` | **cómo** lo dijo | `delivery.sample` |

Todo está en `lib/usePitchCapture.ts`. El front solo lo llama:

```tsx
"use client";
import { usePitchCapture } from "@/lib/usePitchCapture";

const cap = usePitchCapture(sessionId);

<button onClick={cap.recording ? cap.stop : cap.start}>
  {cap.recording ? "Cortar" : "Empezar a pitchear"}
</button>

{cap.error && <p>{cap.error}</p>}
<p>{cap.interim}</p>                        {/* parcial, no llega a Convex */}
<div style={{ width: cap.level * 400 }} />  {/* VU meter gratis */}
```

**Llamá a `sessions.start` antes de `cap.start()`** — si no, `transcript.append` tira
porque no hay `startedAt` contra el cual calcular el tiempo.

Detalles que ya están resueltos adentro:

- Chrome corta el reconocimiento solo tras unos segundos de silencio. El hook lo
  relanza en `onend`: sin eso el transcript se muere a mitad del pitch.
- Solo los resultados **finales** van a Convex. Los interinos cambian en cada
  palabra y llenarían la tabla de basura; se exponen como `interim` para pintarlos.
- Suelta el micrófono al desmontar.
- `silenceThreshold` (default 0.015) **hay que calibrarlo en la sala**: mirá
  `cap.level` con el presentador callado y poné un poco más que eso.

Solo Chrome y Edge. Firefox y Safari no tienen Web Speech API.

## Transcripción

Arrancamos con la **Web Speech API** del browser: nativa, gratis, sin backend.
El cliente llama a `transcript.append` con cada frase. El momento que impresiona —
la pregunta **en voz alta** — lo cubre la voz de Eleven Labs de cada jurado
(ver la sección de abajo).

## Voz de los jurados (Eleven Labs)

Cada jurado responde **en voz alta con su propia voz**. Cuando un jurado reacciona
o pregunta, el backend (`convex/speak.ts`) genera el audio con la API de Eleven
Labs usando la voz configurada en `profiles.voiceId` y lo guarda en Convex file
storage. El front (`lib/useSpokenAudio.ts`) reproduce cada audio en orden.

### Configurar las voces (una vez)

El plan gratuito de Eleven Labs **no permite usar voces de librería por API**, así
que cada voz tiene que ser **tuya** (Voice Design o Instant Voice Clone en
elevenlabs.io):

1. Creá una voz por jurado, acorde a su personalidad
   (Elena: profesional/femenina · Kevin: joven/enérgica · Marco: cálida/directa ·
   Rosa: cálida/presente).
2. Copiá el ID de cada voz (la URL de la voz es
   `https://elevenlabs.io/voice-lab/<id>`).
3. Pegalo en `voiceId` de cada jurado. En el dashboard de Convex (tabla
   `profiles`) se edita en runtime, sin redeploy; también está la columna en
   `convex/profiles.ts`.

Env vars que usa el backend (solo server-side, en Convex → Settings → Environment
Variables, y en `.env.local` para dev local):

```
ELEVENLABS_API_KEY=...
# opcional; default: eleven_multilingual_v2
ELEVENLABS_MODEL=...
```

Sin `voiceId` configurado (o si la API falla) el jurado reacciona por texto igual:
la burbuja aparece, solo no suena.

## Pendiente

- [x] Loop que dispara `jury.react` cada `profile.reactEveryMs`
- [x] Scorecard automático al cerrar la sesión
- [x] Captura de audio: transcript + señales de entrega (`lib/usePitchCapture.ts`)
- [ ] Sala de pitch (pantalla, usa el hook de arriba)
- [ ] Panel del jurado (reacciones, preguntas, chat de humanos)
- [ ] Scorecard final en pantalla
- [ ] Cargar el corpus del RAG (`corpus:load`) — necesita la key del modelo
