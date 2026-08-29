"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { StudioGrade } from "@/components/pitch/StudioGrade";
import { LyricsTranscript } from "@/components/pitch/LyricsTranscript";
import { MicSpectrogram } from "@/components/pitch/MicSpectrogram";
import { PresenterCamera } from "@/components/pitch/PresenterCamera";
import { useSpeechTranscript } from "@/hooks/useSpeechTranscript";
import { api, type Id } from "@/lib/convex-api";
import {
  downloadTranscriptJson,
  flattenTranscript,
  formatClock,
  persistLocalGrade,
  scoreWithTimeGoal,
} from "@/lib/studio-transcript";

type ScoreRow = {
  seatId: string;
  total: number;
  verdict: string;
};

type JurorRow = {
  seatId: string;
  name: string;
  emoji: string;
};

export function StudioRoom() {
  const speech = useSpeechTranscript();
  const gradePitch = useAction(api.studio.grade);
  const createSession = useMutation(api.sessions.create);
  const startSession = useMutation(api.sessions.start);
  const appendLine = useMutation(api.transcript.append);
  const endSession = useMutation(api.sessions.end);

  const [targetMinutes, setTargetMinutes] = useState(1);
  const [busy, setBusy] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [penalty, setPenalty] = useState(0);
  const [gradeElapsedMs, setGradeElapsedMs] = useState(0);
  const [jurors, setJurors] = useState<
    { name: string; emoji: string; total: number }[]
  >([]);
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [viaSession, setViaSession] = useState(false);
  const [savedText, setSavedText] = useState("");

  const scores = useQuery(
    api.live.scores,
    sessionId ? { sessionId } : "skip",
  ) as ScoreRow[] | undefined;
  const panel = useQuery(
    api.panel.jurors,
    sessionId ? { sessionId } : "skip",
  ) as JurorRow[] | undefined;

  const spoken = flattenTranscript(speech.segments, speech.interim);

  useEffect(() => {
    if (!viaSession || !scores || scores.length === 0) return;
    const avg =
      scores.reduce((sum, s) => sum + s.total, 0) / scores.length;
    const adjusted = scoreWithTimeGoal(avg, gradeElapsedMs, targetMinutes);
    const breakdown = scores.map((s) => {
      const juror = panel?.find((j) => j.seatId === s.seatId);
      return {
        name: juror?.name ?? "Jurado",
        emoji: juror?.emoji ?? "",
        total: s.total,
      };
    });
    setScore(adjusted.score);
    setPenalty(adjusted.penalty);
    setWhy(scores[0]?.verdict ?? null);
    setJurors(breakdown);
    persistLocalGrade({
      savedAt: Date.now(),
      text: savedText,
      score: adjusted.score,
      why: scores[0]?.verdict ?? "",
    });
    setBusy(false);
    setViaSession(false);
  }, [viaSession, scores, panel, savedText, gradeElapsedMs, targetMinutes]);

  useEffect(() => {
    if (!busy || !viaSession) return;
    const id = window.setTimeout(() => {
      setBusy(false);
      setViaSession(false);
      setGradeError(
        "La calificación está tardando. El texto sí se guardó.",
      );
    }, 75_000);
    return () => window.clearTimeout(id);
  }, [busy, viaSession]);

  const gradeViaSession = useCallback(
    async (text: string) => {
      const sid = (await createSession({
        title: `[fixture] Estudio ${new Date().toISOString()}`,
        presenterName: "Estudio",
      })) as Id<"sessions">;
      await startSession({ sessionId: sid });
      await appendLine({ sessionId: sid, text, final: true });
      await endSession({ sessionId: sid });
      setSessionId(sid);
      setViaSession(true);
    },
    [appendLine, createSession, endSession, startSession],
  );

  const onGrade = useCallback(async () => {
    const text = flattenTranscript(speech.segments, speech.interim);
    if (text.length < 8) {
      setGradeError("Hablá un poco más antes de calificar.");
      return;
    }

    if (speech.listening) speech.stop();

    setBusy(true);
    setGradeError(null);
    setJurors([]);
    setSavedText(text);
    setPenalty(0);

    const payload = speech.exportTranscript();
    const elapsed = speech.elapsedMs || payload.durationMs;
    setGradeElapsedMs(elapsed);
    downloadTranscriptJson(payload);

    try {
      const result = (await gradePitch({
        text,
        durationMs: elapsed,
      })) as { score: number; why: string };
      const adjusted = scoreWithTimeGoal(
        result.score,
        elapsed,
        targetMinutes,
      );
      setScore(adjusted.score);
      setPenalty(adjusted.penalty);
      setWhy(result.why);
      persistLocalGrade({
        savedAt: Date.now(),
        text,
        score: adjusted.score,
        why: result.why,
      });
      setBusy(false);
    } catch {
      try {
        await gradeViaSession(text);
      } catch (inner) {
        setBusy(false);
        setGradeError(
          inner instanceof Error
            ? inner.message
            : "No se pudo calificar. El texto igual se descargó.",
        );
      }
    }
  }, [gradePitch, gradeViaSession, speech, targetMinutes]);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg">
      {speech.error && (
        <div className="shrink-0 bg-danger/15 px-4 py-1.5 text-sm text-danger">
          {speech.error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="relative min-h-[46%] flex-1 overflow-hidden lg:min-h-0 lg:flex-[7]">
          <PresenterCamera />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/35" />

          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                FROGL · estudio
              </p>
              <h1 className="truncate text-base font-semibold tracking-tight text-white">
                Cámara y texto
              </h1>
            </div>
            <Link
              href="/"
              className="shrink-0 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm hover:border-white/50 hover:text-white"
            >
              Salir
            </Link>
          </header>

          <div className="absolute inset-x-0 bottom-6 flex justify-center sm:bottom-8">
            <MicSpectrogram
              listening={speech.listening}
              disabled={!speech.supported}
              elapsedLabel={speech.elapsedLabel}
              maxMinutes={targetMinutes}
              onMaxMinutesChange={setTargetMinutes}
              mode="goal"
              onToggle={() =>
                speech.listening ? speech.stop() : speech.start()
              }
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col border-t border-border/60 bg-bg lg:w-[32%] lg:max-w-[32%] lg:flex-none lg:border-l lg:border-t-0">
          <p className="shrink-0 px-5 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Traductor de texto
          </p>
          <div className="min-h-0 flex-1">
            <LyricsTranscript
              segments={speech.segments}
              interim={speech.interim}
              listening={speech.listening}
            />
          </div>
          <StudioGrade
            disabled={spoken.length < 8}
            busy={busy}
            error={gradeError}
            score={score}
            why={why}
            jurors={jurors}
            penalty={penalty}
            elapsedLabel={score != null ? formatClock(gradeElapsedMs) : null}
            targetLabel={formatClock(targetMinutes * 60_000)}
            onGrade={onGrade}
          />
        </section>
      </div>
    </div>
  );
}
