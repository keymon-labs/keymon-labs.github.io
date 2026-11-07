---
id: "016"
title: MVP hardening (whole-change review fixes)
model: Sonnet 5.5
why_model: Targeted fixes across core, shell and archetypes from the Opus whole-change review.
status: in-progress
claimed: 2026-11-07
depends_on: ["001b", "006", "007", "008", "009", "010", "014"]
touches: [spanish-arcade/core/**, spanish-arcade/app.js, spanish-arcade/sw.js, spanish-arcade/style.css, spanish-arcade/ui/**, spanish-arcade/archetypes/**, spanish-arcade/scripts/check-units.mjs, spanish-arcade/data/vocab/a1-u0-demo.json, spanish-arcade/units/a1-u0-demo.json, spanish-arcade/test/**, spanish-arcade/docs/PLAN.md]
---
## Prompt
Fix what the whole-change review found, before the MVP ships. C1: validate real units against content without dev units (`includeDev:false`), keep dev units' vocab out of production `content.words`, rename the demo vocab ids with a `demo-` prefix, and make the session skip (and log) an exercise that makes 0 rounds. I1: sw.js `addAll` with a de-duplicated URL list and no silent catch. I2: level-1 hints in listen-pick-word and placeholder must never leave fewer than 2 enabled choices. I3: `canSpeak = speech.available && settings.sound`. I4: send `hint(round, 2)` on `retry` too and make read-answer's ✔ prefix idempotent. I5: dark mode `color-scheme: light dark` (tiles). I6: text-size setting scales `html` font-size.

## Acceptance
- `npm test`, `npm run build` pass; offline reload after first visit works (verify with the network blocked); a unit using words from no earlier unit gives rounds in production content.
