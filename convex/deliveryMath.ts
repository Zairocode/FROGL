// Calculo puro de senales de entrega. SIN imports a proposito: se testea
// con `node check-delivery.ts` sin levantar Convex.

// Muletillas que SI sobreviven a la transcripcion, porque son palabras reales.
// "eeeh" y "mmm" no llegan nunca: esos salen del audio, no de aca.
const MULETILLAS: [string, RegExp][] = [
  ["este", /\beste\b(?!\s+(producto|mercado|modelo|equipo|caso|anio|mes))/gi],
  ["o sea", /\bo sea\b/gi],
  ["digamos", /\bdigamos\b/gi],
  ["viste", /\bviste\b/gi],
  ["nada", /\by nada\b/gi],
  ["tipo", /\btipo\b(?!\s+de)/gi],
  ["obvio", /\bobvio\b/gi],
  ["basicamente", /\bb[aá]sicamente\b/gi],
  ["la verdad", /\bla verdad\b/gi],
  ["eh", /\beh+\b|\bmmm+\b|\bam+\b/gi],
];

export type DeliveryReport = {
  wpm: number;
  fillers: { word: string; n: number }[];
  fillerRate: number; // muletillas por 100 palabras
  volumeAvg: number | null;
  volumeVar: number | null; // baja = monotono
  silentPct: number | null;
  resumen: string;
};

// Pura: sin DB, sin red. Se testea sola (ver demo() al final).
export function analyze(
  lines: { tMs: number; text: string }[],
  samples: { rms: number; silentRatio: number }[],
): DeliveryReport {
  const text = lines.map((l) => l.text).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const spanMs = lines.length ? lines[lines.length - 1].tMs : 0;
  // ponytail: el span llega al inicio de la ultima frase, no a su fin, asi que
  // el wpm queda un poco alto. Si importa la precision, guardar tMs de cierre.
  const wpm = spanMs > 0 ? Math.round((words / spanMs) * 60000) : 0;

  const fillers = MULETILLAS.map(([word, re]) => ({
    word,
    n: (text.match(re) ?? []).length,
  })).filter((f) => f.n > 0);
  const totalFillers = fillers.reduce((s, f) => s + f.n, 0);
  const fillerRate = words > 0 ? (totalFillers / words) * 100 : 0;

  let volumeAvg: number | null = null;
  let volumeVar: number | null = null;
  let silentPct: number | null = null;
  if (samples.length > 0) {
    const rms = samples.map((s) => s.rms);
    volumeAvg = rms.reduce((a, b) => a + b, 0) / rms.length;
    volumeVar =
      rms.reduce((a, r) => a + (r - volumeAvg!) ** 2, 0) / rms.length;
    silentPct =
      (samples.reduce((a, s) => a + s.silentRatio, 0) / samples.length) * 100;
  }

  // Se lo pasamos al modelo en prosa: entiende mejor "hablo bajo" que rms=0.04
  const partes: string[] = [`Ritmo: ${wpm} palabras por minuto.`];
  if (wpm > 0 && wpm < 100) partes.push("Habla lento, se arrastra.");
  if (wpm > 190) partes.push("Habla atropellado.");
  if (totalFillers > 0)
    partes.push(
      `Muletillas: ${fillers.map((f) => `"${f.word}" x${f.n}`).join(", ")} (${fillerRate.toFixed(1)} cada 100 palabras).`,
    );
  else partes.push("Sin muletillas detectables en el texto.");
  if (volumeAvg !== null) {
    if (volumeAvg < 0.05) partes.push("Habla muy bajo, casi no se lo escucha.");
    else if (volumeAvg < 0.12) partes.push("Volumen bajo.");
    if (volumeVar !== null && volumeVar < 0.001)
      partes.push("Tono plano, monotono, no modula.");
    if (silentPct !== null && silentPct > 35)
      partes.push(
        `Se traba: ${silentPct.toFixed(0)}% del tiempo en silencio, muchas pausas.`,
      );
  }
  // Si no hay audio no decimos nada: avisar "no se pudo medir" hace que el
  // jurado lea la ausencia de dato como dato negativo y baje la nota sin motivo.

  return {
    wpm,
    fillers,
    fillerRate,
    volumeAvg,
    volumeVar,
    silentPct,
    resumen: partes.join(" "),
  };
}
