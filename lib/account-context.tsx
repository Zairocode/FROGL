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
import {
  authenticate,
  createAccount,
  readAccounts,
  readSessionId,
  toPublic,
  writeSessionId,
  type PublicJuror,
} from "./accounts";
import { persistRole } from "./roles";

type AccountContextValue = {
  account: PublicJuror | null;
  hydrated: boolean;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<PublicJuror | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sessionId = readSessionId();
    const stored = sessionId
      ? readAccounts().find((item) => item.id === sessionId)
      : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydración SSR-safe: el server renderiza vacío y acá se lee localStorage una vez
    setAccount(stored ? toPublic(stored) : null);
    setHydrated(true);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await createAccount(name, email, password);
      if (!result.ok) return result.error;
      writeSessionId(result.account.id);
      persistRole("jurado");
      setAccount(toPublic(result.account));
      return null;
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    const result = await authenticate(email, password);
    if (!result.ok) return result.error;
    writeSessionId(result.account.id);
    persistRole("jurado");
    setAccount(toPublic(result.account));
    return null;
  }, []);

  const logout = useCallback(() => {
    writeSessionId(null);
    persistRole(null);
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ account, hydrated, register, login, logout }),
    [account, hydrated, register, login, logout],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
