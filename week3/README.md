# Triply — Week 3: Rule-Driven Packing List

> Week 3 of a four-week capstone project: an offline-first trip planner that stores everything in the
> browser and generates a packing list from trip data. This snapshot adds the project's core
> differentiator: a packing list produced by a rule engine.

## What is running in this build

- Everything from weeks 1–2 (trips, itinerary, conflict detection, 46 tests)
- **Quantity expression engine**: `min(days, 7)`, `ceil(days / 3)`, `travelers * 2`, parsed by a
  hand-written tokenizer + recursive-descent parser and evaluated as an AST. No `eval`.
- **Rule engine**: matches by trip length, party size, activity tags and temperature range, then
  materialises suggestions. 12 built-in rules covering documents, toiletries, electronics, clothes,
  cold / hot weather, rain, hiking, beach, long trips, medicine and overseas travel.
- **Derived list design**: rules produce suggestions; user choices (quantity, packed, removed) are
  stored as overrides keyed by `${ruleId}:${itemName}`. The list is recomputed from rules + overrides
  + manual items, so there is no "regenerate" button and no merge bug.
- Packing screen: grouped by category, progress bar, remaining-required counter, per-item checkbox,
  quantity stepper, delete, manual items, copy-as-text
- Settings screen: enable/disable each rule with a switch, reset sample data
- 47 new tests: 28 for the expression engine, 19 for the rule engine (93 total)

## What is deliberately missing (arrives in week 4)

| Week | Adds |
| --- | --- |
| Week 4 | PWA and offline caching, JSON backup/restore, CSV export, print styles, deployment, demo assets |

## Run it

```bash
pnpm install     # or npm install
pnpm dev         # http://localhost:5173
pnpm test        # 93 unit tests
pnpm build       # type-check + production build
```

The seeded Kyoto trip (7 days, 2 travellers, 3–10 °C, tags `hiking` / `rain`) triggers the cold-weather,
rain, hiking and long-trip rules at once — the packing list is populated on first open.

## Verification for this week

- `pnpm build` succeeds
- `pnpm test` — 93 tests passing (`date`, `conflict`, `qtyExpr`, `packingEngine`)
- Manual check: open the Kyoto packing list → change the trip's party size to 3 → towel and toothbrush
  quantities change; tick an item, reload the page, it stays ticked; disable the "Cold weather" rule
  in settings → suggested down jacket disappears but a manual item is untouched

## Project structure (week 3 subset)

```
src/
├─ components/
│  ├─ common/        Modal, EmptyState
│  ├─ itinerary/     DayColumn, ActivityForm
│  ├─ layout/        PageShell
│  ├─ packing/       PackingItemRow
│  └─ trip/          TripCard, TripForm
├─ core/
│  ├─ date.ts        Dates and day counts
│  ├─ conflict.ts    Overlap detection
│  ├─ qtyExpr.ts     Quantity expressions (tokenizer + parser + eval)
│  └─ packingEngine.ts  Rule matching, de-duplication, overrides
├─ db/               dexie.ts, seed.ts (12 rules + samples), actions.ts
├─ pages/            TripList, TripDetail, Itinerary, Packing, Settings
├─ store/ui.ts
├─ types/index.ts    Trip, Activity, PackingState, PackingRule
└─ utils/format.ts
```

## Design notes

- De-duplication: two rules producing the same item in the same category collapse to one entry whose
  quantity is the **maximum**, not the sum, so you never pack "12 pairs of socks".
- Removing a suggested item records a tombstone (`removed: true`) rather than deleting the override,
  so re-enabling the rule restores the user's edit.
- Invalid expressions are caught at save time with a character offset; at runtime a bad expression
  falls back to quantity 1 instead of throwing inside render.
- Temperature comes from `Trip.expectedTemp`; when it is missing the engine estimates a range from the
  departure month so rules still work.

## Next week

Week 4 turns this into a deliverable: PWA install and offline caching, JSON backup/restore, CSV
export, print stylesheet, GitHub Pages deployment, and demo material.
