"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/api";
import type { Id } from "@convex/_generated/dataModel";
import { isFillerToken, tokenize } from "@/lib/fillers";
import { useTranscript } from "@/lib/frogl";

// ============================================================
//  MEDIDOR DE COMPORTAMIENTO
//  Reemplaza a la valoracion con emojis. Aquello dependia de que hubiera
//  humanos tocando botones; esto sale de lo que MEDIMOS del expositor:
//  volumen, pausas, ritmo y muletillas. Funciona con la sala vacia.
// ============================================================

type Muestra = { rms: number; silentRatio: number };

function Fila({
  label,
  valor,
  pct,
  tone,
}: {
  label: string;
  valor: string;
  pct: number; // 0..100, ancho de la barra
  tone: "ok" | "warn" | "bad" | "off";
}) {
  const color =
    tone === "ok"
      ? "var(--accent-teal)"
      : tone === "warn"
        ? "var(--accent-amber)"
        : tone === "bad"
          ? "var(--danger)"
          : "var(--fg-muted)";
  return (
    <div className="flex items-center gap-2">
      <span className="w-[4.6rem] shrink-0 text-[10px] uppercase tracking-[0.1em] text-fg-muted">
        {label}
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-border/60">
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(4, Math.min(100, pct))}%`, background: color }}
        />
      </span>
      <span
        className="w-14 shrink-0 text-right font-[family-name:var(--font-timer)] text-xs tabular-nums"
        style={{ color }}
      >
        {valor}
      </span>
    </div>
  );
}

export function BehaviorMeter({
  sessionId,
  listening,
}: {
  sessionId: Id<"sessions"> | null;
  listening: boolean;
}) {
  const muestras = (useQuery(
    api.live.delivery,
    sessionId ? { sessionId } : "skip",
  ) ?? []) as Muestra[];
  const lines = useTranscript(sessionId);

  const m = useMemo(() => {
    // Ultimas ~10 muestras = los ultimos ~30 segundos: el medidor habla de
    // como venis AHORA, no del promedio de todo el pitch.
    const recientes = muestras.slice(0, 10);
    const rms = recientes.length
      ? recientes.reduce((a, x) => a + x.rms, 0) / recientes.length
      : null;
    const silencio = recientes.length
      ? recientes.reduce((a, x) => a + x.silentRatio, 0) / recientes.length
      : null;

    const texto = lines.map((l) => l.text).join(" ");
    const tokens = tokenize(texto);
    const muletillas = tokens.filter(isFillerToken).length;
    const spanMs = lines.length ? lines[lines.length - 1].tMs : 0;
    const wpm = spanMs > 3000 ? Math.round((tokens.length / spanMs) * 60000) : null;

    return { rms, silencio, muletillas, palabras: tokens.length, wpm };
  }, [muestras, lines]);

  if (!listening && m.palabras === 0) return null;

  return (
    <div className="shrink-0 border-t border-border/60 px-3 py-2.5">
      <div className="flex flex-col gap-1.5">
        <Fila
          label="Volumen"
          valor={m.rms === null ? "—" : m.rms < 0.03 ? "bajo" : m.rms < 0.09 ? "ok" : "fuerte"}
          pct={m.rms === null ? 0 : Math.min(100, m.rms * 900)}
          tone={m.rms === null ? "off" : m.rms < 0.03 ? "bad" : "ok"}
        />
        <Fila
          label="Pausas"
          valor={m.silencio === null ? "—" : `${Math.round(m.silencio * 100)}%`}
          pct={m.silencio === null ? 0 : m.silencio * 100}
          tone={m.silencio === null ? "off" : m.silencio > 0.45 ? "bad" : m.silencio > 0.3 ? "warn" : "ok"}
        />
        <Fila
          label="Ritmo"
          valor={m.wpm === null ? "—" : `${m.wpm} ppm`}
          pct={m.wpm === null ? 0 : Math.min(100, (m.wpm / 200) * 100)}
          tone={m.wpm === null ? "off" : m.wpm < 100 ? "warn" : m.wpm > 190 ? "warn" : "ok"}
        />
        <Fila
          label="Muletillas"
          valor={String(m.muletillas)}
          pct={m.palabras > 0 ? Math.min(100, (m.muletillas / Math.max(1, m.palabras)) * 600) : 0}
          tone={m.muletillas === 0 ? "ok" : m.muletillas / Math.max(1, m.palabras) > 0.06 ? "bad" : "warn"}
        />
      </div>
    </div>
  );
}
