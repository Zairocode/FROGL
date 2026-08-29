"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsoleType } from "@/components/landing/ConsoleType";
import { MicToFrogl } from "@/components/landing/MicToFrogl";
import { Reveal } from "@/components/landing/Reveal";
import { useRole } from "@/lib/role-context";

const PROBLEM_LINES = [
  "Formular un pitch es molesto.",
  "Te enfrentás a jueces y no sabés cómo comunicar tu idea.",
  "Ensayás solo… y el feedback llega tarde, o no llega.",
];

const JURADOS = [
  { slug: "tecnico", emoji: "🔬", color: "#38bdf8", name: "Dra. Elena Vargas", que: "Factibilidad y arquitectura. La única que contrasta tus datos contra la web." },
  { slug: "comercial", emoji: "💼", color: "#34d399", name: "Lucía Ferrer", que: "Quién paga, cuánto, y por qué te elige a vos." },
  { slug: "tiktok", emoji: "📱", color: "#ff8fab", name: "Kevin", que: "Se aburre a los quince segundos. Si no hay gancho, se fue." },
  { slug: "usuario-final", emoji: "🙋", color: "#f97316", name: "Sandra Ríos", que: "No sabe de tecnología. Solo si le sirve el lunes a la mañana." },
  { slug: "recien-llegado", emoji: "🚪", color: "#fbbf24", name: "Marco Ibáñez", que: "Llegó tarde. Mide si tu pitch se sostiene solo." },
  { slug: "actitud", emoji: "🎭", color: "#c4b5fd", name: "Rosa Puentes", que: "No mira la idea, te mira a vos: convicción y manejo de presión." },
];

const PREGUNTAS = [
  { p: "¿Me interrumpen mientras hablo?", r: "No. Antes lo hacían y era un desastre para practicar. Ahora reaccionan al costado y el juicio llega al final." },
  { p: "¿De dónde saca que un dato es falso?", r: "Busca en la web y te deja el link de lo que encontró. Si no estás de acuerdo con la fuente, la abrís y decidís vos." },
  { p: "¿El que presenta lee el chat del jurado?", r: "No. Solo ve los globos que cada jurado decide tirarle. Lo que se hablan entre ellos queda del otro lado." },
  { p: "¿Qué necesito para usarlo?", r: "Chrome o Edge y un micrófono. No hay nada que instalar." },
  { p: "¿Qué pasa con lo que digo?", r: "El audio se transcribe en el servidor y el texto queda guardado para que puedas releerlo y para que el jurado lo evalúe." },
  { p: "¿Puedo practicar sin jurado?", r: "Sí. En preparar escribís el texto y te da una nota rápida antes de decirlo en voz alta." },
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

      {/* Cómo funciona — el titulo se queda fijo a la izquierda y los pasos
          pasan al lado. Rompe con el bloque centrado de antes. */}
      <section
        id="como"
        className="mx-auto max-w-5xl border-t border-border/40 px-5 py-24 sm:px-8"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <p className="label-caps text-accent-teal">Cómo funciona</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.4vw,2.3rem)] leading-[1.08] text-fg">
              Primero te corrige.
              <br />
              Después te juzga.
            </h2>
          </Reveal>

          <ol className="flex flex-col gap-14">
            {[
              {
                n: "01",
                t: "Decís de qué vas a hablar",
                d: "El tema y cuánto tenés. Sin eso el jurado te escucha a ciegas y no puede saber si te fuiste por las ramas.",
              },
              {
                n: "02",
                t: "Hablás de corrido",
                d: "Nadie te corta. El jurado reacciona al costado, con caritas que mirás de reojo o ignorás si estás en tema.",
              },
              {
                n: "03",
                t: "Te marca lo que no cierra",
                d: "Si dijiste que el mercado son 900 mil millones, lo busca y te muestra la fuente que dice otra cosa. No solo te avisa: te da la frase para decir en su lugar. Corregís, lo repetís, y volvés a pasar.",
              },
              {
                n: "04",
                t: "Recién ahí te evalúan",
                d: "Seis jurados con sesgos distintos. Cada uno te dice qué funcionó, qué romper y en qué minuto se te cayó.",
              },
            ].map((p, i) => (
              <Reveal key={p.n} delay={i * 90}>
                <li className="grid grid-cols-[2.6rem_1fr] gap-x-5">
                  <span className="font-[family-name:var(--font-timer)] text-sm tabular-nums text-accent-teal">
                    {p.n}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl text-fg">
                      {p.t}
                    </h3>
                    <p className="mt-2 max-w-prose text-fg-muted">{p.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* El panel — los seis desparramados, no una caja centrada */}
      <section
        id="jurados"
        className="mx-auto max-w-5xl border-t border-border/40 px-5 py-24 sm:px-8"
      >
        <Reveal>
          <p className="label-caps text-accent-teal">Quiénes escuchan</p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.2vw,2.1rem)] leading-[1.1] text-fg">
            Seis cabezas que no piensan igual
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {JURADOS.map((j, i) => (
            <Reveal key={j.slug} delay={i * 70}>
              <div className="flex gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {j.emoji}
                </span>
                <div>
                  <p
                    className="font-[family-name:var(--font-display)] text-base"
                    style={{ color: j.color }}
                  >
                    {j.name}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">{j.que}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-14 max-w-2xl border-l-2 border-accent-teal/40 pl-5">
            <p className="text-fg-muted">
              Un asiento del jurado es un asiento, lo llene un agente o alguien
              con cuenta. Escriben en el mismo panel y el que presenta no
              distingue. Si hay expertos disponibles, escuchan en vivo y firman
              su veredicto.
            </p>
            <button
              type="button"
              className="cta-primary mt-6"
              onClick={() => router.push("/cuenta")}
            >
              Entrar como jurado →
            </button>
          </div>
        </Reveal>
      </section>

      {/* Preguntas — dos columnas, alineado a la izquierda */}
      <section
        id="faq"
        className="mx-auto max-w-5xl border-t border-border/40 px-5 py-24 sm:px-8"
      >
        <Reveal>
          <p className="label-caps text-accent-teal">Preguntas</p>
        </Reveal>
        <dl className="mt-10 grid gap-x-14 gap-y-10 md:grid-cols-2">
          {PREGUNTAS.map((q, i) => (
            <Reveal key={q.p} delay={i * 60}>
              <dt className="font-[family-name:var(--font-display)] text-lg text-fg">
                {q.p}
              </dt>
              <dd className="mt-2 text-fg-muted">{q.r}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <footer className="border-t border-border/40 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-xs text-fg-muted/80">
            El audio se transcribe en el servidor y el texto se guarda con tu
            sesión.
          </p>
          <a
            href="/privacidad"
            className="text-[0.75rem] font-semibold tracking-[0.14em] text-fg-muted uppercase hover:text-fg"
          >
            Privacidad
          </a>
        </div>
      </footer>
    </main>
  );
}
