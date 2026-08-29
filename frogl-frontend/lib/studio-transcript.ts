import type { Segment, TranscriptExport } from "@/lib/transcript-types";

export function flattenTranscript(
  segments: Segment[],
  interim: string,
): string {
  const parts = segments
    .filter((s) => s.kind !== "silence")
    .map((s) => s.text.trim())
    .filter((t) => t.length >= 2);
  const extra = interim.trim();
  if (extra) parts.push(extra);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function downloadTranscriptJson(payload: TranscriptExport) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `frogl-estudio-${new Date(payload.startedAt).toISOString().replace(/[:.]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const LOCAL_KEY = "frogl:estudio:lastGrade";

export type LocalGrade = {
  savedAt: number;
  text: string;
  score: number;
  why: string;
};

export function persistLocalGrade(grade: LocalGrade) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(grade));
  } catch {
    /* quota / private mode */
  }
}

/** Hasta −5 si no llegás a la meta. Si la cumplís o te pasás, no resta. */
export function scoreWithTimeGoal(
  base: number,
  elapsedMs: number,
  targetMinutes: number,
): { score: number; penalty: number; ratio: number } {
  const targetMs = Math.max(1, targetMinutes) * 60_000;
  const ratio = Math.min(1, elapsedMs / targetMs);
  const penalty = Math.round((1 - ratio) * 5 * 10) / 10;
  const score = Math.round(Math.max(0, Math.min(10, base - penalty)) * 10) / 10;
  return { score, penalty, ratio };
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
