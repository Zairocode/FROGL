"use client";

import type { FeedItem } from "@/lib/transcript-types";

type Props = {
  items: FeedItem[];
};

function formatT(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveFeed({ items }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border/50">
      <div className="shrink-0 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
        En vivo
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-3">
        {items.length === 0 && (
          <li className="text-xs text-fg-muted/60">
            Reacciones y preguntas del jurado.
          </li>
        )}
        {[...items].reverse().map((item) => (
          <li key={item.id} className="text-xs leading-snug">
            <div className="mb-0.5 flex items-baseline justify-between gap-2">
              <span className="font-semibold text-fg">{item.displayName}</span>
              <span className="font-mono text-[10px] text-fg-muted">
                {formatT(item.tMs)}
              </span>
            </div>
            <p className="text-fg-muted">
              {item.type === "question" ? (
                <>
                  <span className="text-accent-cyan">Pregunta · </span>
                  {item.text}
                </>
              ) : (
                <>
                  {item.expression && (
                    <span className="text-accent-pink">{item.expression} · </span>
                  )}
                  {item.text}
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
