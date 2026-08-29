import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg px-6 font-sans text-fg">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
          FROGL
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Evaluador de pitches con jurado híbrido
        </h1>
        <p className="text-fg-muted leading-relaxed">
          Maqueta front de la sala: transcript tipo lyrics, micrófono, 4
          jurados y feed en vivo.
        </p>
        <Link
          href="/pitch"
          className="rounded-full bg-accent-pink px-8 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
        >
          Abrir sala de pitch →
        </Link>
      </main>
    </div>
  );
}
