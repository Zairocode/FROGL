"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/lib/api";
import { partir } from "@/lib/highlight";
import { useAnnotations, useCurrentSession, useReview, useTranscript } from "@/lib/frogl";

// FASE 3 — CORRECCION EN CALIENTE
// No da una nota y te deja solo: te marca la linea, te dice con que fuente
// se contradice y que decir en su lugar. Corregis, volves a grabar, y esto
// se corre de nuevo. El jurado no se abre hasta que pasa.

const SEVERIDAD: Record<string, { color: string; borde: string; label: string }> = {
  alta: { color: "text-danger", borde: "border-danger/60", label: "grave" },
  media: { color: "text-accent-amber", borde: "border-accent-amber/60", label: "revisar" },
  baja: { color: "text-accent-cyan", borde: "border-accent-cyan/50", label: "menor" },
};

const TIPO: Record<string, string> = {
  dato: "el dato no cierra",
  falta: "falta algo",
  gancho: "no engancha",
  claridad: "se entiende mal",
};

export function ReviewRoom() {
  const router = useRouter();
  const session = useCurrentSession();
  const sessionId = session?._id ?? null;
  const lines = useTranscript(sessionId);
  const marcas = useAnnotations(sessionId);
  const review = useReview(sessionId);

  const resolver = useMutation(api.live.resolveAnnotation);
  const revisarDeNuevo = useMutation(api.sessions.rereview);
  const deliberar = useMutation(api.sessions.deliberate);

  const [activa, setActiva] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const pendientes = marcas.filter((m) => !m.resolved);
  const texto = lines.map((l) => l.text).join(" ");
  const tramos = useMemo(
    () => partir(texto, pendientes.map((m) => ({ id: m._id, quote: m.quote }))),
    [texto, pendientes],
  );

  if (!session) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <p className="text-fg-muted">No hay ningún pitch para corregir todavía.</p>
      </main>
    );
  }

  const listo = review?.passed ?? false;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-accent-teal">Antes del jurado</p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight text-fg">
            Corregí esto primero
          </h1>
        </div>
        {review && (
          <div className="text-right">
            <p
              className={`font-[family-name:var(--font-timer)] text-4xl tabular-nums ${
                listo ? "text-accent-teal" : "text-accent-amber"
              }`}
            >
              {review.score}
              <span className="text-lg text-fg-muted">/10</span>
            </p>
            <p className="text-xs text-fg-muted">
              {listo ? "listo para el jurado" : `${pendientes.length} sin resolver`}
            </p>
          </div>
        )}
      </header>

      {review && <p className="max-w-3xl text-fg-muted">{review.summary}</p>}

      {!review && (
        <p className="text-fg-muted">
          Revisando lo que dijiste y contrastando los datos contra la web…
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        {/* Lo que dijiste, con lo problemático subrayado */}
        <section className="rounded-2xl border border-border bg-bg-elevated/40 p-5">
          <p className="label-caps mb-3">Lo que dijiste</p>
          <p className="text-lg leading-relaxed text-fg">
            {tramos.length === 0 ? (
              <span className="text-fg-muted">Todavía no hay transcript.</span>
            ) : (
              tramos.map((t, i) =>
                t.marcaId ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiva(t.marcaId)}
                    className={`rounded-sm underline decoration-2 underline-offset-4 transition-colors ${
                      activa === t.marcaId
                        ? "bg-danger/25 decoration-danger"
                        : "bg-danger/10 decoration-danger/60 hover:bg-danger/20"
                    }`}
                  >
                    {t.text}
                  </button>
                ) : (
                  <span key={i}>{t.text}</span>
                ),
              )
            )}
          </p>
        </section>

        {/* Las marcas */}
        <section className="flex flex-col gap-3">
          {pendientes.length === 0 && review ? (
            <div className="rounded-2xl border border-accent-teal/50 bg-accent-teal/10 p-5">
              <p className="text-accent-teal">Sin marcas pendientes.</p>
              <p className="mt-1 text-sm text-fg-muted">
                Ya podés mandarlo al jurado.
              </p>
            </div>
          ) : (
            pendientes.map((m) => {
              const sev = SEVERIDAD[m.severity] ?? SEVERIDAD.media;
              return (
                <article
                  key={m._id}
                  onMouseEnter={() => setActiva(m._id)}
                  className={`rounded-2xl border bg-bg-elevated p-4 transition-colors ${
                    activa === m._id ? sev.borde : "border-border"
                  }`}
                >
                  <p className="label-caps mb-2">
                    <span className={sev.color}>{sev.label}</span>
                    <span className="text-fg-muted"> · {TIPO[m.kind] ?? m.kind}</span>
                  </p>
                  <p className="text-sm text-fg">{m.problem}</p>

                  <p className="mt-3 rounded-lg border border-accent-teal/30 bg-accent-teal/10 p-3 text-sm text-fg">
                    <span className="label-caps mb-1 block text-accent-teal">
                      Decí esto
                    </span>
                    {m.fix}
                  </p>

                  {m.sourceUrl && (
                    <a
                      href={m.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block truncate text-xs text-accent-cyan underline underline-offset-2"
                    >
                      {m.sourceTitle ?? m.sourceUrl}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => void resolver({ annotationId: m._id })}
                    className="mt-3 text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
                  >
                    Ya lo arreglé
                  </button>
                </article>
              );
            })
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-5">
        <button
          type="button"
          onClick={() => router.push("/pitch")}
          className="cta-secondary"
        >
          Volver a grabarlo
        </button>
        <button
          type="button"
          disabled={!sessionId || ocupado}
          onClick={async () => {
            if (!sessionId) return;
            setOcupado(true);
            await revisarDeNuevo({ sessionId });
            setOcupado(false);
          }}
          className="cta-secondary disabled:opacity-40"
        >
          {ocupado ? "Revisando…" : "Revisar de nuevo"}
        </button>
        <button
          type="button"
          disabled={!sessionId || !listo}
          onClick={async () => {
            if (!sessionId) return;
            await deliberar({ sessionId });
            router.push("/jurado");
          }}
          className="cta-primary disabled:cursor-not-allowed disabled:opacity-40"
          title={listo ? undefined : "Resolvé las marcas graves primero"}
        >
          Mandar al jurado
        </button>
      </div>
    </main>
  );
}
