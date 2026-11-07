---
id: "013"
title: Ship: landing card, PWA, credits, README, release
model: Sonnet 5.5
why_model: Checklist work following the labs-apps skill.
status: todo
depends_on: ["001", "001b", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "014"]
touches: [index.html (landing card), README.md (apps table + shared "Used by"), CREDITS.md, spanish-arcade/README.md, manifest/icons, sw.js]
---
## Prompt
Follow `labs-apps` "New app" and "Ship": landing card (tag "Chrome" if a Chrome-only API is used), root README row, app README (layout, data formats, how to add a unit/archetype), CREDITS.md rows only for what we actually distribute (fonts, third-party code); the "inspired by" wording from PLAN §7 on the credits screen and README, the short line on the landing card, a CREDITS.md line crediting the book as the inspiration, 192/512 icons (original art), service-worker cache name. Re-check no personal data, no book material, licence footer. `npm test`, `npm run build`, headless check, push, confirm the Actions run.

## Acceptance
- Live URL loads, installs as a PWA, works offline after reload with the network blocked in Playwright; two units playable; export/import and report/badge work on a phone-size viewport.

## Notes
Decide with the user whether to include the app in `claude/apps.json` (it doesn't call Claude, so default no).
