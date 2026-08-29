import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// El browser (Web Speech API) escupe aca cada frase. Todo lo demas se cuelga de esto.
//
// Reglas del sink:
//  - texto vacio / muy corto se descarta (ruido del mic)
//  - parciales (final:false) se "coalescen": si ya existe un parcial reciente
//    de la misma sesion, se actualiza en vez de insertar uno nuevo. Asi el
//    transcript en vivo no se llena de basura mientras el STT corrige la frase.
export const append = mutation({
  args: {
    sessionId: v.id("sessions"),
    text: v.string(),
    final: v.boolean(),
  },
  handler: async (ctx, { sessionId, text, final }) => {
    const clean = text.trim();
    if (!clean || clean.length < 2) return null;

    const session = await ctx.db.get(sessionId);
    if (!session?.startedAt) throw new Error("La sesion no arranco todavia");
    const tMs = Date.now() - session.startedAt;

    // Parciales: buscar el ultimo final:false de esta sesion y actualizarlo.
    if (!final) {
      const lastInterim = await ctx.db
        .query("transcript")
        .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
        .filter((q) => q.eq(q.field("final"), false))
        .order("desc")
        .first();
      if (lastInterim) {
        return ctx.db.patch(lastInterim._id, { text: clean, tMs });
      }
    }

    return ctx.db.insert("transcript", {
      sessionId,
      tMs,
      text: clean,
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
