"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { JuryChatPanel } from "./JuryChatPanel";
import { JurorAvatar } from "./JurorAvatar";
import { useAccount } from "@/lib/account-context";
import { useHeartbeat, useOpenSessions, usePanel, useTranscript } from "@/lib/frogl";

// La sala del jurado humano. Antes entrabas y no veias nada: ni que
// sesiones habia, ni lo que el expositor decia, ni forma de calificar.

function reloj(ms: number | null) {
  if (!ms) return "--:--";
  const t = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function JuryRoom() {
  const { account } = useAccount();
  const abiertas = useOpenSessions();
  const [elegida, setElegida] = useState<Id<"sessions"> | null>(null);

  // Si te fuiste de la sala o la sesion desaparecio, volves a la lista.
  useEffect(() => {
    if (elegida && !abiertas.some((s) => s._id === elegida)) setElegida(null);
  }, [abiertas, elegida]);

  useHeartbeat(elegida, account);
  const panel = usePanel(elegida);
  const lines = useTranscript(elegida);

  const submit = useMutation(api.live.submitVerdict);
  const [nota, setNota] = useState(7);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);

  const fin = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length]);

  const sesion = useMemo(
    () => abiertas.find((s) => s._id === elegida) ?? null,
    [abiertas, elegida],
  );

  if (!account) return null;

  // ---------- lista de salas ----------
  if (!sesion) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8">
        <header className="flex flex-col gap-2">
          <p className="label-caps text-accent-teal">Panel de jurado</p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-fg">
            Hola, {account.name}
          </h1>
          <p className="text-fg-muted">
            Estas son las salas abiertas ahora. Entrá a la que quieras escuchar.
          </p>
        </header>

        {abiertas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <p className="text-fg-muted">
              No hay nadie pitcheando en este momento.
            </p>
            <p className="mt-1 text-sm text-fg-muted/70">
              Esta lista se actualiza sola cuando alguien abre el micrófono.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {abiertas.map((s) => (
              <li key={s._id}>
                <button
                  type="button"
                  onClick={() => setElegida(s._id)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-bg-elevated px-5 py-4 text-left transition-colors hover:border-accent-teal"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-fg">
                      {s.topic ?? s.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-fg-muted">
                      {s.presenterName}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                      s.status === "live"
                        ? "bg-danger/15 text-danger"
                        : "bg-bg text-fg-muted"
                    }`}
                  >
                    {s.status === "live" ? "en vivo" : "deliberando"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  // ---------- adentro de una sala ----------
  const enVivo = sesion.status === "live";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setElegida(null)}
            className="label-caps text-fg-muted hover:text-fg"
          >
            ← Salas
          </button>
          <h1 className="mt-1 truncate font-[family-name:var(--font-display)] text-2xl text-fg">
            {sesion.topic ?? sesion.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {enVivo && (
            <span className="flex items-center gap-2 text-sm text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              en vivo
            </span>
          )}
          <span className="font-[family-name:var(--font-timer)] text-2xl tabular-nums text-fg">
            {reloj(sesion.startedAt)}
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        {/* Lo que esta diciendo, en vivo */}
        <section className="flex max-h-[26rem] flex-col rounded-2xl border border-border bg-bg-elevated/40 p-5">
          <p className="label-caps mb-3">Lo que está diciendo</p>
          <div className="flex-1 overflow-y-auto pr-1">
            {lines.length === 0 ? (
              <p className="text-fg-muted">Todavía no dijo nada.</p>
            ) : (
              <p className="text-lg leading-relaxed text-fg">
                {lines.map((l) => l.text).join(" ")}
              </p>
            )}
            <div ref={fin} />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-bg-elevated/40 p-4">
            <p className="label-caps mb-3">En la sala</p>
            <div className="flex flex-wrap gap-3">
              {panel.map((j) => (
                <div key={j.seatId} className="flex items-center gap-2">
                  <JurorAvatar name={j.name} color={j.color} size={34} />
                  <span className="text-sm" style={{ color: j.color }}>
                    {j.emoji} {j.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Tu veredicto */}
          <section className="rounded-2xl border border-border bg-bg-elevated p-4">
            <p className="label-caps mb-3">Tu veredicto</p>
            <label className="flex items-center gap-3 text-sm text-fg-muted">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={nota}
                onChange={(e) => setNota(Number(e.target.value))}
                className="flex-1 accent-[var(--accent-teal)]"
              />
              <span className="w-10 text-right font-[family-name:var(--font-timer)] text-xl tabular-nums text-fg">
                {nota}
              </span>
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              placeholder="Qué funcionó, qué cambiarías y qué haría distinto la próxima."
              className="mt-3 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted/60 focus:border-accent-teal"
            />
            <button
              type="button"
              disabled={texto.trim().length < 10 || enviado}
              onClick={async () => {
                await submit({
                  sessionId: sesion._id,
                  userId: account.id,
                  total: nota,
                  verdict: texto.trim(),
                });
                setEnviado(true);
              }}
              className="cta-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviado ? "Veredicto enviado" : "Enviar veredicto"}
            </button>
            {enviado && (
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="mt-2 w-full text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
              >
                Cambiar lo que puse
              </button>
            )}
          </section>
        </div>
      </div>

      <JuryChatPanel />
    </main>
  );
}
