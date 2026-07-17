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

export default function HomePage() {
  const router = useRouter();

  // Lazy initializers read sessionStorage once on first client mount
  const [saved] = useState(loadMapState);
  const [prefs] = usePreferences();
  const [stations, setStations] = useState<Station[]>([]);
  // Restored map-state (within this tab session) wins over the saved "usual fuel" preference,
  // which only applies to a genuinely fresh visit.
  const [fuelType, setFuelType] = useState<FuelType>(saved?.fuelType ?? prefs.fuelType);
  const [search, setSearch] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [coords, setCoords] = useState(saved ? { lat: saved.lat, lng: saved.lng } : { lat: 51.5074, lng: -0.1278 });
  const [radius, setRadius] = useState(saved?.radius ?? 10);
  const [mode, setMode] = useState<"nearby" | "cheapest">(saved?.mode ?? "nearby");
  const [fitBounds, setFitBounds] = useState(!saved);

  // Save map state so back-navigation restores position
  useEffect(() => {
    const state: MapState = { lat: coords.lat, lng: coords.lng, radius, mode, fuelType };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [coords, radius, mode, fuelType]);

  // Only request geolocation if there's no saved state to restore
  useEffect(() => {
    if (saved) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // keep default
        { timeout: 5000 },
      );
    }
  }, []);

  // Fetch stations — keeps map mounted during refresh, only shows spinner on first load
  const fetchData = useCallback(async () => {
    try {
      if (search.length >= 2) {
        const res = await api.searchStations(search);
        setStations(res.stations);
      } else if (mode === "cheapest") {
        const res = await api.cheapest(fuelType, coords.lat, coords.lng, radius, 200);
        setStations(res.results.map((r) => ({ ...r.station, distance_miles: r.distance_miles ?? undefined })));
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
    const timeout = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

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
