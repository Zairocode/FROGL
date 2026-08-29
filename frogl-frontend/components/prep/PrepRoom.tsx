"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/lib/api";

// PREPARAR EL PITCH
// Junta lo que antes estaba partido en dos pantallas: el setup (tema,
// duracion, quien te escucha) y el ensayo del estudio (escribir el texto y
// pedir una nota rapida). Son el mismo momento: lo que hacés antes de
// pararte a hablar.

const DURACIONES = [
  { label: "2 min", ms: 120_000 },
  { label: "3 min", ms: 180_000 },
  { label: "5 min", ms: 300_000 },
];

function Paso({
  n,
  titulo,
  bajada,
  children,
}: {
  n: string;
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-[2.2rem_1fr] gap-x-4 gap-y-3 border-t border-border/40 pt-8">
      <span className="font-[family-name:var(--font-timer)] text-lg tabular-nums text-accent-teal">
        {n}
      </span>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl leading-tight text-fg">
          {titulo}
        </h2>
        {bajada && <p className="mt-1 text-sm text-fg-muted">{bajada}</p>}
      </div>
      <div className="col-start-2">{children}</div>
    </section>
  );
}

export function PrepRoom() {
  const router = useRouter();
  const jueces = useQuery(api.profiles.list) ?? [];
  const plan = useMutation(api.sessions.plan);
  const calificar = useAction(api.studio.grade);

  const [topic, setTopic] = useState("");
  const [plannedMs, setPlannedMs] = useState(180_000);
  const [avanzadas, setAvanzadas] = useState(false);
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [factCheck, setFactCheck] = useState(true);

  const [borrador, setBorrador] = useState("");
  const [nota, setNota] = useState<{ score: number; why: string } | null>(null);
  const [calificando, setCalificando] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);

  const [yendo, setYendo] = useState(false);

  const elegidos = jueces
    .filter((j) => !excluidos.includes(j.slug))
    .map((j) => j.slug);
  const listo = topic.trim().length >= 4 && elegidos.length > 0;

  // ~140 palabras por minuto es un ritmo hablado comodo.
  const palabras = borrador.trim() ? borrador.trim().split(/\s+/).length : 0;
  const minutosEstimados = palabras / 140;
  const objetivoMin = plannedMs / 60000;
  const largo =
    palabras === 0
      ? null
      : minutosEstimados > objetivoMin * 1.15
        ? "largo"
        : minutosEstimados < objetivoMin * 0.6
          ? "corto"
          : "justo";

  async function pedirNota() {
    setCalificando(true);
    setErrorNota(null);
    try {
      setNota(await calificar({ text: borrador, durationMs: plannedMs }));
    } catch (e) {
      setErrorNota(
        e instanceof Error ? e.message : "No se pudo calificar el borrador.",
      );
    } finally {
      setCalificando(false);
    }
  }

  async function irALaSala() {
    if (!listo) return;
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
      <header className="flex flex-col gap-3">
        <p className="label-caps text-accent-teal">Antes de hablar</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,2.8rem)] leading-[1.05] text-fg">
          Preparar el pitch
        </h1>
        <p className="max-w-md text-fg-muted">
          Dos minutos acá te ahorran un jurado que te evalúa a ciegas.
        </p>
      </header>

      <Paso
        n="01"
        titulo="¿De qué vas a hablar?"
        bajada="Lo usa el corrector para saber qué datos verificar."
      >
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Kilo, predicción de demanda para panaderías"
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg-muted/50 focus:border-accent-teal"
        />
      </Paso>

      <Paso n="02" titulo="¿Cuánto tenés?">
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
      </Paso>

      <Paso
        n="03"
        titulo="Ensayá el texto"
        bajada="Opcional. Escribilo o pegalo y pedí una nota antes de decirlo en voz alta."
      >
        <textarea
          value={borrador}
          onChange={(e) => {
            setBorrador(e.target.value);
            setNota(null);
          }}
          rows={7}
          placeholder="Somos Kilo. Las panaderías tiran el 12% de lo que hornean porque deciden a ojo…"
          className="w-full resize-y rounded-xl border border-border bg-bg-elevated px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg-muted/50 focus:border-accent-teal"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
          <span>
            {palabras} palabras
            {largo && (
              <span
                className={
                  largo === "justo"
                    ? " text-accent-teal"
                    : " text-accent-amber"
                }
              >
                {" · "}
                {largo === "justo"
                  ? `entra en ${DURACIONES.find((d) => d.ms === plannedMs)?.label}`
                  : largo === "largo"
                    ? `te pasás, son ~${minutosEstimados.toFixed(1)} min`
                    : `te sobra tiempo, son ~${minutosEstimados.toFixed(1)} min`}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => void pedirNota()}
            disabled={borrador.trim().length < 20 || calificando}
            className="cta-secondary text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {calificando ? "Leyendo…" : nota ? "Calificar de nuevo" : "Pedir una nota"}
          </button>
        </div>

        {errorNota && <p className="mt-2 text-sm text-danger">{errorNota}</p>}

        {nota && (
          <div className="mt-4 flex gap-4 rounded-xl border border-border bg-bg-elevated p-4">
            <span
              className={`font-[family-name:var(--font-timer)] text-3xl tabular-nums ${
                nota.score >= 8
                  ? "text-accent-teal"
                  : nota.score >= 5
                    ? "text-accent-amber"
                    : "text-danger"
              }`}
            >
              {nota.score}
            </span>
            <p className="flex-1 text-sm text-fg-muted">{nota.why}</p>
          </div>
        )}
      </Paso>

      <Paso n="04" titulo="Quiénes te escuchan">
        <button
          type="button"
          onClick={() => setAvanzadas((v) => !v)}
          className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
          aria-expanded={avanzadas}
        >
          {avanzadas
            ? "Ocultar"
            : `Los ${jueces.length} jurados, verificación web activada — cambiar`}
        </button>

        {avanzadas && (
          <div className="mt-4 flex flex-col gap-5">
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
                      onChange={() =>
                        setExcluidos((p) =>
                          p.includes(j.slug)
                            ? p.filter((s) => s !== j.slug)
                            : [...p, j.slug],
                        )
                      }
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
              {elegidos.length === 0 && (
                <p className="text-sm text-danger">
                  Dejá al menos un jurado en la sala.
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
                  Busca tus cifras y te muestra la fuente. Tarda un poco más.
                </span>
              </span>
            </label>
          </div>
        )}
      </Paso>

      <button
        type="button"
        onClick={() => void irALaSala()}
        disabled={!listo || yendo}
        className="cta-primary mt-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {yendo ? "Preparando la sala…" : "Ir a la sala de pitch →"}
      </button>
      {!listo && (
        <p className="-mt-4 text-center text-sm text-fg-muted">
          Falta el tema del pitch.
        </p>
      )}
    </main>
  );
}
