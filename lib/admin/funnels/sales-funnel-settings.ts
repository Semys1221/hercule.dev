import type { Audience } from "@/lib/admin/navigation";

const STORAGE_KEY = (audience: Audience) =>
  `hercule:sales-funnel:pitch-sidebar:${audience}`;

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getPitchSidebarEnabled(audience: Audience): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY(audience));
  if (stored === null) {
    return true;
  }

  return stored === "true";
}

export function setPitchSidebarEnabled(audience: Audience, enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY(audience), String(enabled));
  notifyListeners();
}

export function subscribePitchSidebarEnabled(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  const handleStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("hercule:sales-funnel:pitch-sidebar:")) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getPitchSidebarEnabledSnapshot(audience: Audience): boolean {
  return getPitchSidebarEnabled(audience);
}

export function getPitchSidebarEnabledServerSnapshot(): boolean {
  return true;
}
