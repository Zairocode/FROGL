"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { isMostlyFillers, tokenize } from "@/lib/fillers";
import type { Segment, TranscriptExport } from "@/lib/transcript-types";
import { useCurrentSession, useTranscript } from "@/lib/frogl";
import { usePitchCapture } from "@/lib/usePitchCapture";

// ============================================================
//  MISMO CONTRATO, OTRO MOTOR
//  La version anterior usaba la Web Speech API del browser. Esa API no
//  transcribe localmente: manda el audio a servidores de Google, y en la
//  red del evento eso devolvia "speech error: network" sin parar, con el
//  transcript siempre vacio.
//
//  Ahora el browser solo graba clips y Convex los transcribe con Gemini.
//  La firma que devuelve este hook es identica, asi que PitchRoom,
//  LyricsTranscript y MicSpectrogram siguen andando sin tocarlos.
//  El original quedo en useSpeechTranscript.webspeech.bak.ts.
// ============================================================

const CLIP_MS = 6000; // igual que en usePitchCapture
const LEVELS = 48; // cuantas barras retiene el espectrograma

function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function useSpeechTranscript() {
  const session = useCurrentSession();
  const live = session?.status === "live" ? session : null;
  const activeId = live?._id ?? null;

  const createSession = useMutation(api.sessions.create);
  const startSession = useMutation(api.sessions.start);
  const endSession = useMutation(api.sessions.end);

  const cap = usePitchCapture(activeId);
  const rows = useTranscript(activeId);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LEVELS).fill(0));

  useEffect(() => {
    if (!live?.startedAt) return setElapsedMs(0);
    const tick = () => setElapsedMs(Date.now() - live.startedAt!);
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [live?.startedAt]);

  // El espectrograma quiere una serie, no un valor suelto.
  const levelRef = useRef(0);
  levelRef.current = cap.level;
  useEffect(() => {
    if (!cap.recording) return;
    const id = window.setInterval(() => {
      setLevels((prev) => [...prev.slice(1), levelRef.current]);
    }, 80);
    return () => window.clearInterval(id);
  }, [cap.recording]);

  const segments = useMemo<Segment[]>(
    () =>
      rows.map((r) => {
        const tokens = tokenize(r.text);
        // Cada fila es un clip de CLIP_MS; repartimos las palabras parejo
        // adentro para que el karaoke tenga con que animarse. No es
        // alineacion real: para eso hace falta un STT que devuelva tiempos.
        const paso = tokens.length > 0 ? CLIP_MS / tokens.length : 0;
        return {
          id: r._id,
          kind: isMostlyFillers(tokens) ? "filler" : "speech",
          startMs: r.tMs,
          endMs: r.tMs + CLIP_MS,
          text: r.text,
          words: tokens.map((text, i) => ({
            text,
            startMs: r.tMs + i * paso,
            endMs: r.tMs + (i + 1) * paso,
          })),
          final: r.final,
        };
      }),
    [rows],
  );

  const start = useCallback(async () => {
    let id: Id<"sessions"> | null = activeId;
    if (!id) {
      id = await createSession({
        title: "Pitch en vivo",
        presenterName: "Pitcher",
      });
      await startSession({ sessionId: id });
    }
    // Le pasamos la sesion recien creada: la query todavia no la trajo.
    await cap.start(id);
  }, [activeId, createSession, startSession, cap]);

  const stop = useCallback(async () => {
    cap.stop();
    if (activeId) await endSession({ sessionId: activeId });
  }, [cap, activeId]);

  const exportTranscript = useCallback(
    (): TranscriptExport => ({
      startedAt: live?.startedAt ?? 0,
      endedAt: session?.endedAt ?? null,
      durationMs: elapsedMs,
      segments,
    }),
    [live?.startedAt, session?.endedAt, elapsedMs, segments],
  );

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(exportTranscript(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frogl-pitch-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportTranscript]);

  return {
    segments,
    interim: cap.interim,
    listening: cap.recording,
    // Ya no depende de que el navegador tenga Web Speech: graba y listo.
    supported: true,
    error: cap.error,
    startedAt: live?.startedAt ?? null,
    elapsedMs,
    elapsedLabel: formatMs(elapsedMs),
    levels,
    start,
    stop,
    exportTranscript,
    downloadJson,
  };
}
