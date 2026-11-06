# keymon-labs

Small web apps published at https://keymon-labs.github.io. Mostly built with Claude, often from the Claude mobile app.

## ⚠️ This repo and site are PUBLIC
Every file, commit message and line of git history is readable by anyone, and history is effectively permanent.
**Never commit personal data:** real names of family members or children, ages, schools, photos/voice of people, addresses, locations, contact details, financial/health/employer information, API keys, tokens, passwords, private URLs, or anything taken from personal chats, memory or connected apps (email, drive, calendar, bank tools).
Use invented, generic content. If a change would need personal data, stop and ask. If personal data is committed by mistake, flag it at once: it needs a history rewrite, not a follow-up commit.

## Third-party content and copyright
The site is public and redistributes whatever is committed. Licence terms for this repo are being decided; until then follow these rules.
- **Don't ship recognisable copyrighted or trademarked material** unless the user explicitly says it's fine: characters (Mickey Mouse, Pokémon, Mario…), logos and brands, film/TV/game art, commercial fonts, photos from the web, recorded music, song lyrics or melodies written after 1929.
- **Ideas, mechanics and genres are fine** (a platformer, a times-table quiz, a Tetris-like). Copy the idea, not the art, names or level designs.
- **Prefer** assets you generate (canvas/SVG/PIL, Web Audio synthesis), public-domain works (folk songs, pre-1929 music, classic texts) and openly licensed assets (CC0, CC BY, MIT, OFL fonts).
- **Copied code or assets**: keep their licence header; note source + licence in the app README ("Credits" section) and add npm packages to the "Libraries in use" table. CC BY, MIT, BSD and Apache need attribution; avoid GPL/AGPL code and "NC"/"ND"-licensed assets unless the user agrees.
- **Small snippets** (docs examples, Stack Overflow answers) are fine; add a one-line `// from <url>` comment where the licence asks for attribution.
- When unsure, flag it to the user in one line rather than silently including or dropping it.

## Skills (how-tos for this repo)
`.claude/skills/`: `labs-setup` (GitHub org, Pages, Claude access, troubleshooting), `labs-apps` (new app, new version, ship), `labs-claude-loader` (apps inside Claude: npm bundle + loader artifact release). Public, non-engineer version of the setup: `guide/index.html`; keep it in step with `labs-setup`.

## Start of every task
1. `git pull` (other chats push here too).
2. Read the indexes, not the whole tree: [README.md](README.md) (apps + libraries), [shared/README.md](shared/README.md) (reusable modules), and the target app's `README.md`.
3. Then open only the files the change touches.

## Reuse before you write
Take the first option that works:
1. **Already in this repo?** A module in `shared/` or a pattern in another app. Use it as-is or extend it (keep existing callers working).
2. **A platform feature?** (Web Audio, Canvas, Web MIDI, CSS…) Use it directly.
3. **An npm library already listed in README.md?** Use it.
4. **A well-known open-source library** for something non-trivial (music notation, audio synthesis, physics, charts, maps…)? Add it with `npm install`; Vite bundles it, so no CDN links. Prefer MIT/BSD/Apache, maintained, small. Record it in the README "Libraries in use" table. Never add a dependency for a few lines of code.
5. **Otherwise**, write the minimum code.

## Structure: modular, not fragmented
```
README.md                 index: apps + libraries in use
shared/README.md          index: reusable modules (exports, used by)
shared/<capability>.js    one module per capability (midi, music, audio, pwa…)
<app>/README.md           what it is, files, data format, shared modules used
<app>/index.html          markup only
<app>/style.css           styles
<app>/<app>.js|game.js    app logic (ES module)
<app>/*.json              data (songs, levels, word lists): editable without touching code
<app>/sw.js, manifest.webmanifest, icon-192.png, icon-512.png
<app>/vN/                 frozen past versions: self-contained, never edited
index.html                landing page: one <li class="card"> per app
```
- Default app shape is the four files above (html, css, js, json). Split the JS further only when a file passes ~500 lines **and** there is a clear seam (e.g. rendering vs rules). No folders of tiny one-function files.
- Move code to `shared/` when a **second** app needs it, or when it is clearly generic device/platform glue (input devices, PWA). Update `shared/README.md` in the same commit.
- Changing a shared export: grep every caller (`grep -rn "shared/<module>" --include=*.js .`) and fix them all in the same commit.
- Keep READMEs current: they are how the next session finds things. A new app adds a row to the root README and a card to `index.html`.
- One-line header comment at the top of each JS module: what it is and where its data/styles live.

