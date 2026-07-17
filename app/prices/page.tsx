"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { NationalAverage, TrendPoint, FuelType } from "@/lib/types";
import { FUEL_TEXT_COLORS, fuelLabel } from "@/lib/types";
import { usePreferences } from "@/lib/preferences";
import FuelTabs from "@/components/FuelTabs";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function PricesPage() {
  const [prefs] = usePreferences();
  const [averages, setAverages] = useState<NationalAverage[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>(prefs.fuelType);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.averages(), api.trends(fuelType, days)])
      .then(([avgRes, trendRes]) => {
        setAverages(avgRes.averages);
        setTrend(trendRes.trend);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fuelType, days]);

  const avg = averages.find((a) => a.fuel_type === fuelType);

  return (
    <div className="container">
      <div className="page-header">
        <h1>UK Fuel Prices & Trends</h1>
        <p>National statistics from the Government Fuel Finder scheme</p>
      </div>

      <FuelTabs selected={fuelType} onChange={setFuelType} useLongFuelNames={prefs.useLongFuelNames} />

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {/* National average stats */}
          {avg && (
            <div className="stats-row">
              <StatCard label="National Average" value={`${avg.avg_price_pence.toFixed(1)}p`} color={FUEL_TEXT_COLORS[fuelType]} />
              <StatCard label="Cheapest" value={`${avg.min_price_pence.toFixed(1)}p`} color="#22c55e" />
              <StatCard label="Most Expensive" value={`${avg.max_price_pence.toFixed(1)}p`} color="#ef4444" />
              <StatCard label="Stations Reporting" value={avg.station_count.toLocaleString()} color="var(--text-primary)" />
            </div>
          )}

          {/* All fuel type averages comparison */}
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "8px 0 16px" }}>
            All Fuel Types
          </h2>
          <div className="stats-row" style={{ marginBottom: 40 }}>
            {averages
              .sort((a, b) => a.avg_price_pence - b.avg_price_pence)
              .map((a) => (
                <div className="stat-card" key={a.fuel_type} style={{
                  borderColor: a.fuel_type === fuelType ? FUEL_TEXT_COLORS[a.fuel_type] || "var(--accent)" : "var(--border)",
                  cursor: "pointer",
                }} onClick={() => setFuelType(a.fuel_type as FuelType)}>
                  <div className="label">{fuelLabel(a.fuel_type, prefs.useLongFuelNames)}</div>
                  <div className="value" style={{ color: FUEL_TEXT_COLORS[a.fuel_type] || "var(--accent)" }}>
                    {a.avg_price_pence.toFixed(1)}<span style={{ fontSize: "0.6em", color: "var(--text-muted)" }}>p</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    {a.min_price_pence.toFixed(1)}p – {a.max_price_pence.toFixed(1)}p
                  </div>
                </div>
              ))}
          </div>

          {/* Trend chart */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
              {fuelLabel(fuelType, prefs.useLongFuelNames)} — Daily Trend
            </h2>
            <div className="fuel-tabs" style={{ marginBottom: 0 }}>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  className={`fuel-tab ${days === d ? "active" : ""}`}
                  onClick={() => setDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <TrendChart trend={trend} fuelType={fuelType} />
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>{value}</div>
    </div>
  );
}

function TrendChart({ trend, fuelType }: { trend: TrendPoint[]; fuelType: string }) {
  if (trend.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        No trend data available yet. Historical data builds over time.
      </div>
    );
  }

  const prices = trend.map((t) => t.avg_price_pence);
  const min = Math.min(...prices) - 0.5;
  const max = Math.max(...prices) + 0.5;
  const range = max - min || 1;
  const color = FUEL_TEXT_COLORS[fuelType] || "var(--accent)";

  // SVG line chart
  const w = 800;
  const h = 240;
  const padX = 50;
  const padY = 20;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = trend.map((t, i) => {
    const x = padX + (i / (trend.length - 1 || 1)) * chartW;
    const y = padY + chartH - ((t.avg_price_pence - min) / range) * chartH;
    return { x, y, ...t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  // Y axis ticks
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

        {/* Dots on hover */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} opacity={0}>
            <title>
              {p.date}: {p.avg_price_pence.toFixed(1)}p avg ({p.observations} observations)
            </title>
          </circle>
        ))}

        {/* X axis labels */}
        {points
          .filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1)
          .map((p, i) => (
            <text key={i} x={p.x} y={h - 2} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)">
              {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </text>
          ))}
      </svg>

      {/* Min/Max band info */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8, fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        <span>Low: {Math.min(...prices).toFixed(1)}p</span>
        <span>High: {Math.max(...prices).toFixed(1)}p</span>
        <span>Δ {(Math.max(...prices) - Math.min(...prices)).toFixed(1)}p</span>
      </div>
    </div>
  );
}
