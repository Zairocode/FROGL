import { query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
//  EL PANEL, UNIFICADO
//  Agentes y humanos salen de la MISMA lista con la misma forma.
//  El front no pregunta quien es quien: pinta lo que le llega.
// ============================================================

const HUMANO_VIVO_MS = 15_000; // sin latido por mas de esto, se fue de la sala

export const jurors = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const [seats, reactions, messages] = await Promise.all([
      ctx.db
        .query("seats")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("reactions")
        .withIndex("by_session_time", (q) => q.eq("sessionId", sessionId))
        .order("desc")
        .take(80),
      ctx.db
        .query("messages")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .order("desc")
        .take(80),
    ]);

    const now = Date.now();
    const out = [];
    for (const seat of seats) {
      if (!seat.active) continue;
      // Un humano que dejo de latir ya no esta en la sala. Los agentes no laten.
      if (seat.kind === "human" && now - (seat.lastSeen ?? 0) > HUMANO_VIVO_MS)
        continue;

      const profile = seat.profileId ? await ctx.db.get(seat.profileId) : null;
      const reaction = reactions.find((r) => r.seatId === seat._id);
      const message = messages.find((m) => m.accountId === seat.userId);

      out.push({
        seatId: seat._id,
        kind: seat.kind,
        // El front matchea por slug (JurySlug), no por id de asiento.
        slug: profile?.slug ?? null,
        name: profile?.name ?? seat.displayName,
        emoji: profile?.emoji ?? "",
        color: profile?.color ?? seat.color ?? "#38bdf8",
        // La burbuja es lo mismo mire quien mire: la reaccion del agente
        // o el ultimo mensaje del humano.
        bubble: reaction
          ? { text: reaction.note ?? "", kind: reaction.kind, tMs: reaction.tMs }
          : message
            ? { text: message.text, kind: "chat", tMs: 0 }
            : null,
      });
    }
    return out;
  },
});

// Antes de que arranque el primer pitch no hay asientos todavia, pero la sala
// no deberia verse vacia: mostramos a los 4 agentes esperando.
export const preview = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.map((p) => ({
      seatId: p._id as string,
      kind: "agent" as const,
      slug: p.slug,
      name: p.name,
      emoji: p.emoji,
      color: p.color ?? "#38bdf8",
      bubble: null,
    }));
  },
});
