"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { PitchType } from "@/convex/pitchTypes";

// ============================================================
//  SESION DEL PITCH
//  Un solo `sessionId` activo por browser, persistido en localStorage.
//  El flujo: create -> (lobby) -> start -> (live) -> end -> (ended).
//  El jurado se cuelga del mismo sessionId para sumarse como asiento.
// ============================================================

const SESSION_STORAGE_KEY = "frogl:session-id";

function readStoredSessionId(): Id<"sessions"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (raw as Id<"sessions">) : null;
  } catch {
    return null;
  }
}

function writeStoredSessionId(id: Id<"sessions"> | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    else window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type SessionContextValue = {
  sessionId: Id<"sessions"> | null;
  session: Doc<"sessions"> | null;
  hydrated: boolean;
  /** Crea la sesion (lobby) y la devuelve. No la arranca. */
  createSession: (
    title: string,
    presenterName: string,
    pitchType: PitchType,
  ) => Promise<Id<"sessions">>;
  /** Pasa de lobby a live. Acepta un id explicito para arrancar recien creada. */
  startSession: (id?: Id<"sessions">) => Promise<void>;
  /** Pasa a ended: dispara el scorecard del backend. */
  endSession: () => Promise<void>;
  /** Descarta la sesion local (sin borrarla en el backend). */
  reset: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const create = useMutation(api.sessions.create);
  const start = useMutation(api.sessions.start);
  const end = useMutation(api.sessions.end);

  const session = useQuery(api.sessions.get, sessionId ? { sessionId } : "skip");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydración SSR-safe desde localStorage
    setSessionId(readStoredSessionId());
    setHydrated(true);
  }, []);

  const createSession = useCallback(
    async (title: string, presenterName: string, pitchType: PitchType) => {
      const id = await create({
        title: title.trim() || "Pitch sin título",
        presenterName: presenterName.trim() || "El expositor",
        pitchType,
      });
      writeStoredSessionId(id);
      setSessionId(id);
      return id;
    },
    [create],
  );

  const startSession = useCallback(
    async (id?: Id<"sessions">) => {
      const target = id ?? sessionId;
      if (!target) return;
      await start({ sessionId: target });
    },
    [sessionId, start],
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    await end({ sessionId });
  }, [sessionId, end]);

  const reset = useCallback(() => {
    writeStoredSessionId(null);
    setSessionId(null);
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      session: session ?? null,
      hydrated,
      createSession,
      startSession,
      endSession,
      reset,
    }),
    [sessionId, session, hydrated, createSession, startSession, endSession, reset],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
