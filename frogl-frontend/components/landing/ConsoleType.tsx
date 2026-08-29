"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Mode = "type" | "hold" | "erase";

type Props = {
  lines: string[];
  charMs?: number;
  eraseMs?: number;
  holdMs?: number;
  /** Se llama tras borrar también la última oración */
  onDone?: () => void;
  className?: string;
  /** Oculta el bloque (p. ej. al pasar a FROGL) */
  hidden?: boolean;
};

/**
 * Una oración a la vez: escribe → pausa → borra → siguiente.
 * La última también se borra; luego onDone.
 */
export function ConsoleType({
  lines,
  charMs = 36,
  eraseMs = 18,
  holdMs = 900,
  onDone,
  className = "",
  hidden = false,
}: Props) {
  const [text, setText] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("type");
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishedRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setText("");
        setDone(true);
        onDoneRef.current?.();
      }
      return;
    }

    if (done || lineIdx >= lines.length) return;

    const full = lines[lineIdx];

    if (mode === "type") {
      if (text.length < full.length) {
        const id = window.setTimeout(() => {
          setText(full.slice(0, text.length + 1));
        }, charMs);
        return () => window.clearTimeout(id);
      }
      const id = window.setTimeout(() => setMode("hold"), holdMs);
      return () => window.clearTimeout(id);
    }

    if (mode === "hold") {
      const id = window.setTimeout(() => setMode("erase"), 0);
      return () => window.clearTimeout(id);
    }

    // erase (incluye la última oración)
    if (text.length > 0) {
      const id = window.setTimeout(() => {
        setText((t) => t.slice(0, -1));
      }, eraseMs);
      return () => window.clearTimeout(id);
    }

    const isLast = lineIdx === lines.length - 1;
    if (isLast) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setDone(true);
        onDoneRef.current?.();
      }
      return;
    }

    setLineIdx((i) => i + 1);
    setMode("type");
  }, [charMs, done, eraseMs, holdMs, lineIdx, lines, mode, text]);

  return (
    <div
      className={[
        "w-full max-w-3xl text-center transition-opacity duration-500",
        hidden || done ? "pointer-events-none opacity-0" : "opacity-100",
        className,
      ].join(" ")}
      aria-hidden={hidden || done}
      aria-live="polite"
    >
      <p className="min-h-[3.2em] font-[family-name:var(--font-display)] text-[clamp(1.5rem,4.5vw,2.35rem)] leading-snug tracking-tight text-fg">
        {text}
        {!done ? (
          <span className="ml-0.5 inline-block w-[0.08em] animate-pulse bg-accent-pink align-[-0.05em]">
            &nbsp;
          </span>
        ) : null}
      </p>
    </div>
  );
}
