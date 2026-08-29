"use client";

import { useState } from "react";

/**
 * Front-only stub: la captura real vive en useSpeechTranscript (o en Convex
 * cuando el backend esté cableado). API alineada con el hook de main.
 */
export function usePitchCapture(
  _sessionId: string | null,
  _opts: { lang?: string; silenceThreshold?: number } = {},
) {
  const [recording] = useState(false);
  return {
    recording,
    interim: "",
    level: 0,
    error: null as string | null,
    heard: 0,
    start: async (_override?: string) => {},
    stop: () => {},
  };
}
