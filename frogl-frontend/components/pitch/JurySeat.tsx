"use client";

import { useEffect, useRef, useState } from "react";
import { JuryBust } from "@/components/characters/JuryBust";
import type { SeatView } from "@/lib/transcript-types";

type Props = {
  seat: SeatView;
};

export function JurySeat({ seat }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    if (seat.kind !== "human") return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 160, height: 160 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) setCamError(true);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [seat.kind]);

  // El color llega del perfil en Convex. El fallback por slug cubre
  // sesiones viejas sin color guardado.
  const accentVar =
    seat.color ??
    (seat.slug === "tecnico"
      ? "var(--jury-tecnico)"
      : seat.slug === "tiktok"
        ? "var(--jury-tiktok)"
        : seat.slug === "recien-llegado"
          ? "var(--jury-late)"
          : "var(--jury-actitud)");

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
      <div className="relative flex h-[160px] w-[160px] items-end justify-center overflow-visible">
        {seat.kind === "human" ? (
          <div
            className="mb-1 h-[120px] w-[120px] overflow-hidden rounded-full"
            style={{ boxShadow: `0 0 0 2px ${accentVar}` }}
          >
            {camError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-bg-elevated/40 text-center">
                <span className="text-sm font-semibold text-fg">
                  {seat.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[10px] text-fg-muted">sin cámara</span>
              </div>
            ) : (
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />
            )}
          </div>
        ) : (
          <JuryBust slug={seat.slug} expression={seat.expression} size={160} accent={seat.color} />
        )}
      </div>

      <div className="w-full truncate text-center text-sm font-semibold text-fg">
        {seat.displayName}
      </div>
      <div
        className="truncate text-[10px] font-medium uppercase tracking-wider"
        style={{ color: accentVar }}
      >
        {seat.kind === "human" ? "humano" : seat.expression}
      </div>
      {(seat.lastNote || seat.lastQuestion) && (
        <p className="line-clamp-2 max-w-[140px] text-center text-[11px] leading-snug text-fg-muted">
          {seat.lastQuestion ? `¿ ${seat.lastQuestion}` : seat.lastNote}
        </p>
      )}
    </div>
  );
}
