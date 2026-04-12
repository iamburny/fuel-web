"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Station, FuelType } from "@/lib/types";
import FuelTabs from "@/components/FuelTabs";
import StationList from "@/components/StationList";
import StationMap from "@/components/StationMap";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function HomePage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>("E10");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 }); // London default
  const [radius, setRadius] = useState(10);
  const [mode, setMode] = useState<"nearby" | "cheapest">("nearby");
  const [fitBounds, setFitBounds] = useState(true);

  // Replace with real location when available
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // keep default
        { timeout: 5000 },
      );
    }
  }, []);

  // Fetch stations
  const fetchData = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
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
        <FuelTabs selected={fuelType} onChange={(t) => setFuelType(t)} />
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

      {loading ? (
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
