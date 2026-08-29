"use client";

import { animate } from "animejs";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MicFallback } from "@/components/landing/MicFallback";
import { WebGLErrorBoundary } from "@/components/landing/WebGLGuard";
import { prefersReducedMotion } from "@/lib/motion";

const MicScene = dynamic(
  () => import("@/components/landing/MicMesh").then((m) => m.MicScene),
  {
    ssr: false,
    loading: () => <MicFallback />,
  },
);

type Phase = "mic" | "morph" | "brand";

type Props = {
  /** Cuando las oraciones terminaron: esconde mic y revela FROGL */
  resolve: boolean;
  onBrandReady?: () => void;
};

export function MicToFrogl({ resolve, onBrandReady }: Props) {
  const micRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const onBrandReadyRef = useRef(onBrandReady);
  onBrandReadyRef.current = onBrandReady;

  const [phase, setPhase] = useState<Phase>("mic");
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setReduced(true);
      setPhase("brand");
      onBrandReadyRef.current?.();
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || phase !== "mic") return;
    const el = micRef.current;
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(24px) scale(0.85)";

    const enter = animate(el, {
      opacity: [0, 1],
      translateY: [24, 0],
      scale: [0.85, 1],
      ease: "out(3)",
      duration: 800,
    });

    return () => {
      enter.pause();
      // Strict Mode: no dejar el mic pegado en opacity 0
      el.style.opacity = "1";
      el.style.transform = "none";
    };
  }, [ready, phase]);

  useEffect(() => {
    if (!resolve || phase !== "mic") return;

    if (prefersReducedMotion()) {
      setPhase("brand");
      onBrandReadyRef.current?.();
      return;
    }

    setPhase("morph");
  }, [resolve, phase]);

  useEffect(() => {
    if (phase !== "morph") return;
    const mic = micRef.current;
    const brand = brandRef.current;
    if (!mic || !brand) return;

    brand.style.opacity = "0";
    brand.style.transform = "scale(0.85)";

    const out = animate(mic, {
      opacity: [1, 0],
      scale: [1, 0.55],
      ease: "in(2)",
      duration: 520,
    });

    const inn = animate(brand, {
      opacity: [0, 1],
      scale: [0.85, 1.04, 1],
      ease: "out(3)",
      duration: 700,
      delay: 280,
      onComplete: () => {
        setPhase("brand");
        onBrandReadyRef.current?.();
      },
    });

    return () => {
      out.pause();
      inn.pause();
    };
  }, [phase]);

  if (reduced && phase === "brand") {
    return (
      <h1 className="-translate-y-[10vh] font-[family-name:var(--font-display)] text-[clamp(3rem,12vw,5.5rem)] leading-none tracking-tight text-fg">
        FROGL
      </h1>
    );
  }

  const showMic = phase === "mic" || phase === "morph";
  const showBrand = phase === "morph" || phase === "brand";

  return (
    <div className="relative flex h-[min(52vh,460px)] w-full max-w-lg items-center justify-center sm:h-[min(56vh,520px)] sm:max-w-xl">
      {showMic && ready ? (
        <div
          ref={micRef}
          className="absolute inset-0 translate-y-[18%] sm:translate-y-[20%]"
          aria-hidden
        >
          <WebGLErrorBoundary fallback={<MicFallback />}>
            <MicScene spinning={phase === "mic"} />
          </WebGLErrorBoundary>
        </div>
      ) : null}
      {showBrand ? (
        <h1
          ref={brandRef}
          className="-translate-y-[12vh] relative z-10 font-[family-name:var(--font-display)] text-[clamp(3rem,12vw,5.5rem)] leading-none tracking-tight text-fg sm:-translate-y-[14vh]"
          style={phase === "morph" ? { opacity: 0 } : undefined}
        >
          FROGL
        </h1>
      ) : null}
    </div>
  );
}
