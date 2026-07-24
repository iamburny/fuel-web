"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { HeatmapCell, FuelType } from "@/lib/types";
import { fuelLabel } from "@/lib/types";
import { heatColor } from "@/lib/heatColor";
import { usePreferences } from "@/lib/preferences";
import FuelTabs from "@/components/FuelTabs";
import HeatmapMap from "@/components/HeatmapMap";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function HeatmapPage() {
  const [prefs] = usePreferences();
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [nationalAvg, setNationalAvg] = useState<number | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>(prefs.fuelType);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .heatmap(fuelType)
      .then((res) => {
        setCells(res.cells);
        setNationalAvg(res.national_avg_price_pence);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fuelType]);

  // Saturate the colour scale at the 90th-percentile deviation so a couple of extreme cells don't
  // wash everything else out to the same shade. Floored at 3p so a flat market still shows contrast.
  const maxAbs = useMemo(() => {
    if (cells.length === 0) return 3;
    const sorted = cells.map((c) => Math.abs(c.delta_pence)).sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
    return Math.max(3, Math.round(p90 * 10) / 10);
  }, [cells]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>UK Price Heat Map</h1>
        <p>How local pump prices compare to the national average, by area</p>
      </div>

      <FuelTabs selected={fuelType} onChange={setFuelType} useLongFuelNames={prefs.useLongFuelNames} />

      {nationalAvg != null && (
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
          National average for {fuelLabel(fuelType, prefs.useLongFuelNames)}:{" "}
          <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {nationalAvg.toFixed(1)}p
          </strong>
        </p>
      )}

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <HeatmapMap
            cells={cells}
            maxAbs={maxAbs}
            fuelType={fuelType}
            useLongFuelNames={prefs.useLongFuelNames}
          />
          <Legend maxAbs={maxAbs} />
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}

/** Diverging colour key: cheaper (green) ← national average (amber) → pricier (red). */
function Legend({ maxAbs }: { maxAbs: number }) {
  const stops = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs];
  return (
    <div
      className="card"
      style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}
    >
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Price vs national average</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", maxWidth: 360 }}>
        {stops.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 14,
              background: heatColor(s, maxAbs),
              borderTopLeftRadius: i === 0 ? 4 : 0,
              borderBottomLeftRadius: i === 0 ? 4 : 0,
              borderTopRightRadius: i === stops.length - 1 ? 4 : 0,
              borderBottomRightRadius: i === stops.length - 1 ? 4 : 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 360,
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>−{maxAbs.toFixed(1)}p</span>
        <span>average</span>
        <span>+{maxAbs.toFixed(1)}p</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
        Larger circles = more stations reporting in that area
      </div>
    </div>
  );
}
