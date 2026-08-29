"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JuryFigure } from "./characters/JuryFigure";
import { SpeechBubble } from "./SpeechBubble";
import { useJuryChat } from "@/lib/chat-context";
import { latestBySeat } from "@/lib/chat-store";
import { JURY_LIST } from "@/lib/jury";

function formatTimer(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PitchRoom() {
  const { messages } = useJuryChat();
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const bubbles = useMemo(() => latestBySeat(messages), [messages]);

  useEffect(() => {
    if (!listening) return;
    const started = Date.now() - elapsedRef.current;
    const id = window.setInterval(() => setElapsed(Date.now() - started), 250);
    return () => window.clearInterval(id);
  }, [listening]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <p className="label-caps text-accent-teal">Sala de pitch</p>
        <p className="font-[family-name:var(--font-mono)] text-3xl tabular-nums text-fg">
          {formatTimer(elapsed)}
        </p>
      </div>

      <section className="mt-8 flex flex-1 flex-col items-center text-center">
        <button
          type="button"
          onClick={() => setListening((v) => !v)}
          className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-transform hover:scale-[1.03] ${
            listening
              ? "border-accent-teal bg-accent-teal/15 text-accent-teal"
              : "border-border bg-bg-elevated text-fg"
          }`}
          aria-pressed={listening}
        >
          <span className="sr-only">
            {listening ? "Pausar micrófono" : "Empezar a hablar"}
          </span>
          <MicIcon live={listening} />
        </button>
        <p className="mt-4 text-sm text-fg-muted">
          {listening
            ? "En vivo — el jurado te escucha desde su sala"
            : "Tocá el mic para empezar"}
        </p>

        <div className="mt-8 w-full max-w-2xl text-left">
          <p className="label-caps mb-2">Transcript</p>
          <p className="min-h-[8rem] text-lg leading-relaxed text-fg-muted">
            {listening
              ? "Cuando conectemos el mic, tus frases aparecen acá. El jurado reacciona en globos abajo — no ves su chat, solo lo que te tiran."
              : "Tu pitch se va a leer acá, en vivo."}
          </p>
        </div>
      </section>

      <section className="mt-auto grid grid-cols-2 gap-4 pt-6 lg:grid-cols-4">
        {JURY_LIST.map((seat) => {
          const bubble = bubbles[seat.slug];
          return (
            <div key={seat.slug} className="flex flex-col items-center">
              <div className="flex min-h-[7.5rem] w-full items-end justify-center">
                {bubble ? (
                  <SpeechBubble message={bubble} compact />
                ) : (
                  <p className="pb-4 text-center text-xs text-fg-muted">
                    {seat.name.split(" ")[0]} escucha
                  </p>
                )}
              </div>
              <JuryFigure slug={seat.slug} size={88} />
              <p
                className="label-caps mt-1"
                style={{ color: seat.color }}
              >
                {seat.role}
              </p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function MicIcon({ live }: { live: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        fill={live ? "currentColor" : "var(--fg)"}
      />
      <path
        d="M6 11a6 6 0 0 0 12 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 17v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
