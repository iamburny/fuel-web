# Fuel Prices UK — Next.js Frontend

A dark-themed, industrial-aesthetic web app for viewing live UK fuel prices from the Government Fuel Finder scheme.

## Pages

- **/** — Nearby stations map + list with search, fuel type toggle, nearby/cheapest mode
- **/prices** — National averages, all fuel types comparison, SVG trend chart with day range selector
- **/stations/[id]** — Station detail with mini map, all current prices, 30-day bar chart history

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Leaflet** (dark CartoDB tiles) for maps
- **Custom SVG charts** for trends (zero extra deps)
- **Geolocation API** for "near me" functionality

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Make sure the backend API is running at the URL in `.env.local`.

## Design

Dark industrial theme with:
- **Outfit** display font + **DM Mono** for prices/data
- CartoDB Dark Matter map tiles
- Green/blue/amber/red fuel type colour coding
- Glassmorphism sticky nav
- CSS-only loading spinner, no JS animation libraries

## Fair Use Policy Compliance

Every page with price data includes:
- The compliance footer with Open Government Licence attribution
- A link to the Gov discrepancy report page
- Unmodified timestamps from the source data
- No filtering or manipulation that favours any supplier
