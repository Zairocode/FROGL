// Self-check de la logica de entrega. Corre con: node check-delivery.ts
// No necesita Convex ni red: deliveryMath.ts no importa nada.
import assert from "node:assert";
import { analyze } from "./convex/deliveryMath.ts";

const line = (tMs: number, text: string) => ({ tMs, text });

// --- muletillas ---
const r1 = analyze(
  [line(0, "o sea digamos que esto o sea es tipo un producto viste")],
  [],
);
const n = (w: string) => r1.fillers.find((f) => f.word === w)?.n ?? 0;
assert.equal(n("o sea"), 2, "cuenta 'o sea' dos veces");
assert.equal(n("digamos"), 1);
assert.equal(n("viste"), 1);
assert.ok(r1.fillerRate > 20, "12 palabras con 5 muletillas es tasa alta");

// "este producto" NO es muletilla, "este este" si
assert.equal(analyze([line(0, "este producto es bueno")], []).fillers.length, 0);
assert.ok(analyze([line(0, "este este bueno")], []).fillers.some((f) => f.word === "este"));

// --- ritmo ---
const sesenta = Array.from({ length: 60 }, (_, i) => line(i * 1000, "palabra"));
// El span va hasta el INICIO de la ultima frase, no hasta que termina de hablar:
// sobreestima el wpm un poco. Aceptable, y el check lo deja documentado.
assert.equal(analyze(sesenta, []).wpm, 61, "60 palabras en 59s = 61 wpm");
assert.ok(analyze(sesenta, []).resumen.includes("lento"));

// --- sin audio: no inventa numeros ---
const sinAudio = analyze([line(0, "hola")], []);
assert.equal(sinAudio.volumeAvg, null);
assert.ok(!sinAudio.resumen.includes("Sin datos"), "no menciona el audio faltante");
assert.ok(sinAudio.resumen.includes("Ritmo"), "pero si reporta lo que si midio");

// --- audio bajo y monotono ---
const bajo = analyze(
  [line(0, "hola que tal")],
  Array.from({ length: 10 }, () => ({ rms: 0.02, silentRatio: 0.5 })),
);
assert.ok(bajo.resumen.includes("muy bajo"), "detecta volumen bajo");
assert.ok(bajo.resumen.includes("monotono"), "varianza 0 = monotono");
assert.ok(bajo.resumen.includes("Se traba"), "50% silencio = se traba");

// --- audio normal no dispara alarmas ---
const ok = analyze(
  [line(0, "hola que tal")],
  [
    { rms: 0.3, silentRatio: 0.1 },
    { rms: 0.5, silentRatio: 0.05 },
    { rms: 0.2, silentRatio: 0.15 },
  ],
);
assert.ok(!ok.resumen.includes("muy bajo"));
assert.ok(!ok.resumen.includes("monotono"));
assert.ok(!ok.resumen.includes("Se traba"));

console.log("OK - todos los checks de delivery pasan");
