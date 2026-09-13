export type BookingLostVariant = "lost" | "unqualified";

export type BookingLocalDocMarkedAs = "not_paid" | "lost" | "no_show";

export type BookingLocalDoc = {
  note: string;
  markedAs: BookingLocalDocMarkedAs;
  lostVariant?: BookingLostVariant;
  markedAt: number;
};

type BookingLocalDocsStore = {
  version: 1;
  docs: Record<string, BookingLocalDoc>;
};

const STORE_VERSION = 1;
const STORE_KEY = `hercule:bookings-local-docs:v${STORE_VERSION}`;

type CacheStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getLocalStorage(): CacheStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseStore(raw: string): BookingLocalDocsStore | null {
  try {
    const parsed = JSON.parse(raw) as BookingLocalDocsStore;
    if (!parsed || parsed.version !== STORE_VERSION || typeof parsed.docs !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readStore(storage: CacheStorage | null = getLocalStorage()): BookingLocalDocsStore {
  if (!storage) {
    return { version: STORE_VERSION, docs: {} };
  }
  const raw = storage.getItem(STORE_KEY);
  if (!raw) {
    return { version: STORE_VERSION, docs: {} };
  }
  const parsed = parseStore(raw);
  if (!parsed) {
    storage.removeItem(STORE_KEY);
    return { version: STORE_VERSION, docs: {} };
  }
  return parsed;
}

function writeStore(
  store: BookingLocalDocsStore,
  storage: CacheStorage | null = getLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable
  }
}

export function readAllBookingLocalDocs(
  storage: CacheStorage | null = getLocalStorage(),
): Record<string, BookingLocalDoc> {
  return readStore(storage).docs;
}

export function readBookingLocalDoc(
  inviteeUri: string,
  storage: CacheStorage | null = getLocalStorage(),
): BookingLocalDoc | null {
  return readStore(storage).docs[inviteeUri] ?? null;
}

export function writeBookingLocalDoc(
  inviteeUri: string,
  input: {
    note: string;
    markedAs: BookingLocalDocMarkedAs;
    lostVariant?: BookingLostVariant;
  },
  storage: CacheStorage | null = getLocalStorage(),
): BookingLocalDoc {
  const store = readStore(storage);
  const doc: BookingLocalDoc = {
    note: input.note.trim(),
    markedAs: input.markedAs,
    lostVariant: input.lostVariant,
    markedAt: Date.now(),
  };
  store.docs[inviteeUri] = doc;
  writeStore(store, storage);
  return doc;
}

export function requiresBookingLocalNote(markedAs: BookingLocalDocMarkedAs): boolean {
  return markedAs === "not_paid" || markedAs === "lost";
}
