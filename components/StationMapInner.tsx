"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "@/lib/types";
import { FUEL_SHORT_LABELS, FUEL_COLORS } from "@/lib/types";

interface Props {
  stations: Station[];
  fuelType: string;
  center?: [number, number];
  zoom?: number;
  fitBounds?: boolean;
  onStationClick?: (id: number) => void;
  onMapMove?: (lat: number, lng: number, radiusMiles: number) => void;
}

/** Build a divIcon showing the price in a small coloured tag. */
function priceIcon(pricePence: number | null, fuelType: string): L.DivIcon {
  const color = FUEL_COLORS[fuelType] || "#22c55e";
  const label = pricePence != null ? pricePence.toFixed(1) : "—";

  return L.divIcon({
    className: "",
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, sans-serif;
      padding: 2px 5px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      line-height: 1.3;
      text-align: center;
    ">${label}</div>`,
    iconSize: [42, 18],
    iconAnchor: [21, 9],
  });
}

function FitToStations({ stations, fallback, enabled }: { stations: Station[]; fallback: [number, number]; enabled: boolean }) {
  const map = useMap();
  const didInitRef = useRef(false);

  useEffect(() => {
    // On first mount when fitBounds is off (restored state), move the map
    // to the saved center since MapContainer's center prop is initial-only.
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (!enabled) {
        map.setView(fallback, map.getZoom());
        return;
      }
    }

    if (!enabled) return;
    if (stations.length === 0) {
      map.setView(fallback, map.getZoom());
      return;
    }
    const bounds = L.latLngBounds(stations.map((s) => [s.latitude, s.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [stations, map, fallback, enabled]);

  return null;
}

/** Fires onMapMove with the new center + viewport radius (miles) after drag/zoom, debounced 500ms. */
function MapMoveHandler({ onMapMove }: { onMapMove: (lat: number, lng: number, radiusMiles: number) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const map = useMapEvents({
    moveend() {
      mapRef.current = map;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const m = mapRef.current;
        if (!m || !m.getContainer()) return;
        try {
          const center = m.getCenter();
          const bounds = m.getBounds();
          const ne = bounds.getNorthEast();
          const radiusMiles = m.distance(center, ne) / 1609.344;
          onMapMove(center.lat, center.lng, Math.round(radiusMiles * 10) / 10);
        } catch {
          // Map was destroyed between moveend and the debounce firing
        }
      }, 500);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}

function StationMarker({
  station,
  fuelType,
  onStationClick,
}: {
  station: Station;
  fuelType: string;
  onStationClick?: (id: number) => void;
}) {
  const selectedPrice = station.prices
    .filter((p) => p.fuel_type === fuelType)
    .sort((a, b) => a.price_pence - b.price_pence)[0];

  const icon = useMemo(
    () => priceIcon(selectedPrice?.price_pence ?? null, fuelType),
    [selectedPrice?.price_pence, fuelType]
  );

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={icon}
    >
      <Popup autoPan={false}>
        <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 160 }}>
          <strong style={{ fontSize: 13 }}>{station.name}</strong>
          {station.brand && (
            <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{station.brand}</div>
          )}
          {/* Status tags */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {station.temporary_closure && (
              <span style={{ background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>Closed</span>
            )}
            {station.is_motorway && (
              <span style={{ background: "#3b82f6", color: "#fff", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>Motorway</span>
            )}
            {station.is_supermarket && (
              <span style={{ background: "#22c55e", color: "#fff", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>Supermarket</span>
            )}
          </div>
          {station.phone && (
            <a href={`tel:${station.phone}`} style={{ fontSize: 11, color: "#22c55e", textDecoration: "none", display: "block", marginBottom: 6 }}>
              {station.phone}
            </a>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {station.prices
                .sort((a, b) => a.fuel_type.localeCompare(b.fuel_type))
                .map((p) => (
                  <tr key={p.fuel_type} style={{
                    fontWeight: p.fuel_type === fuelType ? 700 : 400,
                  }}>
                    <td style={{ padding: "2px 8px 2px 0", color: FUEL_COLORS[p.fuel_type] || "#999" }}>
                      {FUEL_SHORT_LABELS[p.fuel_type] || p.fuel_type}
                    </td>
                    <td style={{ padding: "2px 0", textAlign: "right", fontFamily: "monospace" }}>
                      {p.price_pence.toFixed(1)}p
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {station.prices.length === 0 && (
            <div style={{ fontSize: 12, color: "#888" }}>No prices available</div>
          )}
          {onStationClick && (
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <a
                href={`/stations/${station.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onStationClick(station.id);
                }}
                style={{
                  fontSize: 12,
                  color: "#22c55e",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View station →
              </a>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function StationMapInner({
  stations,
  fuelType,
  center,
  zoom = 12,
  fitBounds = true,
  onStationClick,
  onMapMove,
}: Props) {
  const initialCenter: [number, number] = center ?? [51.5074, -0.1278];

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom
      className="map-container"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {stations.map((s) => (
        <StationMarker
          key={s.id}
          station={s}
          fuelType={fuelType}
          onStationClick={onStationClick}
        />
      ))}

      <FitToStations stations={stations} fallback={initialCenter} enabled={fitBounds} />
      {onMapMove && <MapMoveHandler onMapMove={onMapMove} />}
    </MapContainer>
  );
}
