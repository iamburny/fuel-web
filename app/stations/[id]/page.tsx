"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Station, PriceHistoryPoint, Amenities, OpeningHours, DayHours } from "@/lib/types";
import { FUEL_LABELS, FUEL_COLORS } from "@/lib/types";
import FuelTabs from "@/components/FuelTabs";
import StationMap from "@/components/StationMap";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [station, setStation] = useState<Station | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [fuelType, setFuelType] = useState("E10");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStation(id).then((s) => {
      setStation(s);
      // Default to first available fuel type
      if (s.prices.length > 0 && !s.prices.find((p) => p.fuel_type === fuelType)) {
        setFuelType(s.prices[0].fuel_type);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!station) return;
    api.priceHistory(id, fuelType, 30).then((res) => setHistory(res.history)).catch(() => setHistory([]));
  }, [id, fuelType, station]);

  if (loading) return <div className="container"><div className="spinner" /></div>;
  if (!station) return <div className="container"><p>Station not found.</p></div>;

  return (
    <div className="container">
      {/* Back */}
      <div style={{ padding: "16px 0" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Header */}
      <div className="page-header" style={{ paddingTop: 0 }}>
        <h1>{station.name}</h1>
        {station.brand && <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{station.brand}</p>}

        {/* Status badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {station.temporary_closure && (
            <span style={{ background: "#ef4444", color: "#fff", padding: "2px 10px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 600 }}>
              Temporarily Closed
            </span>
          )}
          {station.is_motorway && (
            <span style={{ background: "#3b82f6", color: "#fff", padding: "2px 10px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 600 }}>
              Motorway Services
            </span>
          )}
          {station.is_supermarket && (
            <span style={{ background: "#22c55e", color: "#fff", padding: "2px 10px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 600 }}>
              Supermarket
            </span>
          )}
        </div>

        {/* Full address */}
        <p style={{ lineHeight: 1.5 }}>
          {[station.address_line1, station.address_line2, station.town, station.county, station.postcode]
            .filter(Boolean)
            .join(", ")}
        </p>

        {/* Phone */}
        {station.phone && (
          <p style={{ marginTop: 4 }}>
            <a href={`tel:${station.phone}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
              {station.phone}
            </a>
          </p>
        )}

        {station.distance_miles != null && (
          <p style={{ marginTop: 4 }}>{station.distance_miles.toFixed(1)} miles away</p>
        )}
      </div>

      {/* Mini map */}
      <StationMap
        stations={[station]}
        fuelType={fuelType}
        center={[station.latitude, station.longitude]}
        zoom={15}
      />

      {/* Fuel tabs */}
      <FuelTabs selected={fuelType} onChange={(t) => setFuelType(t)} />

      {/* Current prices — all presented unmodified per Fair Use Policy */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 16 }}>Current Prices</h2>
      <div className="stats-row">
        {station.prices
          .sort((a, b) => a.price_pence - b.price_pence)
          .map((p) => (
            <div className="stat-card" key={p.fuel_type} style={{
              borderColor: p.fuel_type === fuelType ? FUEL_COLORS[p.fuel_type] || "var(--accent)" : "var(--border)",
            }}>
              <div className="label">{FUEL_LABELS[p.fuel_type] || p.fuel_type}</div>
              <div className="value" style={{ color: FUEL_COLORS[p.fuel_type] || "var(--accent)" }}>
                {p.price_pence.toFixed(1)}<span style={{ fontSize: "0.6em", color: "var(--text-muted)" }}>p</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                {new Date(p.reported_at).toLocaleString("en-GB")}
              </div>
            </div>
          ))}
      </div>

      {station.prices.length === 0 && (
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>No prices currently available.</p>
      )}

      {/* Amenities */}
      <AmenitiesSection amenities={station.amenities} />

      {/* Opening hours */}
      <OpeningHoursSection hours={station.opening_hours} />

      {/* Price history chart (simple ASCII-like bar chart via CSS) */}
      {history.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "32px 0 16px" }}>
            Price History — {FUEL_LABELS[fuelType] || fuelType} (30 days)
          </h2>
          <PriceChart history={history} fuelType={fuelType} />
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}

function PriceChart({ history, fuelType }: { history: PriceHistoryPoint[]; fuelType: string }) {
  if (history.length === 0) return null;

  const prices = history.map((h) => h.price_pence);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const color = FUEL_COLORS[fuelType] || "var(--accent)";

  return (
    <div className="card" style={{ padding: "24px 20px" }}>
      {/* Sparkline-style bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
        {history.map((h, i) => {
          const pct = ((h.price_pence - min) / range) * 80 + 20; // 20-100% height
          return (
            <div
              key={i}
              title={`${h.price_pence.toFixed(1)}p — ${new Date(h.reported_at).toLocaleDateString("en-GB")}`}
              style={{
                flex: 1,
                height: `${pct}%`,
                background: color,
                opacity: 0.7 + (i / history.length) * 0.3,
                borderRadius: "2px 2px 0 0",
                minWidth: 3,
                transition: "height 0.3s",
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
      {/* Axis */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
        }}
      >
        <span>{new Date(history[0].reported_at).toLocaleDateString("en-GB")}</span>
        <span>
          Range: {min.toFixed(1)}p – {max.toFixed(1)}p
        </span>
        <span>{new Date(history[history.length - 1].reported_at).toLocaleDateString("en-GB")}</span>
      </div>
    </div>
  );
}

const AMENITY_LABELS: Record<string, string> = {
  adblue_pumps: "AdBlue Pumps",
  adblue_packaged: "AdBlue (Packaged)",
  lpg_pumps: "LPG",
  car_wash: "Car Wash",
  air_pump_or_screenwash: "Air / Screenwash",
  water_filling: "Water",
  twenty_four_hour_fuel: "24-Hour Fuel",
  customer_toilets: "Toilets",
};

function AmenitiesSection({ amenities }: { amenities?: Amenities | null }) {
  if (!amenities) return null;
  const available = Object.entries(AMENITY_LABELS).filter(
    ([key]) => (amenities as any)[key] === true
  );
  if (available.length === 0) return null;

  return (
    <>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "32px 0 16px" }}>Amenities</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {available.map(([key, label]) => (
          <span
            key={key}
            style={{
              background: "var(--card-bg, #1a1a2e)",
              border: "1px solid var(--border)",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: "0.85rem",
              color: "var(--text-primary)",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDay(day?: DayHours): string {
  if (!day) return "—";
  if (day.is_24_hours) return "24 hours";
  if (day.open && day.close) return `${day.open} – ${day.close}`;
  return "—";
}

function OpeningHoursSection({ hours }: { hours?: OpeningHours | null }) {
  if (!hours?.usual_days) return null;
  const days = hours.usual_days;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();

  return (
    <>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "32px 0 16px" }}>Opening Hours</h2>
      <div className="card" style={{ padding: "16px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <tbody>
            {DAY_NAMES.map((name, i) => {
              const isToday = name === today;
              return (
                <tr key={name} style={{ fontWeight: isToday ? 700 : 400 }}>
                  <td style={{ padding: "4px 0", color: isToday ? "var(--accent)" : "var(--text-primary)" }}>
                    {DAY_LABELS[i]}{isToday ? " (today)" : ""}
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {formatDay((days as any)[name])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hours.bank_holidays && hours.bank_holidays.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <strong>Bank holidays:</strong>{" "}
            {hours.bank_holidays.map((bh, i) => (
              <span key={i}>
                {bh.is_24_hours ? "24 hours" : `${bh.open_time} – ${bh.close_time}`}
                {bh.type ? ` (${bh.type})` : ""}
                {i < hours.bank_holidays!.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
