import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output } from "ai";
import { z } from "zod";
import { retrieve } from "./rag";
import { chat } from "./model";
import type { Doc } from "./_generated/dataModel";
import { analyze } from "./delivery";

import { CHAT_MODEL } from "./model";

const MODEL = CHAT_MODEL;
// Neutro salvo que el perfil diga otra cosa: cuatro jurados con el mismo
// acento se notan como el mismo personaje repetido.
const DIALECTO_POR_DEFECTO =
  "espanol neutro de Latinoamerica, sin modismos de ningun pais en particular";
const KINDS = ["hooked", "confused", "bored", "skeptical", "convinced"] as const;

// Anotado a mano: sin esto TS entra en ciclo (action -> internal.jury.bundle -> api.d.ts).
type Bundle = {
  seat: Doc<"seats">;
  session: Doc<"sessions">;
  profile: Doc<"profiles">;
  lines: Doc<"transcript">[];
  samples: Doc<"delivery">[];
  marcas: Doc<"annotations">[];
} | null;

// ============================================================
//  EL TRUCO DEL PROYECTO
//  No hay 4 agentes. Hay UNO. Lo que cambia entre jurados es
//  que porcion del pitch llega a ver. El resto es prompt.
// ============================================================
function sliceTranscript(
  lines: Doc<"transcript">[],
  seat: Doc<"seats">,
  profile: Doc<"profiles">,
  nowMs: number,
  mode: "live" | "final" = "live",
) {
  switch (profile.contextPolicy) {
    case "lateJoin": // entro tarde: nunca vera el arranque
      return lines.filter((l) => l.tMs >= seat.joinedAtMs);
    case "window": {
      const w = profile.windowMs ?? 20_000;
      // En vivo: ventana movil de los ultimos w ms.
      // Al puntuar: los PRIMEROS w ms. Es lo unico que alcanzo a atender
      // antes de irse, y es justo lo que su rubrica (gancho inicial) juzga.
      // Con la ventana del final calificaba la apertura leyendo el cierre.
      return mode === "final"
        ? lines.filter((l) => l.tMs <= w)
        : lines.filter((l) => l.tMs >= nowMs - w);
    }
    default:
      return lines;
  }
}

function mmss(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function contextNote(profile: Doc<"profiles">, seat: Doc<"seats">) {
  if (profile.contextPolicy === "lateJoin")
    return `Entraste a la sala en el minuto ${(seat.joinedAtMs / 60000).toFixed(1)}. Todo lo anterior te lo perdiste y no lo podes adivinar.`;
  if (profile.contextPolicy === "window")
    return `Solo retenes los ultimos ${Math.round((profile.windowMs ?? 20000) / 1000)} segundos. Lo de antes ya se te borro.`;
  return "Escuchaste el pitch completo desde el inicio.";
}

export const bundle = internalQuery({
  args: { seatId: v.id("seats") },
  handler: async (ctx, { seatId }): Promise<Bundle> => {
    const seat = await ctx.db.get(seatId);
    if (!seat || !seat.profileId) return null;
    const [session, profile] = await Promise.all([
      ctx.db.get(seat.sessionId),
      ctx.db.get(seat.profileId),
    ]);
    if (!session || !profile) return null;
    const lines = await ctx.db
      .query("transcript")
      .withIndex("by_session_time", (q) => q.eq("sessionId", seat.sessionId))
      .collect();
    const samples = await ctx.db
      .query("delivery")
      .withIndex("by_session_time", (q) => q.eq("sessionId", seat.sessionId))
      .collect();
    // Lo que el corrector marco y el expositor NO arreglo. El jurado tiene
    // que saber con que se quedo sin corregir.
    const marcas = (
      await ctx.db
        .query("annotations")
        .withIndex("by_session_round", (q) => q.eq("sessionId", seat.sessionId))
        .collect()
    ).filter((a) => !a.resolved);
    return { seat, session, profile, lines, samples, marcas };
  },
});

export const saveReaction = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    tMs: v.number(),
    kind: v.union(...KINDS.map((k) => v.literal(k))),
    note: v.optional(v.string()),
    question: v.optional(v.string()),
  },
  handler: async (ctx, { question, ...reaction }) => {
    await ctx.db.insert("reactions", reaction);
    if (question) {
      await ctx.db.insert("questions", {
        sessionId: reaction.sessionId,
        seatId: reaction.seatId,
        tMs: reaction.tMs,
        text: question,
        answered: false,
      });
    }
  },
});

