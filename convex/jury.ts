import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output } from "ai";
import { z } from "zod";
import { retrieve } from "./rag";
import type { Doc } from "./_generated/dataModel";

const MODEL = "anthropic/claude-sonnet-5";
const KINDS = ["hooked", "confused", "bored", "skeptical", "convinced"] as const;

// Anotado a mano: sin esto TS entra en ciclo (action -> internal.jury.bundle -> api.d.ts).
type Bundle = {
  seat: Doc<"seats">;
  session: Doc<"sessions">;
  profile: Doc<"profiles">;
  lines: Doc<"transcript">[];
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
) {
  switch (profile.contextPolicy) {
    case "lateJoin": // entro tarde: nunca vera el arranque
      return lines.filter((l) => l.tMs >= seat.joinedAtMs);
    case "window": // atencion corta: solo los ultimos windowMs
      return lines.filter((l) => l.tMs >= nowMs - (profile.windowMs ?? 20_000));
    default:
      return lines;
  }
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
    return { seat, session, profile, lines };
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
      model: MODEL,
      system: [
        b.profile.persona,
        contextNote(b.profile, b.seat),
        notes.length ? `Sabes esto del tema:\n- ${notes.join("\n- ")}` : "",
        "Estas escuchando un pitch EN VIVO. Reacciona en una linea, en primera persona, en espanol rioplatense. Nada de resumir lo que escuchaste.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt: `Esto es lo que escuchaste hasta ahora:\n\n"${heard}"\n\nReacciona ahora.`,
      output: Output.object({
        schema: z.object({
          kind: z.enum(KINDS),
          note: z.string().describe("Tu reaccion, una linea, en tu voz"),
          question: z
            .string()
            .nullable()
            .describe("Una pregunta solo si de verdad la harias ahora; si no, null"),
        }),
      }),
    });

    await ctx.runMutation(internal.jury.saveReaction, {
      sessionId: b.seat.sessionId,
      seatId,
      tMs: nowMs,
      kind: output.kind,
      note: output.note,
      question: output.question ?? undefined,
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
  },
  handler: (ctx, args) => ctx.db.insert("scores", args),
});

// Scorecard final. El total lo calculamos nosotros con los pesos, no el modelo.
export const score = action({
  args: { seatId: v.id("seats") },
  handler: async (ctx, { seatId }): Promise<{ total: number; verdict: string } | null> => {
    const b = await ctx.runQuery(internal.jury.bundle, { seatId });
    if (!b) return null;
    const endMs =
      b.session.endedAt && b.session.startedAt
        ? b.session.endedAt - b.session.startedAt
        : Number.MAX_SAFE_INTEGER;
    const visible = sliceTranscript(b.lines, b.seat, b.profile, endMs);
    const heard = visible.map((l) => l.text).join(" ");

    const { output } = await generateText({
      model: MODEL,
      system: [
        b.profile.persona,
        contextNote(b.profile, b.seat),
        "Calificas SOLO lo que escuchaste. Si te perdiste parte del pitch, eso juega en contra del pitch, no a favor.",
      ].join("\n\n"),
      prompt: `Pitch escuchado:\n\n"${heard}"\n\nCalifica de 0 a 10 cada criterio: ${b.profile.rubric
        .map((r) => `${r.key} (${r.label})`)
        .join(", ")}. Cerra con un veredicto de dos lineas.`,
      output: Output.object({
        schema: z.object({
          breakdown: z.array(
            z.object({
              key: z.string(),
              score: z.number().min(0).max(10),
              why: z.string(),
            }),
          ),
          verdict: z.string(),
        }),
      }),
    });

    const weights = new Map(b.profile.rubric.map((r) => [r.key, r.weight]));
    const total = output.breakdown.reduce(
      (sum, item) => sum + item.score * (weights.get(item.key) ?? 0),
      0,
    );

    await ctx.runMutation(internal.jury.saveScore, {
      sessionId: b.seat.sessionId,
      seatId,
      breakdown: output.breakdown,
      total: Math.round(total * 10) / 10,
      verdict: output.verdict,
    });
    return { total, verdict: output.verdict };
  },
});
