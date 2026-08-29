import { internalAction, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

// ============================================================
//  LATIDO DEL JURADO
//  Cadena auto-reagendada: cada tick corre una reaccion y se
//  vuelve a agendar. Muere sola cuando la sesion deja de estar
//  "live", asi que no hay nada que apagar a mano.
// ============================================================

export const shouldTick = internalQuery({
  args: { seatId: v.id("seats") },
  handler: async (ctx, { seatId }): Promise<{ everyMs: number } | null> => {
    const seat = await ctx.db.get(seatId);
    if (!seat?.active || !seat.profileId) return null;
    const [session, profile] = await Promise.all([
      ctx.db.get(seat.sessionId),
      ctx.db.get(seat.profileId),
    ]);
    if (session?.status !== "live" || !profile) return null;
    return { everyMs: profile.reactEveryMs };
  },
});

export const tick = internalAction({
  args: { seatId: v.id("seats") },
  handler: async (ctx, { seatId }): Promise<void> => {
    const go = await ctx.runQuery(internal.loop.shouldTick, { seatId });
    if (!go) return; // sesion cerrada o asiento vacio: la cadena se corta sola
    await ctx.runAction(api.jury.react, { seatId });
    await ctx.scheduler.runAfter(go.everyMs, internal.loop.tick, { seatId });
  },
});
