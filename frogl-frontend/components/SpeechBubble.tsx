"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat-store";
import { JURY } from "@/lib/jury";
import { prefersReducedMotion } from "@/lib/motion";

export function SpeechBubble({
  message,
  compact = false,
}: {
  message: ChatMessage;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seat = JURY[message.seat];

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const animation = animate(el, {
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.92, 1],
      ease: "out(3)",
      duration: 380,
    });
    return () => animation.pause();
  }, [message.id]);

  return (
    <div
      ref={ref}
      className={`speech-bubble ${compact ? "speech-bubble-compact" : ""}`}
      style={{ ["--bubble-accent" as string]: seat.color }}
    >
      <p className="speech-bubble-meta">
        <span className="speech-bubble-dot" />
        {seat.name}
      </p>
      <p className="speech-bubble-text">{message.text}</p>
    </div>
  );
}
