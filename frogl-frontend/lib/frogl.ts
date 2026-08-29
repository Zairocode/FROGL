"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PublicJuror } from "./accounts";

/** La sesion en vivo, o la ultima si ya cerro. undefined = todavia cargando. */
export function useCurrentSession() {
  return useQuery(api.sessions.current);
}

/**
 * El panel completo: agentes y humanos mezclados, con la misma forma.
 * Ningun componente necesita saber cual es cual.
 */
export function usePanel(sessionId: Id<"sessions"> | null | undefined) {
  const real = useQuery(api.panel.jurors, sessionId ? { sessionId } : "skip");
  // Sin sesion la sala no deberia verse vacia: mostramos a los agentes esperando.
  const preview = useQuery(api.panel.preview, sessionId ? "skip" : {});
  return real ?? preview ?? [];
}

export function useTranscript(sessionId: Id<"sessions"> | null | undefined) {
  return useQuery(api.transcript.live, sessionId ? { sessionId } : "skip") ?? [];
}

export function useScores(sessionId: Id<"sessions"> | null | undefined) {
  return useQuery(api.live.scores, sessionId ? { sessionId } : "skip") ?? [];
}

export function useQuestions(sessionId: Id<"sessions"> | null | undefined) {
  return useQuery(api.live.questions, sessionId ? { sessionId } : "skip") ?? [];
}

/**
 * Mantiene al humano sentado en la sala. Si deja de latir, el panel lo saca
 * solo a los 15s: no hace falta avisar que se fue.
 */
export function useHeartbeat(
  sessionId: Id<"sessions"> | null | undefined,
  juror: PublicJuror | null,
) {
  const beat = useMutation(api.seats.heartbeat);
  useEffect(() => {
    if (!sessionId || !juror) return;
    const tick = () =>
      void beat({
        sessionId,
        userId: juror.id,
        displayName: juror.name,
        color: juror.color,
      });
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [sessionId, juror, beat]);
}

/**
 * EL MOMENTO QUE IMPRESIONA: el jurado interrumpe EN VOZ ALTA.
 * speechSynthesis es nativo del browser: no cuesta creditos ni backend.
 * Vapi queda para cuando quieras voces con caracter propio.
 */
export function useSpokenQuestions(
  sessionId: Id<"sessions"> | null | undefined,
  enabled: boolean,
) {
  const questions = useQuestions(sessionId);
  const dichas = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Primera pasada: marcamos las que ya existian sin leerlas. Si no, al
    // abrir la pagina el jurado recita todo el historico de golpe.
    if (dichas.current === null) {
      dichas.current = new Set(questions.map((q) => q._id));
      return;
    }

    for (const q of questions) {
      if (dichas.current.has(q._id)) continue;
      dichas.current.add(q._id);
      const u = new SpeechSynthesisUtterance(q.text);
      u.lang = "es-AR";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  }, [questions, enabled]);

  return questions;
}
