import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// El browser (Web Speech API) escupe aca cada frase. Todo lo demas se cuelga de esto.
export const append = mutation({
  args: {
    sessionId: v.id("sessions"),
    text: v.string(),
    final: v.boolean(),
  },
  handler: async (ctx, { sessionId, text, final }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.startedAt) throw new Error("La sesion no arranco todavia");
    return ctx.db.insert("transcript", {
      sessionId,
      tMs: Date.now() - session.startedAt,
      text,
      final,
    });
  },
});

export const live = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("transcript")
      .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
      .collect(),
});
