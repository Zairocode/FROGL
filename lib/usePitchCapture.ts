"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================================
//  CAPTURA DEL PITCH
//  Del MISMO stream de microfono salen dos cosas en paralelo:
//    1. Web Speech API  -> QUE dijo   -> transcript.append
//    2. Web Audio       -> COMO lo dijo -> delivery.sample
//  Sin backend, sin creditos, sin dependencias.
//
//  Uso:
//    const cap = usePitchCapture(sessionId);
//    <button onClick={cap.recording ? cap.stop : cap.start}>...</button>
//
//  OJO: llama antes a sessions.start, si no transcript.append tira.
// ============================================================

const SAMPLE_MS = 3000; // cada cuanto se manda una muestra a Convex
const FRAME_MS = 100; // cada cuanto se lee el analyser para promediar

export type PitchCaptureOptions = {
  lang?: string;
  /**
   * Por debajo de esto se cuenta silencio. Depende del microfono y del ruido
   * de la sala, no hay un valor universal: mira el `level` que devuelve el
   * hook con el presentador callado y pone un poco mas que eso.
   */
  silenceThreshold?: number;
};

export function usePitchCapture(
  sessionId: Id<"sessions"> | null,
  opts: PitchCaptureOptions = {},
) {
  const { lang = "es-AR", silenceThreshold = 0.015 } = opts;

  const append = useMutation(api.transcript.append);
  const sample = useMutation(api.delivery.sample);

  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const st = useRef({
    stream: null as MediaStream | null,
    ctx: null as AudioContext | null,
    rec: null as SpeechRecognition | null,
    frameTimer: null as ReturnType<typeof setInterval> | null,
    sampleTimer: null as ReturnType<typeof setInterval> | null,
    acc: [] as number[],
    on: false,
  });

  const stop = useCallback(() => {
    const s = st.current;
    s.on = false;
    if (s.frameTimer) clearInterval(s.frameTimer);
    if (s.sampleTimer) clearInterval(s.sampleTimer);
    s.frameTimer = s.sampleTimer = null;
    try {
      s.rec?.abort();
    } catch {
      // abort() tira si ya estaba frenado. No importa.
    }
    s.rec = null;
    s.stream?.getTracks().forEach((t) => t.stop());
    s.stream = null;
    void s.ctx?.close();
    s.ctx = null;
    s.acc = [];
    setRecording(false);
    setInterim("");
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (!sessionId) return setError("No hay sesion activa");
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR)
      return setError(
        "Este navegador no soporta Web Speech API. Funciona en Chrome y Edge.",
      );

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setError("No se pudo abrir el microfono. Revisa los permisos.");
    }

    setError(null);
    const s = st.current;
    s.on = true;
    s.stream = stream;
    s.acc = [];

    // ---- 1. QUE dijo ----
    const rec = new SR();
    s.rec = rec;
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let pendiente = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        // Solo los finales van a Convex: los interinos cambian en cada palabra
        // y llenarian la tabla de basura. El parcial se muestra local nomas.
        if (r.isFinal) void append({ sessionId, text, final: true });
        else pendiente += text + " ";
      }
      setInterim(pendiente.trim());
    };

    rec.onerror = (e) => {
      // "no-speech" y "aborted" son ruido normal, no vale la pena mostrarlos.
      if (e.error !== "no-speech" && e.error !== "aborted")
        setError(`Reconocimiento: ${e.error}`);
    };

    // Chrome corta el reconocimiento solo tras unos segundos de silencio.
    // Sin este relanzado el transcript se muere a mitad del pitch.
    rec.onend = () => {
      if (!s.on) return;
      try {
        rec.start();
      } catch {
        // Si se llama muy pronto tira: el proximo onend reintenta.
      }
    };

    rec.start();

    // ---- 2. COMO lo dijo ----
    const ctx = new AudioContext();
    s.ctx = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    s.frameTimer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      s.acc.push(rms);
      setLevel(rms);
    }, FRAME_MS);

    s.sampleTimer = setInterval(() => {
      const acc = s.acc;
      if (acc.length === 0) return;
      s.acc = [];
      const rms = acc.reduce((a, b) => a + b, 0) / acc.length;
      const silentRatio =
        acc.filter((v) => v < silenceThreshold).length / acc.length;
      void sample({ sessionId, rms, silentRatio });
    }, SAMPLE_MS);

    setRecording(true);
  }, [sessionId, append, sample, lang, silenceThreshold]);

  // Suelta el microfono si el componente se desmonta a mitad del pitch.
  useEffect(() => stop, [stop]);

  return { recording, interim, level, error, start, stop };
}
