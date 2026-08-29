import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) => ctx.db.get(sessionId),
});

export const listLive = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect(),
});

// Crea la sesion y sienta a los 4 agentes. Los humanos se suman despues
// con seats.joinHuman; si no aparece ninguno, el jurado ya esta completo.
export const create = mutation({
  args: { title: v.string(), presenterName: v.string() },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      ...args,
      status: "lobby",
    });
    for (const profile of await ctx.db.query("profiles").collect()) {
      await ctx.db.insert("seats", {
        sessionId,
        kind: "agent",
        profileId: profile._id,
        displayName: `${profile.emoji} ${profile.name}`,
        joinedAtMs: profile.defaultJoinAtMs ?? 0,
        active: true,
      });
    }
    return sessionId;
  },
});

export const start = mutation({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db.patch(sessionId, { status: "live", startedAt: Date.now() }),
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db.patch(sessionId, { status: "ended", endedAt: Date.now() }),
});
