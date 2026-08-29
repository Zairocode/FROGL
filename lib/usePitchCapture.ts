"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { encodeWav, toBase64 } from "./wav";

// ============================================================
//  CAPTURA DEL PITCH
//  El browser SOLO graba. La transcripcion la hace Convex con Gemini.
//
//  Por que no Web Speech API: no transcribe en el browser, manda el audio
//  a servidores de Google. En la red del evento eso daba
//  "speech error: network" en bucle y el transcript quedaba vacio.
//  Grabando y mandando a Convex, la salida a internet la pone el servidor.
//
//  Bonus: sin SpeechRecognition ya no hay dos consumidores peleandose el
//  microfono, asi que volvemos a medir volumen y pausas del mismo stream.
// ============================================================

const CHUNK_MS = 6000; // largo de cada clip que se manda a transcribir
const SAMPLE_MS = 3000; // cada cuanto se manda una muestra acustica
const FRAME_MS = 100; // cada cuanto se lee el analyser

export type PitchCaptureOptions = {
  /**
   * Umbral de silencio. Depende del microfono y del ruido de la sala:
   * mira `level` con el presentador callado y pone un poco mas que eso.
   */
  silenceThreshold?: number;
};

export function usePitchCapture(
  sessionId: Id<"sessions"> | null,
  opts: PitchCaptureOptions = {},
) {
  const { silenceThreshold = 0.015 } = opts;

  const sample = useMutation(api.delivery.sample);
  const ingest = useAction(api.transcript.ingestAudio);

  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Clips transcritos. Si queda en 0 con el nivel moviendose, el problema
  // esta en la transcripcion y no en el microfono.
  const [heard, setHeard] = useState(0);

  const st = useRef({
    stream: null as MediaStream | null,
    ctx: null as AudioContext | null,
    rec: null as MediaRecorder | null,
    frameTimer: null as ReturnType<typeof setInterval> | null,
    sampleTimer: null as ReturnType<typeof setInterval> | null,
    clipTimer: null as ReturnType<typeof setTimeout> | null,
    acc: [] as number[],
    on: false,
    // Clips decodificandose o subiendo ahora mismo. El microfono y el
    // AudioContext NO se sueltan mientras esto sea > 0.
    pending: 0,
    sid: null as Id<"sessions"> | null,
  });

  // Suelta microfono y AudioContext, pero SOLO cuando no queda nada en vuelo.
  // Antes stop() cerraba el contexto de una y el onstop del ultimo clip se
  // encontraba con un ctx muerto al decodificar: se perdian los ultimos
  // segundos del pitch, que es justo donde va el pedido.
  const liberar = useCallback(() => {
    const s = st.current;
    if (s.on || s.pending > 0) return;
    s.stream?.getTracks().forEach((t) => t.stop());
    s.stream = null;
    void s.ctx?.close();
    s.ctx = null;
  }, []);

  const stop = useCallback(() => {
    const s = st.current;
    s.on = false;
    if (s.frameTimer) clearInterval(s.frameTimer);
    if (s.sampleTimer) clearInterval(s.sampleTimer);
    if (s.clipTimer) clearTimeout(s.clipTimer);
    s.frameTimer = s.sampleTimer = s.clipTimer = null;
    try {
      // Esto vacia lo que quedo grabado aunque no llegue a los 6s, y dispara
      // el onstop que lo transcribe. Por eso no se espera al clip completo.
      if (s.rec && s.rec.state !== "inactive") s.rec.stop();
    } catch {
      // ya estaba frenado
    }
    s.rec = null;
    s.acc = [];
    setRecording(false);
    setInterim("");
    setLevel(0);
    liberar();
  }, [liberar]);

  const start = useCallback(
    async (override?: Id<"sessions">) => {
      const sid = override ?? sessionId;
      if (!sid) return setError("No hay sesion activa");
      // Dos capturas a la vez se pelean el microfono. start() es async, asi
      // que sin esta guarda un doble click abre la segunda antes de tiempo.
      if (st.current.on) return;
      st.current.on = true;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        st.current.on = false;
        return setError("No se pudo abrir el microfono. Revisa los permisos.");
      }

      setError(null);
      setHeard(0);
      const s = st.current;
      s.stream = stream;
      s.sid = sid;
      s.acc = [];

      const ctx = new AudioContext();
      s.ctx = ctx;

      // ---- COMO lo dijo: volumen y pausas ----
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
        void sample({ sessionId: sid, rms, silentRatio });
      }, SAMPLE_MS);

      // ---- QUE dijo: clips completos a Convex ----
      // Un clip por grabacion, no timeslices: los pedazos de MediaRecorder
      // despues del primero no traen cabecera y no se pueden decodificar solos.
      const grabarClip = () => {
        if (!s.on || !s.stream) return;
        let rec: MediaRecorder;
        try {
          rec = new MediaRecorder(s.stream);
        } catch (err) {
          console.warn("[FROGL] MediaRecorder fallo:", err);
          setError("Este navegador no puede grabar audio.");
          return;
        }
        s.rec = rec;
        const partes: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) partes.push(e.data);
        };
        rec.onstop = async () => {
          if (s.on) grabarClip(); // el siguiente clip arranca ya
          if (partes.length === 0) return liberar();
          s.pending++;
          try {
            const bytes = await new Blob(partes).arrayBuffer();
            const audio = await ctx.decodeAudioData(bytes);
            const wav = encodeWav(audio.getChannelData(0), audio.sampleRate);
            setInterim("transcribiendo…");
            const texto = await ingest({ sessionId: sid, audio: toBase64(wav) });
            setInterim("");
            if (texto) setHeard((n) => n + 1);
          } catch (err) {
            console.warn("[FROGL] no se pudo transcribir el clip:", err);
            setInterim("");
          } finally {
            s.pending--;
            liberar(); // el ultimo clip en salir apaga la luz
          }
        };
        rec.start();
        s.clipTimer = setTimeout(() => {
          try {
            if (rec.state !== "inactive") rec.stop();
          } catch {
            // ya frenado
          }
        }, CHUNK_MS);
      };
      grabarClip();

      setRecording(true);
    },
    [sessionId, sample, ingest, silenceThreshold, liberar],
  );

  // Suelta el microfono si el componente se desmonta a mitad del pitch.
  useEffect(() => stop, [stop]);

  return { recording, interim, level, error, heard, start, stop };
}
