// Non-React, localStorage-backed holder for the backend JWT + signed-in email. Lives outside the
// React tree so lib/api.ts (a plain module, not a hook) can read the token to attach the
// Authorization header, while the useAuth() hook subscribes for UI updates. Mirrors the
// module-level store pattern in lib/preferences.ts.

const STORAGE_KEY = "fuel-auth";

export interface AuthState {
  token: string | null;
  email: string | null;
}

const EMPTY: AuthState = { token: null, email: null };

let current: AuthState = EMPTY;
const listeners = new Set<() => void>();

function load(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // SSR (no localStorage) or storage denied.
    return EMPTY;
  }
}

/** Read the current auth from localStorage into the module store. Called once on first mount. */
export function hydrateAuth() {
  if (current === EMPTY) {
    const loaded = load();
    if (loaded.token) {
      current = loaded;
      listeners.forEach((l) => l());
    }
  }
}

export function getToken(): string | null {
  return current.token;
}

export function getAuthSnapshot(): AuthState {
  return current;
}

export function getServerAuthSnapshot(): AuthState {
  return EMPTY;
}

export function setAuth(next: AuthState) {
  current = next;
  try {
    if (next.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // keep in-memory value for this session
  }
  listeners.forEach((l) => l());
}

export function clearAuth() {
  setAuth(EMPTY);
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only: reset the shared store between test cases. */
export function __resetAuthStoreForTests() {
  current = EMPTY;
  listeners.clear();
}
