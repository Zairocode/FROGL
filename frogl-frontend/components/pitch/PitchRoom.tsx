"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BehaviorMeter } from "@/components/pitch/BehaviorMeter";
import { DemoControls } from "@/components/pitch/DemoControls";
import { JuryStrip } from "@/components/pitch/JuryStrip";
import { LiveFeed } from "@/components/pitch/LiveFeed";
import { LyricsTranscript } from "@/components/pitch/LyricsTranscript";
import { MicSpectrogram } from "@/components/pitch/MicSpectrogram";
import { PresenterCamera } from "@/components/pitch/PresenterCamera";
import { useSpeechTranscript } from "@/hooks/useSpeechTranscript";
import { useJuryBridge } from "@/hooks/useJuryBridge";
import { useCurrentSession, usePanel } from "@/lib/frogl";
import type {
  FeedItem,
  JuryExpression,
  JurySlug,
  SeatView,
} from "@/lib/transcript-types";

// Los asientos salen de Convex, no de una lista fija. Antes habia
// INITIAL_SEATS con 4 jurados hardcodeados: elegias 6 en /preparar y
// aca aparecian 4 igual, con los nombres viejos.

type JuryEventDetail = {
  slug: JurySlug;
  expression?: JuryExpression;
  note?: string;
  question?: string;
};

declare global {
  interface WindowEventMap {
    "frogl:jury": CustomEvent<JuryEventDetail>;
  }
}

type Overlay = {
  expression: JuryExpression;
  lastNote?: string;
  lastQuestion?: string;
};

export function PitchRoom() {
  const speech = useSpeechTranscript();
  const session = useCurrentSession();
  // Lo que reaccionan los agentes en Convex entra por el mismo CustomEvent
  // que usa DemoControls, asi que el resto del componente no cambia.
  useJuryBridge();

  const panel = usePanel(session?._id ?? null);
  const [overlay, setOverlay] = useState<Record<string, Overlay>>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [maxMinutes, setMaxMinutes] = useState(5);
  const [demo, setDemo] = useState(false);

  // El panel de simulacion es una herramienta de desarrollo: solo con ?demo=1.
  useEffect(() => {
    setDemo(window.location.search.includes("demo=1"));
  }, []);

  const seats = useMemo<SeatView[]>(
    () =>
      panel.map((j) => {
        const o = j.slug ? overlay[j.slug] : undefined;
        return {
          slug: (j.slug ?? j.seatId) as JurySlug,
          kind: j.kind,
          displayName: j.name,
          color: j.color,
          expression: o?.expression ?? "idle",
          lastNote: o?.lastNote,
          lastQuestion: o?.lastQuestion,
        };
      }),
    [panel, overlay],
  );

  const tMs = speech.elapsedMs;

  useEffect(() => {
    if (!speech.listening) return;
    if (speech.elapsedMs >= maxMinutes * 60_000) {
      speech.stop();
    }
  }, [speech.listening, speech.elapsedMs, maxMinutes, speech.stop]);

  const nombreDe = useCallback(
    (slug: string) => seats.find((s) => s.slug === slug)?.displayName ?? slug,
    [seats],
  );

  const setSeatExpression = useCallback(
    (slug: JurySlug, expression: JuryExpression, note?: string) => {
      setOverlay((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], expression, lastNote: note ?? prev[slug]?.lastNote },
      }));
      if (note) {
        setFeed((f) => [
          ...f,
          {
            id: `${Date.now()}-r`,
            tMs,
            seatSlug: slug,
            displayName: nombreDe(slug),
            type: "reaction",
            expression,
            text: note,
          },
        ]);
      }
    },
    [tMs, nombreDe],
  );

  const pushQuestion = useCallback(
    (slug: JurySlug, text: string) => {
      setOverlay((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          expression: prev[slug]?.expression ?? "idle",
          lastQuestion: text,
        },
      }));
      setFeed((f) => [
        ...f,
        {
          id: `${Date.now()}-q`,
          tMs,
          seatSlug: slug,
          displayName: nombreDe(slug),
          type: "question",
          text,
        },
      ]);
    },
    [tMs, nombreDe],
  );

  useEffect(() => {
    const handler = (ev: CustomEvent<JuryEventDetail>) => {
      const { slug, expression, note, question } = ev.detail;
      if (expression) setSeatExpression(slug, expression, note);
      if (question) pushQuestion(slug, question);
    };
    window.addEventListener("frogl:jury", handler);
    return () => window.removeEventListener("frogl:jury", handler);
  }, [pushQuestion, setSeatExpression]);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            FROGL · sala de pitch
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight">
            {session?.topic ?? session?.title ?? "Sala de pitch"}
          </h1>
        </div>
        <button
          type="button"
          onClick={speech.downloadTxt}
          disabled={speech.segments.length === 0}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-medium text-fg-muted hover:border-fg-muted hover:text-fg disabled:opacity-40"
        >
          Exportar
        </button>
      </header>

      {speech.error && (
        <div
          className={`shrink-0 px-4 py-1.5 text-sm ${
            // "Reintentando" y "no se detecta voz" no son fallas del sistema:
            // son avisos accionables (esperá, o acercate al mic). Rojo es
            // solo para lo que ya se perdio de verdad.
            speech.error.startsWith("Reintentando") ||
            speech.error.startsWith("No se está detectando voz")
              ? "bg-accent-amber/15 text-accent-amber"
              : "bg-danger/15 text-danger"
          }`}
        >
          {speech.error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stage: cámara full-bleed + controles centrados encima */}
        <section className="relative min-h-0 flex-1 overflow-hidden lg:flex-[4]">
          <PresenterCamera />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25" />
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 sm:bottom-8">
            <MicSpectrogram
              listening={speech.listening}
              disabled={!speech.supported}
              elapsedLabel={speech.elapsedLabel}
              maxMinutes={maxMinutes}
              onMaxMinutesChange={setMaxMinutes}
              onToggle={() =>
                speech.listening ? speech.stop() : speech.start()
              }
            />
            {speech.listening && (
              <button
                type="button"
                onClick={() =>
                  speech.paused ? speech.resume() : speech.pause()
                }
                className={`pointer-events-auto rounded-full border px-4 py-1.5 text-sm backdrop-blur transition-colors ${
                  speech.paused
                    ? "border-accent-amber bg-accent-amber/20 text-accent-amber"
                    : "border-border/80 bg-bg/70 text-fg-muted hover:text-fg"
                }`}
              >
                {speech.paused ? "Seguir grabando" : "Pausa"}
              </button>
            )}
          </div>
        </section>

        {/* Transcript + medidor + feed */}
        <section className="flex min-h-0 flex-1 flex-col border-t border-border/60 lg:w-[22%] lg:max-w-[22%] lg:flex-none lg:border-l lg:border-t-0">
          <div className="min-h-0 flex-[1.6]">
            <LyricsTranscript
              segments={speech.segments}
              interim={speech.interim}
              listening={speech.listening}
            />
          </div>
          <BehaviorMeter
            sessionId={session?._id ?? null}
            listening={speech.listening}
          />
          <div className="flex min-h-0 max-h-[26%] flex-col">
            <LiveFeed items={feed} />
          </div>
        </section>
      </div>

      <JuryStrip seats={seats} />

      {demo && (
        <DemoControls
          onExpression={setSeatExpression}
          onQuestion={pushQuestion}
          onToggleHuman={() => {}}
          humanSlug={null}
        />
      )}
    </div>
  );
}
