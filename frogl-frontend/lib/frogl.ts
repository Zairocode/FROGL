"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PublicJuror } from "./accounts";

// Hooks contra Convex. Cuando el backend no responde devuelven vacio en vez
// de romper: la app tiene que seguir usable aunque no haya red.

/** La sesion viva, o la ultima si ya cerro. undefined = todavia cargando. */
export function useCurrentSession() {
  return useQuery(api.sessions.current);
}

/**
 * Agentes y humanos en una sola lista, con la misma forma. El tipo va a mano
 * porque panel.jurors y panel.preview devuelven shapes parecidos pero no
 * identicos, y TS colapsa la union a {} si lo dejas inferir.
 */
export type PanelJuror = {
  seatId: string;
  kind: "agent" | "human";
  slug: string | null;
  name: string;
  emoji: string;
  color: string;
  bubble: { text: string; kind: string; tMs: number } | null;
};

export function usePanel(
  sessionId: Id<"sessions"> | null | undefined,
): PanelJuror[] {
  const real = useQuery(api.panel.jurors, sessionId ? { sessionId } : "skip");
  // Sin sesion la sala no deberia verse vacia: mostramos a los jueces esperando.
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

/** Fase 3: lo que el corrector marco sobre el texto. */
export function useAnnotations(sessionId: Id<"sessions"> | null | undefined) {
  return (
    useQuery(api.live.annotations, sessionId ? { sessionId } : "skip") ?? []
  );
}

/** Fase 3: la nota del corrector y si habilita al jurado. */
export function useReview(sessionId: Id<"sessions"> | null | undefined) {
  const rondas = useQuery(
    api.live.reviews,
    sessionId ? { sessionId } : "skip",
  );
  return rondas?.[0] ?? null;
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
 * Lee en voz alta las preguntas del jurado. speechSynthesis es nativo del
 * browser: no cuesta creditos ni backend.
 *
 * Hoy queda apagado por defecto: durante el pitch nadie interrumpe. Se
 * enciende en la pantalla de resultados, donde si tiene sentido escuchar.
 */
export function useSpokenQuestions(
  sessionId: Id<"sessions"> | null | undefined,
  enabled = false,
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
      u.lang = "es-419";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  }, [questions, enabled]);

  return questions;
}

/** Sesiones que un jurado puede mirar ahora mismo. */
export function useOpenSessions() {
  return useQuery(api.live.openForJury) ?? [];
}
