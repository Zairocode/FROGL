import { JUROR_COLORS } from "./accounts";
import type { Doc } from "@/convex/_generated/dataModel";

// ============================================================
//  STREAM DEL JURADO (buildActivity)
//  Convierte las tablas de Convex (reactions, questions, messages,
//  seats, profiles) en el stream unico que consume la UI. Humanos y
//  agentes salen mezclados: el front no pregunta quien es quien.
// ============================================================

export const CUE_KINDS = ["chat", "volume", "posture", "rating"] as const;
export type CueKind = (typeof CUE_KINDS)[number];

export type ChatMessage = {
  id: string;
  /** Estable por autor: seatId para agentes, `human:<nombre>` para humanos. */
  accountId: string;
  author: string;
  color: string;
  text: string;
  createdAt: number;
  cue: CueKind;
};

// Color por jurado agente: matchea los tokens --jury-* del design system.
const JURY_COLOR_BY_SLUG: Record<string, string> = {
  tecnico: "#38bdf8",
  tiktok: "#ff8fab",
  "recien-llegado": "#fbbf24",
  actitud: "#2dd4a8",
};

const REACTION_LABEL: Record<string, string> = {
  hooked: "🔥 Enganchado",
  confused: "🤔 Perdido",
  bored: "😴 Se apaga",
  skeptical: "😬 Escéptico",
  convinced: "👏 Convencido",
};

/** Color deterministico por nombre (para humanos y fallbacks). */
export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return JUROR_COLORS[hash % JUROR_COLORS.length];
}

/**
 * Los cues de coaching ya no viajan en un campo: se infieren del texto.
 * `🔊` -> volumen, `🧍` -> postura. Lo demas es chat (o emojis de rating,
 * que la UI detecta con emoji-regex al puntuar).
 */
export function classifyCue(text: string): CueKind {
  if (text.startsWith("🔊")) return "volume";
  if (text.startsWith("🧍")) return "posture";
  return "chat";
}

type ActivityInput = {
  session: Doc<"sessions">;
  reactions: Doc<"reactions">[];
  questions: Doc<"questions">[];
  messages: Doc<"messages">[];
  seats: Doc<"seats">[];
  profiles: Doc<"profiles">[];
};

export function buildActivity({
  session,
  reactions,
  questions,
  messages,
  seats,
  profiles,
}: ActivityInput): ChatMessage[] {
  const seatById = new Map(seats.map((seat) => [seat._id, seat]));
  const slugBySeat = new Map<string, string>();
  for (const seat of seats) {
    if (!seat.profileId) continue;
    const profile = profiles.find((p) => p._id === seat.profileId);
    if (profile) slugBySeat.set(seat._id, profile.slug);
  }
  const startedAt = session.startedAt ?? 0;

  const colorForSeat = (seatId: Doc<"seats">["_id"]): string => {
    const slug = slugBySeat.get(seatId);
    if (slug && JURY_COLOR_BY_SLUG[slug]) return JURY_COLOR_BY_SLUG[slug];
    const seat = seatById.get(seatId);
    return colorForName(seat?.displayName ?? "Jurado");
  };

  const out: ChatMessage[] = [];

  for (const reaction of reactions) {
    const seat = seatById.get(reaction.seatId);
    out.push({
      id: `r-${reaction._id}`,
      accountId: reaction.seatId,
      author: seat?.displayName ?? "Jurado",
      color: colorForSeat(reaction.seatId),
      text: reaction.note ?? REACTION_LABEL[reaction.kind] ?? reaction.kind,
      createdAt: startedAt + reaction.tMs,
      cue: "chat",
    });
  }

  for (const question of questions) {
    const seat = seatById.get(question.seatId);
    out.push({
      id: `q-${question._id}`,
      accountId: question.seatId,
      author: seat?.displayName ?? "Jurado",
      color: colorForSeat(question.seatId),
      text: question.text,
      createdAt: startedAt + question.tMs,
      cue: "chat",
    });
  }

  for (const message of messages) {
    out.push({
      id: `m-${message._id}`,
      accountId: `human:${message.author}`,
      author: message.author,
      color: colorForName(message.author),
      text: message.text,
      createdAt: message._creationTime,
      cue: classifyCue(message.text),
    });
  }

  return out.sort((a, b) => a.createdAt - b.createdAt);
}

export function latestCue(
  messages: ChatMessage[],
  cue: CueKind,
  maxAgeMs = 18_000,
): ChatMessage | null {
  const now = Date.now();
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.cue !== cue) continue;
    if (now - message.createdAt > maxAgeMs) return null;
    return message;
  }
  return null;
}

export function latestByJuror(
  messages: ChatMessage[],
): Record<string, ChatMessage> {
  const latest: Record<string, ChatMessage> = {};
  for (const message of messages) {
    const prev = latest[message.accountId];
    if (!prev || message.createdAt >= prev.createdAt) {
      latest[message.accountId] = message;
    }
  }
  return latest;
}
