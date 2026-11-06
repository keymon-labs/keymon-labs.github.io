# keymon-labs

Small web apps published at https://keymon-labs.github.io. Mostly built with Claude, often from the Claude mobile app.

## How it deploys
- Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) runs `npm ci && npm run build` → `dist/` is deployed to Pages.
- Never commit `dist/` or `node_modules/`.
- The repo is the source of truth: always commit and push before ending a session. Chat workspaces are temporary.

## Layout
```
index.html              landing page: one <li class="card"> per app
<app>/index.html        latest version of the app
<app>/v1/, v2/ ...      frozen past versions (copies), linked from the landing card
<app>/manifest.webmanifest, sw.js, icon-*.png   PWA files, per app/version
shared/                 (create when needed) ES modules reused across apps
```
- Every `index.html` anywhere is built automatically as a page; no config change needed for new apps or versions.
- Vite hashes JS/CSS/images referenced from HTML (`/assets/name-<hash>.ext`), so stale caches are not an issue for those.
- Files Vite doesn't reference (`sw.js`, `manifest.webmanifest`, manifest icons, data fetched at runtime) are copied as-is by `scripts/copy-static.mjs`. Manifests are deliberately kept un-hashed (see `vite.config.js`).

## Conventions
- Plain HTML + ES modules, no framework unless an app clearly needs one.
- Small apps can be a single `index.html`. Split into modules once a file passes ~400–500 lines: `app.js`, `style.css`, data in `*.json`.
- Shared code: `import { … } from '../shared/x.js'` (Vite resolves and hashes it).
- Keep data (songs, levels, word lists) separate from logic.
- Service workers: network-first for navigations/HTML, cache-first for other same-scope files. Bump the cache name when the worker changes.
- Mobile-first, works in Chrome on Android; light/dark aware. Note on the landing card if an app needs Chrome (e.g. Web MIDI is unavailable in Safari/iOS).

## Releasing a new version of an app
1. Copy the current `<app>/index.html` (+ its manifest/sw/icons) to `<app>/vN/` and update its manifest `id`/`start_url` scope to that folder.
2. Edit `<app>/index.html` as the new latest.
3. Add the version pill to the app's card in the root `index.html`.

## Check before pushing
- `npm run build` must pass.
- Serve `dist/` (`npx vite preview` or `python3 -m http.server -d dist`) and load each changed page in headless Chromium; check for page errors.
- Commit messages: short imperative summary.
