import "@testing-library/jest-dom/vitest";

// Node 22+ ships an experimental native `localStorage`/`sessionStorage` global backed by a file
// on disk. Without a `--localstorage-file` path configured (as here), that global is a broken
// stub with no working methods — and it takes precedence over jsdom's own functional Storage
// implementation (it's already present on `window` by the time jsdom's environment sets up), so
// any test touching storage fails regardless of `environment: "jsdom"`. Replace both globals with
// a small in-memory polyfill so storage-dependent tests are deterministic and don't depend on
// this Node-version-specific behaviour.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
}

for (const key of ["localStorage", "sessionStorage"] as const) {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, key, { value: storage, configurable: true, writable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, key, { value: storage, configurable: true, writable: true });
  }
}
