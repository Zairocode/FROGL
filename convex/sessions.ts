import { mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) => ctx.db.get(sessionId),
});

export const listLive = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect(),
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const live = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .first();
    if (live) return live;
    // Las sesiones de tuning:dryRun ensucian el front si son las mas
    // recientes. Se ignoran por el prefijo del titulo.
    const recientes = await ctx.db.query("sessions").order("desc").take(20);
    return recientes.find((s) => !s.title.startsWith("[fixture]")) ?? null;
  },
});

// Sienta a los jueces elegidos. Si no se eligio ninguno, entran los seis.
async function sentarJurado(
  ctx: { db: any },
  sessionId: Id<"sessions">,
  slugs?: string[],
) {
  const todos = await ctx.db.query("profiles").collect();
  const elegidos =
    slugs && slugs.length > 0
      ? todos.filter((p: any) => slugs.includes(p.slug))
      : todos;
  for (const profile of elegidos) {
    await ctx.db.insert("seats", {
      sessionId,
      kind: "agent",
      profileId: profile._id,
      displayName: profile.name,
      color: profile.color,
      joinedAtMs: profile.defaultJoinAtMs ?? 0,
      active: true,
    });
  }
}

// ============================================================
//  FASE 1 — PREPARACION
//  Tema y duracion antes de abrir el microfono. Sin esto el jurado
//  evaluaba a ciegas: no sabia de que iba el pitch ni cuanto duraba.
// ============================================================
export const plan = mutation({
  args: {
    topic: v.string(),
    plannedMs: v.number(),
    presenterName: v.optional(v.string()),
    // --- opciones avanzadas, todas con default sensato ---
    jurySlugs: v.optional(v.array(v.string())),
    criteria: v.optional(
      v.array(
        v.object({ slug: v.string(), key: v.string(), weight: v.number() }),
      ),
    ),
    factCheck: v.optional(v.boolean()),
  },
  handler: async (ctx, { presenterName, jurySlugs, ...args }) => {
    const sessionId = await ctx.db.insert("sessions", {
      title: args.topic,
      presenterName: presenterName ?? "Pitcher",
      status: "lobby",
      phase: "prep",
      jurySlugs,
      ...args,
    });
    await sentarJurado(ctx, sessionId, jurySlugs);
    return sessionId;
  },
});

// Compatibilidad: el front viejo todavia llama create(). Es plan() sin tema.
export const create = mutation({
  args: { title: v.string(), presenterName: v.string() },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      ...args,
      status: "lobby",
      phase: "prep",
    });
    await sentarJurado(ctx, sessionId);
    return sessionId;
  },
});

// ============================================================
//  FASE 2 — EXPOSICION
//  Nadie interrumpe. El loop sigue vivo pero en modo ambiente:
//  caritas y comentarios al costado, sin preguntas habladas.
// ============================================================
export const start = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, {
      status: "live",
      phase: "live",
      startedAt: Date.now(),
    });

    const seats = await ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    for (const seat of seats) {
      if (seat.kind !== "agent" || !seat.profileId) continue;
      const profile = await ctx.db.get(seat.profileId);
      if (!profile) continue;
      // Nadie reacciona antes de haber llegado: Marco entra a los 90s.
      const firstTick = Math.max(
        profile.reactEveryMs,
        seat.joinedAtMs,
        profile.graceMs ?? 0,
      );
      await ctx.scheduler.runAfter(firstTick, internal.loop.tick, {
        seatId: seat._id,
      });
    }
  },
});

// ============================================================
//  FASE 3 — CORRECCION
//  Cerrar el microfono ya NO manda al jurado: manda al corrector.
//  El jurado se abre solo cuando la revision pasa.
// ============================================================
export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, {
      status: "ended",
      phase: "review",
      endedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.review.run, { sessionId });
  },
});

// Volver a correr el corrector despues de editar. Cada pasada es una ronda.
export const rereview = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { phase: "review" });
    await ctx.scheduler.runAfter(0, api.review.run, { sessionId });
  },
});

// ============================================================
//  FASE 4 — DELIBERACION
//  Se abre a mano o cuando el corrector da el visto bueno.
// ============================================================
export const deliberate = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { phase: "jury" });
    const seats = await ctx.db
      .query("seats")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    // Todos a la vez: seis jueces tardan casi lo mismo que uno.
    for (const seat of seats) {
      if (seat.kind === "agent" && seat.profileId) {
        await ctx.scheduler.runAfter(0, api.jury.score, { seatId: seat._id });
      }
    }
  },
});

export const finish = mutation({
  args: { sessionId: v.id("sessions") },
  handler: (ctx, { sessionId }) => ctx.db.patch(sessionId, { phase: "done" }),
});
