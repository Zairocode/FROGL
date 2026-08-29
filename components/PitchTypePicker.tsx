"use client";

import type { CSSProperties } from "react";
import {
  PITCH_TYPES,
  PITCH_TYPE_META,
  type PitchType,
} from "@/convex/pitchTypes";

const ACCENT: Record<(typeof PITCH_TYPE_META)[PitchType]["accent"], string> = {
  cyan: "var(--accent-cyan)",
  pink: "var(--accent-pink)",
  teal: "var(--accent-teal)",
  amber: "var(--accent-amber)",
};

type PitchTypePickerProps = {
  value: PitchType | null;
  onChange: (type: PitchType) => void;
  disabled?: boolean;
};

export function PitchTypePicker({
  value,
  onChange,
  disabled,
}: PitchTypePickerProps) {
  return (
    <fieldset className="m-0 w-full max-w-xl border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Tipo de pitch</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PITCH_TYPES.map((slug) => {
          const meta = PITCH_TYPE_META[slug];
          const selected = value === slug;
          return (
            <label
              key={slug}
              className={`flex min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-[1.15rem] border px-4 py-3.5 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:scale-[1.015] focus-within:outline-2 focus-within:outline-offset-[3px] motion-reduce:hover:scale-100 ${
                selected
                  ? "border-[var(--type-accent)] bg-[color-mix(in_srgb,var(--type-accent)_14%,var(--bg-elevated))] shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
                  : "border-border bg-bg-elevated hover:border-[color-mix(in_srgb,var(--type-accent)_45%,var(--border))]"
              }`}
              style={
                {
                  "--type-accent": ACCENT[meta.accent],
                } as CSSProperties
              }
            >
              <input
                type="radio"
                name="pitch-type"
                value={slug}
                checked={selected}
                onChange={() => onChange(slug)}
                className="sr-only"
              />
              <TypeMark slug={slug} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-[650] tracking-[0.01em] text-fg">
                  {meta.label}
                </span>
                <span className="text-[0.9rem] leading-snug text-[color-mix(in_srgb,var(--type-accent)_35%,var(--fg-muted))]">
                  {meta.blurb}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PitchTypePill({ type }: { type: PitchType }) {
  const meta = PITCH_TYPE_META[type];
  return (
    <span
      className="inline-flex h-7 items-center rounded-full px-[0.7rem] text-[0.68rem] font-bold tracking-[0.14em] uppercase"
      style={
        {
          "--type-accent": ACCENT[meta.accent],
          background:
            "color-mix(in srgb, var(--type-accent) 16%, var(--bg-elevated))",
          color: "var(--type-accent)",
        } as CSSProperties
      }
    >
      {meta.label}
    </span>
  );
}

function TypeMark({ slug }: { slug: PitchType }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
    className: "mt-0.5 shrink-0 text-[var(--type-accent)]",
  };

  if (slug === "tecnico") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16.5 13.5v3M15 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (slug === "innovacion") {
    return (
      <svg {...common}>
        <path
          d="M12 3.5l1.6 5.2 5.4.2-4.2 3.4 1.5 5.2L12 14.8 7.7 17.5l1.5-5.2-4.2-3.4 5.4-.2L12 3.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (slug === "educacion") {
    return (
      <svg {...common}>
        <path
          d="M4 8.5L12 5l8 3.5L12 12 4 8.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M7 10.2v4.3c0 .6 2.2 2 5 2s5-1.4 5-2v-4.3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 16V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
