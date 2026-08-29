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
        {/* glow + viñeta de escena */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: [
              "radial-gradient(ellipse 50% 40% at 50% 58%, rgba(255,143,171,0.14), transparent 65%)",
              "radial-gradient(ellipse 42% 36% at 62% 48%, rgba(255,232,210,0.1), transparent 55%)",
              "radial-gradient(ellipse at center, transparent 28%, rgba(10,12,14,0.55) 100%)",
            ].join(", "),
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg via-bg/40 to-transparent"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-x-5 top-[7%] z-10 flex justify-center sm:top-[8%]">
          <ConsoleType lines={PROBLEM_LINES} onDone={onConsoleDone} />
        </div>

        <div className="relative z-[1] flex min-h-[calc(100svh-4rem)] w-full flex-col items-center justify-center pb-[18vh] pt-[8vh]">
          <div className="relative w-full max-w-xl">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,200,170,0.18),transparent_70%)] blur-2xl"
              aria-hidden
            />
            <MicToFrogl resolve={consoleDone} onBrandReady={onBrandReady} />
          </div>
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
                // A preparar, no directo a la sala: sin tema ni duracion el
                // jurado escucha a ciegas y el corrector no tiene contra que
                // contrastar.
                router.push("/preparar");
              }}
            >
              Preparar mi pitch →
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
        className="mx-auto max-w-2xl border-t border-border/40 px-5 py-20"
      >
        <p className="label-caps text-accent-teal">Cómo funciona</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.2vw,2.1rem)] leading-tight text-fg">
          Primero te corrige. Después te juzga.
        </h2>

        <ol className="mt-10 flex flex-col gap-9">
          <li className="grid grid-cols-[2.2rem_1fr] gap-4">
            <span className="font-[family-name:var(--font-timer)] text-lg text-accent-teal tabular-nums">
              01
            </span>
            <div>
              <h3 className="text-fg">Decís de qué vas a hablar</h3>
              <p className="mt-1 text-fg-muted">
                El tema y cuánto tenés. Sin eso el jurado te escucha a ciegas y
                no puede saber si te fuiste por las ramas.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[2.2rem_1fr] gap-4">
            <span className="font-[family-name:var(--font-timer)] text-lg text-accent-teal tabular-nums">
              02
            </span>
            <div>
              <h3 className="text-fg">Hablás de corrido</h3>
              <p className="mt-1 text-fg-muted">
                Nadie te corta. El jurado reacciona al costado, con caritas que
                mirás de reojo o ignorás si estás en tema.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[2.2rem_1fr] gap-4">
            <span className="font-[family-name:var(--font-timer)] text-lg text-accent-teal tabular-nums">
              03
            </span>
            <div>
              <h3 className="text-fg">Te marca lo que no cierra</h3>
              <p className="mt-1 text-fg-muted">
                Si dijiste que el mercado son 900 mil millones, lo busca y te
                muestra la fuente que dice otra cosa. No solo te avisa: te da la
                frase para decir en su lugar. Corregís, lo repetís, y volvés a
                pasar. Al jurado no llegás con datos falsos.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[2.2rem_1fr] gap-4">
            <span className="font-[family-name:var(--font-timer)] text-lg text-accent-teal tabular-nums">
              04
            </span>
            <div>
              <h3 className="text-fg">Recién ahí te evalúan</h3>
              <p className="mt-1 text-fg-muted">
                Seis jurados con sesgos distintos: la técnica que pregunta qué
                se rompe al escalar, el que se aburre a los quince segundos, el
                que llegó tarde, la que solo mira cómo te parás. Cada uno te
                dice qué funcionó, qué romper y en qué minuto se te cayó.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section
        id="jurados"
        className="mx-auto max-w-2xl border-t border-border/40 px-5 py-16"
      >
        <p className="label-caps text-accent-teal">El panel</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,1.9rem)] leading-tight text-fg">
          Los jurados sintéticos ocupan las sillas que no llenan las personas
        </h2>
        <p className="mt-4 text-fg-muted">
          Un asiento del jurado es un asiento, lo llene un agente o alguien con
          cuenta. Escriben en el mismo panel y el que presenta no distingue. Si
          hay expertos disponibles, escuchan en vivo y firman su veredicto.
        </p>
        <button
          type="button"
          className="cta-primary mt-6"
          onClick={() => router.push("/cuenta")}
        >
          Entrar como jurado →
        </button>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-2xl border-t border-border/40 px-5 py-16"
      >
        <p className="label-caps text-accent-teal">Preguntas</p>
        <dl className="mt-8 flex flex-col gap-7">
          <div>
            <dt className="text-fg">¿Me van a interrumpir mientras hablo?</dt>
            <dd className="mt-1 text-fg-muted">
              No. Antes lo hacían y era un desastre para practicar. Ahora
              reaccionan al costado y el juicio llega al final.
            </dd>
          </div>
          <div>
            <dt className="text-fg">¿De dónde saca que un dato es falso?</dt>
            <dd className="mt-1 text-fg-muted">
              Busca en la web y te deja el link de lo que encontró. Si no estás
              de acuerdo con la fuente, la abrís y decidís vos.
            </dd>
          </div>
          <div>
            <dt className="text-fg">¿El que presenta lee el chat del jurado?</dt>
            <dd className="mt-1 text-fg-muted">
              No. Solo ve los globos que cada jurado decide tirarle. Lo que se
              hablan entre ellos queda del otro lado.
            </dd>
          </div>
          <div>
            <dt className="text-fg">¿Qué necesito para usarlo?</dt>
            <dd className="mt-1 text-fg-muted">
              Chrome o Edge y un micrófono. No hay nada que instalar.
            </dd>
          </div>
          <div>
            <dt className="text-fg">¿Qué pasa con lo que digo?</dt>
            <dd className="mt-1 text-fg-muted">
              El audio se transcribe en el servidor y el texto queda guardado
              para que puedas releerlo y para que el jurado lo evalúe. No es
              privado del navegador.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="border-t border-border/40 px-5 py-10 text-center">
        <a
          href="/privacidad"
          className="text-[0.75rem] font-semibold tracking-[0.14em] text-fg-muted uppercase hover:text-fg"
        >
          Privacidad
        </a>
        <p className="mt-3 text-xs text-fg-muted/80">
          El audio se transcribe en el servidor y el texto se guarda con tu
          sesión.
        </p>
      </footer>
    </main>
  );
}
