# FROGL — Design System

Contrato visual único para landing, sala de pitch y panel del jurado.
Si una pantalla no cumple esto, no entra a producción.

Producto: evaluador de pitches con jurado híbrido (agentes + humanos). El front no distingue quién escribe en un `seat`; el diseño sí debe hacer legible **quién mira qué** (persona, sesgo, política de contexto).

---

## 1. Propósito

Unificar:

| Superficie | Rol visual |
|---|---|
| Landing | Marca + promesa + CTA (entrar / aplicar / empezar pitch) |
| Sala de pitch | Mic, timer, transcript en vivo — foco en el presentador |
| Panel del jurado | Reacciones, preguntas, scores — 4 asientos legibles |

Este documento define **tokens, layout, personajes 2.5D y motion**. No es un mockup: es la fuente de verdad antes de implementar UI.

---

## 2. Principios

1. **Tangible 2.5D** — Los personajes y thrives visuales se sienten como objetos físicos (vinilo / plástico mate), no como ilustración plana ni como render fotorealista.
2. **Intuitivo, no vacío** — Claridad de jerarquía y affordances. Evitar minimalismo genérico (pantalla negra + texto blanco + un botón). Hay atmósfera, personaje y un camino obvio.
3. **Un foco por viewport** — La primera pantalla tiene una sola composición dominante. Secciones posteriores: un propósito, un headline, una frase de apoyo.
4. **Hecho a mano** — Personajes = SVG / CSS / primitivas compuestas en código (o arte vectorial encargado). **Prohibido** usar imágenes generadas por IA (Gemini, Midjourney, etc.) como asset de marca o personaje.
5. **Motion con intención** — `anime.js` da presencia y feedback; no decoración constante.

---

## 3. Color

Fondo de producto fijo (no seguir `prefers-color-scheme` para el canvas principal).

### Tokens base

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#212529` | Canvas principal (charcoal) |
| `--bg-elevated` | `#2c3034` | Superficies ligeramente elevadas (nav sticky, paneles) |
| `--fg` | `#f8f9fa` | Texto primario |
| `--fg-muted` | `#adb5bd` | Texto secundario, labels |
| `--border` | `#3d4349` | Separadores finos, outlines sutiles |
| `--accent-pink` | `#ff8fab` | CTA primaria, acento de energía |
| `--accent-teal` | `#2dd4a8` | Éxito, “en vivo”, confirmación |
| `--accent-cyan` | `#38bdf8` | Info, links, highlights técnicos |
| `--accent-amber` | `#fbbf24` | Impact / motion sparks, warnings suaves |
| `--danger` | `#f87171` | Errores, rechazo fuerte |

### Tokens de jurado (identidad por asiento)

| Slug | Nombre | Color | Hex |
|---|---|---|---|
| `tecnico` | Dra. Elena Vargas | `--jury-tecnico` | `#38bdf8` (cyan) |
| `tiktok` | Kevin | `--jury-tiktok` | `#ff8fab` (pink) |
| `recien-llegado` | Marco Ibáñez | `--jury-late` | `#fbbf24` (amber) |
| `actitud` | Rosa Puentes | `--jury-actitud` | `#2dd4a8` (teal) |

Los acentos deben **pop** contra `#212529`. No diluir la paleta con púrpuras genéricos ni cream/terracotta “AI default”.

### Reglas

- El fondo de app es siempre `--bg`.
- Un asiento de jurado se identifica por color + silueta del personaje, no solo por emoji.
- No usar blanco puro a pantalla completa; el “blanco” de UI es `--fg` sobre charcoal.

---

## 4. Tipografía

Evitar como look de marca: Inter, Roboto, Arial, system-ui, Geist (pueden quedar de scaffold temporalmente; no son la identidad).

| Rol | Dirección | Uso |
|---|---|---|
| **Display** | Serif redondeada / friendly (ej. Fraunces, Soft Serif) | Logo wordmark, títulos hero, nombre en scorecard |
| **UI** | Sans geométrica limpia (ej. DM Sans, Plus Jakarta Sans) | Nav, body, labels, transcript |
| **Mono** | Mono condensada (ej. JetBrains Mono, Geist Mono ok aquí) | Timer, scores numéricos, IDs técnicos |

### Escala (desktop)

| Token | Tamaño | Peso |
|---|---|---|
| `--text-hero` | clamp(2.5rem, 6vw, 4.5rem) | 600–700 display |
| `--text-title` | 1.75–2.25rem | 600 |
| `--text-body` | 1–1.125rem | 400–500 |
| `--text-label` | 0.75–0.875rem | 500–600, tracking amplio en nav |

