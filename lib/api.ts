import type {
  StationListResponse,
  CheapestResponse,
  AveragesResponse,
  TrendsResponse,
  PriceHistoryResponse,
  Station,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:8000";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), { next: { revalidate: 300 } }); // 5 min ISR
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  nearbyStations: (lat: number, lng: number, radius = 10, fuelType?: string, limit = 20) =>
    get<StationListResponse>("/api/stations/nearby", {
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      fuel_type: fuelType || "",
      limit: String(limit),
    }),

  searchStations: (q: string) =>
    get<StationListResponse>("/api/stations/search/", { q }),

  getStation: (id: number) =>
    get<Station>(`/api/stations/${id}`),

  cheapest: (fuelType = "E10", lat?: number, lng?: number, radius = 10, limit = 10) =>
    get<CheapestResponse>("/api/prices/cheapest", {
      fuel_type: fuelType,
      lat: lat != null ? String(lat) : "",
      lng: lng != null ? String(lng) : "",
      radius: String(radius),
      limit: String(limit),
    }),

  averages: () =>
    get<AveragesResponse>("/api/prices/averages"),

  trends: (fuelType = "E10", days = 30) =>
    get<TrendsResponse>("/api/prices/trends", {
      fuel_type: fuelType,
      days: String(days),
    }),

  priceHistory: (stationId: number, fuelType = "E10", days: number | "all" = 30) =>
    get<PriceHistoryResponse>(`/api/prices/history/${stationId}`, {
      fuel_type: fuelType,
      days: String(days),
    }),
};
