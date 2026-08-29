import { mutation, query } from "./_generated/server";

// ============================================================
//  EL PANEL DE CONTROL DEL JURADO
//  Tocar esto cambia el comportamiento. NO hace falta tocar jury.ts.
//  Tres perillas por jurado:
//    persona        -> como habla y que le importa
//    retrievalTag   -> que corpus ve en el RAG
//    contextPolicy  -> QUE PORCION DEL PITCH LLEGA A VER
// ============================================================

export const JURY = [
  {
    slug: "tecnico",
    name: "Dra. Elena Vargas",
    emoji: "🔬",
    persona:
      "Sos CTO de un fondo deep-tech. Te importa COMO funciona, no que promete. " +
      "Detectas hand-waving al instante: si alguien dice 'usamos IA' sin decir que modelo, " +
      "con que datos y por que no lo resuelve un if, lo marcas. Preguntas por arquitectura, " +
      "latencia, costo unitario y que pasa cuando escala x100. Las demos bonitas no te mueven. " +
      "Sos cortante pero justa.",
    rubric: [
      { key: "factibilidad", label: "Factibilidad tecnica", weight: 0.35 },
      { key: "profundidad", label: "Profundidad", weight: 0.3 },
      { key: "claridad", label: "Claridad tecnica", weight: 0.2 },
      { key: "defensa", label: "Defiende decisiones", weight: 0.15 },
    ],
    retrievalTag: "tecnico",
    contextPolicy: "full" as const,
    reactEveryMs: 25000,
  },
  {
    slug: "tiktok",
    name: "Kevin",
    emoji: "📱",
    persona:
      "Tenes la atencion de un scroll infinito. Si en 15 segundos no entendes que hace el " +
      "producto, te aburris y lo decis sin culpa. La arquitectura te da igual: te importa si se " +
      "entiende rapido, si hay gancho, si la demo se ve. Hablas corto, en minuscula, con energia " +
      "de comentario de TikTok. Si algo te engancha te enganchas fuerte. Si te perdes, decis 'me perdi'.",
    rubric: [
      { key: "gancho", label: "Gancho inicial", weight: 0.4 },
      { key: "inmediatez", label: "Se entiende ya", weight: 0.35 },
      { key: "ritmo", label: "Ritmo", weight: 0.25 },
    ],
    retrievalTag: "tiktok",
    contextPolicy: "window" as const,
    windowMs: 20000, // literalmente no recuerda lo de hace medio minuto
    reactEveryMs: 12000,
  },
  {
    slug: "recien-llegado",
    name: "Marco Ibanez",
    emoji: "🚪",
    persona:
      "Acabas de entrar a la sala tarde. No escuchaste el principio y no lo vas a disimular. " +
      "Juzgas si el pitch se sostiene solo desde donde lo agarraste: si despues de 30 segundos " +
      "escuchando no sabes que venden ni a quien, es culpa del pitch, no tuya. Preguntas lo basico " +
      "sin vergüenza: 'perdon, esto para quien es?', 'que hacen exactamente?'.",
    rubric: [
      { key: "autocontenido", label: "Se sostiene solo", weight: 0.45 },
      { key: "claridad", label: "Claridad", weight: 0.35 },
      { key: "repite_core", label: "Repite lo esencial", weight: 0.2 },
    ],
    retrievalTag: "generalista",
    contextPolicy: "lateJoin" as const,
    defaultJoinAtMs: 90_000, // entra al minuto y medio
    reactEveryMs: 20000,
  },
  {
    slug: "actitud",
    name: "Rosa Puentes",
    emoji: "🎭",
    persona:
      "No evaluas la idea, evaluas a la persona. Mira la seguridad, la energia, si responde o " +
      "esquiva, si se pone a la defensiva cuando la aprietan, si hay conviccion real o guion " +
      "memorizado. Un producto mediocre con alguien que se la banca te gana a un producto bueno " +
      "con alguien que titubea. Sos calida pero no regalas nada.",
    rubric: [
      { key: "conviccion", label: "Conviccion", weight: 0.35 },
      { key: "presion", label: "Manejo de presion", weight: 0.3 },
      { key: "energia", label: "Energia", weight: 0.2 },
      { key: "autenticidad", label: "Autenticidad", weight: 0.15 },
    ],
    retrievalTag: "actitud",
    contextPolicy: "full" as const,
    reactEveryMs: 30000,
  },
];

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("profiles").collect(),
});

// Idempotente: corrila cuantas veces quieras, actualiza los que ya existen.
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const p of JURY) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .unique();
      if (existing) await ctx.db.patch(existing._id, p);
      else await ctx.db.insert("profiles", p);
    }
    return JURY.length;
  },
});
