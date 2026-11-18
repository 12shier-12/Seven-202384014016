# Triply — Week 2: Day-by-Day Itinerary

> Week 2 of a four-week capstone project: an offline-first trip planner that stores everything in the
> browser and generates a packing list from trip data. This snapshot adds the itinerary layer on top
> of week 1's trip management.

## What is running in this build

- Everything from week 1 (trip CRUD, list, detail, sample data, 36 date tests)
- Activities stored per trip and per day, with a compound index `[tripId+dayIndex]`
- Itinerary screen: one column per day (Day 1 … Day N), each with its own activity list and daily
  subtotal (activity count + budget)
- Activity form: title, day, start time, duration, location, type, tags, budget, notes
- Reordering: move up / move down within a day, and "move to Day N" to move across days
- Time-conflict detection: overlapping activities are highlighted and name the activity they clash with
- Trip overview now shows activity count, activity-budget total, budget progress, and conflict count
- 10 new unit tests for the overlap detector (46 in total)

## What is deliberately missing (arrives in later weeks)

| Week | Adds |
| --- | --- |
| Week 3 | Quantity expressions, packing rule engine, packing list, settings, rule toggles |
| Week 4 | PWA and offline caching, CSV export, print styles, deployment, demo assets |

## Run it

```bash
pnpm install     # or npm install
pnpm dev         # http://localhost:5173
pnpm test        # 46 unit tests
pnpm build       # type-check + production build
```

Sample data includes a deliberate overlap on Day 2 of the Kyoto trip (Fushimi Inari 08:30 and the
mountain hike 10:30), so the conflict marker is visible immediately.

## Verification for this week

- `pnpm build` succeeds
- `pnpm test` — 46 tests passing (`tests/date.test.ts`, `tests/conflict.test.ts`)
- Manual check: open the Kyoto trip → itinerary; the two Day 2 activities are marked amber and each
  names the other; move an activity to another day; the daily subtotals update

## Project structure (week 2 subset)

```
src/
├─ components/
│  ├─ common/        Modal, EmptyState
│  ├─ itinerary/     DayColumn, ActivityForm
│  ├─ layout/        PageShell
│  └─ trip/          TripCard, TripForm
├─ core/             date.ts, conflict.ts
├─ db/               dexie.ts, seed.ts, actions.ts
├─ pages/            TripList, TripDetail, Itinerary
├─ store/ui.ts
├─ types/index.ts    Trip, Activity, ConflictPair
└─ utils/format.ts
```

## Design notes

- Conflict detection converts `HH:mm` to minutes, treats an activity as `[start, start + duration)`
  with a 60-minute default, then sweeps an active list sorted by start time. Touching ranges
  (11:00 → 11:00) are not conflicts; nested chains are still detected.
- The detector returns conflicting *pairs*, not a boolean, so the UI can say which activity clashes.
- Ordering is stored as an integer per day; moving up/down swaps two values inside a transaction, so
  a reorder never leaves duplicate positions.

## Next week

Week 3 adds the packing list: a restricted expression engine for quantities, a rule engine matching
on trip length, party size, tags and temperature, and a derived list the user can tick off.
