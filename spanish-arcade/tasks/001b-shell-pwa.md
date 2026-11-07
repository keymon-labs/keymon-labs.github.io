---
id: "001b"
title: Shell, routes, PWA and footer
model: Sonnet 5.5
why_model: Plain app assembly on top of the core; contracts are already fixed by 001.
status: done
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

Ruling: the shell locks `submit` between a "next" result and the next round, so every archetype gets double-tap safety — cost if wrong: none.
Ruling: storage failures are logged and play continues with a "progress won't be saved" notice — cost if wrong: progress lost silently on a full device.
Ruling: the Spanish Arcade service worker precaches the hashed /assets bundle on install (offline works right after the first visit); maths-arcade has the same gap and was not touched — flagged to the owner.
Ruling: units may carry `"dev": true`; production builds drop them (the demo unit uses it) so it cannot lock the first real unit — cost if wrong: a flag to remove.
Ruling: text size and a unit intro screen were added here (PLAN section 6) since no later task owned them; the slot contract `ui/settings-slots/<name>.js` is in PLAN section 3 and the 003/005 `touches` now list it.
Reviewed by Opus, then a scoped Sonnet re-review that ran the shell drive: clean. Known limits: shell strings are English-only (no `i18n.js`), tokens are inline in style.css until task 002, no app README until task 013, `<html lang>` follows the help language even though shell strings are English. Not checked: the speaker button and real speech (no voices in headless), a real-device install.
