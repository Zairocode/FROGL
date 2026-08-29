"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FrogMascot } from "./characters/FrogMascot";
import { useAccount } from "@/lib/account-context";
import { useRole } from "@/lib/role-context";

type Step = "code" | "name";

export function JuryAuthForm() {
  const router = useRouter();
  const { joinWithReferral, account } = useAccount();
  const { setRole } = useRole();
  const [step, setStep] = useState<Step>("code");
  const [referralCode, setReferralCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (account) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <FrogMascot size={140} />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-fg">
          Hola, {account.name}
        </h1>
        <p className="mt-2 text-fg-muted">Ya estás en el panel de jurado.</p>
        <button
          type="button"
          className="cta-primary mt-6"
          onClick={() => {
            setRole("jurado");
            router.push("/jurado");
          }}
        >
          Ir a la sala →
        </button>
      </main>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (step === "code") {
      if (!referralCode.trim()) {
        setError("Ingresá el código de referido.");
        return;
      }
      setStep("name");
      return;
    }

    if (name.trim().length < 2) {
      setError("Poné tu nombre.");
      return;
    }

    setPending(true);
    const fail = await joinWithReferral(referralCode, name);
    setPending(false);
    if (fail) {
      setError(fail);
      return;
    }
    setRole("jurado");
    router.push("/jurado");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <p className="label-caps text-accent-teal">Jurado</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)] text-fg">
        {step === "code" ? "Código de referido" : "Tu nombre"}
      </h1>
      <p className="mt-2 text-fg-muted">
        {step === "code"
          ? "Escribí el código que te pasaron. Puede ser cualquiera."
          : "Con ese nombre vas a aparecer en la sala."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        {step === "code" ? (
          <label className="field">
            <span>Código de referido</span>
            <input
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              autoComplete="off"
              autoFocus
              required
              placeholder="Tu código"
            />
          </label>
        ) : (
          <label className="field">
            <span>Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoFocus
              required
              minLength={2}
              placeholder="Tu nombre"
            />
          </label>
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="cta-primary mt-2" disabled={pending}>
          {pending
            ? "Un segundo…"
            : step === "code"
              ? "Continuar"
              : "Entrar a la sala"}
        </button>
      </form>

      {step === "name" ? (
        <button
          type="button"
          className="mt-5 text-sm text-fg-muted hover:text-fg"
          onClick={() => {
            setError(null);
            setStep("code");
          }}
        >
          ← Cambiar código
        </button>
      ) : null}
    </main>
  );
}
