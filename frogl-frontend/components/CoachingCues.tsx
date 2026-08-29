"use client";

import { useJuryChat } from "@/lib/chat-context";
import { latestCue } from "@/lib/chat-store";

export function CoachingCues() {
  const { messages } = useJuryChat();
  const volume = latestCue(messages, "volume");
  const posture = latestCue(messages, "posture");

  if (!volume && !posture) return null;

  return (
    <div className="flex flex-col gap-2">
      {volume ? (
        <p className="coaching-banner coaching-banner-volume">
          Habla más fuerte
        </p>
      ) : null}
      {posture ? (
        <p className="coaching-banner coaching-banner-posture">
          Compone la postura
        </p>
      ) : null}
    </div>
  );
}
