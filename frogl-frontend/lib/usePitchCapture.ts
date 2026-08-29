"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/lib/api";
import type { Id } from "@convex/_generated/dataModel";
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
  // Clips que fallaron incluso con reintentos: visible para que el usuario
  // sepa que perdio audio en vez de creer que "no jala".
  const [lost, setLost] = useState(0);
  const [paused, setPaused] = useState(false);

  const st = useRef({
    stream: null as MediaStream | null,
    ctx: null as AudioContext | null,
    rec: null as MediaRecorder | null,
    frameTimer: null as ReturnType<typeof setInterval> | null,
    sampleTimer: null as ReturnType<typeof setInterval> | null,
    clipTimer: null as ReturnType<typeof setTimeout> | null,
    watchdog: null as ReturnType<typeof setInterval> | null,
    // Cuando arranco el ultimo clip. El watchdog lo usa para detectar una
    // cadena muerta: si esto no avanza, nada esta grabando.
    lastClipAt: 0,
    acc: [] as number[],
    on: false,
    // Clips decodificandose o subiendo ahora mismo. El microfono y el
    // AudioContext NO se sueltan mientras esto sea > 0.
    pending: 0,
    // En pausa el microfono sigue abierto pero no se graban clips nuevos.
    // Soltar el stream y volver a pedirlo haria que Chrome pregunte permiso
    // otra vez en medio del pitch.
    paused: false,
    grabar: null as (() => void) | null,
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
    if (s.watchdog) clearInterval(s.watchdog);
    s.frameTimer = s.sampleTimer = s.clipTimer = s.watchdog = null;
    try {
      // Esto vacia lo que quedo grabado aunque no llegue a los 6s, y dispara
      // el onstop que lo transcribe. Por eso no se espera al clip completo.
      if (s.rec && s.rec.state !== "inactive") s.rec.stop();
    } catch {
      // ya estaba frenado
    }
    s.rec = null;
    s.acc = [];
    s.paused = false;
    s.grabar = null;
    setPaused(false);
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
      //
      // BUG QUE ESTO ARREGLA: un compania hablo 5 minutos y solo se
      // transcribieron ~12 palabras (el primer clip). Causa: crear un
      // MediaRecorder nuevo cada 6s, encadenado desde el onstop del
      // anterior, puede fallar (el navegador a veces tira error al
      // reabrir el mismo stream muy seguido) — y esa falla no tenia
      // reintento, asi que la cadena moria en silencio para siempre tras
      // el primer clip. Ahora: (a) un fallo al crear/arrancar reintenta
      // solo, y (b) el watchdog de mas abajo resucita la cadena aunque
      // falle por una razon que no preveimos aca.
      const grabarClip = (reintento = 0) => {
        if (!s.on || s.paused || !s.stream) return;
        let rec: MediaRecorder;
        try {
          rec = new MediaRecorder(s.stream);
        } catch (err) {
          console.warn(
            `[FROGL] MediaRecorder fallo al crear (intento ${reintento + 1}):`,
            err,
          );
          if (reintento < 5) {
            setTimeout(() => grabarClip(reintento + 1), 500);
          } else {
            setError(
              "El navegador dejo de poder grabar audio. Probá recargar la página.",
            );
          }
          return;
        }
        s.rec = rec;
        s.lastClipAt = Date.now();
        const partes: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) partes.push(e.data);
        };
        rec.onerror = (e) => {
          // No sabemos siempre si onstop se va a disparar despues de un
          // error del recorder. El watchdog es la red de seguridad real;
          // esto es para tener el motivo en consola cuando pasa.
          console.warn("[FROGL] MediaRecorder onerror:", e);
        };
        rec.onstop = async () => {
          // En pausa no se encadena el siguiente, pero este se transcribe
          // igual: lo que ya dijiste no se tira.
          if (s.on && !s.paused) grabarClip();
          if (partes.length === 0) return liberar();
          s.pending++;
          try {
            const bytes = await new Blob(partes).arrayBuffer();
            const audio = await ctx.decodeAudioData(bytes);
            const wav = toBase64(
              encodeWav(audio.getChannelData(0), audio.sampleRate),
            );
            setInterim("transcribiendo…");
            // El gateway devuelve 429 cuando los clips llegan seguidos. El
            // WAV ya esta en memoria: reintentar es gratis comparado con
            // perder seis segundos de pitch. Antes un fallo descartaba el
            // clip en silencio y "la transcripcion no jalaba".
            let texto: string | null = null;
            let ok = false;
            for (let intento = 0; intento < 3; intento++) {
              try {
                texto = await ingest({ sessionId: sid, audio: wav });
                ok = true;
                break;
              } catch (err) {
                console.warn(
                  `[FROGL] clip fallo (intento ${intento + 1}/3):`,
                  err,
                );
                if (intento < 2)
                  await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
              }
            }
            setInterim("");
            if (ok) {
              if (texto) setHeard((n) => n + 1);
            } else {
              setLost((n) => n + 1);
            }
          } catch (err) {
            console.warn("[FROGL] no se pudo decodificar el clip:", err);
            setInterim("");
            setLost((n) => n + 1);
          } finally {
            s.pending--;
            liberar(); // el ultimo clip en salir apaga la luz
          }
        };
        try {
          rec.start();
        } catch (err) {
          console.warn(
            `[FROGL] MediaRecorder fallo al arrancar (intento ${reintento + 1}):`,
            err,
          );
          if (reintento < 5) setTimeout(() => grabarClip(reintento + 1), 500);
          return;
        }
        s.clipTimer = setTimeout(() => {
          try {
            if (rec.state !== "inactive") rec.stop();
          } catch {
            // ya frenado
          }
        }, CHUNK_MS);
      };
      s.grabar = grabarClip;
      s.paused = false;
      setPaused(false);
      s.lastClipAt = Date.now();
      grabarClip();

      // Red de seguridad: si en mas del doble de un clip no arranco uno
      // nuevo, la cadena murio por algo que no anticipamos. La resucita
      // en vez de dejar al presentador hablando al vacio.
      s.watchdog = setInterval(() => {
        if (!s.on || s.paused) return;
        const quieto = Date.now() - s.lastClipAt > CHUNK_MS * 2.5;
        const sinGrabar = !s.rec || s.rec.state === "inactive";
        if (quieto && sinGrabar) {
          console.warn("[FROGL] cadena de grabacion muerta, reanudando");
          grabarClip();
        }
      }, CHUNK_MS);

      setRecording(true);
    },
    [sessionId, sample, ingest, silenceThreshold, liberar],
  );

  const pause = useCallback(() => {
    const s = st.current;
    if (!s.on || s.paused) return;
    s.paused = true;
    if (s.clipTimer) clearTimeout(s.clipTimer);
    try {
      // Corta el clip actual: se transcribe lo grabado hasta aca.
      if (s.rec && s.rec.state !== "inactive") s.rec.stop();
    } catch {
      // ya estaba frenado
    }
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    const s = st.current;
    if (!s.on || !s.paused) return;
    s.paused = false;
    setPaused(false);
    s.grabar?.();
  }, []);

  // Suelta el microfono si el componente se desmonta a mitad del pitch.
  useEffect(() => stop, [stop]);

  return { recording, paused, interim, level, error, heard, lost, start, pause, resume, stop };
}
