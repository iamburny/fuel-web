"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { favouritesApi } from "./api";
import { getToken } from "./authToken";
import type { Favourite } from "./types";

// Shared module-level cache of the signed-in user's favourites, so a heart toggled on a station
// card, the station detail page, and the Favourites page all stay in sync without re-fetching.
// Same pattern as lib/preferences.ts / lib/authToken.ts.

const EMPTY: Favourite[] = [];
let cache: Favourite[] = EMPTY;
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

/** Fetch the favourites list from the backend (or clear it if signed out). */
export async function reloadFavourites() {
  if (!getToken()) {
    cache = EMPTY;
    loaded = true;
    emit();
    return;
  }
  try {
    cache = await favouritesApi.list();
    loaded = true;
    emit();
  } catch {
    // leave the previous cache in place on a transient failure
  }
}

/** Drop all cached favourites — call on sign-out. */
export function resetFavourites() {
  cache = EMPTY;
  loaded = false;
  emit();
}

export function useFavourites() {
  const favourites = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    if (!loaded && getToken()) reloadFavourites();
  }, []);

  const favouriteFor = useCallback(
    (stationId: number): Favourite | null =>
      favourites.find((f) => f.station_id === stationId) ?? null,
    [favourites],
  );

  const add = useCallback(async (stationId: number, fuelType = "E10") => {
    const created = await favouritesApi.add(stationId, fuelType);
    // POST omits the joined station summary; that's fine — the heart only needs id/station_id.
    cache = [...cache.filter((f) => f.station_id !== stationId), created];
    emit();
  }, []);

  const remove = useCallback(async (id: number) => {
    await favouritesApi.remove(id);
    cache = cache.filter((f) => f.id !== id);
    emit();
  }, []);

  return { favourites, favouriteFor, add, remove, reload: reloadFavourites };
}
