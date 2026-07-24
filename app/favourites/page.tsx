"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useFavourites } from "@/lib/favourites";
import { useAlerts } from "@/lib/alerts";
import { usePreferences } from "@/lib/preferences";
import { fuelLabel, type FuelType } from "@/lib/types";
import FuelTabs from "@/components/FuelTabs";
import SignInPanel from "@/components/SignInPanel";
import ComplianceFooter from "@/components/ComplianceFooter";

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation isn't supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 });
  });
}

export default function FavouritesPage() {
  const { isLoggedIn } = useAuth();
  const { favourites, remove, reload } = useFavourites();
  const { alerts, add: addAlert, remove: removeAlert, reload: reloadAlerts } = useAlerts();
  const [prefs] = usePreferences();

  // Refresh from the server on entry so we get the joined station summaries (the add() response
  // omits them).
  useEffect(() => {
    if (isLoggedIn) {
      reload();
      reloadAlerts();
    }
  }, [isLoggedIn, reload, reloadAlerts]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Favourites</h1>
        <p>Your saved stations and area alerts</p>
      </div>

      {!isLoggedIn ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>Sign in to save stations and get price-drop alerts.</p>
          <SignInPanel />
        </div>
      ) : (
        <>
          <AreaAlertsSection
            alerts={alerts}
            useLongFuelNames={prefs.useLongFuelNames}
            onAdd={addAlert}
            onRemove={removeAlert}
          />

          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 4px" }}>Favourite stations</h2>
          {favourites.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
              No favourites yet. Tap the heart on any station to save it here.
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {favourites.map((f) => (
                <div
                  key={f.id}
                  className="station-row"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Link
                    href={`/stations/${f.station_id}`}
                    className="station-info"
                    style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                  >
                    <h3>{f.station?.name ?? `Station #${f.station_id}`}</h3>
                    <div className="station-meta">
                      {[
                        f.station?.brand,
                        fuelLabel(f.fuel_type, prefs.useLongFuelNames),
                        f.notify_on_drop ? "Alerts on" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </Link>
                  <button type="button" onClick={() => remove(f.id)} style={removeButtonStyle}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}

const removeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "6px 12px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.85rem",
};

function AreaAlertsSection({
  alerts,
  useLongFuelNames,
  onAdd,
  onRemove,
}: {
  alerts: { id: number; latitude: number; longitude: number; radius_miles: number; fuel_type: string }[];
  useLongFuelNames: boolean;
  onAdd: (lat: number, lng: number, radiusMiles: number, fuelType: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fuelType, setFuelType] = useState<FuelType>("E10");
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      await onAdd(pos.coords.latitude, pos.coords.longitude, radiusMiles, fuelType);
      setShowForm(false);
    } catch {
      setError("Couldn't get your location. Enable location and try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>Area alerts</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
        Get notified when prices drop near a location.
      </p>

      {alerts.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="station-row"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <h3 style={{ fontSize: "0.95rem" }}>
                  {fuelLabel(a.fuel_type, useLongFuelNames)} within {a.radius_miles} mi
                </h3>
                <div className="station-meta" style={{ fontFamily: "var(--font-mono)" }}>
                  {a.latitude.toFixed(3)}, {a.longitude.toFixed(3)}
                </div>
              </div>
              <button type="button" onClick={() => onRemove(a.id)} style={removeButtonStyle}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <FuelTabs selected={fuelType} onChange={setFuelType} useLongFuelNames={useLongFuelNames} />
          </div>
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
              Radius
            </div>
            <select
              className="search-input"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} miles
                </option>
              ))}
            </select>
          </label>

          {error && <div style={{ fontSize: "0.85rem", color: "#ef4444", marginBottom: 12 }}>{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={create}
              disabled={creating}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: creating ? "default" : "pointer",
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Please wait…" : "Use my current location"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 16px",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="card"
          style={{
            width: "100%",
            textAlign: "center",
            fontWeight: 600,
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          Notify me of drops near me
        </button>
      )}
    </div>
  );
}
