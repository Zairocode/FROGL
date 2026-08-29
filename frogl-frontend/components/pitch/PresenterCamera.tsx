"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
};

export function PresenterCamera({ className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
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
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      className={[
        "absolute inset-0 overflow-hidden bg-bg-elevated",
        className,
      ].join(" ")}
    >
      {error ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-fg-muted">
          <span className="text-sm font-medium">Cámara no disponible</span>
          <span className="text-xs">Permití el acceso a la cámara</span>
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
  );
}
