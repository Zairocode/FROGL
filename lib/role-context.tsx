"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { persistRole, readStoredRole, type Role } from "./roles";

type RoleContextValue = {
  role: Role | null;
  hydrated: boolean;
  setRole: (role: Role) => void;
  clearRole: () => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydración SSR-safe desde sessionStorage
    setRoleState(readStoredRole());
    setHydrated(true);
  }, []);

  const setRole = useCallback((next: Role) => {
    persistRole(next);
    setRoleState(next);
  }, []);

  const clearRole = useCallback(() => {
    persistRole(null);
    setRoleState(null);
  }, []);

  const value = useMemo(
    () => ({ role, hydrated, setRole, clearRole }),
    [role, hydrated, setRole, clearRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
