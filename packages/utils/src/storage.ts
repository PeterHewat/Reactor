/**
 * A minimal storage interface compatible with the Web Storage API.
 */
export interface StorageLike {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
  clear(): void;
}

/**
 * Creates an in-memory storage implementation.
 *
 * Used as a fallback when `localStorage` is unavailable (e.g., SSR, Node.js).
 *
 * @returns A `StorageLike` object backed by a `Map`
 *
 * @example
 * const storage = createMemoryStorage();
 * storage.setItem("key", "value");
 * storage.getItem("key"); // "value"
 * storage.removeItem("key");
 */
export function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (name: string) => store.get(name) ?? null,
    setItem: (name: string, value: string) => {
      store.set(name, value);
    },
    removeItem: (name: string) => {
      store.delete(name);
    },
    clear: () => {
      store.clear();
    },
  };
}

/** Cached memory storage singleton for SSR/test environments. */
let memoryStorageSingleton: StorageLike | null = null;

function isStorageLike(value: unknown): value is StorageLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StorageLike).getItem === "function" &&
    typeof (value as StorageLike).setItem === "function" &&
    typeof (value as StorageLike).removeItem === "function" &&
    typeof (value as StorageLike).clear === "function"
  );
}

function getNativeLocalStorage(): StorageLike | null {
  if (typeof window !== "undefined" && isStorageLike(window.localStorage)) {
    return window.localStorage;
  }
  if (isStorageLike(globalThis.localStorage)) {
    return globalThis.localStorage as StorageLike;
  }
  return null;
}

/**
 * Replaces missing or broken `localStorage` with in-memory storage.
 *
 * Node 24+ can expose a non-functional `localStorage` when
 * `--localstorage-file` is set without a valid path (common in Vitest worker
 * processes). Test setup should call this before stores that use persistence.
 */
export function ensureLocalStoragePolyfill(): void {
  if (getNativeLocalStorage()) {
    return;
  }

  const storage = getLocalStorageOrMemory();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
    });
  }
}

/**
 * Returns `localStorage` when available, otherwise falls back to a
 * singleton in-memory storage implementation.
 *
 * The memory fallback is cached so that repeated calls in SSR or test
 * environments share the same store instance, preventing data loss
 * between calls. **Theme and i18n preferences do not persist across full
 * page reloads** when `localStorage` is unavailable (strict CSP, private mode, SSR).
 *
 * Safe to call in SSR environments (e.g., during Vite SSR or Node tests).
 *
 * @returns A `StorageLike` object
 *
 * @example
 * const storage = getLocalStorageOrMemory();
 * storage.setItem("theme", "dark");
 */
export function getLocalStorageOrMemory(): StorageLike {
  const native = getNativeLocalStorage();
  if (native) {
    return native;
  }
  if (!memoryStorageSingleton) {
    memoryStorageSingleton = createMemoryStorage();
  }
  return memoryStorageSingleton;
}

/**
 * Clears all entries from persisted storage (localStorage or in-memory fallback).
 *
 * @example
 * beforeEach(() => {
 *   clearPersistedStorage();
 * });
 */
export function clearPersistedStorage(): void {
  getLocalStorageOrMemory().clear();
}
