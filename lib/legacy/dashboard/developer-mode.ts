const DASHBOARD_DEVELOPER_MODE_STORAGE_KEY = "hercule:dashboard:developer-mode";

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getDashboardDeveloperModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.localStorage.getItem(DASHBOARD_DEVELOPER_MODE_STORAGE_KEY);
  if (stored === null) {
    return false;
  }

  return stored === "true";
}

export function setDashboardDeveloperModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_DEVELOPER_MODE_STORAGE_KEY, String(enabled));
  notifyListeners();
}

export function subscribeDashboardDeveloperModeEnabled(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DASHBOARD_DEVELOPER_MODE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getDashboardDeveloperModeEnabledSnapshot(): boolean {
  return getDashboardDeveloperModeEnabled();
}

export function getDashboardDeveloperModeEnabledServerSnapshot(): boolean {
  return false;
}
