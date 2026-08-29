import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============================================================
//  TTS — COLA DE VOZ DEL JURADO (Eleven Labs, server-side)
//  Cuando un jurado reacciona o pregunta, jury.saveReaction encola
//  un job aca. speak.render lo toma, genera el audio con la voz
//  PROPIA de ese jurado (profiles.voiceId) en Eleven Labs y lo
//  guarda en Convex file storage. El front consume pending (jobs
//  que ya tienen audioUrl), reproduce y lo marca done.
//
//  Si el jurado no tiene voiceId configurado, o la API falla, el
//  job se descarta (done=true sin audio): la burbuja de texto
//  aparece igual, no rompe nada. Ver profiles.ts -> voiceId.
// ============================================================

// La key se lee del deployment de Convex (ELEVENLABS_API_KEY, ya presente
// en .env.local para el dev local). Modelo de TTS overridable con env
// ELEVENLABS_MODEL; default: multilingual (calidad, espanol bien).
const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

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

// El front consume esto: solo los jobs que YA tienen audio listo para
// reproducir, mas viejo primero. Los que estan renderizando o se
// descartaron quedan fuera hasta que el render termine.
export const pending = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const jobs = await ctx.db
      .query("speakJobs")
      .withIndex("by_session_pending", (q) =>
        q.eq("sessionId", sessionId).eq("done", false),
      )
      .order("asc")
      .take(20);
    const out: Array<{
      _id: Id<"speakJobs">;
      seatId: Id<"seats">;
      text: string;
      kind: "reaction" | "question";
      tMs: number;
      audioUrl: string;
    }> = [];
    for (const j of jobs) {
      if (!j.audioStorageId) continue;
      const audioUrl = await ctx.storage.getUrl(
        j.audioStorageId as Id<"_storage">,
      );
      if (audioUrl) out.push({ ...j, audioUrl });
    }
    return out;
  },
});

// El front la llama cuando termina de reproducir el audio. De paso borra el
// mp3 de storage: no se acumulan archivos por cada reaccion de cada sesion.
export const markDone = mutation({
  args: { speakJobId: v.id("speakJobs") },
  handler: async (ctx, { speakJobId }) => {
    const job = await ctx.db.get(speakJobId);
    if (job?.audioStorageId) {
      await ctx.storage.delete(job.audioStorageId as Id<"_storage">);
    }
    await ctx.db.patch(speakJobId, { done: true });
  },
});

// Joins necesarios para renderizar: el job + la voz de su asiento.
export const getBundle = internalQuery({
  args: { jobId: v.id("speakJobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    const seat = await ctx.db.get(job.seatId);
    const profile = seat?.profileId ? await ctx.db.get(seat.profileId) : null;
    if (!profile) return null;
    return { job, profile };
  },
});

// Genera el mp3 con la voz del jurado y lo guarda en storage. Lo agenda
// jury.react (ctx.scheduler.runAfter) justo despues de encolar el job.
export const render = internalAction({
  args: { jobId: v.id("speakJobs") },
  handler: async (ctx, { jobId }) => {
    try {
      const b = await ctx.runQuery(internal.speak.getBundle, { jobId });
      if (!b) return;
      const { job, profile } = b;

      const voiceId = profile.voiceId?.trim();
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!voiceId || !apiKey) {
        // Sin voz configurada (o sin key): no hay audio que generar. El job
        // se descarta y el texto queda solo como burbuja.
        await ctx.runMutation(internal.speak.skipAudio, { jobId });
        return;
      }

      const model = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
      const res = await fetch(`${ELEVENLABS_ENDPOINT}/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ text: job.text, model_id: model }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        const detalle = (await res.text()).slice(0, 300);
        throw new Error(`ElevenLabs ${res.status}: ${detalle}`);
      }

      const bytes = await res.arrayBuffer();
      const storageId = await ctx.storage.store(
        new Blob([bytes], { type: "audio/mpeg" }),
      );
      await ctx.runMutation(internal.speak.setAudio, {
        jobId,
        audioStorageId: storageId,
      });
    } catch (err) {
      // Fallo elegante: drena el job, la burbuja de texto sigue apareciendo.
      console.error("[speak.render] fallo TTS ElevenLabs:", err);
      await ctx.runMutation(internal.speak.skipAudio, { jobId });
    }
  },
});

export const setAudio = internalMutation({
  args: { jobId: v.id("speakJobs"), audioStorageId: v.string() },
  handler: (ctx, { jobId, audioStorageId }) =>
    ctx.db.patch(jobId, { audioStorageId }),
});

export const skipAudio = internalMutation({
  args: { jobId: v.id("speakJobs") },
  handler: (ctx, { jobId }) => ctx.db.patch(jobId, { done: true }),
});
