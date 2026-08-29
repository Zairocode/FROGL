"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ExposureScore } from "./ExposureScore";
import { JuryChatPanel } from "./JuryChatPanel";
import { JuryCoaching } from "./JuryCoaching";
import { JurorAvatar } from "./JurorAvatar";
import { JuryProjection } from "./LiveCamera";
import { useAccount } from "@/lib/account-context";
import { useSession } from "@/lib/session-context";
import { colorForName } from "@/lib/chat-store";
import { isPitchType, PITCH_TYPE_META } from "@/convex/pitchTypes";
import { PitchTypePill } from "./PitchTypePicker";

export function JuryRoom() {
  const { account } = useAccount();
  const { sessionId, session } = useSession();
  const [seatId, setSeatId] = useState<string | null>(null);
  const joinHuman = useMutation(api.seats.joinHuman);
  const leave = useMutation(api.seats.leave);

  const seats = useQuery(api.seats.list, sessionId ? { sessionId } : "skip");

  // El jurado se sienta como humano la primera vez que entra.
  useEffect(() => {
    if (!account || !sessionId || seatId) return;
    let cancelled = false;
    void joinHuman({ sessionId, displayName: account.name, userId: account.id })
      .then((id) => {
        if (!cancelled) setSeatId(id);
      })
      .catch(() => {
        /* sin sesion activa: se reintenta al entrar */
      });
    return () => {
      cancelled = true;
    };
  }, [account, sessionId, seatId, joinHuman]);

  useEffect(() => {
    if (!seatId) return;
    return () => {
      void leave({ seatId: seatId as never });
    };
  }, [seatId, leave]);

  const panel = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; color: string }>();
    for (const seat of seats ?? []) {
      byId.set(seat._id, {
        id: seat._id,
        name: seat.displayName,
        color: colorForName(seat.displayName),
      });
    }
    if (account) {
      byId.set(`human:${account.name}`, {
        id: `human:${account.name}`,
        name: account.name,
        color: account.color,
      });
    }
    return [...byId.values()];
  }, [seats, account]);

  const selectedType = isPitchType(session?.pitchType)
    ? session.pitchType
    : null;

  if (!account) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2">
        <p className="label-caps text-accent-teal">
          En vivo · {session?.status === "live" ? "sesión activa" : "lobby"}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.4rem)] text-fg">
          Sala del jurado
        </h1>
        <p className="max-w-xl text-fg-muted">
          Entraste como <span style={{ color: account.color }}>{account.name}</span>.
          Reaccionás con coaching, emojis o chat. El pitcher recibe tus globos.
        </p>
        {selectedType ? (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            Este pitch es
            <PitchTypePill type={selectedType} />
            <span>{PITCH_TYPE_META[selectedType].blurb}</span>
          </p>
        ) : null}
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
                  {account && juror.name === account.name ? " · vos" : ""}
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
