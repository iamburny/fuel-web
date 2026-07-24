"use client";

import dynamic from "next/dynamic";
import type { HeatmapCell } from "@/lib/types";

/** react-leaflet touches `window` at import, so the real map loads SSR-disabled (see StationMap). */
const HeatmapMapInner = dynamic(() => import("./HeatmapMapInner"), {
  ssr: false,
  loading: () => <div className="map-container" />,
});

export interface HeatmapMapProps {
  cells: HeatmapCell[];
  maxAbs: number;
  useLongFuelNames?: boolean;
  fuelType: string;
}

export default function HeatmapMap(props: HeatmapMapProps) {
  return <HeatmapMapInner {...props} />;
}
