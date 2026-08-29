"use client";

import { useEffect } from "react";
import type { PublicJuror } from "./accounts";

type SessionStub = { _id: string } | null;

type PanelJuror = {
  seatId: string;
  name: string;
  color: string;
  emoji: string;
  kind: "agent" | "human";
};

/** Front-only stub: sin Convex. */
export function useCurrentSession(): SessionStub {
  return null;
}

export function usePanel(_sessionId?: string | null): PanelJuror[] {
  return [];
}

export function useTranscript(_sessionId?: string | null) {
  return [] as Array<{ text: string; tMs: number; final: boolean }>;
}

export function useScores(_sessionId?: string | null) {
  return [] as unknown[];
}

export function useQuestions(_sessionId?: string | null) {
  return [] as Array<{ _id: string; text: string }>;
}

export function useHeartbeat(
  _sessionId?: string | null,
  _juror?: PublicJuror | null,
) {
  /* no-op offline */
}

export function useSpokenQuestions(
  _sessionId?: string | null,
  _enabled?: boolean,
) {
  useEffect(() => {
    /* no-op offline */
  }, []);
}
