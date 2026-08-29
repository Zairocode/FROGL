"use client";

import { useCallback, useEffect, useState } from "react";
import { DemoControls } from "@/components/pitch/DemoControls";
import { JuryStrip } from "@/components/pitch/JuryStrip";
import { LiveFeed } from "@/components/pitch/LiveFeed";
import { LyricsTranscript } from "@/components/pitch/LyricsTranscript";
import { MicSpectrogram } from "@/components/pitch/MicSpectrogram";
import { PresenterCamera } from "@/components/pitch/PresenterCamera";
import { useSpeechTranscript } from "@/hooks/useSpeechTranscript";
import type {
  FeedItem,
  JuryExpression,
  JurySlug,
  SeatView,
} from "@/lib/transcript-types";

const INITIAL_SEATS: SeatView[] = [
  {
    slug: "tecnico",
    kind: "agent",
    displayName: "Dra. Elena Vargas",
    expression: "idle",
  },
  {
    slug: "tiktok",
    kind: "agent",
    displayName: "Kevin",
    expression: "idle",
  },
  {
    slug: "recien-llegado",
    kind: "agent",
    displayName: "Marco Ibáñez",
    expression: "idle",
  },
  {
    slug: "actitud",
    kind: "agent",
    displayName: "Rosa Puentes",
    expression: "idle",
  },
];

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

export function PitchRoom() {
  const speech = useSpeechTranscript();
  const [seats, setSeats] = useState<SeatView[]>(INITIAL_SEATS);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [maxMinutes, setMaxMinutes] = useState(5);

  const tMs = speech.elapsedMs;

  useEffect(() => {
    if (!speech.listening) return;
    if (speech.elapsedMs >= maxMinutes * 60_000) {
      speech.stop();
    }
  }, [speech.listening, speech.elapsedMs, maxMinutes, speech.stop]);

  const setSeatExpression = useCallback(
    (slug: JurySlug, expression: JuryExpression, note?: string) => {
      let displayName: string = slug;
      setSeats((prev) =>
        prev.map((s) => {
          if (s.slug !== slug) return s;
          displayName = s.displayName;
          return { ...s, expression, lastNote: note ?? s.lastNote };
        }),
      );
      if (note) {
        setFeed((f) => [
          ...f,
          {
            id: `${Date.now()}-r`,
            tMs,
            seatSlug: slug,
            displayName,
            type: "reaction",
            expression,
            text: note,
          },
        ]);
      }
    },
    [tMs],
  );

  const pushQuestion = useCallback(
    (slug: JurySlug, text: string) => {
      let displayName: string = slug;
      setSeats((prev) =>
        prev.map((s) => {
          if (s.slug !== slug) return s;
          displayName = s.displayName;
          return { ...s, lastQuestion: text };
        }),
      );
      setFeed((f) => [
        ...f,
        {
          id: `${Date.now()}-q`,
          tMs,
          seatSlug: slug,
          displayName,
          type: "question",
          text,
        },
      ]);
    },
    [tMs],
  );

  const toggleHuman = useCallback((slug: JurySlug) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.slug !== slug) return s;
        if (s.kind === "human") {
          return {
            ...s,
            kind: "agent",
            displayName:
              slug === "actitud" ? "Rosa Puentes" : s.displayName,
          };
        }
        return {
          ...s,
          kind: "human",
          displayName: "vos (humano)",
          expression: "idle",
        };
      }),
    );
  }, []);

  useEffect(() => {
    const handler = (ev: CustomEvent<JuryEventDetail>) => {
      const { slug, expression, note, question } = ev.detail;
      if (expression) setSeatExpression(slug, expression, note);
      if (question) pushQuestion(slug, question);
    };
    window.addEventListener("frogl:jury", handler);
    return () => window.removeEventListener("frogl:jury", handler);
  }, [pushQuestion, setSeatExpression]);

  const humanSlug =
    seats.find((s) => s.kind === "human")?.slug ?? null;

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            FROGL · sala de pitch
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight">
            Maqueta en vivo
          </h1>
        </div>
        <button
          type="button"
          onClick={speech.downloadJson}
          disabled={speech.segments.length === 0}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-medium text-fg-muted hover:border-fg-muted hover:text-fg disabled:opacity-40"
        >
          Exportar
        </button>
      </header>

      {speech.error && (
        <div className="shrink-0 bg-danger/15 px-4 py-1.5 text-sm text-danger">
          {speech.error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stage: cámara full-bleed + controles centrados encima */}
        <section className="relative min-h-0 flex-1 overflow-hidden lg:flex-[4]">
          <PresenterCamera />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25" />
          <div className="absolute inset-x-0 bottom-6 flex justify-center sm:bottom-8">
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
          </div>
        </section>

        {/* Transcript + feed (~20% en desktop) */}
        <section className="flex min-h-0 flex-1 flex-col border-t border-border/60 lg:w-[20%] lg:max-w-[20%] lg:flex-none lg:border-l lg:border-t-0">
          <div className="min-h-0 flex-[1.6]">
            <LyricsTranscript
              segments={speech.segments}
              interim={speech.interim}
              listening={speech.listening}
            />
          </div>
          <div className="flex min-h-0 max-h-[28%] flex-col sm:max-h-[32%]">
            <LiveFeed items={feed} />
          </div>
        </section>
      </div>

      <JuryStrip seats={seats} />

      <DemoControls
        onExpression={setSeatExpression}
        onQuestion={pushQuestion}
        onToggleHuman={toggleHuman}
        humanSlug={humanSlug}
      />
    </div>
  );
}
