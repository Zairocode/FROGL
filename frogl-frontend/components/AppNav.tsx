"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "@/lib/account-context";
import { useRole } from "@/lib/role-context";

export function AppNav() {
  const { role, hydrated, clearRole } = useRole();
  const { account, logout } = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const showJuryRoom = hydrated && Boolean(account);

  if (pathname === "/estudio") {
    return null;
  }

  function exit() {
    if (account) logout();
    clearRole();
    router.push("/");
  }

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
          <Link href="/preparar" className="hover:text-fg">
            Preparar
          </Link>
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
          {hydrated && (role || account) ? (
            <button
              type="button"
              onClick={exit}
              className="text-[0.7rem] font-semibold tracking-[0.12em] text-fg-muted uppercase hover:text-fg"
            >
              {account ? account.name : "Pitcher"} · salir
            </button>
          ) : null}
          {/* Sin rol elegido todavia no hay adonde mandar este boton
              (caia a "/", la propia landing). "Preparar mi pitch" ya
              vive como CTA principal ahi, asi que solo mostramos esto
              una vez que hay algo real a donde ir. */}
          {account || role === "pitcher" ? (
            <Link
              href={account ? "/jurado" : "/pitch"}
              className="cta-primary"
            >
              {account ? "Panel →" : "Sala →"}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
