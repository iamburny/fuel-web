"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useFavourites } from "@/lib/favourites";
import { usePreferences } from "@/lib/preferences";
import { fuelLabel } from "@/lib/types";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function FavouritesPage() {
  const { isLoggedIn } = useAuth();
  const { favourites, remove, reload } = useFavourites();
  const [prefs] = usePreferences();

  // Refresh from the server on entry so we get the joined station summaries (the add() response
  // omits them).
  useEffect(() => {
    if (isLoggedIn) reload();
  }, [isLoggedIn, reload]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Favourites</h1>
        <p>Your saved stations</p>
      </div>

      {!isLoggedIn ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>Sign in to save stations and get price-drop alerts.</p>
          <div style={{ display: "inline-flex" }}>
            <GoogleSignInButton />
          </div>
        </div>
      ) : favourites.length === 0 ? (
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
              <button
                type="button"
                onClick={() => remove(f.id)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <ComplianceFooter />
    </div>
  );
}
