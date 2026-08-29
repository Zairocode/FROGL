"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsoleType } from "@/components/landing/ConsoleType";
import { MicToFrogl } from "@/components/landing/MicToFrogl";
import { useRole } from "@/lib/role-context";

const PROBLEM_LINES = [
  "Formular un pitch es molesto.",
  "Te enfrentás a jueces y no sabés cómo comunicar tu idea.",
  "Ensayás solo… y el feedback llega tarde, o no llega.",
];

export function LandingPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [consoleDone, setConsoleDone] = useState(false);
  const [brandReady, setBrandReady] = useState(false);

  const onConsoleDone = useCallback(() => setConsoleDone(true), []);
  const onBrandReady = useCallback(() => setBrandReady(true), []);

  return (
    <main>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden px-5">
        <div className="pointer-events-none absolute inset-x-5 top-[7%] z-10 flex justify-center sm:top-[8%]">
          <ConsoleType lines={PROBLEM_LINES} onDone={onConsoleDone} />
        </div>

        <div className="flex min-h-[calc(100svh-4rem)] w-full flex-col items-center justify-center pb-[18vh] pt-[8vh]">
          <MicToFrogl resolve={consoleDone} onBrandReady={onBrandReady} />
        </div>

        <div
          className={[
            "absolute inset-x-5 bottom-6 z-10 mx-auto flex max-w-lg flex-col items-center gap-3 text-center transition-all duration-700 sm:bottom-10 sm:gap-5",
            brandReady
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0",
          ].join(" ")}
        >
          <p className="font-[family-name:var(--font-display)] text-xl text-fg sm:text-2xl">
            FROGL tiene la solución.
          </p>
          <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
            Pitches personalizados con agentes de jurado y jurados reales —
            hibridando la eficacia de la IA y la experiencia de los expertos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="cta-primary"
              onClick={() => {
                setRole("pitcher");
                router.push("/pitch");
              }}
            >
              Empezar pitch →
            </button>
            <button
              type="button"
              className="cta-secondary"
              onClick={() => router.push("/cuenta")}
            >
              Soy jurado
            </button>
          </div>
        </div>
      </section>

      <section
        id="como"
        className="mx-auto max-w-xl border-t border-border/40 px-5 py-16 text-center"
      >
        <p className="label-caps">Cómo funciona</p>
        <p className="mt-3 text-fg-muted">
          Presentás → el jurado híbrido reacciona en vivo → te puntúan.
        </p>
      </section>

      <section
        id="jurados"
        className="mx-auto max-w-xl px-5 py-12 text-center"
      >
        <p className="label-caps">El panel</p>
        <p className="mt-3 text-fg-muted">
          Código de referido + nombre. Entrá a la sala del jurado.
        </p>
        <button
          type="button"
          className="cta-primary mt-5"
          onClick={() => router.push("/cuenta")}
        >
          Soy jurado →
        </button>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-xl px-5 pb-20 pt-12 text-center"
      >
        <p className="label-caps">FAQ</p>
        <p className="mt-3 text-fg-muted">
          El pitcher no ve el chat del jurado: solo globos con lo que cada
          cuenta decide tirarle.
        </p>
      </section>
    </main>
  );
}
