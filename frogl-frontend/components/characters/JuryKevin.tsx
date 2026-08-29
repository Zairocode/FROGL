"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { ContactShadow, SoftEye } from "./primitives";

export function JuryKevin({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    const animation = animate(el, {
      translateY: [0, -5, 0],
      rotate: [-2, 2, -2],
      ease: "inOut(2)",
      duration: 900,
      loop: true,
    });
    return () => animation.pause();
  }, []);

  return (
    <div
      ref={rootRef}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <ContactShadow />
        <circle cx="78" cy="28" r="3.2" fill="#fbbf24" />
        <circle cx="84" cy="38" r="2" fill="#fbbf24" />
        <ellipse cx="34" cy="82" rx="7.5" ry="4.5" fill="#2dd4a8" />
        <ellipse cx="68" cy="80" rx="7.5" ry="4.5" fill="#2dd4a8" />
        <rect x="30" y="60" width="6.5" height="18" rx="3.2" fill="#ff8fab" />
        <rect x="64" y="58" width="6.5" height="18" rx="3.2" fill="#ff8fab" />
        <rect
          x="26"
          y="30"
          width="46"
          height="38"
          rx="20"
          fill="url(#kevin-body)"
        />
        <rect x="14" y="34" width="14" height="16" rx="7" fill="#2dd4a8" />
        <rect x="70" y="28" width="14" height="16" rx="7" fill="#2dd4a8" />
        <circle cx="18" cy="32" r="5.5" fill="#f0d5c4" />
        <circle cx="80" cy="26" r="5.5" fill="#f0d5c4" />
        <rect x="34" y="16" width="30" height="26" rx="14" fill="#f0d5c4" />
        <path d="M36 24 Q49 12 64 22 L62 16 Q49 8 36 18 Z" fill="#1a1d21" />
        <SoftEye cx={43} cy={30} lookX={1.4} lookY={-0.6} />
        <SoftEye cx={55} cy={30} lookX={1.4} lookY={-0.6} />
        <path
          d="M44 40 Q49 45 54 40"
          stroke="#1a1d21"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="kevin-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb3c6" />
            <stop offset="100%" stopColor="#ff8fab" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
