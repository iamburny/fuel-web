"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Station, FuelType } from "@/lib/types";
import { usePreferences } from "@/lib/preferences";
import FuelTabs from "@/components/FuelTabs";
import StationList from "@/components/StationList";
import StationMap from "@/components/StationMap";
import ComplianceFooter from "@/components/ComplianceFooter";

const STORAGE_KEY = "fuel-map-state";

interface MapState {
  lat: number;
  lng: number;
  radius: number;
  mode: "nearby" | "cheapest";
  fuelType: FuelType;
}

function loadMapState(): MapState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const LONDON = { lat: 51.5074, lng: -0.1278 };

export default function HomePage() {
  const router = useRouter();

  const [prefs] = usePreferences();
  const [stations, setStations] = useState<Station[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>("E10");
  const [search, setSearch] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [coords, setCoords] = useState(LONDON);
  const [radius, setRadius] = useState(10);
  const [mode, setMode] = useState<"nearby" | "cheapest">("nearby");
  const [fitBounds, setFitBounds] = useState(true);
  // 'pending' until the mount effect below has checked sessionStorage; then 'restored' (a saved
  // map position exists for this tab session) or 'fresh' (nothing saved). Real state, not a ref,
  // so other effects can depend on it — gates both "don't overwrite sessionStorage with stale
  // defaults before we've had a chance to read it" and "don't apply the usual-fuel preference
  // over a just-restored position" below.
  const [restoreStatus, setRestoreStatus] = useState<"pending" | "restored" | "fresh">("pending");

  // Restore saved map state (this tab session) once on mount. Deliberately done in an effect, not
  // a useState initializer: sessionStorage doesn't exist during SSR, so reading it in an
  // initializer means the server-rendered HTML (always "nothing saved") and the client's first
  // render (the real saved state) disagree — a hydration mismatch. React responds to a mismatch
  // by discarding and remounting the whole tree, which raced with the stations fetch and crashed
  // the map/list with an unrelated-looking "Cannot read properties of undefined" error.
  useEffect(() => {
    const saved = loadMapState();
    if (saved) {
      setFuelType(saved.fuelType);
      setCoords({ lat: saved.lat, lng: saved.lng });
      setRadius(saved.radius);
      setMode(saved.mode);
      setFitBounds(false);
      setRestoreStatus("restored");
    } else {
      setRestoreStatus("fresh");
    }
  }, []);

  // Save map state so back-navigation restores position — gated on restoreStatus so this can't
  // fire with stale defaults before the restore effect above has had a chance to run.
  useEffect(() => {
    if (restoreStatus === "pending") return;
    const state: MapState = { lat: coords.lat, lng: coords.lng, radius, mode, fuelType };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [restoreStatus, coords, radius, mode, fuelType]);

  // Apply the saved "usual fuel" preference, but only for a genuinely fresh visit (no restored
  // map state) — reruns once prefs has actually finished loading from localStorage (see
  // usePreferences), since its very first value is always the default.
  useEffect(() => {
    if (restoreStatus === "fresh") {
      setFuelType(prefs.fuelType);
    }
  }, [restoreStatus, prefs.fuelType]);

  // Only request geolocation if there's no saved state to restore
  useEffect(() => {
    if (restoreStatus !== "fresh") return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // keep default
        { timeout: 5000 },
      );
    }
  }, [restoreStatus]);

  // Fetch stations — keeps map mounted during refresh, only shows spinner on first load
  const fetchData = useCallback(async () => {
    try {
      if (search.length >= 2) {
        const res = await api.searchStations(search);
        setStations(res.stations);
      } else if (mode === "cheapest") {
        const res = await api.cheapest(fuelType, coords.lat, coords.lng, radius, 200);
        // /api/prices/cheapest's station objects carry no `prices` array at all — only a
        // top-level price_pence for the one matched fuel type — so StationList/StationMarker's
        // `station.prices.filter(...)` crashed on every entry. Synthesize the single-entry array
        // they expect from the price this endpoint actually gave us. reported_at has no real
        // value from this endpoint; it's unused by anything rendering this in-memory list (the
        // station detail page re-fetches full price/history data independently on click).
        setStations(
          res.results.map((r) => ({
            ...r.station,
            distance_miles: r.distance_miles ?? undefined,
            prices: [{ fuel_type: fuelType, price_pence: r.price_pence, reported_at: "" }],
          })),
        );
      } else {
        const res = await api.nearbyStations(coords.lat, coords.lng, radius, fuelType, 200);
        setStations(res.stations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoad(false);
    }
  }, [coords, fuelType, search, mode, radius]);

  // Re-enable fitBounds when search or mode changes (but not on map drag)
  useEffect(() => {
    setFitBounds(true);
  }, [search, mode]);

  const handleMapMove = useCallback((lat: number, lng: number, radiusMiles: number) => {
    setFitBounds(false);
    setRadius(radiusMiles);
    setCoords({ lat, lng });
  }, []);

  useEffect(() => {
    // Wait until the sessionStorage restore attempt has resolved, so this doesn't fire once
    // against the stale London/E10 defaults and then immediately again against the restored
    // values — the same "flash" trade-off already accepted for the geolocation-driven refetch.
    if (restoreStatus === "pending") return;
    const timeout = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchData, restoreStatus]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find cheap fuel near you</h1>
        <p>Live prices from the UK Government Fuel Finder scheme</p>
      </div>

      {/* Search */}
      <input
        className="search-input"
        placeholder="Search by station name, postcode, or brand…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {/* Fuel type + mode toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <FuelTabs selected={fuelType} onChange={(t) => setFuelType(t)} useLongFuelNames={prefs.useLongFuelNames} />
        <div className="fuel-tabs">
          <button
            className={`fuel-tab ${mode === "nearby" ? "active" : ""}`}
            onClick={() => setMode("nearby")}
          >
            Nearby
          </button>
          <button
            className={`fuel-tab ${mode === "cheapest" ? "active" : ""}`}
            onClick={() => setMode("cheapest")}
          >
            Cheapest
          </button>
        </div>
      </div>

      {initialLoad ? (
        <div className="spinner" />
      ) : (
        <>
          {/* Map */}
          <StationMap
            stations={stations}
            fuelType={fuelType}
            center={[coords.lat, coords.lng]}
            fitBounds={fitBounds}
            onStationClick={(id) => router.push(`/stations/${id}`)}
            onMapMove={handleMapMove}
          />

          {/* List */}
          <StationList stations={stations} fuelType={fuelType} />
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}
