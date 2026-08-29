"use client";

import { useEffect, useMemo, useState } from "react";
import { CoachingCues } from "./CoachingCues";
import { ExposureScore } from "./ExposureScore";
import { JurorAvatar } from "./JurorAvatar";
import { LiveCamera } from "./LiveCamera";
import { SpeechBubble } from "./SpeechBubble";
import { LyricsTranscript } from "@/components/pitch/LyricsTranscript";
import { MicSpectrogram } from "@/components/pitch/MicSpectrogram";
import { useSpeechTranscript } from "@/hooks/useSpeechTranscript";
import { useAccount } from "@/lib/account-context";
import type { PublicJuror } from "@/lib/accounts";
import { useJuryChat } from "@/lib/chat-context";
import { latestByJuror } from "@/lib/chat-store";
import { useCameraLive } from "@/lib/camera-context";

export function PitchRoom() {
  const { messages } = useJuryChat();
  const { online } = useAccount();
  const { live: cameraLive } = useCameraLive();
  const speech = useSpeechTranscript();
  const [maxMinutes, setMaxMinutes] = useState(5);

  const visible = useMemo(() => {
    const byId = new Map<string, PublicJuror>();
    for (const juror of online) byId.set(juror.id, juror);
    for (const message of messages) {
      if (!byId.has(message.accountId)) {
        byId.set(message.accountId, {
          id: message.accountId,
          name: message.author,
          color: message.color,
        });
      }
    }
    return [...byId.values()];
  }, [messages, online]);

  const bubbles = useMemo(
    () =>
      latestByJuror(
        messages.filter(
          (message) => message.cue !== "volume" && message.cue !== "posture",
        ),
      ),
    [messages],
  );

  useEffect(() => {
    if (!speech.listening) return;
    if (speech.elapsedMs >= maxMinutes * 60_000) {
      speech.stop();
    }
  }, [speech.listening, speech.elapsedMs, maxMinutes, speech.stop]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <p className="label-caps text-accent-teal">Sala de pitch</p>
        <p className="font-[family-name:var(--font-mono)] text-3xl tabular-nums text-fg">
          {speech.elapsedLabel}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="relative">
          <LiveCamera />
          {cameraLive ? (
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
              <MicSpectrogram
                listening={speech.listening}
                disabled={!speech.supported}
                elapsedLabel={speech.elapsedLabel}
                maxMinutes={maxMinutes}
                onMaxMinutesChange={setMaxMinutes}
                onToggle={() =>
                  speech.listening ? speech.stop() : speech.start()
                }
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {!cameraLive ? (
            <p className="text-sm text-fg-muted">
              Primero proyectá la cámara. Después tocá el mic en la
              proyección para transcribir.
            </p>
          ) : (
            <p className="text-sm text-fg-muted">
              {speech.listening
                ? "En vivo — el jurado te escucha y te valora"
                : "Tocá el mic en la cámara para empezar a transcribir"}
            </p>
          )}
          {speech.error ? (
            <p className="text-sm text-danger">{speech.error}</p>
          ) : null}
          <CoachingCues />
          <ExposureScore />
        </div>
      </div>

      <section className="mt-8 w-full text-left">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="label-caps">Transcript</p>
          <button
            type="button"
            onClick={speech.downloadJson}
            disabled={speech.segments.length === 0}
            className="text-xs font-medium text-fg-muted hover:text-fg disabled:opacity-40"
          >
            Exportar
          </button>
        </div>
        <div className="h-56 overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated/40">
          <LyricsTranscript
            segments={speech.segments}
            interim={speech.interim}
            listening={speech.listening}
          />
        </div>
      </section>

      <section className="mt-auto grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
        {visible.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-fg-muted">
            Todavía no hay jurados con cuenta en la sala.
          </p>
        ) : (
          visible.map((juror) => {
            const bubble = bubbles[juror.id];
            return (
              <div key={juror.id} className="flex flex-col items-center">
                <div className="flex min-h-[7.5rem] w-full items-end justify-center">
                  {bubble ? (
                    <SpeechBubble message={bubble} compact />
                  ) : (
                    <p className="pb-4 text-center text-xs text-fg-muted">
                      {juror.name} escucha
                    </p>
                  )}
                </div>
                <JurorAvatar name={juror.name} color={juror.color} size={72} />
                <p className="label-caps mt-2" style={{ color: juror.color }}>
                  {juror.name}
                </p>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
