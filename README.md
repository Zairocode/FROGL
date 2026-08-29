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
CONVEX_DEPLOY_KEY="dev:colorful-mole-701|..." npm run deploy
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

## Deploy en Vercel

**El repo tiene el front en `frogl-frontend/`, no en la raíz.** La raíz es solo
el backend de Convex y los checks. Si Vercel apunta a la raíz, buildea una app
vacía — que fue exactamente lo que pasó la primera vez.

En Vercel → Settings → Build & Deployment:

| Opción | Valor |
|---|---|
| Root Directory | `frogl-frontend` |
| Include source files outside of the Root Directory | **activado** |

Lo segundo es obligatorio: el front importa el codegen de Convex desde
`../convex/_generated` con el alias `@convex/*`. Sin esa opción, Vercel no sube
esa carpeta y el build falla con *Module not found*.

El front corre un `postinstall` que instala tambien las dependencias de la
raiz. No lo saques: el front usa los tipos de `../convex/_generated`, y esos
tipos se resuelven contra `<raiz>/node_modules`. Sin esa carpeta todo cae a
`any` y el build muere con errores TS7006. En local no se nota porque la raiz
suele tener `node_modules` de antes; en un clon limpio falla siempre.

`NEXT_PUBLIC_CONVEX_URL` es opcional — hay un fallback en el código con la URL
del deployment, que no es secreta porque toda variable `NEXT_PUBLIC_` termina
en el bundle igual. Configurala igual si algún día cambia el deployment.

### El backend va por separado

Convex no se despliega con Vercel:

```bash
CONVEX_DEPLOY_KEY="dev:colorful-mole-701|..." npx convex deploy
```

> **Un solo deployment para todos, y solo desde `main`.** Convex sincroniza el
> schema con el código que le mandás: desplegar desde otra rama no agrega
> funciones, **borra** las que esa rama no tiene. Ya pasó una vez y se llevó
> puesto el corrector, la sala del jurado y media docena de queries.
>
> Por eso `npm run deploy` corre una guarda que frena si no estás en `main`.
> Si de verdad necesitás desplegar tu rama, avisá al equipo y usá
> `FROGL_DEPLOY_ANYWAY=1 npm run deploy`.

## Correr en local

```bash
# backend: ya está desplegado en la nube, no hace falta levantarlo

cd frogl-frontend
npm install
npm run dev          # http://localhost:3000
```

Si algo se rompe de forma rara después de un cambio — un error de sintaxis en
una línea que en el archivo está bien — es caché de Turbopack. Matá el server y
levantalo de nuevo antes de buscar el bug.

### Los checks

```bash
npm run check        # desde la raíz
```

Corre los tres: encoder WAV, señales de entrega y resaltado del corrector.
No necesitan red ni Convex.


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
El cliente llama a `transcript.append` con cada frase. Vapi queda reservado para el
momento en que un jurado hace la pregunta **en voz alta**, que es el que impresiona.

## Pendiente

- [x] Loop que dispara `jury.react` cada `profile.reactEveryMs`
- [x] Scorecard automático al cerrar la sesión
- [x] Captura de audio: transcript + señales de entrega (`lib/usePitchCapture.ts`)
- [ ] Sala de pitch (pantalla, usa el hook de arriba)
- [ ] Panel del jurado (reacciones, preguntas, chat de humanos)
- [ ] Scorecard final en pantalla
- [ ] Cargar el corpus del RAG (`corpus:load`) — necesita la key del modelo
