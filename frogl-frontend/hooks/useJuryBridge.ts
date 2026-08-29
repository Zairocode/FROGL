"use client";

import { useEffect, useRef } from "react";
import type { JuryExpression, JurySlug } from "@/lib/transcript-types";
import { useCurrentSession, usePanel, useQuestions } from "@/lib/frogl";

// ============================================================
//  PUENTE CONVEX -> UI DEL JURADO
//  PitchRoom ya escucha el CustomEvent "frogl:jury" (lo usa DemoControls
//  para las demos). En vez de tocar su logica de estado, nos sumamos como
//  otro emisor: lo que sale del backend entra por el mismo canal.
//  Ademas lee las preguntas en voz alta con speechSynthesis, que es nativo.
// ============================================================

// Cualquier slug no vacio vale: los jueces viven en la tabla profiles y
// pueden ser 6 hoy y 8 maniana. La lista fija de 4 era la razon de que
// Comercial y Usuario nunca aparecieran en el panel.
const esSlug = (v: unknown): v is JurySlug =>
  typeof v === "string" && v.length > 0;

export function useJuryBridge(speakQuestions = true) {
  const session = useCurrentSession();
  const sessionId = session?._id ?? null;
  const panel = usePanel(sessionId);
  const questions = useQuestions(sessionId);

  const vistos = useRef({ notas: new Set<string>(), preguntas: null as Set<string> | null });

  useEffect(() => {
    for (const juror of panel) {
      const nota = juror.bubble?.text;
      if (!nota || !esSlug(juror.slug)) continue;
      const clave = `${juror.seatId}:${nota}`;
      if (vistos.current.notas.has(clave)) continue;
      vistos.current.notas.add(clave);
      window.dispatchEvent(
        new CustomEvent("frogl:jury", {
          detail: {
            slug: juror.slug,
            expression: (juror.bubble?.kind ?? "idle") as JuryExpression,
            note: nota,
          },
        }),
      );
    }
  }, [panel]);

  useEffect(() => {
    // Primera pasada: marcamos las que ya existian sin emitirlas ni leerlas.
    // Si no, al abrir la pagina el jurado recita todo el historico de golpe.
    if (vistos.current.preguntas === null) {
      vistos.current.preguntas = new Set(questions.map((q) => q._id));
      return;
    }
    const porAsiento = new Map(panel.map((j) => [j.seatId, j]));
    for (const q of questions) {
      if (vistos.current.preguntas.has(q._id)) continue;
      vistos.current.preguntas.add(q._id);
      const juror = porAsiento.get(q.seatId);
      if (esSlug(juror?.slug)) {
        window.dispatchEvent(
          new CustomEvent("frogl:jury", {
            detail: { slug: juror!.slug as JurySlug, question: q.text },
          }),
        );
      }
      if (speakQuestions && typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(q.text);
        u.lang = "es-419";
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    }
  }, [questions, panel, speakQuestions]);
}
