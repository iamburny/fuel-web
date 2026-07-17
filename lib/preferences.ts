"use client";

import { useCallback, useEffect, useState } from "react";
import type { FuelType } from "./types";

const STORAGE_KEY = "fuel-preferences";

export interface UserPreferences {
  fuelType: FuelType;
  mpg?: number;
  tankCapacityLitres?: number;
  useLongFuelNames: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fuelType: "E10",
  useLongFuelNames: false,
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

/**
 * localStorage-backed user preferences (usual fuel type, MPG, tank capacity, long fuel names) —
 * the web equivalent of the Android app's UserPreferencesStore. Auto-saves on every change, no
 * explicit Save button: Android originally had one, but users found it easy to tap a setting,
 * navigate away without saving, then be confused why nothing changed elsewhere — auto-save
 * removes that whole failure mode.
 *
 * Always starts from DEFAULT_PREFERENCES and syncs the real localStorage value in a useEffect
 * after mount, rather than reading localStorage in the useState initializer. The latter reads
 * correctly on the client but SSR has no localStorage, so the server-rendered HTML would show
 * defaults while the client's first render already reflects the saved preference — a hydration
 * mismatch that makes React discard and remount the whole tree (this was a real, reproduced bug:
 * it took the map/list down with it, since remounting mid-fetch raced with the stations state).
 * The cost is a one-frame flash from default to saved preference on first load, same trade-off
 * every SSR app with client-only storage makes.
 */
export function usePreferences(): [UserPreferences, (patch: Partial<UserPreferences>) => void] {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const update = useCallback((patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — keep the in-memory value for this session at least.
      }
      return next;
    });
  }, []);

  return [prefs, update];
}
