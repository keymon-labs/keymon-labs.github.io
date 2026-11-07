---
id: "001b"
title: Shell, routes, PWA and footer
model: Sonnet 5.5
why_model: Plain app assembly on top of the core; contracts are already fixed by 001.
status: in-progress
claimed: 2026-11-07
depends_on: ["001"]
touches: [spanish-arcade/index.html, app.js, style.css (minimal, unstyled), ui/settings.js (slot host), manifest.webmanifest, sw.js, icon-192.png, icon-512.png]
---
## Prompt
Build the app shell per `docs/PLAN.md` §3 and §6: hash routes (`#/`, `#/profile/<id>`, `#/unit/<id>`, `#/settings`), a screen frame with footer per CLAUDE.md (`__BUILD__`), error ring buffer + "Copy diagnostic info", `ui/settings.js` as a screen with **named slots** that tasks 003 (transfer) and 005 (reports) fill without editing each other's code, the unit-play screen that mounts archetypes through the session engine from task 001, a result card (stars, placeholder joke line), `navigator.storage.persist()`, test hook `window.__spanishArcade`, manifest + service worker (copy maths-arcade's, cache prefix `spanish-arcade`), simple original placeholder icons. Plain and unstyled is fine (design is 002); use CSS variables from `ui/theme/tokens.css` if it exists.

## Acceptance
- Placeholder unit playable end to end in headless Chromium; progress persists across reload; works offline after first load with the network blocked.
- No landing-page card yet (task 013).

## Notes
Don't add a framework. Keep Settings behind the parent-gate hook (the gate itself is built in 004).
