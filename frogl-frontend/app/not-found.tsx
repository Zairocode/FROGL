import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 40%, rgba(255,143,171,0.12), transparent 70%), radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <p className="label-caps text-accent-pink">404</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,4.5rem)] leading-none tracking-tight text-fg">
        Página no encontrada
      </h1>
      <p className="mt-5 max-w-md text-fg-muted">
        Esta ruta no existe o se movió. Volvé al inicio o empezá un pitch.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="cta-primary">
          Ir al inicio →
        </Link>
        <Link href="/pitch" className="cta-secondary">
          Sala de pitch
        </Link>
      </div>
    </main>
  );
}
