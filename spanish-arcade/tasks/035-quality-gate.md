---
id: "035"
title: Quality gate: smoke audit, docs, landing card, ship
model: Sonnet 5.5
why_model: Final checks across the round.
status: done
depends_on: ["026", "027", "028", "029", "030", "031", "032", "033"]
touches: [spanish-arcade/README.md, spanish-arcade/docs/**, index.html, spanish-arcade/sw.js, spanish-arcade/test/**]
---
## Prompt
E13 and E14: headless play-through of each new archetype and unit (sound off, reduced motion, phone and landscape); no page errors; update READMEs, ARCHETYPES.md ticks, PLAN rules, service worker cache name, landing card; re-read the diff for personal data; push and confirm the Actions run.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Everything in the Check-before-pushing list passes; live URL loads the new units.

## Notes

Ruling: done as part of the 026-035 round; the quality gate was run by the coordinator (tests, build, headless smoke, public-data scan, deploy check).
