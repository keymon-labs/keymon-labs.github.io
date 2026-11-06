---
name: labs-claude-loader
description: Run keymon-labs apps inside Claude on the viewer's own Claude account: make an app loader-ready, publish the npm bundle, and (re)publish the "keymon-labs for Claude" loader artifact after a push. Use when touching claude/, an app listed in claude/apps.json, or the loader's capabilities.
---

# keymon-labs for Claude (the loader artifact)

## How it fits together
```
<app>/claude.js        Claude entry: inlines the app's CSS + <main> markup, calls globalThis.keymonLabs.ready(mount)
claude/apps.json       which apps the loader offers (id, name, description, entry, source, uses[])
claude/build.js        npm run build:claude → claude/dist/<id>.js, one self-contained ES module per app
claude/build-loader.js npm run build:loader -- --version X → claude/out/loader.html (catalog pinned to X + SRI hashes)
claude/loader.html     loader template: app list, trust screen, SRI loading, mounts the app
claude/DISCLAIMER.md   user-facing security model + disclaimer (linked from the trust screen)
.github/workflows/claude-apps.yml  push to main → npm publish @keymon-labs/claude-apps@0.1.<run>
```
Mount contract: `mount(root, { sample })`. `sample` is the artifact `sample` capability (types: artifact-capabilities skill). The app owns the page once mounted.

Capabilities: the loader artifact declares **only** `{ sample: { images: true } }`. Every app inherits whatever the loader declares, so adding a capability (db, mcp, user…) widens the blast radius for every app. Do it only when the user asks, and update `claude/DISCLAIMER.md` and the trust-screen "can / can't" list in `loader.html` in the same change.

## Make an app loader-ready
1. Split UI from the "ask Claude" step: the UI exports `start({ read, ... })`; the web entry passes an API-key reader, `claude.js` passes one built on `sample` (see `homework-reader/` for the pattern).
2. Add `<app>/claude.js` (inline CSS with `?inline`, markup with `index.html?raw`, then `globalThis.keymonLabs.ready(...)`).
3. Add the app to `claude/apps.json` with an honest `uses` list (what it sends to Claude, what it stores), and add its folder to `paths:` in `.github/workflows/claude-apps.yml`.
4. `npm run build:claude`, then test locally (next section).

## Test locally
```sh
npm run build:claude
npm run build:loader -- --local http://localhost:8766/claude/dist/
python3 -m http.server -d . 8766
```
Wrap `claude/out/loader.html` in a doctype/head/body skeleton, open it in Playwright with an init script that stubs `window.claude = { use: async n => n === "sample" ? fakeSample : null }`, and check: trust screen, run, app works, a tampered file (route the .js to different content) shows "didn't match the fingerprint".

## One-time npm setup (the user does this; needs their npm login)
1. npmjs.com account with 2FA; create the org `keymon-labs` (free, public packages).
2. First publish by hand, because trusted publishing is configured on an existing package:
   `npm run build:claude && cd claude && npm version 0.1.0 --no-git-tag-version && npm publish` (then revert the version change, don't commit it).
3. npmjs.com → package `@keymon-labs/claude-apps` → Settings → Trusted Publisher → GitHub Actions: owner `keymon-labs`, repo `keymon-labs.github.io`, workflow `claude-apps.yml`. Docs: https://docs.npmjs.com/trusted-publishers
4. Optional hardening on the same page: "Require two-factor authentication and disallow tokens".
5. GitHub repo → Settings → Secrets and variables → Actions → Variables: `NPM_PUBLISH` = `true`. Until then the workflow skips.

## Release after a push (every time claude/ or a listed app changes)
1. Push to `main`; wait for the "Publish Claude apps to npm" run: `gh run list --workflow claude-apps.yml -L 1` / `gh run watch`.
2. `V=$(npm view @keymon-labs/claude-apps version)`; `npm run build:loader -- --version $V`. This hashes the files actually on npm.
3. Find the artifact: Artifact `action: "list"`, title **keymon-labs for Claude**. Read it and compare its `<meta name="keymon-labs-build">` with the new build id (`<version> <commit>`). Same → nothing to do.
4. Publish `claude/out/loader.html`:
   - existing: `url` = the artifact's URL; omit `capabilities` (keeps `{sample:{images:true}}`) unless they changed.
   - first time: `capabilities: { sample: { images: true } }`, `icon: "apps"`, description "Hobby apps from keymon-labs that run on your own Claude account."
5. Tell the user the new build id. Sharing the link publicly is the user's choice (share settings in claude.ai); only then add a link to it on the site.

The artifact URL is not committed: find it with Artifact list. Viewers keep their trust choices across republishes (same origin), but every changed app hash asks again, which is the point.
