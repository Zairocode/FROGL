"use client";

import { useRouter } from "next/navigation";
import { FrogMascot } from "./characters/FrogMascot";
import { JuryFigure } from "./characters/JuryFigure";
import { JURY_LIST } from "@/lib/jury";
import { useRole } from "@/lib/role-context";

export function LandingPage() {
  const router = useRouter();
  const { setRole } = useRole();

  return (
    <main>
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-8 text-center">
        <div className="type-ring" aria-hidden>
          <span>LIVE · TÉCNICA · TIKTOK · LATE JOIN · ACTITUD · PITCH · </span>
          <span>LIVE · TÉCNICA · TIKTOK · LATE JOIN · ACTITUD · PITCH · </span>
        </div>

        <FrogMascot size={260} className="relative z-10" />

        <h1 className="relative z-10 mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-hero)] leading-[0.95] tracking-tight text-fg">
          FROGL
        </h1>
        <p className="relative z-10 mt-4 max-w-md text-lg text-fg-muted">
          Presentás. El jurado híbrido reacciona en vivo. Te puntúan con su
          propia rúbrica.
        </p>

        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
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
            onClick={() => {
              setRole("jurado");
              router.push("/jurado");
            }}
          >
            Soy jurado
          </button>
        </div>
      </section>

      <section id="como" className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="label-caps">Cómo funciona</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)] text-fg">
          Presentás → reaccionan → te puntúan
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-fg-muted">
          El pitcher habla en su sala. El jurado escribe en una sala aparte. Esas
          reacciones aparecen como globos de texto frente al presentador.
        </p>
      </section>

      <section id="jurados" className="mx-auto max-w-5xl px-5 py-16">
        <p className="label-caps text-center">El panel</p>
        <h2 className="mt-2 text-center font-[family-name:var(--font-display)] text-[length:var(--text-title)]">
          Cuatro sesgos. Un asiento cada uno.
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {JURY_LIST.map((seat) => (
            <div key={seat.slug} className="flex flex-col items-center text-center">
              <JuryFigure slug={seat.slug} size={130} />
              <p className="mt-2 font-[family-name:var(--font-display)] text-xl">
                {seat.name}
              </p>
              <p className="label-caps mt-1" style={{ color: seat.color }}>
                {seat.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="label-caps">FAQ</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)]">
          ¿El pitcher ve el chat del jurado?
        </h2>
        <p className="mt-4 text-fg-muted">
          No. La sala del jurado es privada. Solo le llegan globos con lo que el
          panel decide tirarle.
        </p>
      </section>
    </main>
  );
}
