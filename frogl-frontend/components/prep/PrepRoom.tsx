"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// FASE 1 — PREPARACION
// Es la puerta: sin tema ni duracion el jurado evalua a ciegas, que era
// justo lo que le faltaba antes.

const DURACIONES = [
  { label: "2 min", ms: 120_000 },
  { label: "3 min", ms: 180_000 },
  { label: "5 min", ms: 300_000 },
];

export function PrepRoom() {
  const router = useRouter();
  const jueces = useQuery(api.profiles.list) ?? [];
  const plan = useMutation(api.sessions.plan);

  const [topic, setTopic] = useState("");
  const [plannedMs, setPlannedMs] = useState(180_000);
  const [avanzadas, setAvanzadas] = useState(false);
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [factCheck, setFactCheck] = useState(true);
  const [yendo, setYendo] = useState(false);

  const elegidos = jueces
    .filter((j) => !excluidos.includes(j.slug))
    .map((j) => j.slug);

  const toggle = (slug: string) =>
    setExcluidos((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  async function empezar() {
    if (topic.trim().length < 4 || elegidos.length === 0) return;
    setYendo(true);
    try {
      await plan({
        topic: topic.trim(),
        plannedMs,
        jurySlugs: elegidos,
        factCheck,
      });
      router.push("/pitch");
    } catch {
      setYendo(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <p className="label-caps text-accent-teal">Antes de empezar</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,2.6rem)] leading-tight text-fg">
          ¿De qué vas a hablar?
        </h1>
        <p className="max-w-lg text-fg-muted">
          El jurado necesita saber el tema y cuánto tenías para decirlo. Sin
          eso te evalúa a ciegas.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label htmlFor="tema" className="label-caps">
          Tema del pitch
        </label>
        <input
          id="tema"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Kilo, predicción de demanda para panaderías"
          className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-fg outline-none placeholder:text-fg-muted/60 focus:border-accent-teal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="label-caps">Cuánto tenés</span>
        <div className="flex gap-2">
          {DURACIONES.map((d) => (
            <button
              key={d.ms}
              type="button"
              onClick={() => setPlannedMs(d.ms)}
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                plannedMs === d.ms
                  ? "border-accent-teal bg-accent-teal/15 text-accent-teal"
                  : "border-border bg-bg-elevated text-fg-muted hover:text-fg"
              }`}
              aria-pressed={plannedMs === d.ms}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-elevated/50">
        <button
          type="button"
          onClick={() => setAvanzadas((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-fg-muted hover:text-fg"
          aria-expanded={avanzadas}
        >
          <span className="label-caps">Opciones avanzadas</span>
          <span aria-hidden>{avanzadas ? "−" : "+"}</span>
        </button>

        {avanzadas && (
          <div className="flex flex-col gap-5 border-t border-border/60 px-4 py-4">
            <div className="flex flex-col gap-3">
              <span className="text-sm text-fg-muted">
                Quiénes te escuchan
              </span>
              <div className="flex flex-col gap-2">
                {jueces.map((j) => {
                  const dentro = !excluidos.includes(j.slug);
                  return (
                    <label
                      key={j.slug}
                      className="flex cursor-pointer items-center gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={dentro}
                        onChange={() => toggle(j.slug)}
                        className="h-4 w-4 accent-[var(--accent-teal)]"
                      />
                      <span aria-hidden>{j.emoji}</span>
                      <span
                        style={{ color: dentro ? j.color : undefined }}
                        className={dentro ? "" : "text-fg-muted line-through"}
                      >
                        {j.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {elegidos.length === 0 && (
                <p className="text-sm text-danger">
                  Dejá al menos un juez en la sala.
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={factCheck}
                onChange={(e) => setFactCheck(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--accent-teal)]"
              />
              <span>
                Verificar tus datos contra la web
                <span className="mt-0.5 block text-xs text-fg-muted">
                  Busca tus cifras de verdad y te muestra la fuente. Tarda un
                  poco más — se puede apagar para un ensayo.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void empezar()}
        disabled={topic.trim().length < 4 || elegidos.length === 0 || yendo}
        className="cta-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        {yendo ? "Preparando la sala…" : "Ir a la sala de pitch"}
      </button>
    </main>
  );
}
