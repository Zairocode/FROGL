import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    status: v.union(v.literal("lobby"), v.literal("live"), v.literal("ended")),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Perfiles de jurado. Se editan en runtime, sin deploy: este es el panel de control.
  profiles: defineTable({
    slug: v.string(),
    name: v.string(),
    emoji: v.string(),
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
    author: v.string(),
    text: v.string(),
  }).index("by_session", ["sessionId"]),

  // Corpus del RAG. Un chunk = un tag. Si sirve para dos jurados, se duplica.
  chunks: defineTable({
    tag: v.string(),
    text: v.string(),
    source: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 3072, // gemini-embedding-001
    filterFields: ["tag"],
  }),
});
