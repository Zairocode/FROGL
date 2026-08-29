import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// El front consume esto y NO distingue humano de agente: mismo shape, mismo stream.
export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const joinHuman = mutation({
  args: {
    sessionId: v.id("sessions"),
    displayName: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { sessionId, displayName, userId }) => {
    const session = await ctx.db.get(sessionId);
    const tMs = session?.startedAt ? Date.now() - session.startedAt : 0;
    return ctx.db.insert("seats", {
      sessionId,
      kind: "human",
      displayName,
      userId,
      joinedAtMs: tMs,
      active: true,
    });
  },
});

export const leave = mutation({
  args: { seatId: v.id("seats") },
  handler: (ctx, { seatId }) => ctx.db.patch(seatId, { active: false }),
});
