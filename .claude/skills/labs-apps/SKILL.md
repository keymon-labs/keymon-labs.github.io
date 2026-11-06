---
name: labs-apps
description: Add a new app to keymon-labs, release a new version of an existing one (frozen vN/ snapshots), and ship it (tests, build, headless check, push). Use for any new app or version bump on the site.
---

# Adding and versioning keymon-labs apps

Rules live in `CLAUDE.md` (public-data rule, ponytail, structure, copyright). This is the step list.

## New app
1. `git pull`; read `README.md` and `shared/README.md`. Reuse `shared/` modules before writing code.
2. Create `<app>/` with the default shape:
   - `index.html` (markup only; `<link rel="manifest">`, icon links, `<script type="module" src="./<entry>.js">`)
   - `style.css` (tokens on `:root`, light/dark), `<app>.js` or `game.js` (logic, one-line header comment)
   - data as `*.json` when there is any
   - `manifest.webmanifest` with `id`, `start_url`, `scope` = `/<app>/`; `icon-192.png`, `icon-512.png` (draw them with PIL; no copyrighted images)
   - `sw.js`: copy `maths-arcade/sw.js`, rename the cache prefix to `<app>`
   - `README.md`: what it is, files table, data format, shared modules used, versions
   - `test/*.test.js` for pure logic (parsers, scoring, rules)
3. Licence: add the `© <year> keymon-labs · CC BY-NC-SA 4.0` line (linking to NOTICE.md) to the app's menu or footer, and a CREDITS.md row for any third-party code, font, sound, music or data.
4. Register: one `<li class="card" id="<app>">` in the root `index.html` (with a "Versions:" row holding the Latest pill), one row in the root `README.md` Apps table, and add `<app>` to "Used by" for every shared module it imports.
5. Kids' apps: no ads, tracking, analytics or sign-in. Say "Chrome" on the card if it needs Web MIDI/Bluetooth.
6. To make it also run inside Claude, see the `labs-claude-loader` skill.

## New version of an existing app
Do this when a change alters gameplay or the UI a user has learned. Bug fixes go straight into latest without a snapshot.
1. Next N: `ls <app>/` for existing `vN/` folders.
2. Snapshot the **current** latest into `<app>/vN/` as a self-contained page: inline its CSS/JS/data, or copy the files and rewrite imports so nothing reaches `../shared/` or `../`. Copy `manifest.webmanifest`, `sw.js` and icons; set the manifest `id`, `start_url` and `scope` to `/<app>/vN/` and give the sw cache name a `-vN` suffix.
3. Never edit an existing `vN/` folder afterwards.
4. Make the change in `<app>/` (the latest). Bump the `sw.js` cache name if `sw.js` changed.
5. Add a `vN` pill (with a `title` saying what that version was) to the app's card in `index.html`, newest first after Latest, and a line under "Versions" in the app README.

## Ship
1. `npm test` and `npm run build` pass.
2. `python3 -m http.server -d dist 8765`, load each changed page in headless Chromium (Playwright): no page errors; drive the test hook (`window.__<app>`) for games; one mobile-size screenshot.
3. Re-check: no personal data, no keys, no copyrighted assets; CREDITS.md covers all third-party material.
4. Commit (short imperative message) and push to `main`. The Pages deploy runs automatically; check the Actions run is green.
5. If the app is in `claude/apps.json`, follow the release steps in `labs-claude-loader`.
