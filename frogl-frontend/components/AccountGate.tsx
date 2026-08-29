"use client";

import Link from "next/link";
import { FrogMascot } from "./characters/FrogMascot";
import { useAccount } from "@/lib/account-context";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { account, hydrated } = useAccount();

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-fg-muted">
        Cargando…
      </div>
    );
  }

  if (!account) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <FrogMascot size={160} />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-fg">
          Esta sala es solo con cuenta de jurado
        </h1>
        <p className="mt-2 max-w-md text-fg-muted">
          Entrá con tu código de referido y tu nombre para unirte al panel.
        </p>
        <Link href="/cuenta" className="cta-primary mt-8">
          Entrar como jurado
        </Link>
      </main>
    );
  }

  return children;
}
