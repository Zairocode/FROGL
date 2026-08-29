"use client";

type JurorScore = {
  name: string;
  emoji: string;
  total: number;
};

type Props = {
  disabled: boolean;
  busy: boolean;
  error: string | null;
  score: number | null;
  why: string | null;
  jurors?: JurorScore[];
  penalty?: number;
  elapsedLabel?: string | null;
  targetLabel?: string | null;
  onGrade: () => void;
};

function scoreTone(score: number): string {
  if (score >= 8) return "text-accent-teal";
  if (score >= 5) return "text-accent-amber";
  return "text-danger";
}

function fillColor(score: number): string {
  if (score >= 8) return "bg-accent-teal";
  if (score >= 5) return "bg-accent-amber";
  return "bg-danger";
}

export function StudioGrade({
  disabled,
  busy,
  error,
  score,
  why,
  jurors = [],
  penalty = 0,
  elapsedLabel,
  targetLabel,
  onGrade,
}: Props) {
  return (
    <div className="max-h-[48%] shrink-0 overflow-y-auto border-t border-border/60 px-5 py-4">
      <button
        type="button"
        onClick={onGrade}
        disabled={disabled || busy}
        className="cta-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? "Calificando…"
          : score != null
            ? "Volver a calificar"
            : "Guardar y calificar"}
      </button>

      {disabled && !busy ? (
        <p className="mt-2 text-center text-xs text-fg-muted">
          Transcribí algo con el micrófono para poder calificarlo.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {score != null ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Calificación
          </p>
          <p
            className={[
              "mt-1 font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight",
              scoreTone(score),
            ].join(" ")}
          >
            {score.toFixed(1)}
            <span className="ml-1 text-lg text-fg-muted">/10</span>
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-border"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={score}
            aria-label="Puntaje del pitch"
          >
            <span
              className={["block h-full rounded-full", fillColor(score)].join(
                " ",
              )}
              style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-fg-muted">
            <span>0</span>
            <span>10</span>
          </div>
          {why ? (
            <p className="mt-3 text-sm leading-snug text-fg">{why}</p>
          ) : null}
          {elapsedLabel && targetLabel ? (
            <p className="mt-2 text-xs text-fg-muted">
              Meta {targetLabel} · hablaste {elapsedLabel}
              {penalty > 0
                ? ` · −${penalty.toFixed(1)} por no llegar al tiempo`
                : " · tiempo cumplido"}
            </p>
          ) : null}
          {jurors.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {jurors.map((j) => (
                <li
                  key={j.name}
                  className="flex items-baseline justify-between gap-2 text-xs text-fg-muted"
                >
                  <span>
                    {j.emoji} {j.name}
                  </span>
                  <span className="font-mono tabular-nums text-fg">
                    {j.total.toFixed(1)}/10
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
