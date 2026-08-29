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

    // --- fase 1: lo que se decide antes de abrir el microfono ---
    // Sin esto el jurado evaluaba a ciegas: no sabia de que iba el pitch
    // ni cuanto tenia que durar.
    topic: v.optional(v.string()),
    plannedMs: v.optional(v.number()),

    // El pitch avanza por acá y no se saltea ninguna: el jurado no se abre
    // hasta que la correccion pase.
    phase: v.optional(
      v.union(
        v.literal("prep"),
        v.literal("live"),
        v.literal("review"),
        v.literal("jury"),
        v.literal("done"),
      ),
    ),

    // --- opciones avanzadas, todas opcionales ---
    jurySlugs: v.optional(v.array(v.string())), // que jueces entran
    criteria: v.optional(
      // Reemplaza pesos de la rubrica de un juez. Lo que no se nombra queda
      // como esta en el perfil.
      v.array(
        v.object({ slug: v.string(), key: v.string(), weight: v.number() }),
      ),
    ),
    factCheck: v.optional(v.boolean()), // verificar contra la web
    reviewRound: v.optional(v.number()), // cuantas veces se corrigio
  }).index("by_status", ["status"]),

  // Resultado de una pasada del corrector. Una fila por ronda.
  reviews: defineTable({
    sessionId: v.id("sessions"),
    round: v.number(),
    score: v.number(), // 0..10, salud del pitch
    passed: v.boolean(), // si habilita al jurado
    summary: v.string(),
  }).index("by_session", ["sessionId"]),

  // Lo que el corrector subraya en el transcript. el campo quote es el fragmento
  // literal para que el front lo pueda resaltar sin adivinar posiciones.
  annotations: defineTable({
    sessionId: v.id("sessions"),
    round: v.number(),
    quote: v.string(),
    kind: v.union(
      v.literal("dato"), // una cifra o afirmacion que no cierra
      v.literal("falta"), // algo que deberia estar y no esta
      v.literal("gancho"), // no engancha
      v.literal("claridad"), // se entiende mal
    ),
    severity: v.union(v.literal("alta"), v.literal("media"), v.literal("baja")),
    problem: v.string(),
    fix: v.string(),
    sourceUrl: v.optional(v.string()),
    sourceTitle: v.optional(v.string()),
    resolved: v.boolean(),
  }).index("by_session_round", ["sessionId", "round"]),

  // Perfiles de jurado. Se editan en runtime, sin deploy: este es el panel de control.
  profiles: defineTable({
    slug: v.string(),
    name: v.string(),
    emoji: v.string(),
    color: v.optional(v.string()),
    // Como suena. Estaba hardcodeado "rioplatense" en el prompt y salian
    // todos hablando igual. Se edita por jurado desde el dashboard.
    dialect: v.optional(v.string()),
    // Como trata al expositor. Las personas estaban escritas para ser
    // filosas y nada les pedia ser utiles, asi que salian solo groseras.
    tone: v.optional(v.string()),
    // Solo el tecnico contrasta contra la web. Los demas opinan de lo que
    // escucharon: buscar por todos multiplica costo y tiempo sin sumar.
    verifiesFacts: v.optional(v.boolean()),
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
    // Forma obligatoria del feedback. Pedir "se amable" por prompt no
    // alcanzaba: la estructura es la que obliga a que sea util.
    funciono: v.optional(v.string()),
    romper: v.optional(v.string()),
    hacer: v.optional(v.string()),
    momento: v.optional(v.string()), // mm:ss del punto que senala
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

  // Pitch del estudio (cámara + texto): se guarda y se califica 0–10.
  studioGrades: defineTable({
    text: v.string(),
    score: v.number(),
    why: v.string(),
    durationMs: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

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
