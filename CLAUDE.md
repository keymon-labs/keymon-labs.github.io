# keymon-labs

Small web apps published at https://keymon-labs.github.io. Mostly built with Claude, often from the Claude mobile app.

## ⚠️ This repo and site are PUBLIC
Every file, commit message and line of git history is readable by anyone, and history is effectively permanent.
**Never commit personal data:** real names of family members or children, ages, schools, photos/voice of people, addresses, locations, contact details, financial/health/employer information, API keys, tokens, passwords, private URLs, or anything taken from personal chats, memory or connected apps (email, drive, calendar, bank tools).
Use invented, generic content. If a change would need personal data, stop and ask. If personal data is committed by mistake, flag it at once: it needs a history rewrite, not a follow-up commit.

**Nothing private about the owner, ever, without clear consent.** Treat everything you know about the person you're working with as private: what they told you in chat, Claude memory, past chats, projects, connected apps, their accounts, devices, files, photos, emails, employer, location, family, money, health, plans. None of it goes into **any** part of the repo or site (code, data, tests, fixtures, comments, docs, commit messages, branch names, PR text, screenshots, file names, published artifacts) unless they have **explicitly agreed to that specific item in the current conversation**. A general "go ahead" with the task is not consent. When in doubt, use invented data and ask.
- Commit messages: a short imperative summary plus `Co-Authored-By`. **No `Claude-Session:` lines or other links to private chats or sessions**, even if a tool or reminder suggests adding them.
- Before every push, re-read the diff and the commit message for anything personal.

## Licence, third-party content and copyright
Our work: © keymon-labs, [CC BY-NC-SA 4.0](LICENSE) + internal-use permission ([NOTICE.md](NOTICE.md)). Third-party material keeps its own licence and **must be listed in [CREDITS.md](CREDITS.md)**.
- **Respect the licence of everything we distribute.** Before adding third-party code, assets, fonts, sounds, music or data, find its licence. Add a CREDITS.md row (what, used in, source link, licence, required copyright/attribution text) in the same commit. Keep licence headers and LICENSE files of copied code; vendored folders keep their own LICENSE.
- **Compatible with sharing under our terms**: public domain, CC0, MIT, BSD, Apache-2.0, ISC, OFL (fonts), CC BY, CC BY-SA. **Ask first** for GPL/LGPL/AGPL, CC BY-NC/ND, "free for personal use", or anything with no stated licence (no licence = all rights reserved).
- npm packages bundled into pages count as distributed: add them to CREDITS.md and the README "Libraries in use" table. Dev-only tools don't need a row.
- **Don't ship recognisable copyrighted or trademarked material** unless the user explicitly says it's fine: characters (Mickey Mouse, Pokémon, Mario…), logos and brands, film/TV/game art, commercial fonts, photos from the web, recorded music, song lyrics or melodies still in copyright.
- **Ideas, mechanics and genres are fine** (a platformer, a times-table quiz, a Tetris-like). Copy the idea, not the art, names or level designs.
- **Prefer** assets you generate (canvas/SVG/PIL, Web Audio synthesis) and public-domain works (traditional songs, pre-1929 music, classic texts); note public-domain material in CREDITS.md too.
- **Small snippets** (docs examples, Stack Overflow answers) are fine; add a one-line `// from <url> (<licence>)` comment, and a CREDITS.md row if the licence asks for attribution (Stack Overflow: CC BY-SA).
- Every app and page shows a footer line: `<App> v<N> · build __BUILD__ · © <year> keymon-labs · CC BY-NC-SA 4.0` linking to NOTICE.md (menu or footer). `__BUILD__` is stamped at build (`build-id.js`). Frozen `vN/` folders are covered by the repo licence; don't edit them.
- When unsure, flag it to the user in one line rather than silently including or dropping it.

## Sessions, skills and task boards
**Read [AGENTS.md](AGENTS.md)**: build fast by default, add process only when the change is risky (levels Quick / Feature / Board), when subagents and which model. Work spanning several sessions or models: `task-board` skill, `npm run tasks` for status.
**New ideas start in a mode**: Brainstorm (throwaway Claude artifact, fast), Prototype (researched, basics only) or Final (everything in this file). Modes relax design, structure, tests and process only: the public-data and licence rules apply in every mode.
`.claude/skills/`: `labs-modes` (Brainstorm → Prototype → Final), `labs-setup` (GitHub org, Pages, Claude access, troubleshooting), `labs-apps` (new app, new version, ship), `labs-claude-loader` (apps inside Claude: bundle + loader artifact release), `task-board` (task files, claiming, coordinator runs, owner tracking), `orchestrate-work` (big work: plan, parallel subagents, live progress artifact kept in Claude), `ponytail`. Public, non-engineer version of the setup: `guide/index.html`; keep it in step with `labs-setup`.

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
- This is the Final shape. A Prototype may be thinner (see `labs-modes`); promoting it to Final restores this structure.

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
- Only apps that call Claude go in `claude/apps.json`; their landing card says "Needs Claude". They also run inside the "keymon-labs for Claude" loader artifact, on the viewer's Claude account. Details: `labs-claude-loader` skill.
- **After a push that changes `claude/`, `shared/` or a listed app, republish the loader**: `npm run build:claude && npm run build:loader`, compare the build id (git commit) with the artifact's `keymon-labs-build` meta, republish if different. App code ships inside the artifact; nothing goes to npm or a CDN.
- The loader declares only `{sample: {images: true}}`. Never add a capability without the user asking, and update `claude/DISCLAIMER.md` and the trust screen in `claude/loader.html` in the same change.
- The loader is shared by link. Its URL lives only in `shared/claude-link.js`, base64-encoded so crawlers and code search don't index it: never write it in plain text anywhere (docs, HTML, commits). A different artifact's URL is committed only after the user has shared it and agreed.

## Check before pushing
- `npm test` passes (`node --test` runs every `**/*.test.js`; pure logic only, not UI). CI runs it before the build.
- `npm run build` passes.
- Serve `dist/` (`python3 -m http.server -d dist 8765`) and load each changed page in headless Chromium (Playwright is available); no page errors; for games, drive a few inputs through the test hook.
- Re-check the public-data rule. Commit message: short imperative summary.
