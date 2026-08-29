"use client";

import { useMemo } from "react";
import { useJuryChat } from "@/lib/chat-context";
import { scoreExpositor } from "@/lib/emoji-score";

const TONE_COLOR = {
  hot: "var(--accent-pink)",
  good: "var(--accent-teal)",
  mixed: "var(--accent-amber)",
  cold: "var(--danger)",
  empty: "var(--fg-muted)",
} as const;

export function ExposureScore({ compact = false }: { compact?: boolean }) {
  const { messages } = useJuryChat();
  const result = useMemo(() => scoreExpositor(messages), [messages]);
  const color = TONE_COLOR[result.tone];

  return (
    <div className={`exposure-score ${compact ? "exposure-score-compact" : ""}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">Valoración</p>
          <p
            className="font-[family-name:var(--font-display)] text-2xl leading-none"
            style={{ color }}
          >
            {result.label}
          </p>
        </div>
        <p
          className="font-[family-name:var(--font-mono)] text-3xl tabular-nums"
          style={{ color }}
        >
          {result.tone === "empty" ? "—" : result.score}
        </p>
      </div>
      <div className="exposure-score-track" aria-hidden>
        <span
          className="exposure-score-fill"
          style={{
            width: result.tone === "empty" ? "0%" : `${result.score}%`,
            background: color,
          }}
        />
      </div>
      {result.emojis.length > 0 ? (
        <p className="exposure-score-emojis" aria-label="Emojis del jurado">
          {result.emojis.slice(-12).join(" ")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-fg-muted">
          El jurado valora con emojis. Se leen con emoji-regex.
        </p>
      )}
    </div>
  );
}