Nav en mayúsculas o small-caps ligeras está bien (referencia “the next craft”); no gritar en body.

---

## 5. Layout

Referencia de composición: landing tipo *the next craft* — fondo oscuro, **héroe centrado**, nav mínima, un objeto/personaje dominante — pero **más intuitivo** para FROGL: el usuario debe entender en &lt;3s “presentás → jurado reacciona → te puntúan”.

### Landing (primer viewport)

Una sola composición:

1. **Nav** — logo izquierda; links centro (About / How it works / Jury / FAQ); CTA derecha (`Empezar →`).
2. **Héroe** — personaje(s) 2.5D a escala dominante (edge-to-edge atmosphere, no card inset).
3. **Marca** — “FROGL” como señal hero-level (no solo texto de nav).
4. **Una frase** — promesa corta (pitch + jurado híbrido en vivo).
5. **Un grupo CTA** — primario + secundario opcional.

Opcional detrás del héroe: anillo tipográfico rotatorio (ciudades / “live” / tags de jurado) — atmosférico, no contenido crítico.

**No** en el primer viewport: stats, schedules, listas densas, badges flotantes sobre el personaje, cards.

### Sala de pitch

- Zona central: timer + estado mic + transcript scrolling.
- Lateral o inferior: strip de 4 asientos (avatar 2.5D + última reacción).
- Jerarquía: transcript legible &gt; reacciones ornamentales.

### Panel del jurado

- Cuatro columnas/asientos iguales en estructura; color + personaje diferencian.
- Reacciones y preguntas como flujo temporal, no dashboard de métricas.
- Scorecard final: tipografía display + números mono; sin cards decorativas innecesarias.

### Densidad

Intuitivo = affordances claras (dónde hablar, quién escucha, qué pasó). No = más chrome. Preferir espacio, sombra suave del personaje, y motion de entrada.

---

## 6. Personajes 2.5D

Estética: **Peanuts Movie / Duolingo moderno** — figuras básicas con volumen soft (mate, especulares suaves), no anatomía realista.

### Construcción (obligatoria)

| Pieza | Forma |
|---|---|
| Cabeza / torso | Cápsula o “pill” redondeada |
| Brazos | Cilindros soft, ligeramente desacoplados del torso |
| Piernas / pies | Cápsulas pequeñas, a menudo **detached** (flotan) |
| Ojos | Círculos flat blancos + pupilas; párpados gruesos negros |
| Boca / bigote / pelo | Siluetas sólidas, sin detalle de pelo fino |
| Material | Vinilo mate; gradientes suaves; sombra de contacto |

Turnaround mental: frontal → ¾ → perfil usando las mismas primitivas. El “render” 2.5D es la misma geometría con lighting, no otro diseño.

### Producción permitida

- Componentes React + SVG path compuestos.
- CSS (`border-radius`, gradients) para thrives simples.
- Arte vectorial humano / Figma exportado a SVG.

### Producción prohibida

- Renders o PNGs generados por IA como personaje final.
- Fotos, emoji gigantes como sustituto de personaje de marca.
- Overlays tipo sticker/badge encima del héroe.

### Mascot — FROG

| Campo | Spec |
|---|---|
| Rol | Marca, landing, empty states, loading |
| Cuerpo | Pill verde (`#2dd4a8` / verdosos vecinos) |
| Ojos | Grandes, flat, expresión curiosa |
| Extremidades | Cortas, cápsulas; pies cyan `#38bdf8` |
| Personalidad | Animado, atento, no agresivo |
| Idle | Bounce suave + respiración (squash leve) |

### Jurados (mapean a `convex/profiles.ts` → `JURY`)

#### 1. `tecnico` — Dra. Elena Vargas

- Color: `--jury-tecnico` (cyan).
- Look: silueta sobria (bata/cápsula clara + acento cyan); expresión cortante, párpados bajos.
- Motion: pocos gestos; tilt de cabeza al reaccionar; spark solo si detecta hand-waving.
- Política visual: siempre “presente” (context `full`).

#### 2. `tiktok` — Kevin

- Color: `--jury-tiktok` (pink).
- Look: el más dinámico — rosa / teal en ropa, pose energética (referencia del personaje de pelea/impacto: puños, sparks ámbar).
- Motion: idle inquieto, reacciones rápidas, sparks amarillos en hits.
- Política visual: “ventana corta” — puede mirar al costado / distraerse cuando el pitch se alarga.

