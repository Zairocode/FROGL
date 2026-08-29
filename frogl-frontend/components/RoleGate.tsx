"use client";

import Link from "next/link";
import { FrogMascot } from "./characters/FrogMascot";
import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/roles";

export function RoleGate({
  allow,
  children,
  title,
  body,
}: {
  allow: Role;
  children: React.ReactNode;
  title: string;
  body: string;
}) {
  const { role, hydrated, setRole } = useRole();

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-fg-muted">
        Cargando…
      </div>
    );
  }

  if (role !== allow) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <FrogMascot size={160} />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-fg">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-fg-muted">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="cta-primary"
            onClick={() => setRole(allow)}
          >
            Entrar como {allow}
          </button>
          <Link href="/" className="cta-secondary">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
