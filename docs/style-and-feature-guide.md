# Style & Feature Guide — keeping fuel-web in sync with the Android app

This document exists because the Android app (`fuel-android`) and this web app (`fuel-web`) are
two independent clients of the same backend (`fuel-api`), built at different times by different
work, and they've drifted from each other before. It's the reference for "what should the
cross-platform experience actually be" — read it before changing fuel-type colours, adding a
price-related feature, or reviewing a PR that touches either client, and update it whenever a
deliberate divergence is introduced so it doesn't silently rot back into an accidental one.

## Fuel-type colour palette

Both apps must use the **same six colours**, sourced from Android's `FuelTypes.COLORS`
(`core/src/main/java/uk/co/fuelprices/data/api/Models.kt`) and mirrored here in
`lib/types.ts`'s `FUEL_COLORS`. The palette loosely follows real UK fuel pump nozzle colour
conventions rather than being an arbitrary categorical palette:

| Fuel type | Hex | Rationale |
|---|---|---|
| `E10` | `#22c55e` | green — unleaded |
| `E5` | `#3b82f6` | blue — super unleaded |
| `B7_STANDARD` | `#111827` | near-black — diesel |
| `B7_PREMIUM` | `#4b5563` | dark grey — premium/super diesel |
| `B10` | `#a855f7` | purple — biodiesel |
| `HVO` | `#14b8a6` | teal — HVO |

**Single source of truth per platform**: on web, every colour reference must go through
`FUEL_COLORS` (`lib/types.ts`) — never hardcode a fuel-type hex value in a component or in
`globals.css`. Before this guide, `globals.css` had a second, silently-wrong copy of this
palette (`.fuel-tab[data-fuel="B7"].active` etc.) that used `data-fuel` values (`B7`, `SDV`)
that didn't match the real `FuelType` union (`B7_STANDARD`, `B7_PREMIUM`) — so it never actually
applied and diesel/premium-diesel rendered amber/red instead of near-black/grey. `FuelTabs.tsx`
now applies the active colour as an inline style computed from `FUEL_COLORS` directly, which is
both correct and impossible to let drift out of sync with a CSS selector again.

**Contrast**: active fuel-type pills always use white text (`color: #fff`), not the CSS default
black — several of these colours (near-black diesel especially) fail contrast with black text.
Android's own fuel-type pills use white text unconditionally for the same reason; match it.

## Feature parity table

| Feature | Android | Web |
|---|---|---|
| Colour-coded map pins showing price | `core/.../car/CarColors.kt` (car) + `app/.../ui/components/GoogleMap.kt` (phone) | `components/StationMapInner.tsx`'s `priceIcon()` |
| Usual fuel type (persisted) | `UserPreferencesStore` (DataStore) | `lib/preferences.ts` (`usePreferences()`, localStorage) |
| Long/short fuel names toggle | `UserPreferencesStore.useLongFuelNames` + `fuelLabel()` | `lib/preferences.ts` + `fuelLabel()` in `lib/types.ts` |
| MPG + tank capacity → drive-cost estimate | `FuelCostCalculator.estimateDriveCostPounds()`, shown on `DetailScreen` | `lib/fuelCost.ts`'s `estimateDriveCostPounds()`, shown on `app/stations/[id]/page.tsx` |
| Vs-national-average price delta | Per price row on `DetailScreen`/car `StationDetailScreen` | Per price card on `app/stations/[id]/page.tsx` |
| Preferences auto-save (no Save button) | Confirmed UX choice — an explicit Save button was removed after users found it easy to forget | `app/settings/page.tsx` saves on every change from the start, for the same reason |
| Data attribution + discrepancy link | `ComplianceFooter`-equivalent on every price screen | `components/ComplianceFooter.tsx` on every page |
| Discrepancy report URL | `https://www.fuel-finder.service.gov.uk/` (the specific `/report-discrepancy` path 404s — confirmed via curl) | Same URL, same reason — keep these in sync if the real report page is ever found |

### Distance-to-station: a shared gotcha, not just a web quirk

`GET /api/stations/:id` never returns `distance_miles` (only `/nearby` and `/cheapest` do,
since they have a query origin point to measure from). Both the Android Detail screen and the
web station page originally had dead code checking a `distance_miles` field that was always
`null`/`undefined` from this endpoint. Both now compute it client-side against the device/browser's
current location instead (`haversineMiles()` — same formula on both platforms, see
`lib/fuelCost.ts` / Android's `FuelCostCalculator.kt`), gated on the drive-cost estimate actually
needing it, so neither platform asks for location permission on every station visit unnecessarily.

### SSR + client-only storage is a real gotcha (web-only, no Android equivalent)

`lib/preferences.ts`'s `usePreferences()` must **not** read `localStorage` inside its `useState`
initializer, tempting as that is (it's what `app/page.tsx`'s pre-existing `loadMapState`/
`sessionStorage` pattern does). SSR has no `localStorage`, so the server-rendered HTML reflects
defaults while the client's first render would already reflect the saved preference — a hydration
mismatch. This isn't cosmetic: React responds to a hydration mismatch by discarding and remounting
the whole tree, which raced with the stations fetch in testing and crashed the map/list with an
unrelated-looking `Cannot read properties of undefined (reading 'filter')`. The fix is to always
start from defaults and sync the real value in a `useEffect` after mount (a one-frame flash from
default → saved value on first load, the standard trade-off for client-only storage under SSR).
Android has no equivalent failure mode since `UserPreferencesStore` has no server-rendered HTML to
mismatch against.

## Deliberate divergences — not bugs, don't "fix" these to match

- **Map viewport reloading.** Android's Nearby screen splits the GPS-anchored station *list* from
  viewport-following map *pins* (dragging the map loads new pins via `/api/stations/bounds`
  without touching the list) — a deliberate trade-off for mobile battery/data usage, with an
  explicit recenter-to-GPS button since panning no longer auto-recenters. Web's `app/page.tsx` +
  `components/StationMapInner.tsx`'s `MapMoveHandler` instead re-queries `/api/stations/nearby` at
  the dragged point for *both* the pins and the list together. This is fine and arguably better on
  desktop, where there's no battery/data-usage pressure motivating the split — don't port
  Android's list/pin split to web.
- **Android Auto / Automotive OS.** The car-native Preferences screen, the host-rendered
  (non-interactive) map, and the complete absence of the discrepancy web link in the car (Android
  Automotive OS blocks car apps from opening browsers) are Android-only concerns with no web
  equivalent. Don't try to map these onto the browser.
- **Release build / signing / R8 keep rules.** Android-packaging concerns, not applicable to a
  server-rendered Next.js app.

## Where things live (web)

- `lib/types.ts` — `FUEL_COLORS`, `FUEL_LABELS`/`FUEL_SHORT_LABELS`, `fuelLabel()`.
- `lib/preferences.ts` — `usePreferences()` hook, localStorage-backed.
- `lib/fuelCost.ts` — `haversineMiles()`, `estimateDriveCostPounds()`.
- `app/settings/page.tsx` — the preferences UI.
- `components/FuelTabs.tsx` — takes an optional `useLongFuelNames` prop; every page that renders
  fuel-type tabs or labels should read it from `usePreferences()` and pass it through, rather than
  hardcoding short or long labels.
