/**
 * A minimal storage interface compatible with the Web Storage API.
 */
export interface StorageLike {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
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
  };
}

/**
 * Returns `localStorage` when available, otherwise falls back to an
 * in-memory storage implementation.
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
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return createMemoryStorage();
}
