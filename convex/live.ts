import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    accountId: v.string(),
    author: v.string(),
    color: v.string(),
    text: v.string(),
    cue: v.optional(v.string()),
  },
  handler: (ctx, args) => ctx.db.insert("messages", args),
});

export const answerQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: (ctx, { questionId }) =>
    ctx.db.patch(questionId, { answered: true }),
});
