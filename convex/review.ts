import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";
import { chat, searchTool, CHAT_MODEL } from "./model";
import type { Doc, Id } from "./_generated/dataModel";

// ============================================================
//  EL CORRECTOR
//  Corre ANTES que el jurado y no da una nota: da anotaciones ancladas a
//  un fragmento del transcript, con la fuente que las respalda y que
//  hacer en su lugar. El expositor corrige, vuelve a decirlo, y esto se
//  corre de nuevo. El jurado no se abre hasta que pasa.
// ============================================================

const KINDS = ["dato", "falta", "gancho", "claridad"] as const;
const SEVERIDADES = ["alta", "media", "baja"] as const;

// Umbral para habilitar al jurado. Un problema grave alcanza para frenar
// aunque el promedio de bien: no queremos que llegue con una cifra falsa.
const NOTA_MINIMA = 7;

function mmss(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

type Bundle = {
  session: Doc<"sessions">;
  lines: Doc<"transcript">[];
} | null;

export const bundle = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }): Promise<Bundle> => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    const lines = await ctx.db
      .query("transcript")
      .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
      .collect();
    return { session, lines };
  },
});

export const save = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    round: v.number(),
    score: v.number(),
    passed: v.boolean(),
    summary: v.string(),
    annotations: v.array(
      v.object({
        quote: v.string(),
        kind: v.union(...KINDS.map((k) => v.literal(k))),
        severity: v.union(...SEVERIDADES.map((s) => v.literal(s))),
        problem: v.string(),
        fix: v.string(),
        sourceUrl: v.optional(v.string()),
        sourceTitle: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { sessionId, round, annotations, ...review }) => {
    await ctx.db.insert("reviews", { sessionId, round, ...review });
    for (const a of annotations) {
      await ctx.db.insert("annotations", {
        sessionId,
        round,
        resolved: false,
        ...a,
      });
    }
    await ctx.db.patch(sessionId, {
      reviewRound: round,
      // Solo abre el jurado si paso. Si no, se queda en revision para que
      // el expositor corrija y vuelva a intentar.
      phase: review.passed ? "jury" : "review",
    });
  },
});

export const run = action({
  args: { sessionId: v.id("sessions") },
  handler: async (
    ctx,
    { sessionId },
  ): Promise<{ score: number; passed: boolean; annotations: number } | null> => {
    const b = await ctx.runQuery(internal.review.bundle, { sessionId });
    if (!b || b.lines.length === 0) return null;

    const round = (b.session.reviewRound ?? 0) + 1;
    const tema = b.session.topic ?? "sin tema declarado";
    const markdown = b.lines
      .map((l) => `- [${mmss(l.tMs)}] ${l.text}`)
      .join("\n");

    // ---- paso 1: contrastar contra la web ----
    // Va en una llamada aparte a proposito: la busqueda necesita varios
    // pasos y mezclarla con la salida estructurada la vuelve fragil.
    let verificacion = "";
    let fuentes: { uri: string; title: string }[] = [];
    if (b.session.factCheck !== false) {
      const r = await generateText({
        model: await chat(CHAT_MODEL),
        tools: { google_search: searchTool() },
        stopWhen: stepCountIs(4),
        prompt: [
          `Un pitch sobre "${tema}". Esto es lo que dijo el expositor:`,
          markdown,
          "",
          "Busca en la web SOLO las afirmaciones comprobables: cifras de mercado, " +
            "datos de la industria, nombres de competidores, precios de referencia. " +
            "Ignora opiniones, planes a futuro y todo lo que no se pueda verificar.",
          "Para cada una deci si el dato se sostiene o no, y con que fuente. " +
            "Si todo cierra, decilo en una linea y no inventes problemas.",
        ].join("\n"),
      });
      verificacion = r.text;
      const meta = r.providerMetadata?.google as
        | { groundingMetadata?: { groundingChunks?: { web?: { uri: string; title?: string | null } | null }[] } }
        | undefined;
      fuentes = (meta?.groundingMetadata?.groundingChunks ?? [])
        .map((c) => c.web)
        .filter((w): w is { uri: string; title?: string | null } => !!w?.uri)
        .map((w) => ({ uri: w.uri, title: w.title ?? w.uri }));
    }

    // ---- paso 2: convertirlo en marcas sobre el texto ----
    const { output } = await generateText({
      model: await chat(CHAT_MODEL),
      // Corregir es medicion, no creatividad: sin esto la misma revision
      // marca cosas distintas en cada corrida y el expositor no entiende nada.
      temperature: 0,
      system: [
        "Sos un corrector de pitches. No calificas al expositor: marcas problemas concretos en el texto y decis como arreglarlos.",
        "Cada marca tiene que citar un fragmento LITERAL del transcript, copiado tal cual, porque el front lo usa para resaltar en pantalla.",
        "No marques mas de 6 cosas. Si hay 20 problemas, elegis los 6 que mas cambian el pitch.",
        "El campo fix dice que decir EN SU LUGAR, en concreto. Nada de 'ser mas claro'.",
        "Si algo esta bien, no lo marques. Un transcript sin problemas graves es un resultado valido.",
      ].join("\n"),
      prompt: [
        `Tema declarado: ${tema}`,
        b.session.plannedMs
          ? `Duracion planeada: ${mmss(b.session.plannedMs)}. Real: ${mmss(b.lines[b.lines.length - 1].tMs)}.`
          : "",
        "",
        "Transcript:",
        markdown,
        verificacion ? `\nVerificacion web:\n${verificacion}` : "",
        fuentes.length
          ? `\nFuentes disponibles para citar:\n${fuentes.map((f) => `- ${f.title} :: ${f.uri}`).join("\n")}`
          : "",
        "",
        "Devolve las marcas, una nota de 0 a 10 de que tan listo esta el pitch para ir al jurado, y un resumen de dos lineas.",
      ]
        .filter(Boolean)
        .join("\n"),
      output: Output.object({
        schema: z.object({
          score: z.number().min(0).max(10),
          summary: z.string(),
          annotations: z
            .array(
              z.object({
                quote: z
                  .string()
                  .describe("Fragmento LITERAL del transcript, copiado tal cual"),
                kind: z.enum(KINDS),
                severity: z.enum(SEVERIDADES),
                problem: z.string().describe("Que esta mal, en una linea"),
                fix: z.string().describe("Que decir en su lugar, concreto"),
                sourceUrl: z.string().nullable(),
                sourceTitle: z.string().nullable(),
              }),
            )
            .max(6),
        }),
      }),
    });

    // Una sola marca grave frena el paso al jurado aunque el promedio de bien:
    // no queremos que llegue con una cifra falsa sin corregir.
    const hayGrave = output.annotations.some((a) => a.severity === "alta");
    const passed = output.score >= NOTA_MINIMA && !hayGrave;

    await ctx.runMutation(internal.review.save, {
      sessionId,
      round,
      score: output.score,
      passed,
      summary: output.summary,
      annotations: output.annotations.map((a) => ({
        quote: a.quote,
        kind: a.kind,
        severity: a.severity,
        problem: a.problem,
        fix: a.fix,
        sourceUrl: a.sourceUrl ?? undefined,
        sourceTitle: a.sourceTitle ?? undefined,
      })),
    });

    return { score: output.score, passed, annotations: output.annotations.length };
  },
});

// El expositor tacha una marca cuando ya la arreglo.
export const resolve = internalMutation({
  args: { annotationId: v.id("annotations") },
  handler: (ctx, { annotationId }) =>
    ctx.db.patch(annotationId, { resolved: true }),
});
