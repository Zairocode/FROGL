"use client";

import { useEffect, useRef } from "react";
import type { Segment } from "@/lib/transcript-types";

type Props = {
  segments: Segment[];
  interim: string;
  listening: boolean;
};

function lineLabel(seg: Segment): string {
  if (seg.kind === "silence") return "···";
  if (seg.kind === "filler") return seg.text || "eeeh";
  return seg.text;
}

export function LyricsTranscript({ segments, interim, listening }: Props) {
  const activeRef = useRef<HTMLParagraphElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const activeKey = interim
    ? "interim"
    : segments.length
      ? segments[segments.length - 1].id
      : "empty";

  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeKey, segments.length, interim]);

  return (
    <div
      ref={scrollerRef}
      className="h-full min-h-0 overflow-y-auto overscroll-contain px-5 py-6"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-end gap-4 pb-8">
        {segments.length === 0 && !interim && (
          <p className="text-xl font-medium leading-snug text-fg-muted/50 sm:text-2xl">
            {listening
              ? "Empezá a hablar…"
              : "Pulsá el micrófono para transcribir tu pitch"}
          </p>
        )}

        {segments.map((seg, i) => {
          const isPast =
            i < segments.length - 1 ||
            (interim.length > 0 && i === segments.length - 1);
          const isActive = !interim && i === segments.length - 1;
          return (
            <p
              key={seg.id}
              ref={isActive ? activeRef : undefined}
              className={[
                "max-w-prose transition-all duration-300",
                seg.kind === "silence" || seg.kind === "filler"
                  ? "font-medium tracking-wide"
                  : "font-semibold",
                isActive
                  ? "text-2xl leading-snug text-fg sm:text-3xl"
                  : isPast
                    ? "text-lg leading-snug text-fg-muted/55 sm:text-xl"
                    : "text-xl text-fg-muted/40",
                seg.kind === "filler" && isActive ? "text-accent-amber" : "",
                seg.kind === "silence" && isActive ? "text-fg-muted/70" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {lineLabel(seg)}
            </p>
          );
        })}

        {interim ? (
          <p
            ref={activeRef}
            className="max-w-prose text-2xl font-semibold leading-snug text-fg sm:text-3xl"
          >
            {interim}
            <span className="ml-1 inline-block animate-pulse text-accent-teal">
              |
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
