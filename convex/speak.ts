import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
//  TTS — COLA DE VOZ DEL JURADO
//  El backend NO genera audio. Cuando algo tiene que sonar (una
//  pregunta del jurado, una reaccion destacada) se encola aca.
//  El front (Chrome speechSynthesis, Linux Mint) consume la cola,
//  reproduce y la marca done. Vapi queda reservado para el momento
//  de la pregunta en voz alta con calidad de produccion.
// ============================================================

// Interno: lo usan jury.saveReaction y live.askQuestion.
export const addJob = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    text: v.string(),
    kind: v.union(v.literal("reaction"), v.literal("question")),
    tMs: v.number(),
  },
  handler: async (ctx, { sessionId, seatId, text, kind, tMs }) => {
    const clean = text.trim();
    if (!clean) return null;
    return ctx.db.insert("speakJobs", {
      sessionId,
      seatId,
      text: clean,
      kind,
      tMs,
      done: false,
    });
  },
});

// El front consume esto: pendientes de esta sesion, mas viejo primero.
export const pending = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("speakJobs")
      .withIndex("by_session_pending", (q) =>
        q.eq("sessionId", sessionId).eq("done", false),
      )
      .order("asc")
      .take(20),
});

// El front la llama cuando termina de reproducir el audio.
export const markDone = mutation({
  args: { speakJobId: v.id("speakJobs") },
  handler: (ctx, { speakJobId }) =>
    ctx.db.patch(speakJobId, { done: true }),
});
