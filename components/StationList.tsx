import Link from "next/link";
import type { Station } from "@/lib/types";
import { FUEL_TEXT_COLORS } from "@/lib/types";
import FavouriteButton from "@/components/FavouriteButton";

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
          // Relative wrapper so the favourite heart can overlay the row without nesting a <button>
          // inside the row's <Link> (invalid HTML). The Link gets extra right padding to leave room.
          <div key={s.id} style={{ position: "relative" }}>
            <Link href={`/stations/${s.id}`} className="station-row" style={{ paddingRight: 52 }}>
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
                  <span className="price-big" style={{ color: FUEL_TEXT_COLORS[fuelType] }}>
                    {price.price_pence.toFixed(1)}
                    <span className="price-unit">p</span>
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span>
                )}
              </div>
            </Link>
            <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
              <FavouriteButton stationId={s.id} fuelType={fuelType} size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
