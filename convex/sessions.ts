import { mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
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
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { status: "live", startedAt: Date.now() });

    const seats = await ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    for (const seat of seats) {
      if (seat.kind !== "agent" || !seat.profileId) continue;
      const profile = await ctx.db.get(seat.profileId);
      if (!profile) continue;
      // Nadie reacciona antes de haber llegado: Marco entra a los 90s.
      const firstTick = Math.max(profile.reactEveryMs, seat.joinedAtMs);
      await ctx.scheduler.runAfter(firstTick, internal.loop.tick, {
        seatId: seat._id,
      });
    }
  },
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { status: "ended", endedAt: Date.now() });
    // El loop se corta solo al no estar "live". Aca disparamos el scorecard final.
    const seats = await ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const seat of seats) {
      if (seat.kind === "agent" && seat.profileId) {
        await ctx.scheduler.runAfter(0, api.jury.score, { seatId: seat._id });
      }
    }
  },
});
