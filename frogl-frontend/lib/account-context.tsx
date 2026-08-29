"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createAccountFromReferral,
  dropPresence,
  livePresence,
  PRESENCE_CHANNEL,
  PRESENCE_KEY,
  readAccounts,
  readSessionId,
  toPublic,
  writeSessionId,
  type PublicJuror,
} from "./accounts";
import { persistRole } from "./roles";

type AccountContextValue = {
  account: PublicJuror | null;
  online: PublicJuror[];
  hydrated: boolean;
  joinWithReferral: (
    referralCode: string,
    name: string,
  ) => Promise<string | null>;
  logout: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<PublicJuror | null>(null);
  const [online, setOnline] = useState<PublicJuror[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sessionId = readSessionId();
    const stored = sessionId
      ? readAccounts().find((item) => item.id === sessionId)
      : null;
    setAccount(stored ? toPublic(stored) : null);
    setOnline(livePresence());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const refresh = () => setOnline(livePresence());
    const onStorage = (event: StorageEvent) => {
      if (event.key === PRESENCE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(refresh, 4000);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(PRESENCE_CHANNEL);
      channel.onmessage = refresh;
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
      channel?.close();
    };
  }, []);

  const joinWithReferral = useCallback(
    async (referralCode: string, name: string) => {
      const result = createAccountFromReferral(name, referralCode);
      if (!result.ok) return result.error;
      writeSessionId(result.account.id);
      persistRole("jurado");
      setAccount(toPublic(result.account));
      return null;
    },
    [],
  );

  const logout = useCallback(() => {
    if (account) dropPresence(account.id);
    writeSessionId(null);
    persistRole(null);
    setAccount(null);
  }, [account]);

  const value = useMemo(
    () => ({ account, online, hydrated, joinWithReferral, logout }),
    [account, online, hydrated, joinWithReferral, logout],
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
