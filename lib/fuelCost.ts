const LITRES_PER_UK_GALLON = 4.546;
const EARTH_RADIUS_MILES = 3958.8;

/** Haversine distance in miles between two lat/lng points. */
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimated one-way fuel cost (£) to drive `distanceMiles` at `mpg`, using `pricePence`
 * (pence per litre) as the cost basis. Mirrors the Android app's FuelCostCalculator.kt exactly,
 * including the UK-gallon constant, so both platforms report the same estimate for the same inputs.
 */
export function estimateDriveCostPounds(distanceMiles: number, mpg: number, pricePence: number): number {
  const costPerMilePounds = ((pricePence / 100) * LITRES_PER_UK_GALLON) / mpg;
  return costPerMilePounds * distanceMiles;
}
