# DeviceIntel

**FDA Medical Device Intelligence** — search millions of medical-device
adverse-event reports live from the [openFDA API](https://open.fda.gov/apis/device/event/),
visualize safety signals across manufacturers and products, browse the full
IMDRF/FDA adverse-event code taxonomy, and export analysis-ready spreadsheets —
all in the browser, no installation required.

> ⚠️ For research and educational purposes only. **Not for clinical
> decision-making.**

## Stack

| Layer     | Tech                                                             |
| --------- | --------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19**           |
| Language  | **TypeScript**                                                  |
| Styling   | **Tailwind CSS v4** (CSS-first theme, light/dark, no JS runtime)|
| Charts    | **Recharts**                                                    |
| Icons     | **lucide-react**                                                |
| Export    | **ExcelJS** (multi-sheet `.xlsx` generated server-side)         |
| Data      | openFDA `device/event` API + FDA IMDRF annex code workbook      |

No database is required — the app queries FDA's live data directly and computes
all analytics on demand.

## Features

- **Flexible search** — product code, brand, device (generic) name,
  manufacturer, date range, and event type, with comma-separated multi-value
  filters and quick-start presets.
- **Live KPIs** — reports, devices, patients, deaths, injuries, malfunctions.
- **Analytics dashboard** across five tabs:
  - _Overview_ — event-type donut, monthly timeline, brand × event-type stacked bars.
  - _Devices & Makers_ — top manufacturers, brands, product codes, device types.
  - _Problems & Outcomes_ — device problems, patient problems, outcomes, report sources.
  - _Demographics_ — age/weight (median & range), sex, ethnicity, race, reporter occupation, manufacturer country.
  - _Reports_ — browsable table of individual reports.
- **IMDRF / FDA Code Explorer** (`/codes`) — pulls the FDA adverse-event annex
  terminology (Annex A/C/D/G, plus B/E/F) live from FDA, with search across
  IMDRF code / FDA code / term / definition and one-click Excel export.
- **One-click Excel export** — formatted workbooks for both report analytics and
  the code tables.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Optionally add an openFDA API key (see `.env.example`) to raise rate limits and
double batch size. Users can also paste a key in the UI's advanced filters.

## Production

```bash
npm run build
npm start
```

Deploys to Vercel with zero configuration (`app/api/*` run as Node.js
functions, `maxDuration = 300` for large extractions).

## Architecture

```
app/
  page.tsx              # client dashboard orchestration
  codes/page.tsx        # IMDRF / FDA code explorer
  api/search/route.ts   # openFDA proxy -> analytics
  api/export/route.ts   # ExcelJS report workbook
  api/imdrf/route.ts    # FDA annex code loader (JSON)
  api/imdrf/export      # ExcelJS annex workbook
lib/
  fda.ts                # query builder + paginated fetch
  fda-codes.ts          # code -> label maps
  analytics.ts          # aggregation (tallies, demographics, chart data)
  imdrf.ts              # FDA IMDRF annex workbook loader
components/
  search-form.tsx  dashboard.tsx  charts.tsx  tables.tsx  ui.tsx
```
