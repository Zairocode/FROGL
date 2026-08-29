"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { ContactShadow, SoftEye } from "./primitives";

export function FrogMascot({
  size = 280,
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
      translateY: [0, -8, 0],
      scaleY: [1, 0.97, 1],
      scaleX: [1, 1.02, 1],
      ease: "inOut(2)",
      duration: 1800,
      loop: true,
    });
    return () => {
      animation.pause();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`frog-mascot inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <ContactShadow />
        <ellipse cx="28" cy="78" rx="8" ry="5.5" fill="#38bdf8" />
        <ellipse cx="72" cy="78" rx="8" ry="5.5" fill="#38bdf8" />
        <rect x="22" y="58" width="7" height="18" rx="3.5" fill="#1f9d78" />
        <rect x="71" y="58" width="7" height="18" rx="3.5" fill="#1f9d78" />
        <rect
          x="24"
          y="22"
          width="52"
          height="50"
          rx="26"
          fill="url(#frog-body)"
        />
        <rect x="18" y="40" width="12" height="22" rx="6" fill="#2dd4a8" />
        <rect x="70" y="40" width="12" height="22" rx="6" fill="#2dd4a8" />
        <ellipse cx="38" cy="14" rx="9" ry="8" fill="#2dd4a8" />
        <ellipse cx="62" cy="14" rx="9" ry="8" fill="#2dd4a8" />
        <SoftEye cx={38} cy={36} lookX={1} />
        <SoftEye cx={62} cy={36} lookX={-0.4} />
        <path
          d="M42 52 Q50 58 58 52"
          stroke="#147a5c"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="34" cy="48" rx="5" ry="3" fill="#7ef0c8" opacity="0.55" />
        <defs>
          <linearGradient id="frog-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ee9c0" />
            <stop offset="100%" stopColor="#2dd4a8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
