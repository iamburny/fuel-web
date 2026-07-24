import type {
  StationListResponse,
  CheapestResponse,
  AveragesResponse,
  TrendsResponse,
  PriceHistoryResponse,
  HeatmapResponse,
  Station,
  Favourite,
} from "./types";
import { getToken } from "./authToken";

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

  heatmap: (fuelType = "E10") =>
    get<HeatmapResponse>("/api/prices/heatmap", { fuel_type: fuelType }),
};

/** Error carrying the HTTP status, so callers can distinguish 401 (re-auth) from other failures. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Authenticated requests: always attach the bearer token (when present) and never cache — these
// are per-user and must not be served from the ISR cache the public `get()` uses.
async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(new URL(path, BASE).toString(), {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role?: string;
}

export const authApi = {
  /** Exchange a Google ID token for the app JWT. */
  googleLogin: (idToken: string) =>
    authedFetch<TokenResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),

  /** Create an email/password account. Throws ApiError(409) if the email is taken. */
  register: (email: string, password: string) =>
    authedFetch<{ id: number; email: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /** Log in with email/password. Throws ApiError(401) on bad credentials. The backend accepts
   *  `email` (it also reads `username` for the app's form-encoded call). */
  login: (email: string, password: string) =>
    authedFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /** Start a password reset — always resolves 200 regardless of whether the email is registered. */
  requestPasswordReset: (email: string) =>
    authedFetch<{ ok: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /** Complete a password reset with the emailed token. Throws ApiError(400) if invalid/expired. */
  confirmPasswordReset: (token: string, password: string) =>
    authedFetch<{ ok: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};

export const favouritesApi = {
  list: () => authedFetch<Favourite[]>("/api/favourites/"),
  add: (stationId: number, fuelType = "E10") =>
    authedFetch<Favourite>("/api/favourites/", {
      method: "POST",
      body: JSON.stringify({ station_id: stationId, fuel_type: fuelType }),
    }),
  remove: (id: number) => authedFetch<void>(`/api/favourites/${id}`, { method: "DELETE" }),
};