// Una reaccion en vivo. El front la ve aparecer sola por la suscripcion.
export const react = action({
  args: { seatId: v.id("seats") },
  handler: async (ctx, { seatId }): Promise<void> => {
    const b = await ctx.runQuery(internal.jury.bundle, { seatId });
    if (!b) return;
    const nowMs = b.session.startedAt ? Date.now() - b.session.startedAt : 0;
    const visible = sliceTranscript(b.lines, b.seat, b.profile, nowMs);
    if (visible.length === 0) return;

    const heard = visible.map((l) => l.text).join(" ");
    const notes = await retrieve(ctx, b.profile.retrievalTag, heard.slice(-800));

    const { output } = await generateText({
      model: await chat(MODEL),
      system: [
        b.profile.persona,
        contextNote(b.profile, b.seat),
        notes.length ? `Sabes esto del tema:\n- ${notes.join("\n- ")}` : "",
        "Estas escuchando un pitch EN VIVO y NO podes interrumpir. Reacciona en una linea, en primera persona, como quien le murmura algo al de al lado. Nada de resumir ni de preguntar.",
        `Hablas en ${b.profile.dialect ?? DIALECTO_POR_DEFECTO}.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt: `Esto es lo que escuchaste hasta ahora:\n\n"${heard}"\n\nReacciona ahora.`,
      output: Output.object({
        schema: z.object({
          kind: z.enum(KINDS),
          note: z.string().describe("Tu reaccion, una linea, en tu voz"),
          // Sin preguntas: durante el pitch nadie interrumpe. Esto es
          // ambiente, una carita al costado que el expositor puede ignorar.
        }),
      }),
    });

    await ctx.runMutation(internal.jury.saveReaction, {
      sessionId: b.seat.sessionId,
      seatId,
      tMs: nowMs,
      kind: output.kind,
      note: output.note,
    });
  },
});

export const saveScore = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    breakdown: v.array(
      v.object({ key: v.string(), score: v.number(), why: v.string() }),
    ),
    total: v.number(),
    verdict: v.string(),
    funciono: v.optional(v.string()),
    romper: v.optional(v.string()),
    hacer: v.optional(v.string()),
    momento: v.optional(v.string()),
  },
  handler: (ctx, args) => ctx.db.insert("scores", args),
});

// Scorecard final. Cuatro decisiones deliberadas:
//  1. El schema fuerza una propiedad por criterio, asi el modelo no puede
//     inventar keys. Antes el total se iba a 0 con veredictos elogiosos.
//  2. El total lo calculamos nosotros con los pesos, nunca el modelo.
//  3. El feedback tiene forma obligatoria: que funciono, que romper, que
//     hacer. Pedir "se amable" por prompt no alcanzaba; la estructura si.
//  4. Cada senalamiento va anclado a un minuto, para que el expositor
//     pueda ir a escucharse ahi en vez de adivinar a que se referian.
export const score = action({
  args: { seatId: v.id("seats") },
  handler: async (
    ctx,
    { seatId },
  ): Promise<{ total: number; verdict: string } | null> => {
    const b = await ctx.runQuery(internal.jury.bundle, { seatId });
    if (!b) return null;
    const endMs =
      b.session.endedAt && b.session.startedAt
        ? b.session.endedAt - b.session.startedAt
        : Number.MAX_SAFE_INTEGER;
    const visible = sliceTranscript(b.lines, b.seat, b.profile, endMs, "final");
    const heard = visible.map((l) => l.text).join(" ");
    const delivery = analyze(visible, b.samples);

    // Opciones avanzadas: el usuario puede apagar criterios o cambiarles el
    // peso. Lo que no toco queda como esta en el perfil.
    const override = (b.session.criteria ?? []).filter(
      (c) => c.slug === b.profile.slug,
    );
    const rubrica =
      override.length > 0
        ? b.profile.rubric
            .map((r) => {
              const o = override.find((c) => c.key === r.key);
              return o ? { ...r, weight: o.weight } : r;
            })
            .filter((r) => r.weight > 0)
        : b.profile.rubric;

    const criterio = z.object({
      score: z.number().min(0).max(10),
      why: z.string(),
    });
    const shape: Record<string, typeof criterio> = {};
    for (const r of rubrica) shape[r.key] = criterio;

    const duracion =
      b.session.plannedMs && b.session.endedAt && b.session.startedAt
        ? `Tenia ${mmss(b.session.plannedMs)} y uso ${mmss(endMs)}.`
        : "";

    const { output } = await generateText({
      model: await chat(MODEL),
      temperature: 0,
      system: [
        b.profile.persona,
        b.profile.tone ? `Como tratas al expositor: ${b.profile.tone}` : "",
        contextNote(b.profile, b.seat),
        b.session.topic ? `El pitch es sobre: ${b.session.topic}.` : "",
        duracion,
        "Calificas SOLO lo que escuchaste. Si te perdiste parte del pitch, eso juega en contra del pitch, no a favor, pero DECILO: aclara desde donde escuchaste y que no podes opinar.",
        "Como lo dijo, medido del audio y del texto (no lo interpretes, es dato duro): " +
          delivery.resumen,
        b.marcas.length
          ? `El corrector marco esto y sigue sin arreglarse:\n${b.marcas
              .map((m) => `- ${m.problem}`)
              .join("\n")}`
          : "",
        "El expositor vino a mejorar, no a que lo destruyan. Se exigente y concreto, nunca cruel.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt: [
        `Pitch escuchado:\n\n"${heard}"`,
        "Califica de 0 a 10 cada criterio. Respeta la escala de cada uno:",
        ...rubrica.map(
          (r) =>
            `- ${r.key} (${r.label})` + (r.anchor ? `\n  Escala: ${r.anchor}` : ""),
        ),
        "Despues cerra con tu devolucion: una cosa que funciono, una que hay que romper, y una accion concreta para la proxima.",
      ].join("\n\n"),
      output: Output.object({
        schema: z.object({
          criterios: z.object(shape),
          funciono: z.string().describe("Algo que SI funciono. Concreto, no de compromiso"),
          romper: z.string().describe("Lo que mas hay que cambiar"),
          momento: z
            .string()
            .nullable()
            .describe("Minuto mm:ss donde pasa lo que senalas, si aplica"),
          hacer: z.string().describe("Una accion concreta para la proxima"),
          verdict: z.string().describe("Dos lineas, en tu voz"),
        }),
      }),
    });

    const criterios = output.criterios as Record<
      string,
      { score: number; why: string }
    >;
    const breakdown = rubrica.map((r) => ({
      key: r.key,
      score: criterios[r.key].score,
      why: criterios[r.key].why,
    }));
    // Los pesos pueden no sumar 1 si el usuario apago criterios: renormalizamos
    // para que la nota siga siendo sobre 10 y no baje por haber sacado uno.
    const pesoTotal = rubrica.reduce((s, r) => s + r.weight, 0) || 1;
    const total =
      rubrica.reduce((s, r) => s + criterios[r.key].score * r.weight, 0) /
      pesoTotal;

    await ctx.runMutation(internal.jury.saveScore, {
      sessionId: b.seat.sessionId,
      seatId,
      breakdown,
      total: Math.round(total * 10) / 10,
      verdict: output.verdict,
      funciono: output.funciono,
      romper: output.romper,
      hacer: output.hacer,
      momento: output.momento ?? undefined,
    });
    return { total: Math.round(total * 10) / 10, verdict: output.verdict };
  },
});
