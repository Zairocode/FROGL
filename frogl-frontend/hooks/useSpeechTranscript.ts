"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/lib/api";
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
  const router = useRouter();
  const session = useCurrentSession();
  const live = session?.status === "live" ? session : null;
  const activeId = live?._id ?? null;

  const createSession = useMutation(api.sessions.create);
  const startSession = useMutation(api.sessions.start);
  const endSession = useMutation(api.sessions.end);

  const cap = usePitchCapture(activeId);
  // Se lee de la SESION, no de la sesion viva. Con activeId, al cerrar el
  // micro la sesion pasaba a "ended", la query se apagaba y el transcript
  // desaparecia de pantalla como si se hubiera borrado. Los datos siempre
  // estuvieron en Convex: el que los soltaba era el front.
  const rows = useTranscript(session?._id ?? null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LEVELS).fill(0));

  useEffect(() => {
    const t0 = session?.startedAt;
    if (!t0) return setElapsedMs(0);
    // Terminada la sesion el cronometro se congela en la duracion real,
    // en vez de volver a cero o seguir corriendo para siempre.
    if (session?.endedAt) return setElapsedMs(session.endedAt - t0);
    const tick = () => setElapsedMs(Date.now() - t0);
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [session?.startedAt, session?.endedAt]);

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
    if (!activeId) return;
    // Cerrar el microfono ya no manda al jurado: manda al corrector.
    // sessions.end mueve la fase a "review" y dispara review.run.
    await endSession({ sessionId: activeId });
    router.push("/correccion");
  }, [cap, activeId, endSession, router]);

  const exportTranscript = useCallback(
    (): TranscriptExport => ({
      startedAt: session?.startedAt ?? 0,
      endedAt: session?.endedAt ?? null,
      durationMs: elapsedMs,
      segments,
    }),
    [session?.startedAt, session?.endedAt, elapsedMs, segments],
  );

  // Texto plano y no JSON: esto lo abre una persona para releer su pitch,
  // no un programa. El JSON no lo pedia nadie.
  const downloadTxt = useCallback(() => {
    const x = exportTranscript();
    const cuerpo = [
      session?.topic ? `Tema: ${session.topic}` : null,
      `Duracion: ${formatMs(x.durationMs)}`,
      `Fecha: ${new Date(x.startedAt || Date.now()).toLocaleString("es-AR")}`,
      "",
      "-".repeat(48),
      "",
      ...x.segments.map((seg) => `[${formatMs(seg.startMs)}] ${seg.text}`),
    ]
      .filter((l) => l !== null)
      .join("\n");

    const blob = new Blob([cuerpo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pitch-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportTranscript, session?.topic]);

  return {
    segments,
    interim: cap.interim,
    listening: cap.recording,
    paused: cap.paused,
    pause: cap.pause,
    resume: cap.resume,
    // Ya no depende de que el navegador tenga Web Speech: graba y listo.
    supported: true,
    // Tres niveles: "perdido" es definitivo (se dio por vencido despues
    // de ~1 minuto reintentando en segundo plano), "en cola" es temporal
    // y probablemente se resuelva solo. Antes todo caia en un fallo
    // silencioso: el sintoma era "la transcripcion no jala".
    error:
      cap.error ??
      (cap.lost > 0
        ? `Se ${cap.lost === 1 ? "perdio 1 tramo" : "perdieron " + cap.lost + " tramos"} de audio: la red no aguanto ni los reintentos de fondo. Lo demas sigue grabando.`
        : cap.queued > 0
          ? `Reintentando ${cap.queued === 1 ? "1 tramo" : cap.queued + " tramos"} de audio por la red. Sigue grabando mientras tanto.`
          : cap.quiet
            ? "No se está detectando voz. Acercate al micrófono o subí el volumen."
            : null),
    startedAt: session?.startedAt ?? null,
    elapsedMs,
    elapsedLabel: formatMs(elapsedMs),
    levels,
    start,
    stop,
    exportTranscript,
    downloadTxt,
  };
}
