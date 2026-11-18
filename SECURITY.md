# Security Policy

Triply is a client-side application: it has no backend, no accounts, and no telemetry. All trip data
stays in the browser's IndexedDB on the device that entered it, and the app makes no network requests
at runtime, so there is no server-side attack surface to report against.

## Supported versions

The deployed build (the latest commit on `main`, published from `week4/`) is the supported version.
The weekly folders `week1`–`week3` are frozen coursework snapshots and do not receive fixes.

| Version | Supported |
| --- | --- |
| `main` (week4) | :white_check_mark: |
| week1 – week3 | :x: |

## Reporting a vulnerability

Open an issue in this repository or contact the maintainer privately through GitHub. Please include
the browser and version, the steps to reproduce, and what you expected to happen. Because there is no
backend, reports about the hosting provider (GitHub Pages) should go to GitHub instead.

Expect an initial reply within a week. This is a university capstone project, not a product, so fixes
are best-effort.
