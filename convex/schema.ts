import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { pitchTypeValidator } from "./pitchTypes";

// Politica de contexto: QUE PORCION DEL TRANSCRIPT VE CADA JURADO.
// Es el knob que hace distintos a los jurados sin duplicar codigo de agente.
const contextPolicy = v.union(
  v.literal("full"),     // ve todo el pitch
  v.literal("lateJoin"), // solo desde seat.joinedAtMs en adelante
  v.literal("window"),   // solo los ultimos windowMs (atencion corta)
);

const reactionKind = v.union(
  v.literal("hooked"),
  v.literal("confused"),
  v.literal("bored"),
  v.literal("skeptical"),
  v.literal("convinced"),
);

export default defineSchema({
  sessions: defineTable({
    title: v.string(),
    presenterName: v.string(),
    // Tipo de pitch: el lente que el front elige al crear la sala. Alimenta
    // el briefing de los jurados (pitchTypes.pitchBriefing). Vacio = general.
    pitchType: v.optional(pitchTypeValidator),
    // Fase del room (live/review/...). Vive en el front; el backend lo persiste
    // tal cual llega. Opcional por compatibilidad con sesiones viejas.
    phase: v.optional(v.string()),
    // Campos del room que el front ya guarda en runtime (deployment actual).
    // Se preservan por compatibilidad; el backend no los escribe todavia.
    topic: v.optional(v.string()),
    plannedMs: v.optional(v.number()),
    reviewRound: v.optional(v.number()),
    jurySlugs: v.optional(v.array(v.string())),
    factCheck: v.optional(v.boolean()),
    status: v.union(v.literal("lobby"), v.literal("live"), v.literal("ended")),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Perfiles de jurado. Se editan en runtime, sin deploy: este es el panel de control.
  profiles: defineTable({
    slug: v.string(),
    name: v.string(),
    emoji: v.string(),
    color: v.optional(v.string()),
    // Como suena. Estaba hardcodeado "rioplatense" en el prompt y salian
    // todos hablando igual. Se edita por jurado desde el dashboard.
    dialect: v.optional(v.string()),
    persona: v.string(),
    rubric: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        weight: v.number(),
        // Que significa un 2 y que significa un 9 para ESTE criterio.
        // Sin anclas el modelo puntua por impresion y varia entre corridas.
        anchor: v.optional(v.string()),
      }),
    ),
    retrievalTag: v.string(),   // que corpus del RAG ve -> chunks.tag
    // Puede verificar afirmaciones factuales con Tavily (tool buscarEnWeb).
    // El deployment ya usaba este nombre en runtime; lo adoptamos.
    verifiesFacts: v.optional(v.boolean()),
    // Refinamiento de voz, editable en runtime. Se preserva por compatibilidad.
    tone: v.optional(v.string()),
    contextPolicy,
    windowMs: v.optional(v.number()),
    defaultJoinAtMs: v.optional(v.number()),
    reactEveryMs: v.number(),   // cada cuanto opina durante el pitch
  }).index("by_slug", ["slug"]),

  // Un asiento del jurado. Humano o agente comparten tabla y stream:
  // el front no distingue, y si no hay humanos entra un agente al mismo slot.
  seats: defineTable({
    sessionId: v.id("sessions"),
    kind: v.union(v.literal("agent"), v.literal("human")),
    profileId: v.optional(v.id("profiles")),
    displayName: v.string(),
    userId: v.optional(v.string()),
    joinedAtMs: v.number(),
    active: v.boolean(),
    // Ultima vez que este asiento reacciono (solo agentes). El scheduler la
    // usa como throttle: no dispara jury.react si reactEveryMs no paso.
    lastReactedAtMs: v.optional(v.number()),
    lastSeen: v.optional(v.number()), // heartbeat del humano; los agentes no lo usan
    color: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  transcript: defineTable({
    sessionId: v.id("sessions"),
    tMs: v.number(),
    text: v.string(),
    final: v.boolean(),
  }).index("by_session_time", ["sessionId", "tMs"]),

  reactions: defineTable({
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    tMs: v.number(),
    kind: reactionKind,
    note: v.optional(v.string()),
  }).index("by_session_time", ["sessionId", "tMs"]),

  questions: defineTable({
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    tMs: v.number(),
    text: v.string(),
    answered: v.boolean(),
  }).index("by_session", ["sessionId"]),

  scores: defineTable({
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    breakdown: v.array(
      v.object({ key: v.string(), score: v.number(), why: v.string() }),
    ),
    total: v.number(),
    verdict: v.string(),
    // Feedback categorizado del scorecard (deployment actual). El backend de
    // esta rama no los escribe todavia; se preservan por compatibilidad.
    funciono: v.optional(v.string()),
    hacer: v.optional(v.string()),
    romper: v.optional(v.string()),
    momento: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  // Muestras acusticas que manda el browser cada ~3s con Web Audio.
  // El transcript da QUE dijo; esto da COMO lo dijo.
  delivery: defineTable({
    sessionId: v.id("sessions"),
    tMs: v.number(),
    rms: v.number(),          // volumen medio de la ventana, 0..1
    silentRatio: v.number(),  // proporcion de la ventana en silencio, 0..1
  }).index("by_session_time", ["sessionId", "tMs"]),

  // Chat de los humanos mirando en vivo
  messages: defineTable({
    sessionId: v.id("sessions"),
    accountId: v.string(),
    author: v.string(),
    color: v.string(),
    text: v.string(),
    cue: v.optional(v.string()), // chat | volume | posture | rating
  }).index("by_session", ["sessionId"]),

  // Cola de TTS: cuando un jurado (agente) hace una pregunta, el backend la
  // encola aca. El front (Chrome speechSynthesis, Linux Mint) la consume y
  // la marca done. El backend NO genera audio: solo orquesta.
  speakJobs: defineTable({
    sessionId: v.id("sessions"),
    seatId: v.id("seats"),
    text: v.string(),
    kind: v.union(v.literal("reaction"), v.literal("question")),
    tMs: v.number(),
    done: v.boolean(),
  }).index("by_session_pending", ["sessionId", "done"]),

  // Corpus del RAG. Un chunk = un tag. Si sirve para dos jurados, se duplica.
  // Embeddings: gemini-embedding-001 (3072 dims). El deployment actual ya
  // tiene chunks a 3072: cambiar la dimension forzaria a dropear y re-embedear.
  chunks: defineTable({
    tag: v.string(),
    text: v.string(),
    source: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 3072,
    filterFields: ["tag"],
  }),
});
