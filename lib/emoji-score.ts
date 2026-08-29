import emojiRegex from "emoji-regex";
import type { ChatMessage } from "./chat-store";

const WEIGHTS: Record<string, number> = {
  "🔥": 2,
  "💯": 2,
  "🤩": 2,
  "😍": 2,
  "👏": 1,
  "👍": 1,
  "✨": 1,
  "💪": 1,
  "🤔": 0,
  "😐": 0,
  "😬": -1,
  "😕": -1,
  "👎": -1,
  "😴": -2,
  "💀": -2,
};

export const RATING_EMOJIS = ["🔥", "👏", "🤔", "😬", "😴"] as const;

export function extractEmojis(text: string): string[] {
  const regex = emojiRegex();
  return Array.from(text.matchAll(regex), (match) => match[0]);
}

export type ExposureScore = {
  emojis: string[];
  score: number;
  label: string;
  tone: "hot" | "good" | "mixed" | "cold" | "empty";
};

export function scoreExpositor(messages: ChatMessage[]): ExposureScore {
  const emojis = messages
    .filter((message) => message.cue !== "volume" && message.cue !== "posture")
    .flatMap((message) => extractEmojis(message.text));
  if (emojis.length === 0) {
    return { emojis: [], score: 0, label: "Sin valoración", tone: "empty" };
  }

  const points = emojis.reduce((sum, emoji) => sum + (WEIGHTS[emoji] ?? 0), 0);
  const max = emojis.length * 2;
  const score = Math.round(((points + max) / (max * 2)) * 100);

  if (score >= 80) return { emojis, score, label: "En llamas", tone: "hot" };
  if (score >= 60) return { emojis, score, label: "Convence", tone: "good" };
  if (score >= 40) return { emojis, score, label: "Tibio", tone: "mixed" };
  return { emojis, score, label: "Se apaga", tone: "cold" };
}
