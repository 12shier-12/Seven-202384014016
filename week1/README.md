# Triply — Week 1: Foundation and Trip Management

> Week 1 of a four-week capstone project: an offline-first trip planner that stores everything in the
> browser and generates a packing list from trip data. This snapshot covers the foundation and the
> trip-management layer only.

## What is running in this build

- Vite + React 18 + TypeScript + Tailwind CSS project setup
- Hash-based routing (`/` and `/trip/:id`), mobile-first shell with a header and a bottom nav
- Data layer: Dexie (IndexedDB) with a versioned schema for `trips` and `meta`
- Sample data on first launch: three trips (Kyoto, Chengdu, Hangzhou), idempotent seeding
- Trip CRUD with a modal form: name, destination, dates, party size, budget, expected temperature,
  cover emoji, notes
- Trip list as cards, sorted by departure date, with automatic upcoming / ongoing / past labels and
  a filter bar
- Trip detail page: gradient hero, date range, day count, party size, budget, notes, edit and delete
- Pure date utilities (`src/core/date.ts`) with 36 unit tests

## What is deliberately missing (arrives in later weeks)

| Week | Adds |
| --- | --- |
| Week 2 | Day-by-day itinerary, activity CRUD, reordering, time-conflict detection |
| Week 3 | Quantity expressions, packing rule engine, packing list, settings |
| Week 4 | PWA and offline caching, CSV export, print styles, deployment, demo assets |

## Run it

```bash
pnpm install     # or npm install
pnpm dev         # http://localhost:5173
pnpm test        # 36 unit tests
pnpm build       # type-check + production build
```

No backend and no network calls: every write goes to IndexedDB in this browser profile.

## Verification for this week

- `pnpm build` succeeds (`tsc --noEmit` + Vite production build)
- `pnpm test` — 36 tests passing (`tests/date.test.ts`)
- Manual check: create a trip, refresh, the trip is still there; delete it; reload sample data from
  the empty state

## Project structure (week 1 subset)

```
src/
├─ components/
│  ├─ common/        Modal, EmptyState
│  ├─ layout/        PageShell
│  └─ trip/          TripCard, TripForm
├─ core/date.ts      Date parsing, day counts, status, time helpers
├─ db/               dexie.ts (schema), seed.ts (sample trips), actions.ts (CRUD)
├─ pages/            TripList, TripDetail
├─ store/ui.ts       Zustand: list filter
├─ types/index.ts    Trip model
├─ utils/format.ts   Money, date range, status labels
└─ App.tsx, main.tsx, index.css
```

## Design notes

- Dates are stored as `YYYY-MM-DD` and all arithmetic goes through `Date.UTC`, so local time zones
  and daylight saving cannot shift a trip by a day.
- Day counts are inclusive: 13 March to 19 March is 7 days.
- Sorting uses the Dexie `startDate` index, not an in-memory sort.
- Each weekly build uses its own IndexedDB database (`triply-w1` … `triply-w4`), so you can open
  several snapshots in one browser without schema clashes.

## Next week

Week 2 adds the itinerary: activities per day, reordering, a "move to Day N" action, and an
overlap detector that highlights conflicting activities.
