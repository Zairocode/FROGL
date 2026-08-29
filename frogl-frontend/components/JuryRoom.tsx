"use client";

import { useState } from "react";
import { JuryFigure } from "./characters/JuryFigure";
import { JuryChatPanel } from "./JuryChatPanel";
import { JURY_LIST, type JurySlug } from "@/lib/jury";

export function JuryRoom() {
  const [activeSeat, setActiveSeat] = useState<JurySlug>("tecnico");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2">
        <p className="label-caps text-accent-teal">En vivo · panel cerrado</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.4rem)] text-fg">
          Sala del jurado
        </h1>
        <p className="max-w-xl text-fg-muted">
          Cuatro asientos, un chat. El pitcher no ve esta sala: solo recibe tus
          mensajes como globos de texto.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {JURY_LIST.map((seat) => {
          const selected = seat.slug === activeSeat;
          return (
            <button
              key={seat.slug}
              type="button"
              onClick={() => setActiveSeat(seat.slug)}
              className={`flex flex-col items-center rounded-[1.25rem] border px-2 py-4 text-center transition-transform ${
                selected
                  ? "border-transparent bg-bg-elevated"
                  : "border-border bg-transparent hover:bg-bg-elevated/50"
              }`}
              style={
                selected
                  ? { boxShadow: `0 0 0 2px ${seat.color}` }
                  : undefined
              }
            >
              <JuryFigure slug={seat.slug} size={120} />
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight">
                {seat.name}
              </p>
              <p className="label-caps mt-1" style={{ color: seat.color }}>
                {seat.role}
              </p>
              <p className="mt-1 text-xs text-fg-muted">{seat.policy}</p>
            </button>
          );
        })}
      </div>

      <JuryChatPanel activeSeat={activeSeat} />
    </main>
  );
}
