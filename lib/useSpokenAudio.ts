"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================================
//  VOZ DEL JURADO (Eleven Labs)
//  Consume speak.pending: jobs que el backend ya renderizó con la
//  voz propia de cada jurado (profiles.voiceId). Los reproduce en
//  orden con <audio> y marca done al terminar.
//
//  El Set a nivel de módulo evita que dos salas montadas a la vez
//  (pitch + jurado) doblen el audio: cada job se encola una sola
//  vez por pestaña, sin importar cuántos montajes haya.
// ============================================================

type PendingJob = {
  _id: Id<"speakJobs">;
  seatId: Id<"seats">;
  text: string;
  kind: "reaction" | "question";
  tMs: number;
  audioUrl: string;
};

const yaEncargados = new Set<string>();

export function useSpokenAudio(sessionId: Id<"sessions"> | null | undefined) {
  const jobs = useQuery(api.speak.pending, sessionId ? { sessionId } : "skip");
  const markDone = useMutation(api.speak.markDone);

  const cola = useRef<PendingJob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const sonando = useRef(false);

  // Un solo elemento <audio> reutilizado: reproduce de a uno, en orden.
  useEffect(() => {
    audio.current = new Audio();
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    if (!jobs) return;
    for (const job of jobs) {
      if (yaEncargados.has(job._id)) continue;
      yaEncargados.add(job._id);
      cola.current.push(job);
    }
    reproducirSiguiente();
    // reproducirSiguiente usa refs estables: no hace falta re-ejecutar por ella.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  function reproducirSiguiente() {
    const el = audio.current;
    if (!el || sonando.current) return;
    const job = cola.current.shift();
    if (!job) return;

    sonando.current = true;
    const terminar = () => {
      void markDone({ speakJobId: job._id });
      sonando.current = false;
      reproducirSiguiente();
    };
    el.onended = terminar;
    el.onerror = terminar;
    el.src = job.audioUrl;
    void el.play().catch(terminar);
  }
}
