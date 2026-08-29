"use client";

import { ExposureScore } from "./ExposureScore";
import { JuryChatPanel } from "./JuryChatPanel";
import { JuryCoaching } from "./JuryCoaching";
import { JurorAvatar } from "./JurorAvatar";
import { JuryProjection } from "./LiveCamera";
import { useAccount } from "@/lib/account-context";
import { useCurrentSession, useHeartbeat, usePanel } from "@/lib/frogl";

export function JuryRoom() {
  const { account } = useAccount();
  const session = useCurrentSession();
  const sessionId = session?._id ?? null;

  // Te sienta en la sala y late. Si cerras la pestania, a los 15s el panel
  // te saca solo: no hace falta avisar que te fuiste.
  useHeartbeat(sessionId, account);

  const panel = usePanel(sessionId);

  if (!account) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2">
        <p className="label-caps text-accent-teal">En vivo · panel cerrado</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.4rem)] text-fg">
          Sala del jurado
        </h1>
        <p className="max-w-xl text-fg-muted">
          Entraste como{" "}
          <span style={{ color: account.color }}>{account.name}</span>. Calificás
          al lado de los jurados sintéticos, y el pitcher recibe tus globos.
        </p>
        {!session && (
          <p className="text-sm text-fg-muted">
            No hay ningún pitch abierto todavía.
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.9fr)]">
        <JuryProjection />
        <div className="flex flex-col gap-5">
          <JuryCoaching />
          <ExposureScore compact />
        </div>
      </div>

      <section>
        <p className="label-caps">Jurados en sala</p>
        <div className="mt-4 flex flex-wrap gap-6">
          {panel.length === 0 ? (
            <p className="text-sm text-fg-muted">Nadie conectado todavía.</p>
          ) : (
            panel.map((juror) => (
              <div key={juror.seatId} className="flex flex-col items-center gap-2">
                <JurorAvatar name={juror.name} color={juror.color} size={88} />
                <p className="font-[family-name:var(--font-display)] text-lg leading-tight">
                  {juror.emoji} {juror.name}
                  {juror.kind === "human" && juror.name === account.name
                    ? " · vos"
                    : ""}
                </p>
                <p className="text-xs text-fg-muted">
                  {juror.kind === "agent" ? "sintético" : "humano"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <JuryChatPanel />
    </main>
  );
}
