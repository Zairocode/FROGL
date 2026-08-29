"use client";

import { useEffect, useRef, useState } from "react";
import { FrogMascot } from "./characters/FrogMascot";
import { useCameraLive } from "@/lib/camera-context";

export function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { live, setLive } = useCameraLive();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLive(false);
    };
  }, [setLive]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setError("No pudimos acceder a la cámara. Revisá los permisos del navegador.");
      setLive(false);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }

  return (
    <div className="camera-stage">
      <video
        ref={videoRef}
        className={`camera-stage-video ${live ? "is-on" : ""}`}
        playsInline
        muted
        autoPlay
      />

      {!live ? (
        <div className="camera-stage-empty">
          <FrogMascot size={120} />
          <p className="label-caps">Proyección</p>
          <p className="mt-1 max-w-xs text-sm text-fg-muted">
            Encendé la cámara para proyectarte en vivo.
          </p>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <button type="button" className="cta-primary mt-4" onClick={start}>
            Proyectar cámara
          </button>
        </div>
      ) : (
        <div className="camera-stage-chrome">
          <span className="live-pill">En vivo</span>
          <button type="button" className="cta-secondary h-9 px-4 text-sm" onClick={stop}>
            Cortar
          </button>
        </div>
      )}
    </div>
  );
}

export function JuryProjection() {
  const { live } = useCameraLive();

  return (
    <div className="camera-stage camera-stage-remote">
      <div className="camera-stage-empty">
        <FrogMascot size={96} />
        <p className="label-caps">{live ? "Señal del expositor" : "Proyección"}</p>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">
          {live
            ? "El pitcher está en cámara. Reaccioná con coaching o emojis."
            : "Esperando que el expositor proyecte su cámara."}
        </p>
      </div>
      {live ? <span className="live-pill camera-stage-badge">En vivo</span> : null}
    </div>
  );
}
