import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Todo lo que el panel del jurado necesita. Humanos y agentes salen mezclados
// del mismo stream: el front no pregunta quien es quien.
export const reactions = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("reactions")
      .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .take(50),
});

export const questions = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("questions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const scores = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("scores")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const messages = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

export const send = mutation({
  args: {
    sessionId: v.id("sessions"),
    accountId: v.string(),
    author: v.string(),
    color: v.string(),
    text: v.string(),
    cue: v.optional(v.string()),
  },
  handler: (ctx, args) => ctx.db.insert("messages", args),
});

export const answerQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: (ctx, { questionId }) =>
    ctx.db.patch(questionId, { answered: true }),
});

// La ultima revision del corrector. El front la usa para decidir si ya
// puede mostrar el boton de "mandar al jurado".
export const reviews = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) =>
    ctx.db
      .query("reviews")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .take(5),
});

// Las marcas de la ronda actual, sin las que el expositor ya arreglo.
export const annotations = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    const round = session?.reviewRound ?? 1;
    return ctx.db
      .query("annotations")
      .withIndex("by_session_round", (q) =>
        q.eq("sessionId", sessionId).eq("round", round),
      )
      .collect();
  },
});

// El expositor tacha una marca cuando la corrigio.
export const resolveAnnotation = mutation({
  args: { annotationId: v.id("annotations") },
  handler: (ctx, { annotationId }) =>
    ctx.db.patch(annotationId, { resolved: true }),
});

// ============================================================
//  LO QUE UN JURADO HUMANO NECESITA
//  Antes entraba a la sala y no veia nada: ni que sesiones habia
//  abiertas, ni lo que el expositor estaba diciendo, ni forma de
//  dar su veredicto.
// ============================================================

// Sesiones que un jurado puede mirar: las que estan en vivo primero, y
// despues las que ya cerraron pero siguen en deliberacion.
export const openForJury = query({
  args: {},
  handler: async (ctx) => {
    const recientes = await ctx.db.query("sessions").order("desc").take(25);
    return recientes
      .filter(
        (s) =>
          !s.title.startsWith("[fixture]") &&
          (s.status === "live" || s.phase === "jury" || s.phase === "review"),
      )
      .map((s) => ({
        _id: s._id,
        title: s.title,
        topic: s.topic ?? null,
        presenterName: s.presenterName,
        status: s.status,
        phase: s.phase ?? null,
        startedAt: s.startedAt ?? null,
      }));
  },
});

// El veredicto de un humano. Se guarda en la misma tabla que el de los
// agentes: el front no distingue quien puntuo.
export const submitVerdict = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    total: v.number(),
    verdict: v.string(),
    funciono: v.optional(v.string()),
    romper: v.optional(v.string()),
    hacer: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, userId, ...voto }) => {
    const seats = await ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const mine = seats.find((s) => s.userId === userId);
    if (!mine) throw new Error("Todavia no estas sentado en esta sala");

    // Si ya habia votado, se reemplaza en vez de acumular.
    const previos = await ctx.db
      .query("scores")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const p of previos.filter((p) => p.seatId === mine._id)) {
      await ctx.db.delete(p._id);
    }

    return ctx.db.insert("scores", {
      sessionId,
      seatId: mine._id,
      breakdown: [],
      ...voto,
    });
  },
});
