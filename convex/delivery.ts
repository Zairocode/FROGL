import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
//  COMO LO DIJO, no que dijo.
//  El transcript viene limpio: la Web Speech API borra "eeeh" y "mmm"
//  y no trae silencios ni volumen. Sin esto, Rosa califica "energia"
//  leyendo un texto que no tiene ninguna informacion de energia.
// ============================================================

// El browser manda una muestra cada ~3s mientras dura el pitch.
export const sample = mutation({
  args: {
    sessionId: v.id("sessions"),
    rms: v.number(),
    silentRatio: v.number(),
  },
  handler: async (ctx, { sessionId, rms, silentRatio }) => {
    const session = await ctx.db.get(sessionId);
    // Esto es telemetria: si todavia no arranco, se descarta en silencio.
    // A diferencia de transcript.append, no tira: no queremos que una muestra
    // temprana rompa el loop de captura del browser.
    if (!session?.startedAt) return;
    await ctx.db.insert("delivery", {
      sessionId,
      tMs: Date.now() - session.startedAt,
      rms,
      silentRatio,
    });
  },
});

export { analyze, type DeliveryReport } from "./deliveryMath";
