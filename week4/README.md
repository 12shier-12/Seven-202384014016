# Triply — Week 4: Final Delivery

> Week 4 of a four-week capstone project: an offline-first trip planner that stores everything in the
> browser and generates a packing list from trip data. This is the final build: it can be installed
> as an app, works with no network, exports data, and is ready to deploy.

## What this week adds

| Area | Delivered |
| --- | --- |
| PWA | `vite-plugin-pwa` with an auto-updating service worker, installable manifest, 192/512/maskable icons, precached app shell |
| CSV | Packing list exports as CSV with a UTF-8 BOM so Excel opens Chinese correctly |
| JSON backup | Full export / import with `schemaVersion`, validation and a confirmation before overwriting |
| Print | Print stylesheet plus a "Print" button for a paper checklist |
| Deployment | GitHub Actions workflow that tests, builds and publishes to GitHub Pages |
| Presentation | `DEMO.md` — a two-minute demo script, and the full project documentation in `docs/PROJECT.md` |

Everything from weeks 1–3 is included: trip management, day-by-day itinerary with conflict detection,
quantity expressions, the 12-rule packing engine, and the settings screen.

## Run it

```bash
pnpm install      # or npm install
pnpm dev          # http://localhost:5173
pnpm test         # 100 tests
pnpm build        # production build + service worker
pnpm preview      # serve the production build locally
```

To verify the PWA locally, run `pnpm build && pnpm preview`, open the preview URL, and check
DevTools → Application → Manifest / Service Workers. The service worker is only registered in the
production build.

## Verification for this week

- `tsc --noEmit` clean
- `pnpm test` — 100 tests across 6 files (date 36, conflict 10, qtyExpr 28, packingEngine 19, csv 4,
  jsdom smoke 3)
- `pnpm build` — succeeds and emits `manifest.webmanifest`, `sw.js` and the Workbox runtime;
  precache: 13 entries
- Manual checklist: install the app, go offline, tick an item and reload — state persists; export CSV
  and open it in Excel; export JSON, reset data, import the file back; print the packing list

## Weekly snapshots

| Folder | Content | Tests |
| --- | --- | --- |
| [`../week1`](../week1) | Foundation + trip management | 36 |
| [`../week2`](../week2) | Itinerary + conflict detection | 46 |
| [`../week3`](../week3) | Packing rule engine + settings | 93 |
| `week4` (this folder) | PWA, CSV, backup, print, deployment, demo | 100 |

Each folder is a self-contained project: `pnpm install && pnpm dev` works inside any of them.

## Project structure (final)

```
week4/
├─ docs/PROJECT.md       Full documentation: architecture, data model, design notes, API of the modules
├─ DEMO.md               Two-minute demo script for the presentation
├─ public/icons/         PWA icons (192, 512, maskable, apple-touch)
├─ src/
│  ├─ components/        layout, trip, itinerary, packing, common
│  ├─ pages/             TripList, TripDetail, Itinerary, Packing, Settings
│  ├─ core/              date, conflict, qtyExpr, packingEngine, csv (no React)
│  ├─ db/                dexie schema, seed data, actions
│  ├─ types/             data model
│  └─ utils/             formatting helpers
├─ tests/                date, conflict, qtyExpr, packingEngine, csv, smoke
└─ .github/workflows/deploy.yml
```

## Notes and limits

- UI copy is Simplified Chinese; documentation is English. Internationalisation is not implemented.
- Data lives in IndexedDB on one device; use JSON export/import to move it.
- Drag-and-drop ordering is still on the roadmap; the current build reorders with up/down buttons and
  a "move to Day N" menu.
- The deployed link still needs to be produced: set the repository, push to `main`, and replace the
  placeholder URL in the docs.
