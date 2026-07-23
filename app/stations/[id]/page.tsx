"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Station, PriceHistoryPoint, NationalAverage, Amenities, OpeningHours, DayHours } from "@/lib/types";
import { FUEL_TEXT_COLORS, fuelLabel } from "@/lib/types";
import { usePreferences } from "@/lib/preferences";
import { haversineMiles, estimateDriveCostPounds } from "@/lib/fuelCost";
import FuelTabs from "@/components/FuelTabs";
import StationMap from "@/components/StationMap";
import ComplianceFooter from "@/components/ComplianceFooter";
import FavouriteButton from "@/components/FavouriteButton";

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [prefs] = usePreferences();
  const [station, setStation] = useState<Station | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [averages, setAverages] = useState<NationalAverage[]>([]);
  const [fuelType, setFuelType] = useState<string>(prefs.fuelType);
  const [days, setDays] = useState<number | "all">(30);
  const [loading, setLoading] = useState(true);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

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
    api.averages().then((res) => setAverages(res.averages)).catch(() => setAverages([]));
  }, [id]);

  useEffect(() => {
    if (!station) return;
    api.priceHistory(id, fuelType, days).then((res) => setHistory(res.history)).catch(() => setHistory([]));
  }, [id, fuelType, days, station]);

  // /api/stations/:id never returns distance_miles (only /nearby and /cheapest do), so it's
  // computed client-side against the browser's current location instead — same fix applied on
  // the Android app's Detail screen. Only asked for when it'd actually be used (the drive-cost
  // estimate needs MPG + tank capacity), so we don't prompt for location on every station visit.
  useEffect(() => {
    if (!station || prefs.mpg == null || prefs.tankCapacityLitres == null) return;
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDistanceMiles(
          haversineMiles(pos.coords.latitude, pos.coords.longitude, station.latitude, station.longitude),
        );
      },
      () => {},
      { timeout: 5000 },
    );
  }, [station, prefs.mpg, prefs.tankCapacityLitres]);

  const preferredPrice = station?.prices.find((p) => p.fuel_type === prefs.fuelType)?.price_pence;
  const driveCostPounds =
    distanceMiles != null && prefs.mpg != null && preferredPrice != null
      ? estimateDriveCostPounds(distanceMiles, prefs.mpg, preferredPrice)
      : null;

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0 }}>{station.name}</h1>
          <FavouriteButton stationId={station.id} fuelType={fuelType} size={26} />
        </div>
        {station.brand && <p style={{ color: "var(--text-muted)", marginBottom: 4, marginTop: 4 }}>{station.brand}</p>}

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

        {distanceMiles != null && (
          <p style={{ marginTop: 4 }}>{distanceMiles.toFixed(1)} miles away</p>
        )}
        {driveCostPounds != null && (
          <p style={{ marginTop: 4, color: "var(--accent)" }}>
            Est. £{driveCostPounds.toFixed(2)} in fuel to get here
          </p>
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
      <FuelTabs selected={fuelType} onChange={(t) => setFuelType(t)} useLongFuelNames={prefs.useLongFuelNames} />

      {/* Current prices — all presented unmodified per Fair Use Policy */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 16 }}>Current Prices</h2>
      <div className="stats-row">
        {station.prices
          .sort((a, b) => a.price_pence - b.price_pence)
          .map((p) => {
            const avg = averages.find((a) => a.fuel_type === p.fuel_type)?.avg_price_pence;
            const delta = avg != null ? p.price_pence - avg : null;
            return (
              <div className="stat-card" key={p.fuel_type} style={{
                borderColor: p.fuel_type === fuelType ? FUEL_TEXT_COLORS[p.fuel_type] || "var(--accent)" : "var(--border)",
              }}>
                <div className="label">{fuelLabel(p.fuel_type, prefs.useLongFuelNames)}</div>
                <div className="value" style={{ color: FUEL_TEXT_COLORS[p.fuel_type] || "var(--accent)" }}>
                  {p.price_pence.toFixed(1)}<span style={{ fontSize: "0.6em", color: "var(--text-muted)" }}>p</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                  {new Date(p.reported_at).toLocaleString("en-GB")}
                </div>
                {delta != null && (
                  <div style={{
                    fontSize: "0.75rem", marginTop: 4, fontFamily: "var(--font-mono)", fontWeight: 600,
                    color: delta <= 0 ? "#22c55e" : "#ef4444",
                  }}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)}p vs national avg
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {station.prices.length === 0 && (
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>No prices currently available.</p>
      )}

      {/* Amenities */}
      <AmenitiesSection amenities={station.amenities} />

      {/* Opening hours */}
      <OpeningHoursSection hours={station.opening_hours} />

      {/* Price history trend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "32px 0 16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
          Price Trend — {fuelLabel(fuelType, prefs.useLongFuelNames)}
        </h2>
        <div className="fuel-tabs" style={{ marginBottom: 0 }}>
          {([7, 30, 90, "all"] as const).map((d) => (
            <button
              key={d}
              className={`fuel-tab ${days === d ? "active" : ""}`}
              onClick={() => setDays(d)}
            >
              {d === "all" ? "All" : `${d}d`}
            </button>
          ))}
        </div>
      </div>
      <PriceTrendChart history={history} fuelType={fuelType} />

      <ComplianceFooter />
    </div>
  );
}

function PriceTrendChart({ history, fuelType }: { history: PriceHistoryPoint[]; fuelType: string }) {
  if (history.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        No price history available yet. Data builds over time as prices change.
      </div>
    );
  }

  const prices = history.map((h) => h.price_pence);
  const min = Math.min(...prices) - 0.5;
  const max = Math.max(...prices) + 0.5;
  const range = max - min || 1;
  const color = FUEL_TEXT_COLORS[fuelType] || "var(--accent)";

  const w = 800;
  const h = 240;
  const padX = 50;
  const padY = 20;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = history.map((pt, i) => {
    const x = padX + (i / (history.length - 1 || 1)) * chartW;
    const y = padY + chartH - ((pt.price_pence - min) / range) * chartH;
    return { x, y, ...pt };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => min + (range * i) / (ticks - 1));

  return (
    <div className="card" style={{ padding: "20px 12px" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => {
          const y = padY + chartH - ((v - min) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padX} x2={w - padX} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={padX - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontFamily="var(--font-mono)">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={0.08} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots — always visible, not just a hover affordance: with only one point in range
            (common, since history only records actual price changes) the line path has no
            segment to draw at all, so the dot is the only thing that makes the data visible. */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color}>
            <title>
              {new Date(p.reported_at).toLocaleDateString("en-GB")}: {p.price_pence.toFixed(1)}p
            </title>
          </circle>
        ))}

        {/* X axis labels */}
        {points
          .filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1)
          .map((p, i) => (
            <text key={i} x={p.x} y={h - 2} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)">
              {new Date(p.reported_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </text>
          ))}
      </svg>

      {/* Summary */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8, fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        <span>Low: {Math.min(...prices).toFixed(1)}p</span>
        <span>High: {Math.max(...prices).toFixed(1)}p</span>
        <span>{"\u0394"} {(Math.max(...prices) - Math.min(...prices)).toFixed(1)}p</span>
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
              background: "var(--bg-elevated)",
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
