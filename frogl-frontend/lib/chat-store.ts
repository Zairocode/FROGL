import type { PublicJuror } from "./accounts";

export const CUE_KINDS = ["chat", "volume", "posture", "rating"] as const;
export type CueKind = (typeof CUE_KINDS)[number];

export type ChatMessage = {
  id: string;
  accountId: string;
  author: string;
  color: string;
  text: string;
  createdAt: number;
  cue?: CueKind;
};

export const CHAT_STORAGE_KEY = "frogl:jury-chat:v2";
export const CHAT_CHANNEL = "frogl-jury-chat";

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as ChatMessage;
  return (
    typeof m.id === "string" &&
    typeof m.accountId === "string" &&
    typeof m.author === "string" &&
    typeof m.color === "string" &&
    typeof m.text === "string" &&
    typeof m.createdAt === "number" &&
    (m.cue === undefined ||
      (typeof m.cue === "string" && CUE_KINDS.includes(m.cue as CueKind)))
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
  juror: PublicJuror,
  text: string,
  cue?: CueKind,
): ChatMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    accountId: juror.id,
    author: juror.name,
    color: juror.color,
    text: text.trim(),
    createdAt: Date.now(),
    cue,
  };
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
