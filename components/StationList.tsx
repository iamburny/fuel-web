import Link from "next/link";
import type { Station } from "@/lib/types";

export default function StationList({
  stations,
  fuelType,
}: {
  stations: Station[];
  fuelType: string;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {stations.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          No stations found.
        </div>
      )}
      {stations.map((s) => {
        const price = s.prices
          .filter((p) => p.fuel_type === fuelType)
          .sort((a, b) => a.price_pence - b.price_pence)[0];

        return (
          <Link href={`/stations/${s.id}`} key={s.id} className="station-row">
            <div className="station-info">
              <h3>{s.name}</h3>
              <div className="station-meta">
                {[s.brand, s.distance_miles != null ? `${s.distance_miles.toFixed(1)} mi` : null, s.postcode]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="station-price">
              {price ? (
                <span className="price-big">
                  {price.price_pence.toFixed(1)}
                  <span className="price-unit">p</span>
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
