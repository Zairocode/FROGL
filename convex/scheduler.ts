import { internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// ============================================================
//  EL LOOP QUE HACE VIVIR AL JURADO
//  El cron (convex/crons.ts) llama a tick cada 5s. Aca se decide
//  QUIEN reacciona y CUANDO, leyendo el reactEveryMs de cada
//  profile. Un solo cron, cero jobs por asiento: la sesion es
//  "live", el asiento es agente y el throttle dice "es hora".
// ============================================================

// Espera un poco mas que el intervalo del cron para no disparar
// reacciones duplicadas si dos ticks se enciman.
const THROTTLE_MARGIN_MS = 1000;

export const tick = internalMutation({
  handler: async (ctx) => {
    const nowMs = Date.now();
    const liveSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    for (const session of liveSessions) {
      if (!session.startedAt) continue;

      const seats = await ctx.db
        .query("seats")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const seat of seats) {
        // Solo agentes con profile reaccionan. Los humanos reaccionan solos.
        if (seat.kind !== "agent" || !seat.profileId || !seat.active) continue;

        const profile = await ctx.db.get(seat.profileId);
        if (!profile) continue;

        // El asiento entra tarde (lateJoin): su reloj arranca desde ahi.
        const periodMs = profile.reactEveryMs;
        const baseMs = Math.max(seat.joinedAtMs, seat.lastReactedAtMs ?? 0);
        const elapsed = nowMs - baseMs;
        if (elapsed + THROTTLE_MARGIN_MS < periodMs) continue;

        // No hay nada nuevo que escuchar desde la ultima reaccion:
        // saltamos para no gastar un LLM en silencio.
        const lastLine = await ctx.db
          .query("transcript")
          .withIndex("by_session_time", (q) => q.eq("sessionId", session._id))
          .order("desc")
          .first();
        if (!lastLine || lastLine.tMs <= baseMs) continue;

        // Marcamos ANTES de agendar: si el action falla, el proximo tick
        // lo reintenta (lastReactedAtMs queda viejo).
        await ctx.db.patch(seat._id, { lastReactedAtMs: nowMs });
        await ctx.scheduler.runAfter(0, api.jury.react, {
          seatId: seat._id,
        });
      }
    }
  },
});
