import { NICHE_STORAGE_KEY, type Niche, isNiche } from "@/lib/admin/navigation";

export function readStoredNiche(): Niche | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(NICHE_STORAGE_KEY)?.trim();
    return value && isNiche(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredNiche(niche: Niche): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(NICHE_STORAGE_KEY, niche);
  } catch {
    // ignore quota / private mode
  }
}
