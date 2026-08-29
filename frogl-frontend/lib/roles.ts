export const ROLES = ["jurado", "pitcher"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_STORAGE_KEY = "frogl:role";

export function isRole(value: unknown): value is Role {
  return value === "jurado" || value === "pitcher";
}

export function readStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return isRole(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function persistRole(role: Role | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    else window.localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
