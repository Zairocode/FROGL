"use client";

import { useJuryChat } from "@/lib/chat-context";
import { RATING_EMOJIS } from "@/lib/emoji-score";

const RATING_HINT: Record<(typeof RATING_EMOJIS)[number], string> = {
  "🔥": "En llamas",
  "👏": "Convence",
  "🤔": "Se pierde",
  "😬": "Tenso",
  "😴": "Se apaga",
};

export function JuryCoaching() {
  const { send } = useJuryChat();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label-caps">Coaching al expositor</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="cta-primary"
            onClick={() => send("🔊 Habla más fuerte")}
          >
            Habla más fuerte
          </button>
          <button
            type="button"
            className="cta-secondary"
            onClick={() => send("🧍 Compone la postura")}
          >
            Compone la postura
          </button>
        </div>
      </div>

      <div>
        <p className="label-caps">Valorar con emoji</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RATING_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-rate-btn"
              title={RATING_HINT[emoji]}
              onClick={() => send(emoji)}
            >
              <span aria-hidden>{emoji}</span>
              <span className="sr-only">{RATING_HINT[emoji]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
