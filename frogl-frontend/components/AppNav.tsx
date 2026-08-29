"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";

export function AppNav() {
  const { role, hydrated, clearRole } = useRole();
  const pathname = usePathname();
  const showJuryRoom = hydrated && role === "jurado";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg-elevated/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-fg"
        >
          FROGL
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-8 text-[0.75rem] font-semibold tracking-[0.16em] text-fg-muted uppercase sm:flex"
        >
          {pathname === "/" ? (
            <>
              <a href="#como" className="hover:text-fg">
                Cómo
              </a>
              <a href="#jurados" className="hover:text-fg">
                Jurado
              </a>
              <a href="#faq" className="hover:text-fg">
                FAQ
              </a>
            </>
          ) : (
            <Link href="/" className="hover:text-fg">
              Inicio
            </Link>
          )}
          {role === "pitcher" ? (
            <Link
              href="/pitch"
              className={pathname === "/pitch" ? "text-fg" : "hover:text-fg"}
            >
              Sala
            </Link>
          ) : null}
          {showJuryRoom ? (
            <Link
              href="/jurado"
              className={
                pathname === "/jurado" ? "text-accent-pink" : "hover:text-fg"
              }
            >
              Sala jurado
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {hydrated && role ? (
            <button
              type="button"
              onClick={clearRole}
              className="text-[0.7rem] font-semibold tracking-[0.12em] text-fg-muted uppercase hover:text-fg"
            >
              {role === "jurado" ? "Jurado" : "Pitcher"} · salir
            </button>
          ) : null}
          <Link
            href={
              role === "jurado"
                ? "/jurado"
                : role === "pitcher"
                  ? "/pitch"
                  : "/"
            }
            className="cta-primary"
          >
            {role === "jurado"
              ? "Panel →"
              : role === "pitcher"
                ? "Sala →"
                : "Empezar →"}
          </Link>
        </div>
      </div>
    </header>
  );
}
