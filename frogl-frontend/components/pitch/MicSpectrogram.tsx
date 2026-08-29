"use client";

import { useEffect, useRef } from "react";

const MAX_OPTIONS = [5, 6, 7, 8, 9, 10] as const;

type Props = {
  listening: boolean;
  disabled?: boolean;
  onToggle: () => void;
  elapsedLabel: string;
  maxMinutes: number;
  onMaxMinutesChange: (minutes: number) => void;
};

export function MicSpectrogram({
  listening,
  disabled,
  onToggle,
  elapsedLabel,
  maxMinutes,
  onMaxMinutesChange,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const itemH = 28;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = MAX_OPTIONS.indexOf(
      maxMinutes as (typeof MAX_OPTIONS)[number],
    );
    if (idx < 0) return;
    el.scrollTop = idx * itemH;
  }, [maxMinutes]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / itemH);
    const clamped = Math.max(0, Math.min(MAX_OPTIONS.length - 1, idx));
    const next = MAX_OPTIONS[clamped];
    if (next !== maxMinutes) onMaxMinutesChange(next);
  };

  return (
    <div className="pointer-events-auto flex items-end gap-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.55)]">
      {/* Izquierda: pill mic + tiempo */}
      <div className="flex items-center gap-3 rounded-full bg-[#2a2d31]/90 px-2 py-1.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={listening}
          aria-label={listening ? "Detener micrófono" : "Activar micrófono"}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
            listening
              ? "bg-danger text-bg"
              : "bg-accent-pink text-bg hover:opacity-95",
            disabled ? "cursor-not-allowed opacity-40" : "",
          ].join(" ")}
        >
          <MicIcon muted={!listening} />
        </button>

        <span className="min-w-[3.25rem] pr-3 text-center font-mono text-base tabular-nums tracking-tight text-white">
          {elapsedLabel.replace(/^0(\d):/, "$1:")}
        </span>
      </div>

      {/* Derecha: selector máx minutos (label arriba, scroll abajo) */}
      <div className="flex flex-col items-center rounded-2xl bg-[#2a2d31]/90 px-2 pb-1.5 pt-1.5 backdrop-blur-sm">
        <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">
          máx
        </span>
        <div className="relative h-[84px] w-12 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#2a2d31] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#2a2d31] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[5] h-7 -translate-y-1/2 rounded-md bg-white/10" />
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth py-[28px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MAX_OPTIONS.map((m) => (
              <div
                key={m}
                className={[
                  "flex h-7 snap-center items-center justify-center font-mono text-sm tabular-nums",
                  m === maxMinutes
                    ? "font-semibold text-white"
                    : "text-white/40",
                ].join(" ")}
              >
                {m}
                <span className="ml-0.5 text-[10px] font-sans opacity-70">
                  m
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        fill="currentColor"
        opacity={muted ? 0.85 : 1}
      />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {muted && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
