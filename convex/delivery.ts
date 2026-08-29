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
    tMs: v.number(),
    rms: v.number(),
    silentRatio: v.number(),
  },
  handler: (ctx, args) => ctx.db.insert("delivery", args),
});

export { analyze, type DeliveryReport } from "./deliveryMath";
