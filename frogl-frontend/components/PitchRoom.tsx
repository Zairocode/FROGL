"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CoachingCues } from "./CoachingCues";
import { ExposureScore } from "./ExposureScore";
import { JurorAvatar } from "./JurorAvatar";
import { LiveCamera } from "./LiveCamera";
import { SpeechBubble } from "./SpeechBubble";
import { useAccount } from "@/lib/account-context";
import type { PublicJuror } from "@/lib/accounts";
import { useJuryChat } from "@/lib/chat-context";
import { latestByJuror } from "@/lib/chat-store";

function formatTimer(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PitchRoom() {
  const { messages } = useJuryChat();
  const { online } = useAccount();
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const visible = useMemo(() => {
    const byId = new Map<string, PublicJuror>();
    for (const juror of online) byId.set(juror.id, juror);
    for (const message of messages) {
      if (!byId.has(message.accountId)) {
        byId.set(message.accountId, {
          id: message.accountId,
          name: message.author,
          color: message.color,
        });
      }
    }
    return [...byId.values()];
  }, [messages, online]);
  const bubbles = useMemo(
    () =>
      latestByJuror(
        messages.filter(
          (message) => message.cue !== "volume" && message.cue !== "posture",
        ),
      ),
    [messages],
  );

  useEffect(() => {
    if (!listening) return;
    const started = Date.now() - elapsedRef.current;
    const id = window.setInterval(() => setElapsed(Date.now() - started), 250);
    return () => window.clearInterval(id);
  }, [listening]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <p className="label-caps text-accent-teal">Sala de pitch</p>
        <p className="font-[family-name:var(--font-mono)] text-3xl tabular-nums text-fg">
          {formatTimer(elapsed)}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <LiveCamera />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <button
              type="button"
              onClick={() => setListening((v) => !v)}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform hover:scale-[1.03] ${
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
            <p className="mt-3 text-sm text-fg-muted">
              {listening
                ? "En vivo — el jurado te escucha y te valora"
                : "Tocá el mic para empezar"}
            </p>
          </div>
          <CoachingCues />
          <ExposureScore />
        </div>
      </div>

      <section className="mt-8 w-full text-left">
        <p className="label-caps mb-2">Transcript</p>
        <p className="min-h-[5rem] text-lg leading-relaxed text-fg-muted">
          {listening
            ? "Cuando conectemos el mic, tus frases aparecen acá. El jurado te tira globos, coaching y emojis — no ves su chat."
            : "Tu pitch se va a leer acá, en vivo."}
        </p>
      </section>

      <section className="mt-auto grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
        {visible.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-fg-muted">
            Todavía no hay jurados con cuenta en la sala.
          </p>
        ) : (
          visible.map((juror) => {
            const bubble = bubbles[juror.id];
            return (
              <div key={juror.id} className="flex flex-col items-center">
                <div className="flex min-h-[7.5rem] w-full items-end justify-center">
                  {bubble ? (
                    <SpeechBubble message={bubble} compact />
                  ) : (
                    <p className="pb-4 text-center text-xs text-fg-muted">
                      {juror.name} escucha
                    </p>
                  )}
                </div>
                <JurorAvatar name={juror.name} color={juror.color} size={72} />
                <p className="label-caps mt-2" style={{ color: juror.color }}>
                  {juror.name}
                </p>
              </div>
            );
          })
        )}
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
