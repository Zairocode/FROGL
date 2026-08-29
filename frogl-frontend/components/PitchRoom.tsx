"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CoachingCues } from "./CoachingCues";
import { ExposureScore } from "./ExposureScore";
import { JurorAvatar } from "./JurorAvatar";
import { LiveCamera } from "./LiveCamera";
import { SpeechBubble } from "./SpeechBubble";
import { useAccount } from "@/lib/account-context";
import type { ChatMessage } from "@/lib/chat-store";
import {
  useCurrentSession,
  usePanel,
  useSpokenQuestions,
  useTranscript,
} from "@/lib/frogl";
import { usePitchCapture } from "@/lib/usePitchCapture";

function formatTimer(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PitchRoom() {
  const { account } = useAccount();
  const session = useCurrentSession();
  const live = session?.status === "live" ? session : null;
  const activeId = live?._id ?? null;

  const createSession = useMutation(api.sessions.create);
  const startSession = useMutation(api.sessions.start);
  const endSession = useMutation(api.sessions.end);

  const cap = usePitchCapture(activeId);
  const panel = usePanel(activeId);
  const lines = useTranscript(activeId);
  // Las lee en voz alta apenas llegan, solo mientras estas pitcheando.
  const questions = useSpokenQuestions(activeId, cap.recording);
  const pendiente = [...questions].reverse().find((q) => !q.answered) ?? null;

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!live?.startedAt) return setElapsed(0);
    const tick = () => setElapsed(Date.now() - live.startedAt!);
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [live?.startedAt]);

  // Las burbujas salen del panel unificado: la reaccion de un agente y el
  // mensaje de un humano llegan con la misma forma, asi que SpeechBubble
  // no distingue quien habla.
  const bubbles = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    for (const juror of panel) {
      if (!juror.bubble?.text) continue;
      map[juror.seatId] = {
        id: juror.seatId,
        accountId: juror.seatId,
        author: juror.name,
        color: juror.color,
        text: juror.bubble.text,
        createdAt: Date.now(),
      };
    }
    return map;
  }, [panel]);

  const dicho = lines.map((l) => l.text).join(" ");

  async function toggle() {
    if (cap.recording) {
      cap.stop();
      if (activeId) await endSession({ sessionId: activeId });
      return;
    }
    let id: Id<"sessions"> | null = activeId;
    if (!id) {
      id = await createSession({
        title: "Pitch en vivo",
        presenterName: account?.name ?? "Pitcher",
      });
      await startSession({ sessionId: id });
    }
    // Le pasamos la sesion recien creada: la query todavia no la trajo.
    await cap.start(id);
  }

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
              onClick={() => void toggle()}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform hover:scale-[1.03] ${
                cap.recording
                  ? "border-accent-teal bg-accent-teal/15 text-accent-teal"
                  : "border-border bg-bg-elevated text-fg"
              }`}
              aria-pressed={cap.recording}
            >
              <span className="sr-only">
                {cap.recording ? "Cortar el pitch" : "Empezar a hablar"}
              </span>
              <MicIcon live={cap.recording} />
            </button>
            <p className="mt-3 text-sm text-fg-muted">
              {cap.recording
                ? "En vivo — el jurado te escucha y te valora"
                : "Tocá el mic para empezar"}
            </p>
            {cap.recording && (
              <div
                className="mt-2 h-1 rounded-full bg-accent-teal transition-[width] duration-100"
                style={{ width: `${Math.min(100, cap.level * 400)}%` }}
                aria-hidden
              />
            )}
            {cap.error && (
              <p className="mt-2 text-sm text-accent-pink">{cap.error}</p>
            )}
          </div>
          <CoachingCues />
          <ExposureScore />
        </div>
      </div>

      {pendiente && (
        <section className="mt-6 rounded-2xl border-2 border-accent-teal bg-accent-teal/10 px-5 py-4">
          <p className="label-caps text-accent-teal">El jurado te interrumpe</p>
          <p className="mt-1 text-xl leading-snug text-fg">{pendiente.text}</p>
        </section>
      )}

      <section className="mt-8 w-full text-left">
        <p className="label-caps mb-2">Transcript</p>
        <p className="min-h-[5rem] text-lg leading-relaxed text-fg-muted">
          {dicho || cap.interim ? (
            <>
              <span className="text-fg">{dicho}</span>{" "}
              <span className="opacity-60">{cap.interim}</span>
            </>
          ) : cap.recording ? (
            "Escuchando…"
          ) : (
            "Tu pitch se va a leer acá, en vivo."
          )}
        </p>
      </section>

      <section className="mt-auto grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
        {panel.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-fg-muted">
            Todavía no hay jurados en la sala.
          </p>
        ) : (
          panel.map((juror) => {
            const bubble = bubbles[juror.seatId];
            return (
              <div key={juror.seatId} className="flex flex-col items-center">
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
                  {juror.emoji} {juror.name}
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
