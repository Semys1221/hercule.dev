import type { Audience } from "@/lib/admin/navigation";

const PITCH_SIDEBAR_STORAGE_KEY = (audience: Audience) =>
  `hercule:sales-funnel:pitch-sidebar:${audience}`;

const DEVELOPER_MODE_STORAGE_KEY = (audience: Audience) =>
  `hercule:sales-funnel:developer-mode:${audience}`;

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

  const stored = window.localStorage.getItem(PITCH_SIDEBAR_STORAGE_KEY(audience));
  if (stored === null) {
    return true;
  }

  return stored === "true";
}

export function setPitchSidebarEnabled(audience: Audience, enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PITCH_SIDEBAR_STORAGE_KEY(audience), String(enabled));
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

export function getDeveloperModeEnabled(audience: Audience): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY(audience));
  if (stored === null) {
    return false;
  }

  return stored === "true";
}

export function setDeveloperModeEnabled(audience: Audience, enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY(audience), String(enabled));
  notifyListeners();
}

export function subscribeDeveloperModeEnabled(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  const handleStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("hercule:sales-funnel:developer-mode:")) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getDeveloperModeEnabledSnapshot(audience: Audience): boolean {
  return getDeveloperModeEnabled(audience);
}

export function getDeveloperModeEnabledServerSnapshot(): boolean {
  return false;
}
