"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { FuelType } from "./types";

const STORAGE_KEY = "fuel-preferences";

export type ThemePreference = "system" | "light" | "dark";

export interface UserPreferences {
  fuelType: FuelType;
  mpg?: number;
  tankCapacityLitres?: number;
  useLongFuelNames: boolean;
  theme: ThemePreference;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fuelType: "E10",
  useLongFuelNames: false,
  theme: "system",
};

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    // Server-side render (no localStorage) or private-browsing storage denial.
    return DEFAULT_PREFERENCES;
  }
}

// Module-level store shared by every usePreferences() call in the app, so a change made in one
// mounted component (e.g. the Settings page) is immediately visible in another mounted component
// that's already on screen (e.g. ThemeSync, which lives in the root layout and persists across
// client-side navigation instead of remounting). Plain per-component useState can't do this: two
// independent instances of the same hook don't know about each other, so ThemeSync would only
// pick up a theme change on the next full reload — a real bug this store fixes.
let currentPreferences: UserPreferences = DEFAULT_PREFERENCES;
const listeners = new Set<() => void>();

function setPreferences(next: UserPreferences) {
  currentPreferences = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — keep the in-memory value for this session at least.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentPreferences;
}

function getServerSnapshot() {
  return DEFAULT_PREFERENCES;
}

/**
 * Test-only: clears the shared in-memory store between test cases. Without this, the module-level
 * store (necessary for cross-component live sync — see the comment above it) would leak state
 * from one test into the next, since the module is only imported once per test file.
 */
export function __resetPreferencesStoreForTests() {
  currentPreferences = DEFAULT_PREFERENCES;
  listeners.clear();
}

/**
 * Shared, localStorage-backed user preferences (usual fuel type, MPG, tank capacity, long fuel
 * names, theme) — the web equivalent of the Android app's UserPreferencesStore. Auto-saves on
 * every change, no explicit Save button: Android originally had one, but users found it easy to
 * tap a setting, navigate away without saving, then be confused why nothing changed elsewhere —
 * auto-save removes that whole failure mode.
 *
 * The store starts at DEFAULT_PREFERENCES (same value on server and client) and syncs the real
 * localStorage value in a useEffect after mount, rather than reading localStorage in the
 * useState/useSyncExternalStore initializer. The latter reads correctly on the client but SSR has
 * no localStorage, so the server-rendered HTML would show defaults while the client's first
 * render already reflects the saved preference — a hydration mismatch that makes React discard
 * and remount the whole tree (this was a real, reproduced bug: it took the map/list down with it,
 * since remounting mid-fetch raced with the stations state). The cost is a one-frame flash from
 * default to saved preference on first load, same trade-off every SSR app with client-only
 * storage makes.
 */
export function usePreferences(): [UserPreferences, (patch: Partial<UserPreferences>) => void] {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Only the very first mount across the whole app needs to actually read localStorage — once
    // loaded, the module-level store already holds the real value for every later mount, so
    // there's no per-component default-then-sync flash beyond the very first one.
    if (currentPreferences === DEFAULT_PREFERENCES) {
      setPreferences(loadPreferences());
    }
  }, []);

  const update = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences({ ...currentPreferences, ...patch });
  }, []);

  return [prefs, update];
}

/**
 * Resolves the "theme" preference to an actual "light"/"dark" value — needed anywhere a decision
 * can't be made in pure CSS (e.g. picking a map tile URL). `theme: "system"` follows the OS
 * setting live via matchMedia; explicit "light"/"dark" always wins outright. Defaults to "dark"
 * before mount (matching the app's existing always-dark default, and SSR-safe for the same
 * hydration reason usePreferences itself starts from defaults — see its own comment).
 */
export function useResolvedTheme(theme: ThemePreference): "light" | "dark" {
  const getSystemPreference = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";

  const [systemPreference, setSystemPreference] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setSystemPreference(getSystemPreference());
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemPreference(media.matches ? "light" : "dark");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return theme === "system" ? systemPreference : theme;
}
