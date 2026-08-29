"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FrogMascot } from "./characters/FrogMascot";
import { useAccount } from "@/lib/account-context";
import { useRole } from "@/lib/role-context";

export function JuryAuthForm() {
  const router = useRouter();
  const { login, register, account } = useAccount();
  const { setRole } = useRole();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (account) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <FrogMascot size={140} />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-fg">
          Hola, {account.name}
        </h1>
        <p className="mt-2 text-fg-muted">Ya tenés sesión de jurado.</p>
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
    setPending(true);
    setError(null);
    const fail =
      mode === "register"
        ? await register(name, email, password)
        : await login(email, password);
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
      <p className="label-caps text-accent-teal">Cuenta de jurado</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-title)] text-fg">
        {mode === "register" ? "Creá tu cuenta" : "Entrá al panel"}
      </h1>
      <p className="mt-2 text-fg-muted">
        Sin bots. Cada jurado entra con su nombre y su mail.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        {mode === "register" ? (
          <label className="field">
            <span>Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span>Mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            minLength={4}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="cta-primary mt-2" disabled={pending}>
          {pending
            ? "Un segundo…"
            : mode === "register"
              ? "Crear cuenta"
              : "Entrar"}
        </button>
      </form>

      <button
        type="button"
        className="mt-5 text-sm text-fg-muted hover:text-fg"
        onClick={() => {
          setError(null);
          setMode((current) => (current === "register" ? "login" : "register"));
        }}
      >
        {mode === "register"
          ? "¿Ya tenés cuenta? Entrá"
          : "¿No tenés cuenta? Registrate"}
      </button>
    </main>
  );
}