## How to write code (ponytail)
Distilled from the ponytail skill (vendored in `.claude/skills/ponytail/`, MIT).
- The smallest change that fully solves the task. Finish every part the task needs: callers, data, READMEs, landing card.
- Before editing, list every place the change must reach. For a bug fix, grep callers and fix the root cause once, in the shared code.
- No abstractions, options, config, wrappers or "for later" code nobody asked for. Deletion beats addition. Keep the existing structure and conventions.
- Prefer the shortest **readable** diff; a clever one-liner that needs decoding is not short.
- Comments only for the *why* the code can't show, one line. Known limits are marked `// shortcut: <limit>, <when to upgrade>`.
- New non-trivial logic (a parser, a scoring rule, a whole new app) gets one small check: a headless play-through or an assert-based self-test.
- Never cut: input validation, error handling that prevents data loss, security, accessibility, anything the user asked for.
- End the reply with one or two lines on what was skipped or not checked, and any risk.

## How it deploys
- Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) runs `npm ci && npm run build` → `dist/` is deployed to Pages.
- Every `index.html` is a page automatically; new apps and versions need no config.
- Vite content-hashes JS/CSS/JSON/images reached from HTML into `/assets/` (immutable, so no stale caches).
- Anything Vite doesn't bundle (`sw.js`, manifests, manifest icons, runtime-fetched files) is copied to `dist/` at the same path by the `copy-unbundled` plugin in `vite.config.js`. Manifests stay un-hashed on purpose.
- Never commit `dist/` or `node_modules/`. Always commit and push before ending a session: chat workspaces are temporary.

## App conventions
- Plain HTML + ES modules; a framework only if an app clearly needs one.
- Mobile-first, Chrome on Android; landscape-friendly for games; light/dark aware unless the app has its own look.
- Installable: manifest with `id`, `start_url`, `scope` = the app folder; 192 and 512 PNG icons; `registerServiceWorker()` from `shared/pwa.js`.
- Service worker: network-first for navigations, cache-first for same-scope files **and `/assets/`** (hashed). Bump the cache name when `sw.js` changes.
- Web MIDI / Web Bluetooth don't exist on iOS Safari: say "Chrome" on the landing card.
- Apps for kids: forgiving, no ads, no tracking, no analytics, no sign-in.
- Expose a small test hook (`window.__<app>`) when the app is a game or has state worth driving headlessly.

## Releasing a new version of an app
1. Snapshot the current version into `<app>/vN/` as a **self-contained** page: inline its CSS/JS/data, or copy the files with imports rewritten so it doesn't depend on `shared/` (shared code may change later). Copy its manifest/sw/icons and set the manifest `id`, `start_url`, `scope` to `vN/`.
2. Make the changes in `<app>/` as the new latest.
3. Add the `vN` pill to the app's card in `index.html` and note it in the app README.

## Apps inside Claude (claude/)
- Apps listed in `claude/apps.json` also run inside the "keymon-labs for Claude" loader artifact, on the viewer's Claude account. Details: `labs-claude-loader` skill.
- **After a push that changes `claude/` or a listed app, republish the loader**: wait for the npm publish Action, `npm run build:loader -- --version <new>`, compare the build id with the artifact's `keymon-labs-build` meta, republish if different. The build id is `<npm version> <git commit>`.
- The loader declares only `{sample: {images: true}}`. Never add a capability without the user asking, and update `claude/DISCLAIMER.md` and the trust screen in `claude/loader.html` in the same change.
- Never commit the artifact URL until the user has shared it publicly.

## Check before pushing
- `npm test` passes (`node --test` runs every `**/*.test.js`; pure logic only, not UI). CI runs it before the build.
- `npm run build` passes.
- Serve `dist/` (`python3 -m http.server -d dist 8765`) and load each changed page in headless Chromium (Playwright is available); no page errors; for games, drive a few inputs through the test hook.
- Re-check the public-data rule. Commit message: short imperative summary.
