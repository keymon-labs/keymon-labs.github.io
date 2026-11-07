---
name: labs-claude-loader
description: Run keymon-labs apps inside Claude on the viewer's own Claude account: make an app loader-ready, build the bundles, and (re)publish the "keymon-labs for Claude" loader artifact after a push. Use when touching claude/, an app listed in claude/apps.json, or the loader's capabilities.
---

# keymon-labs for Claude (the loader artifact)

## How it fits together
```
<app>/claude.js        Claude entry: inlines the app's CSS + <main> markup, calls globalThis.keymonLabs.ready(mount)
claude/apps.json       which apps the loader offers (id, name, description, entry, source, uses[])
claude/build.js        npm run build:claude → claude/dist/<id>.js, one self-contained ES module per app
claude/build-loader.js npm run build:loader → claude/out/loader.html + claude/out/apps/<id>.js (SRI hashes baked in)
claude/loader.html     loader template: intro, app list, "More on the website" (website-only apps read from the landing cards at build), trust screen, SRI loading, mounts the app
claude/DISCLAIMER.md   user-facing security model + disclaimer (linked from the trust screen)
```
No npm, no CDN: the app files are published as supporting files of the artifact itself. The repo is the only source; the artifact is a build of one commit (its build id).

Mount contract: `mount(root, { sample })`. `sample` is the artifact `sample` capability (types: artifact-capabilities skill). The app owns the page once mounted.

Capabilities: the loader artifact declares **only** `{ sample: { images: true } }`. Every app inherits whatever the loader declares, so adding a capability (db, mcp, user…) widens the blast radius for every app. Do it only when the user asks, and update `claude/DISCLAIMER.md` and the trust-screen "can / can't" list in `loader.html` in the same change.

## Make an app loader-ready
1. Split UI from the "ask Claude" step: the UI exports `start({ read, ... })`; the web entry passes an API-key reader, `claude.js` passes one built on `sample` (see `homework-reader/` for the pattern).
2. Add `<app>/claude.js` (inline CSS with `?inline`, markup with `index.html?raw`, then `globalThis.keymonLabs.ready(...)`).
3. Add the app to `claude/apps.json` with an honest `uses` list (what it sends to Claude, what it stores). Only apps that actually call Claude belong there; the rest stay on the website.
4. On its landing card, tag it `Needs Claude: …` and add the "Open in Claude" button (`data-open-in-claude="<id>"`).
5. Test locally (next section).

## Test locally
```sh
npm run build:claude && npm run build:loader -- --allow-dirty
python3 -m http.server -d claude/out 8766
```
Wrap `claude/out/loader.html` in a doctype/head/body skeleton (save it inside `claude/out/`), open it in Playwright with an init script that stubs `window.claude = { use: async n => n === "sample" ? fakeSample : null }`, and check: trust screen, run, app works, a tampered file (route `apps/<id>.js` to different content) shows "didn't match the fingerprint".

## Release (every push that changes claude/, shared/ or a listed app)
1. Commit and push first: `build-loader` refuses uncommitted changes, so every build id is a real commit. The artifact doesn't depend on the Pages deploy: publish right after the push, then check the deploy run afterwards (`gh run list -L 1`), never sleep-wait for it first.
2. `npm run build:claude && npm run build:loader`. Build id = short git commit.
3. Find the artifact: Artifact `action: "list"`, title **keymon-labs for Claude**. Read it; compare its `<meta name="keymon-labs-build">` with the new build id. Same → nothing to do.
4. Publish `claude/out/loader.html` with `files` mapping every `apps/<id>.js` → `claude/out/apps/<id>.js`:
   - existing: pass its `url`; omit `capabilities` (keeps `{sample:{images:true}}`) unless they changed.
   - first time: `capabilities: { sample: { images: true } }`, `icon: "apps"`, description "Hobby apps from keymon-labs that run on your own Claude account."
5. Tell the user the new build id. Sharing the link publicly is the user's choice (share settings in claude.ai); only then add a link to it on the site.

The artifact URL is not committed: find it with Artifact list. Viewers keep their trust choices across republishes (same artifact), but every changed app hash asks again, which is the point.
