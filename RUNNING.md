# Running the project

A short guide for anyone reviewing this repository. It takes about two minutes and needs no backend,
no database and no API keys.

## 1. Install Node.js

Download the **LTS** installer from <https://nodejs.org> and run it (Windows or macOS).

Check that it worked — open a new terminal and run:

```bash
node -v
```

You should see `v20.x` or newer.

## 2. Get the code

```bash
git clone https://github.com/<your-username>/Seven-202384014016.git
cd Seven-202384014016/week4
```

`week4` is the final build; `week1`–`week3` are the earlier weekly milestones.

## 3. Install dependencies

```bash
npm install
```

This downloads the packages into `node_modules/` (about a minute on a normal connection).

## 4. Start the app

```bash
npm run dev
```

Open <http://localhost:5173>. You should see **我的行程** with three sample trips. Open the Kyoto
trip to see the day-by-day itinerary, the amber conflict marker on Day 2, and the generated packing
list.

Stop the server with `Ctrl + C`.

## Checks you can run

| Command | What it does |
| --- | --- |
| `npm test` | Runs the 100 unit tests (core logic + jsdom smoke tests) |
| `npm run build` | Produces a static build in `dist/` (also emits the service worker) |
| `npm run preview` | Serves the production build at <http://localhost:4173> |

## Deploying it (optional)

The build is fully static, so any static host works. For GitHub Pages:

```bash
npm run build
cd dist
git init
git add -A
git commit -m "publish"
git branch -M gh-pages
git remote add origin https://github.com/<your-username>/Seven-202384014016.git
git push -f origin gh-pages
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / (root)**.
After a minute the app is available at `https://<your-username>.github.io/Seven-202384014016/`.
The `gh-pages` branch of the upstream repository already contains a prebuilt copy, so enabling Pages
on a fork is enough if you do not want to build anything.

## Notes

- The interface is in Simplified Chinese; the documentation (this file, `README.md`,
  `week4/docs/PROJECT.md`) is in English.
- All data is stored in the browser's IndexedDB. Nothing is uploaded anywhere, and the app works
  offline after the first load.
- The first launch seeds three sample trips; **Settings → Reset to sample data** restores them.
- There is no backend: the system architecture is browser-only by design.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `node: command not found` / `不是内部或外部命令` | Node.js is not installed, or the terminal was opened before installing it. Reinstall the LTS build and open a new terminal. |
| `npm.ps1 cannot be loaded` on Windows | PowerShell blocks scripts. Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `cmd` instead of PowerShell. |
| `EACCES` on macOS | Do not use `sudo npm install`. Reinstall Node with the official installer or via `nvm`. |
| `npm install` is slow | Wait a minute, or add `--registry=https://registry.npmmirror.com`. |
| Port 5173 is already in use | `npm run dev -- --port 5174`, then open <http://localhost:5174>. |
| Blank page after updating | Hard refresh (`Ctrl + F5` / `Cmd + Shift + R`); the old service worker may be cached. |
| A red ❌ in the Actions tab | Those are old runs from a deployment workflow that has since been removed. They do not affect the app. |
