"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CoachingCues } from "./CoachingCues";
import { ExposureScore } from "./ExposureScore";
import { JurorAvatar } from "./JurorAvatar";
import { LiveCamera } from "./LiveCamera";
import { SpeechBubble } from "./SpeechBubble";
import { useJuryChat } from "@/lib/chat-context";
import { latestByJuror } from "@/lib/chat-store";
import { useSession } from "@/lib/session-context";
import { usePitchCapture } from "@/lib/usePitchCapture";
import { useSpokenAudio } from "@/lib/useSpokenAudio";
import { colorForName } from "@/lib/chat-store";
import { PitchTypePicker, PitchTypePill } from "./PitchTypePicker";
import { isPitchType, PITCH_TYPE_META, type PitchType } from "@/convex/pitchTypes";

function formatTimer(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PitchRoom() {
  const {
    session,
    sessionId,
    hydrated,
    createSession,
    startSession,
    endSession,
  } = useSession();
  const { messages } = useJuryChat();
  const [elapsed, setElapsed] = useState(0);
  const [pitchType, setPitchType] = useState<PitchType | null>(null);

  // El jurado responde en voz alta: cada reaccion/pregunta suena con la voz
  // propia de su perfil (Eleven Labs). Sin voiceId configurado, no suena.
  useSpokenAudio(sessionId);

  const seats = useQuery(api.seats.list, sessionId ? { sessionId } : "skip");
  const transcript = useQuery(
    api.transcript.live,
    sessionId ? { sessionId } : "skip",
  );

  const cap = usePitchCapture(sessionId);

  // Crea y arranca la sesion en un solo click cuando entra el pitcher.
  const [bootstrapping, setBootstrapping] = useState(false);
  async function begin() {
    if (bootstrapping || !pitchType) return;
    setBootstrapping(true);
    try {
      const id = await createSession(
        `Pitch ${PITCH_TYPE_META[pitchType].label}`,
        "El expositor",
        pitchType,
      );
      await startSession(id);
    } finally {
      setBootstrapping(false);
    }
  }

  const live = session?.status === "live";

  useEffect(() => {
    if (!live) return;
    const started = session.startedAt ? Date.now() - session.startedAt : Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - started), 250);
    return () => window.clearInterval(id);
  }, [live, session?.startedAt]);

  const visible = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; color: string }>();
    for (const seat of seats ?? []) {
      byId.set(seat._id, {
        id: seat._id,
        name: seat.displayName,
        color: colorForName(seat.displayName),
      });
    }
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
  }, [seats, messages]);

  const bubbles = useMemo(
    () =>
      latestByJuror(
        messages.filter(
          (message) => message.cue !== "volume" && message.cue !== "posture",
        ),
      ),
    [messages],
  );

  const transcriptText = useMemo(
    () =>
      (transcript ?? [])
        .map((line) => line.text)
        .join(" ")
        .trim(),
    [transcript],
  );

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center text-fg-muted">
        Cargando…
      </main>
    );
  }

  if (!live) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-title)] text-fg">
          ¿Qué tipo de pitch es?
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          Los cuatro jurados siguen siendo ellos. Cambia lo que van a exigir.
        </p>
        <div className="mt-8 w-full">
          <PitchTypePicker
            value={pitchType}
            onChange={setPitchType}
            disabled={bootstrapping}
          />
        </div>
        <button
          type="button"
          className="cta-primary mt-8 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:filter-none"
          onClick={begin}
          disabled={bootstrapping || !pitchType}
        >
          {bootstrapping
            ? "Abriendo la sala…"
            : session
              ? "Arrancar el pitch →"
              : "Crear y arrancar →"}
        </button>
        {session ? (
          <button
            type="button"
            className="cta-secondary mt-3"
            onClick={endSession}
          >
            Cerrar la sala
          </button>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label-caps text-accent-teal">Sala de pitch</p>
          {isPitchType(session.pitchType) ? (
            <PitchTypePill type={session.pitchType} />
          ) : null}
        </div>
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
              onClick={() => (cap.recording ? cap.stop() : cap.start())}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform hover:scale-[1.03] ${
                cap.recording
                  ? "border-accent-teal bg-accent-teal/15 text-accent-teal"
                  : "border-border bg-bg-elevated text-fg"
              }`}
              aria-pressed={cap.recording}
            >
              <span className="sr-only">
                {cap.recording ? "Pausar micrófono" : "Empezar a hablar"}
              </span>
              <MicIcon live={cap.recording} />
            </button>
            <p className="mt-3 text-sm text-fg-muted">
              {cap.error
                ? cap.error
                : cap.recording
                  ? "En vivo — el jurado te escucha y te valora"
                  : "Tocá el mic para empezar"}
            </p>
            {cap.recording ? (
              <div className="mt-2 flex h-1.5 w-40 overflow-hidden rounded-full bg-border/60">
                <span
                  className="h-full rounded-full bg-accent-teal transition-[width] duration-150"
                  style={{ width: `${Math.min(100, Math.round(cap.level * 220))}%` }}
                />
              </div>
            ) : null}
          </div>
          <CoachingCues />
          <ExposureScore />
        </div>
      </div>

      <section className="mt-8 w-full text-left">
        <p className="label-caps mb-2">Transcript</p>
        <p className="min-h-[5rem] text-lg leading-relaxed text-fg-muted">
          {cap.interim}
          {cap.interim ? " " : ""}
          {transcriptText}
          {!cap.recording && !transcriptText
            ? "Tu pitch se va a leer acá, en vivo."
            : ""}
        </p>
      </section>

      <section className="mt-auto grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
        {visible.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-fg-muted">
            Todavía no hay jurados en la sala.
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
