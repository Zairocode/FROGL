"use client";

import { useRouter } from "next/navigation";
import { FrogMascot } from "./characters/FrogMascot";
import { useRole } from "@/lib/role-context";

export function LandingPage() {
  const router = useRouter();
  const { setRole } = useRole();

  return (
    <main>
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-8 text-center">
        <div className="type-ring" aria-hidden>
          <span>LIVE · CUENTA · JURADO · PITCH · GLOBOS · EN VIVO · </span>
          <span>LIVE · CUENTA · JURADO · PITCH · GLOBOS · EN VIVO · </span>
        </div>

        <FrogMascot size={260} className="relative z-10" />

        <h1 className="relative z-10 mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-hero)] leading-[0.95] tracking-tight text-fg">
          FROGL
        </h1>
        <p className="relative z-10 mt-4 max-w-md text-lg text-fg-muted">
          Presentás. Jurados de verdad, cada uno con su cuenta, reaccionan en
          vivo.
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
            onClick={() => router.push("/cuenta")}
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
          El pitcher habla en su sala. Cada jurado entra con su cuenta a una
          sala aparte. Esas reacciones aparecen como globos de texto.
        </p>
      </section>

      <section id="jurados" className="mx-auto max-w-xl px-5 py-16 text-center">
        <p className="label-caps">El panel</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)]">
          Humanos con cuenta. Sin bots.
        </h2>
        <p className="mt-4 text-fg-muted">
          Entrá con un código de referido y tu nombre. Sin mail ni contraseña.
        </p>
        <button
          type="button"
          className="cta-primary mt-6"
          onClick={() => router.push("/cuenta")}
        >
          Soy jurado →
        </button>
      </section>

      <section id="faq" className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="label-caps">FAQ</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)]">
          ¿El pitcher ve el chat del jurado?
        </h2>
        <p className="mt-4 text-fg-muted">
          No. La sala del jurado es privada. Solo le llegan globos con lo que
          cada cuenta decide tirarle.
        </p>
      </section>
    </main>
  );
}
