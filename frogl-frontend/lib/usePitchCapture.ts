"use client";

import { useState } from "react";

/** Front-only stub: la captura real vive en useSpeechTranscript. */
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
    start: async () => {},
    stop: () => {},
  };
}
