import type { JurySlug } from "./jury";
import { JURY_SLUGS } from "./jury";

export type ChatMessage = {
  id: string;
  seat: JurySlug;
  author: string;
  text: string;
  createdAt: number;
};

export const CHAT_STORAGE_KEY = "frogl:jury-chat:v1";
export const CHAT_CHANNEL = "frogl-jury-chat";

function isSeat(value: unknown): value is JurySlug {
  return typeof value === "string" && JURY_SLUGS.includes(value as JurySlug);
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as ChatMessage;
  return (
    typeof m.id === "string" &&
    isSeat(m.seat) &&
    typeof m.author === "string" &&
    typeof m.text === "string" &&
    typeof m.createdAt === "number"
  );
}

export function readChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMessage);
  } catch {
    return [];
  }
}

export function writeChat(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

export function createMessage(
  seat: JurySlug,
  author: string,
  text: string,
): ChatMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    seat,
    author,
    text: text.trim(),
    createdAt: Date.now(),
  };
}

export function latestBySeat(
  messages: ChatMessage[],
): Partial<Record<JurySlug, ChatMessage>> {
  const latest: Partial<Record<JurySlug, ChatMessage>> = {};
  for (const message of messages) {
    const prev = latest[message.seat];
    if (!prev || message.createdAt >= prev.createdAt) {
      latest[message.seat] = message;
    }
  }
  return latest;
}
