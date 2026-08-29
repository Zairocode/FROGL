import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const reactionKind = v.union(
  v.literal("hooked"),
  v.literal("confused"),
  v.literal("bored"),
  v.literal("skeptical"),
  v.literal("convinced"),
);

// Todo lo que el panel del jurado necesita. Humanos y agentes salen mezclados
// del mismo stream: el front no pregunta quien es quien.
export const reactions = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("reactions")
      .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .take(50),
});

export const questions = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("questions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const scores = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("scores")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const messages = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const send = mutation({
  args: {
    sessionId: v.id("sessions"),
    author: v.string(),
    text: v.string(),
  },
  handler: (ctx, args) => ctx.db.insert("messages", args),
});

// Los humanos del panel reaccionan igual que los agentes: mismo shape,
// mismo stream. El front no pregunta quien es quien.
export const sendReaction = mutation({
  args: {
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    kind: reactionKind,
    note: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, seatId, kind, note }) => {
    const seat = await ctx.db.get(seatId);
    if (!seat || seat.sessionId !== sessionId) throw new Error("Asiento invalido");
    const session = await ctx.db.get(sessionId);
    const tMs = session?.startedAt ? Date.now() - session.startedAt : 0;
    return ctx.db.insert("reactions", { sessionId, seatId, tMs, kind, note });
  },
});

// Pregunta de un humano: se vuelca a la misma tabla questions.
export const askQuestion = mutation({
  args: {
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    text: v.string(),
  },
  handler: async (ctx, { sessionId, seatId, text }) => {
    const seat = await ctx.db.get(seatId);
    if (!seat || seat.sessionId !== sessionId) throw new Error("Asiento invalido");
    const session = await ctx.db.get(sessionId);
    const tMs = session?.startedAt ? Date.now() - session.startedAt : 0;
    const questionId = await ctx.db.insert("questions", {
      sessionId,
      seatId,
      tMs,
      text,
      answered: false,
    });
    // La pregunta de un humano tambien puede salir en voz alta (TTS).
    await ctx.scheduler.runAfter(0, internal.speak.addJob, {
      sessionId,
      seatId,
      text,
      kind: "question",
      tMs,
    });
    return questionId;
  },
});

export const answerQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: (ctx, { questionId }) =>
    ctx.db.patch(questionId, { answered: true }),
});
