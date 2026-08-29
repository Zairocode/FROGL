"use client";

import type { JuryExpression, JurySlug } from "@/lib/transcript-types";

const EXPRESSIONS: JuryExpression[] = [
  "idle",
  "hooked",
  "confused",
  "bored",
  "skeptical",
  "convinced",
];

const SLUGS: { slug: JurySlug; label: string }[] = [
  { slug: "tecnico", label: "Elena" },
  { slug: "tiktok", label: "Kevin" },
  { slug: "recien-llegado", label: "Marco" },
  { slug: "actitud", label: "Rosa" },
];

type Props = {
  onExpression: (slug: JurySlug, expression: JuryExpression, note?: string) => void;
  onQuestion: (slug: JurySlug, text: string) => void;
  onToggleHuman: (slug: JurySlug) => void;
  humanSlug: JurySlug | null;
};

export function DemoControls({
  onExpression,
  onQuestion,
  onToggleHuman,
  humanSlug,
}: Props) {
  return (
    <details className="border-t border-border/50 bg-bg-elevated/30 text-sm">
      <summary className="cursor-pointer px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Demo · simular back
      </summary>
      <div className="flex flex-wrap items-end gap-3 px-4 pb-4 pt-1">
        {SLUGS.map(({ slug, label }) => (
          <div key={slug} className="flex flex-col gap-1">
            <span className="text-[10px] text-fg-muted">{label}</span>
            <select
              className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as JuryExpression;
                if (!v) return;
                onExpression(slug, v, `Reacción mock: ${v}`);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                expresión
              </option>
              {EXPRESSIONS.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
              onClick={() =>
                onQuestion(
                  slug,
                  slug === "tecnico"
                    ? "¿Qué modelo y con qué datos?"
                    : slug === "tiktok"
                      ? "me perdí, qué hace esto?"
                      : slug === "recien-llegado"
                        ? "perdón, ¿esto para quién es?"
                        : "¿Lo bancás cuando te aprietan?",
                )
              }
            >
              pregunta
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ml-auto rounded-md bg-accent-pink/90 px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-pink"
          onClick={() => onToggleHuman("actitud")}
        >
          Rosa: {humanSlug === "actitud" ? "agente" : "humano + cam"}
        </button>
      </div>
    </details>
  );
}
