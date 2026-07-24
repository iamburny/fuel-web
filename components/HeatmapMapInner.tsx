"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { HeatmapCell } from "@/lib/types";
import { heatColor } from "@/lib/heatColor";
import { fuelLabel } from "@/lib/types";
import { usePreferences, useResolvedTheme } from "@/lib/preferences";
import type { HeatmapMapProps } from "./HeatmapMap";

/** Marker radius (px) scales with the cell's station count, so busy areas read as larger blobs. */
function radiusFor(count: number): number {
  return Math.max(5, Math.min(26, Math.sqrt(count) * 1.7));
}

export default function HeatmapMapInner({ cells, maxAbs, fuelType, useLongFuelNames }: HeatmapMapProps) {
  const [prefs] = usePreferences();
  const resolvedTheme = useResolvedTheme(prefs.theme);
  const tileSlug = resolvedTheme === "light" ? "light_all" : "dark_all";

  return (
    <MapContainer
      center={[54.5, -2.5]} // roughly the centre of Great Britain
      zoom={6}
      scrollWheelZoom
      className="map-container"
    >
      <TileLayer
        url={`https://{s}.basemaps.cartocdn.com/${tileSlug}/{z}/{x}/{y}{r}.png`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {cells.map((c, i) => {
        const color = heatColor(c.delta_pence, maxAbs);
        const sign = c.delta_pence > 0 ? "+" : "";
        return (
          <CircleMarker
            key={i}
            center={[c.latitude, c.longitude]}
            radius={radiusFor(c.station_count)}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 1, opacity: 0.8 }}
          >
            <Tooltip direction="top">
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
                <strong>{c.avg_price_pence.toFixed(1)}p</strong> avg {fuelLabel(fuelType, !!useLongFuelNames)}
                <br />
                {sign}
                {c.delta_pence.toFixed(1)}p vs national ({sign}
                {c.delta_percent.toFixed(1)}%)
                <br />
                {c.station_count} station{c.station_count === 1 ? "" : "s"}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
