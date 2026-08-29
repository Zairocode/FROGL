import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad — FROGL",
  description:
    "La transcripción del pitch vive solo en tu navegador. Cómo tratamos datos en FROGL.",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="label-caps text-accent-teal">Legal</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight text-fg sm:text-5xl">
        Política de privacidad
      </h1>
      <p className="mt-4 text-fg-muted">Última actualización: agosto 2026</p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-fg-muted">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-fg">
            Transcripción en el navegador
          </h2>
          <p className="mt-3">
            El reconocimiento de voz y la transcripción del pitch se procesan{" "}
            <strong className="text-fg">solo en tu navegador</strong> (Web Speech
            API / APIs locales del dispositivo). Ese texto{" "}
            <strong className="text-fg">no se sube a servidores de FROGL</strong>{" "}
            como parte del flujo de captura en vivo: vive en la sesión de la
            página y se pierde al cerrar o recargar, salvo que vos exportés o
            guardés algo a propósito.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-fg">
            Cámara y micrófono
          </h2>
          <p className="mt-3">
            Pedimos permiso de cámara y micrófono solo para la sala de pitch.
            El stream se muestra en tu dispositivo; no almacenamos grabaciones
            de audio ni video en infraestructura de FROGL en esta versión
            front-only.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-fg">
            Cuenta de jurado
          </h2>
          <p className="mt-3">
            El acceso de jurado usa un código de referido y un nombre que
            quedan en almacenamiento local del navegador para la sesión de
            maqueta. No pedimos correo ni contraseña en este flujo.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-fg">
            Contacto
          </h2>
          <p className="mt-3">
            Si tenés dudas sobre privacidad en FROGL, escribí al equipo del
            producto. Al usar la app aceptás este tratamiento local-first de la
            transcripción.
          </p>
        </section>
      </div>

      <Link href="/" className="cta-secondary mt-12 inline-flex">
        ← Volver al inicio
      </Link>
    </main>
  );
}
