"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isFillerToken, isMostlyFillers, tokenize } from "@/lib/fillers";
import type { Segment, TranscriptExport, Word } from "@/lib/transcript-types";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: {
      isFinal: boolean;
      length: number;
      [j: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SILENCE_MS = 1200;
const RMS_VOICE = 0.035;
const RMS_SILENCE = 0.018;
const LEVEL_BARS = 24;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function estimateWords(
  text: string,
  startMs: number,
  endMs: number,
): Word[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  const span = Math.max(endMs - startMs, tokens.length * 80);
  const slice = span / tokens.length;
  return tokens.map((t, i) => ({
    text: t,
    startMs: Math.round(startMs + i * slice),
    endMs: Math.round(startMs + (i + 1) * slice),
  }));
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function useSpeechTranscript() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interim, setInterim] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: LEVEL_BARS }, () => 0),
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const wantListenRef = useRef(false);
  const phraseStartRef = useRef<number | null>(null);
  const lastVoiceAtRef = useRef<number>(0);
  const silenceOpenRef = useRef<{ startMs: number } | null>(null);
  const hasInterimRef = useRef(false);

  const nowMs = useCallback(() => {
    const t0 = startedAtRef.current;
    if (!t0) return 0;
    return Date.now() - t0;
  }, []);

  const pushSegment = useCallback((seg: Segment) => {
    setSegments((prev) => [...prev, seg]);
  }, []);

  const finalizeSilence = useCallback(
    (endMs: number) => {
      if (!silenceOpenRef.current) return;
      const start = silenceOpenRef.current.startMs;
      silenceOpenRef.current = null;
      if (endMs - start >= SILENCE_MS * 0.6) {
        pushSegment({
          id: uid(),
          kind: "silence",
          startMs: start,
          endMs,
          text: "···",
          words: [],
          final: true,
        });
      }
    },
    [pushSegment],
  );

  const stopVadLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevels(Array.from({ length: LEVEL_BARS }, () => 0));
  }, []);

  const runVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const timeData = new Uint8Array(analyser.fftSize);
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / timeData.length);
      const t = nowMs();

      analyser.getByteFrequencyData(freqData);
      const bars: number[] = [];
      const binSize = Math.floor(freqData.length / LEVEL_BARS);
      for (let i = 0; i < LEVEL_BARS; i++) {
        let acc = 0;
        const start = i * binSize;
        for (let j = start; j < start + binSize; j++) {
          acc += freqData[j] ?? 0;
        }
        bars.push(Math.min(1, acc / binSize / 180));
      }
      setLevels(bars);

      if (rms >= RMS_VOICE) {
        lastVoiceAtRef.current = t;
        if (silenceOpenRef.current) {
          finalizeSilence(t);
        }
      } else if (rms < RMS_SILENCE) {
        if (
          !hasInterimRef.current &&
          t - lastVoiceAtRef.current > SILENCE_MS
        ) {
          if (!silenceOpenRef.current) {
            silenceOpenRef.current = {
              startMs: lastVoiceAtRef.current || Math.max(0, t - SILENCE_MS),
            };
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finalizeSilence, nowMs]);

  const commitFinalText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const endMs = nowMs();
      const startMs = phraseStartRef.current ?? Math.max(0, endMs - 800);
      phraseStartRef.current = null;
      hasInterimRef.current = false;

      if (silenceOpenRef.current) {
        finalizeSilence(startMs);
      }

      const tokens = tokenize(trimmed);
      const words = estimateWords(trimmed, startMs, endMs);
      const allFillers =
        tokens.length > 0 &&
        (tokens.every(isFillerToken) || isMostlyFillers(tokens));

      pushSegment({
        id: uid(),
        kind: allFillers ? "filler" : "speech",
        startMs,
        endMs,
        text: trimmed,
        words,
        final: true,
      });
      setInterim("");
    },
    [finalizeSilence, nowMs, pushSegment],
  );

  const stop = useCallback(() => {
    wantListenRef.current = false;
    setListening(false);
    stopVadLoop();

    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;

    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;

    const t = nowMs();
    if (silenceOpenRef.current) finalizeSilence(t);
  }, [finalizeSilence, nowMs, stopVadLoop]);

  const start = useCallback(async () => {
    setError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setError("Web Speech API no disponible. Usá Chrome o Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const t0 = Date.now();
      startedAtRef.current = t0;
      setStartedAt(t0);
      setSegments([]);
      setInterim("");
      setElapsedMs(0);
      lastVoiceAtRef.current = 0;
      silenceOpenRef.current = null;
      phraseStartRef.current = null;
      hasInterimRef.current = false;

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-GT";
      recognitionRef.current = recognition;

      recognition.onresult = (ev) => {
        let interimBuf = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const piece = res[0]?.transcript ?? "";
          if (res.isFinal) {
            commitFinalText(piece);
          } else {
            interimBuf += piece;
          }
        }
        if (interimBuf) {
          if (phraseStartRef.current == null) {
            phraseStartRef.current = nowMs();
          }
          hasInterimRef.current = true;
          if (silenceOpenRef.current) {
            finalizeSilence(nowMs());
          }
          setInterim(interimBuf.trim());
        }
      };

      recognition.onerror = (ev) => {
        if (ev.error === "no-speech" || ev.error === "aborted") return;
        if (ev.error === "not-allowed") {
          setError("Permiso de micrófono denegado.");
          stop();
          return;
        }
        setError(`Speech error: ${ev.error}`);
      };

      recognition.onend = () => {
        if (wantListenRef.current) {
          try {
            recognition.start();
          } catch {
            /* ignore restart race */
          }
        }
      };

      wantListenRef.current = true;
      setListening(true);
      recognition.start();
      runVadLoop();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo acceder al micrófono.",
      );
      stop();
    }
  }, [commitFinalText, finalizeSilence, nowMs, runVadLoop, stop]);

  useEffect(() => {
    if (!listening || !startedAt) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 200);
    return () => window.clearInterval(id);
  }, [listening, startedAt]);

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor());
    return () => {
      wantListenRef.current = false;
      stopVadLoop();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      void audioCtxRef.current?.close();
    };
  }, [stopVadLoop]);

  const exportTranscript = useCallback((): TranscriptExport => {
    const t0 = startedAtRef.current ?? Date.now();
    const ended = Date.now();
    return {
      startedAt: t0,
      endedAt: listening ? null : ended,
      durationMs: ended - t0,
      segments,
    };
  }, [listening, segments]);

  const downloadJson = useCallback(() => {
    const payload = exportTranscript();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frogl-transcript-${t0Stamp(payload.startedAt)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("[FROGL transcript export]", payload);
  }, [exportTranscript]);

  return {
    segments,
    interim,
    listening,
    supported,
    error,
    startedAt,
    elapsedMs,
    elapsedLabel: formatMs(elapsedMs),
    levels,
    start,
    stop,
    exportTranscript,
    downloadJson,
  };
}

function t0Stamp(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().replace(/[:.]/g, "-");
}