#### 3. `recien-llegado` — Marco Ibáñez

- Color: `--jury-late` (amber).
- Look: ropa neutra + acento amber; pose de “acabo de entrar” (un pie aún “afuera”, mirando el transcript).
- Motion: entrada delayed en sala; fade/slide al unirse (`lateJoin`).
- Política visual: asiento vacío o ghost hasta `joinedAtMs`, luego pop-in.

#### 4. `actitud` — Rosa Puentes

- Color: `--jury-actitud` (teal).
- Look: cálida, postura abierta; menos “gadget”, más presencia humana.
- Motion: nod lento, lean-in cuando hay convicción; freeze sutil si detecta guion.
- Política visual: `full`, reacciona con menos frecuencia (más peso por gesto).

### Archivos sugeridos (cuando se implementen)

```
components/characters/
  FrogMascot.tsx
  JuryElena.tsx
  JuryKevin.tsx
  JuryMarco.tsx
  JuryRosa.tsx
  primitives/   # ojos, pie cápsula, brazo — reutilizar
```

---

## 7. Motion — anime.js

Dependencia ya en el proyecto: `animejs` ^4.x.

### Cuándo usar

| Momento | Animación | Notas |
|---|---|---|
| Load landing | Entrada del héroe (opacity + translateY + scale 0.96→1) | Ease out, ~600–900ms |
| Idle mascot / Kevin | Bounce Y + squash leve | Loop suave; `prefers-reduced-motion` → estático |
| Reacción jurado | Punch corto / nod / spark | Disparar con nuevos `reactions` |
| Late join Marco | Slide + fade | Alineado a `seat.joinedAtMs` |
| CTA hover | Scale 1→1.03 + color | Micro; no bounce infinito |
| Anillo tipográfico | Rotate 360 continuo | Muy lento; pausar si reduced-motion |

### Easing

Preferir elastic / spring suaves para personajes (objeto de plástico soft). UI chrome: ease-out estándar.

### Qué no animar

- Transcript word-by-word con bounce (legibilidad primero).
- Parallax agresivo en sala de pitch.
- Glow púrpura / partículas constantes.

### Patrón de integración (orientativo)

```ts
import { animate } from "animejs";

animate(".frog-mascot", {
  translateY: [0, -8, 0],
  ease: "inOut(2)",
  duration: 1800,
  loop: true,
});
```

Respetar `window.matchMedia("(prefers-reduced-motion: reduce)")`: cancelar loops; mantener fades cortos o ninguno.

---

## 8. UI chrome (mínimo)

- **Radios**: grandes en personajes y CTAs (`999px` / `1rem+`); no sharp newspaper.
- **Sombras**: una sombra de contacto suave bajo el héroe; no multi-layer neumorphism.
- **Cards**: por defecto **no**. Solo si contienen interacción (input, asiento clickable, score). Si quitar borde/sombra no duele, no es card.
- **Botón primario**: `--accent-pink` o beige claro de alto contraste sobre charcoal (como APPLY de la referencia); texto oscuro o `--fg` según contraste WCAG.
- **Glass**: permitido muy ligero en nav (`bg-elevated` + blur bajo); no glassmorphism de moda en todo.

---

## 9. Do / Don't

### Do

- Fondo `#212529` en todas las superficies de producto.
- Personajes de primitivas + lighting soft.
- Un héroe dominante en landing.
- Color de asiento = identidad del jurado.
- `anime.js` para idle, entrada y reacciones.
- Tipografía display + sans UI expresiva.

### Don't

- Arte / personajes generados por IA como source of truth.
- Cards en el héroe; badges flotantes sobre el personaje.
- Purple-on-white, cream+#terracotta, o dark+glow genérico.
- Primer viewport lleno de stats / schedule / metadata.
- Sustituir personajes por emoji a escala hero.
- Animar todo a la vez; priorizar 2–3 motions con intención por pantalla.

---

## 10. Checklist de implementación

- [ ] Tokens en `app/globals.css` (`--bg`, acentos, jury colors) — ver sección 3
- [ ] Fuentes display + UI en `app/layout.tsx` (reemplazar Geist como marca)
- [ ] `FrogMascot` + 4 jurados como componentes SVG
- [ ] Landing: nav + héroe + CTA según sección 5
- [ ] Hooks de motion con `anime.js` + reduced-motion
- [ ] Sala: strip de asientos usando colores `--jury-*`
- [ ] Revisar cada PR de UI contra este documento
