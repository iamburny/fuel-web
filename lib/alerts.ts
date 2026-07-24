"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { alertsApi } from "./api";
import { getToken } from "./authToken";
import type { AlertSubscription } from "./types";

// Shared module-level cache of the signed-in user's area alerts, mirroring lib/favourites.ts.

const EMPTY: AlertSubscription[] = [];
let cache: AlertSubscription[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function snapshot() {
  return cache;
}

function serverSnapshot() {
  return EMPTY;
}

/** Fetch the alerts list from the backend (or clear it if signed out). */
export async function reloadAlerts() {
  if (!getToken()) {
    cache = EMPTY;
    loaded = true;
    emit();
    return;
  }
  try {
    cache = await alertsApi.list();
    loaded = true;
    emit();
  } catch {
    // leave the previous cache in place on a transient failure
  }
}

/** Drop all cached alerts — call on sign-out. */
export function resetAlerts() {
  cache = EMPTY;
  loaded = false;
  emit();
}

export function useAlerts() {
  const alerts = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    if (!loaded && getToken()) reloadAlerts();
  }, []);

  const add = useCallback(
    async (latitude: number, longitude: number, radiusMiles = 10, fuelType = "E10", label: string | null = null) => {
      const created = await alertsApi.add(latitude, longitude, radiusMiles, fuelType, label);
      cache = [created, ...cache];
      emit();
    },
    [],
  );

  const remove = useCallback(async (id: number) => {
    await alertsApi.remove(id);
    cache = cache.filter((a) => a.id !== id);
    emit();
  }, []);

  return { alerts, add, remove, reload: reloadAlerts };
}
