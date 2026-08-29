"use client";

import { ExposureScore } from "./ExposureScore";
import { JuryChatPanel } from "./JuryChatPanel";
import { JuryCoaching } from "./JuryCoaching";
import { JurorAvatar } from "./JurorAvatar";
import { JuryProjection } from "./LiveCamera";
import { dropPresence, touchPresence } from "@/lib/accounts";
import { useAccount } from "@/lib/account-context";
import { useEffect, useMemo } from "react";

export function JuryRoom() {
  const { account, online } = useAccount();
  const panel = useMemo(() => {
    const byId = new Map(online.map((juror) => [juror.id, juror]));
    if (account) byId.set(account.id, account);
    return [...byId.values()];
  }, [account, online]);

  useEffect(() => {
    if (!account) return;
    touchPresence(account);
    const beat = window.setInterval(() => touchPresence(account), 4000);
    return () => {
      window.clearInterval(beat);
      dropPresence(account.id);
    };
  }, [account]);

  if (!account) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2">
        <p className="label-caps text-accent-teal">En vivo · panel cerrado</p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.4rem)] text-fg">
          Sala del jurado
        </h1>
        <p className="max-w-xl text-fg-muted">
          Entraste como <span style={{ color: account.color }}>{account.name}</span>.
          No hay bots: solo cuentas humanas. El pitcher recibe tus globos.
        </p>
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
            <p className="text-sm text-fg-muted">Nadie más conectado todavía.</p>
          ) : (
            panel.map((juror) => (
              <div key={juror.id} className="flex flex-col items-center gap-2">
                <JurorAvatar name={juror.name} color={juror.color} size={88} />
                <p className="font-[family-name:var(--font-display)] text-lg leading-tight">
                  {juror.name}
                  {juror.id === account.id ? " · vos" : ""}
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
