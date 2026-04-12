"use client";

import dynamic from "next/dynamic";
import type { Station } from "@/lib/types";

/**
 * react-leaflet touches `window` at import time, so the real map component
 * is loaded with SSR disabled. This wrapper exists solely to bridge that.
 */
const StationMapInner = dynamic(() => import("./StationMapInner"), {
  ssr: false,
  loading: () => <div className="map-container" />,
});

interface Props {
  stations: Station[];
  fuelType: string;
  center?: [number, number];
  zoom?: number;
  fitBounds?: boolean;
  onStationClick?: (id: number) => void;
  onMapMove?: (lat: number, lng: number, radiusMiles: number) => void;
}

export default function StationMap(props: Props) {
  return <StationMapInner {...props} />;
}
