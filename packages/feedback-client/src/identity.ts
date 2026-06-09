import type { Identity } from "./types";

const STORAGE_KEY = "design-feedback:identity";

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (typeof parsed.name === "string" && typeof parsed.email === "string" && parsed.name && parsed.email) {
      return { name: parsed.name, email: parsed.email };
    }
  } catch {
    // fall through
  }
  return null;
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}
