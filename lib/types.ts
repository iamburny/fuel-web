export interface DayHours {
  open?: string;
  close?: string;
  is_24_hours?: boolean;
}

export interface BankHoliday {
  type?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
}

export interface OpeningHours {
  usual_days?: {
    monday?: DayHours;
    tuesday?: DayHours;
    wednesday?: DayHours;
    thursday?: DayHours;
    friday?: DayHours;
    saturday?: DayHours;
    sunday?: DayHours;
  };
  bank_holidays?: BankHoliday[];
}

export interface Amenities {
  adblue_pumps?: boolean;
  adblue_packaged?: boolean;
  lpg_pumps?: boolean;
  car_wash?: boolean;
  air_pump_or_screenwash?: boolean;
  water_filling?: boolean;
  twenty_four_hour_fuel?: boolean;
  customer_toilets?: boolean;
}

export interface Station {
  id: number;
  gov_id: string;
  name: string;
  brand?: string;
  operator?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  town?: string;
  county?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  temporary_closure?: boolean;
  is_motorway?: boolean;
  is_supermarket?: boolean;
  amenities?: Amenities | null;
  opening_hours?: OpeningHours | null;
  distance_miles?: number;
  prices: FuelPrice[];
}

export interface FuelPrice {
  fuel_type: string;
  price_pence: number;
  reported_at: string;
}

export interface StationListResponse {
  count: number;
  stations: Station[];
}

export interface CheapestEntry {
  station: Station;
  price_pence: number;
  distance_miles?: number;
}

export interface CheapestResponse {
  results: CheapestEntry[];
  discrepancy_report_url: string;
  data_notice: string;
}

export interface NationalAverage {
  fuel_type: string;
  avg_price_pence: number;
  min_price_pence: number;
  max_price_pence: number;
  station_count: number;
  as_of: string;
}

export interface AveragesResponse {
  averages: NationalAverage[];
  discrepancy_report_url: string;
  data_notice: string;
}

export interface TrendPoint {
  date: string;
  avg_price_pence: number;
  min_price_pence: number;
  max_price_pence: number;
  observations: number;
}

export interface TrendsResponse {
  trend: TrendPoint[];
  discrepancy_report_url: string;
  data_notice: string;
}

export interface PriceHistoryPoint {
  price_pence: number;
  reported_at: string;
}

export interface PriceHistoryResponse {
  station_id: number;
  station_name: string;
  fuel_type: string;
  history: PriceHistoryPoint[];
}

/**
 * Fuel type identifiers come from the Gov Fuel Finder API and are passed
 * through by the backend unchanged. Treat as a fixed enum.
 */
/**
 * Fuel type identifiers as returned by the Gov Fuel Finder API (all uppercase).
 */
export type FuelType =
  | "E10"
  | "E5"
  | "B7_STANDARD"
  | "B7_PREMIUM"
  | "B10"
  | "HVO";

export const FUEL_TYPES: FuelType[] = [
  "E10",
  "E5",
  "B7_STANDARD",
  "B7_PREMIUM",
  "B10",
  "HVO",
];

/** Long-form labels — use for detail pages and headings. */
export const FUEL_LABELS: Record<string, string> = {
  E10: "Unleaded (E10)",
  E5: "Super Unleaded (E5)",
  B7_STANDARD: "Diesel (B7)",
  B7_PREMIUM: "Premium Diesel (B7)",
  B10: "Biodiesel (B10)",
  HVO: "HVO Diesel",
};

/** Compact labels — use for tab buttons and tight UI. */
export const FUEL_SHORT_LABELS: Record<string, string> = {
  E10: "E10",
  E5: "E5",
  B7_STANDARD: "Diesel",
  B7_PREMIUM: "Super Diesel",
  B10: "B10",
  HVO: "HVO",
};

/**
 * Loosely follows real UK fuel pump nozzle colour conventions (green = unleaded, black = diesel)
 * — kept identical to the Android app's FuelTypes.COLORS so both platforms brand fuel types the
 * same way.
 */
export const FUEL_COLORS: Record<string, string> = {
  E10: "#22c55e", // green — unleaded
  E5: "#3b82f6", // blue — super unleaded
  B7_STANDARD: "#111827", // near-black — diesel
  B7_PREMIUM: "#4b5563", // dark grey — premium/super diesel
  B10: "#a855f7", // purple — biodiesel
  HVO: "#14b8a6", // teal — HVO
};

/**
 * Foreground-safe variant of FUEL_COLORS, for use as text/border/line colour directly on this
 * site's dark background. FUEL_COLORS' diesel values are intentionally near-black/dark-grey to
 * match real pump nozzle colours when used as a *solid fill* with white text on top (the active
 * fuel tab, map price-chip pins) — but that same near-black is illegible as foreground text on a
 * background that's already dark. Only the two diesel entries differ from FUEL_COLORS; the other
 * four are already light enough to read as text.
 */
export const FUEL_TEXT_COLORS: Record<string, string> = {
  ...FUEL_COLORS,
  B7_STANDARD: "#9ca3af", // light grey — legible where FUEL_COLORS' near-black would vanish
  B7_PREMIUM: "#d1d5db", // lighter grey — kept visually distinct from B7_STANDARD's tint
};

/** Fuel type label respecting the long/short-name preference (mirrors Android's fuelLabel()). */
export function fuelLabel(type: string, useLong: boolean): string {
  return useLong ? FUEL_LABELS[type] ?? type : FUEL_SHORT_LABELS[type] ?? type;
}
