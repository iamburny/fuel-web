"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  clearAuth,
  getAuthSnapshot,
  getServerAuthSnapshot,
  hydrateAuth,
  setAuth,
  subscribeAuth,
} from "./authToken";

/**
 * Signed-in state for the web app: the backend JWT (issued by /api/auth/login or /api/auth/google)
 * plus the account email for display. Backed by the shared localStorage store in ./authToken so
 * lib/api.ts can read the token outside React. SSR-safe the same way lib/preferences.ts is — starts
 * empty on both server and client, then hydrates real localStorage in a useEffect after mount to
 * avoid a hydration mismatch.
 */
export function useAuth() {
  const state = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);

  useEffect(() => {
    hydrateAuth();
  }, []);

  const login = useCallback((token: string, email: string | null) => {
    setAuth({ token, email });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return {
    token: state.token,
    email: state.email,
    isLoggedIn: state.token != null,
    login,
    logout,
  };
}
