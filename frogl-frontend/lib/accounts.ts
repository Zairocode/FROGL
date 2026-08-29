export type JuryAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  color: string;
  createdAt: number;
};

export type PublicJuror = {
  id: string;
  name: string;
  color: string;
};

export const ACCOUNTS_KEY = "frogl:jury-accounts:v1";
export const SESSION_KEY = "frogl:jury-session";
export const PRESENCE_KEY = "frogl:jury-presence:v1";
export const PRESENCE_CHANNEL = "frogl-jury-presence";

export const JUROR_COLORS = [
  "#38bdf8",
  "#ff8fab",
  "#fbbf24",
  "#2dd4a8",
  "#c4b5fd",
  "#fb7185",
];

export function toPublic(account: Pick<JuryAccount, "id" | "name" | "color">): PublicJuror {
  return { id: account.id, name: account.name, color: account.color };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function hashPassword(email: string, password: string) {
  const payload = new TextEncoder().encode(`${normalizeEmail(email)}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function readAccounts(): JuryAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JuryAccount[]) : [];
  } catch {
    return [];
  }
}

export function writeAccounts(accounts: JuryAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function readSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSessionId(id: string | null) {
  if (id) window.sessionStorage.setItem(SESSION_KEY, id);
  else window.sessionStorage.removeItem(SESSION_KEY);
}

export function colorForIndex(index: number) {
  return JUROR_COLORS[index % JUROR_COLORS.length];
}

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true; account: JuryAccount } | { ok: false; error: string }> {
  const trimmed = name.trim();
  const mail = normalizeEmail(email);
  if (trimmed.length < 2) return { ok: false, error: "Poné tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return { ok: false, error: "El mail no es válido." };
  }
  if (password.length < 4) {
    return { ok: false, error: "La contraseña necesita al menos 4 caracteres." };
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === mail)) {
    return { ok: false, error: "Ese mail ya tiene una cuenta de jurado." };
  }

  const account: JuryAccount = {
    id: newId(),
    name: trimmed,
    email: mail,
    passwordHash: await hashPassword(mail, password),
    color: colorForIndex(accounts.length),
    createdAt: Date.now(),
  };
  writeAccounts([...accounts, account]);
  return { ok: true, account };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ ok: true; account: JuryAccount } | { ok: false; error: string }> {
  const mail = normalizeEmail(email);
  const account = readAccounts().find((item) => item.email === mail);
  if (!account) return { ok: false, error: "No hay una cuenta con ese mail." };
  const passwordHash = await hashPassword(mail, password);
  if (passwordHash !== account.passwordHash) {
    return { ok: false, error: "Contraseña incorrecta." };
  }
  return { ok: true, account };
}

export type PresenceEntry = PublicJuror & { lastSeen: number };

export function readPresence(): PresenceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESENCE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PresenceEntry[]) : [];
  } catch {
    return [];
  }
}

export function writePresence(entries: PresenceEntry[]) {
  window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(entries));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(PRESENCE_CHANNEL);
    channel.postMessage(entries);
    channel.close();
  }
}

const PRESENCE_TTL_MS = 16_000;

export function livePresence(now = Date.now()): PublicJuror[] {
  return readPresence()
    .filter((entry) => now - entry.lastSeen < PRESENCE_TTL_MS)
    .map(({ id, name, color }) => ({ id, name, color }));
}

export function touchPresence(juror: PublicJuror) {
  const now = Date.now();
  const next = readPresence()
    .filter((entry) => now - entry.lastSeen < PRESENCE_TTL_MS && entry.id !== juror.id)
    .concat({ ...juror, lastSeen: now });
  writePresence(next);
}

export function dropPresence(accountId: string) {
  writePresence(readPresence().filter((entry) => entry.id !== accountId));
}
