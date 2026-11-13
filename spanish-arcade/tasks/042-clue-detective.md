---
id: "042"
title: New archetype clue-detective (ages 10-12)
model: Sonnet 5.5
why_model: Design is fixed in docs/research/AGE-BANDS.md; it also unblocks the planned who-is-who clue game.
status: todo
depends_on: []
touches: [spanish-arcade/archetypes/clue-detective/**, spanish-arcade/test/clue-detective.test.js, spanish-arcade/lab/**]
---
## Prompt
Build archetype `clue-detective` exactly as proposed in `docs/research/AGE-BANDS.md` (skill, interaction, params table, data shape, audio, difficulty 1-3). Follow `archetypes/README.md` and `docs/ARCHETYPES.md`; reuse `ui/tiles.js`, `ui/speech.js`; compact layout (must not need page scroll at 360x640, the layout audit `scripts/layout-audit.mjs` must pass); README with params table in the archetype folder; add a lab sample (invented content only); pure logic in `logic.js` with tests; no real unit uses it yet. Make it engaging for 10-12 (see the doc's hook) and forgiving.
## Acceptance
- `npm test`, `npm run build` exit 0; lab loads it headless and a scripted round completes with no page errors; layout audit includes it at 0px.
## Notes
Parallel with 039, 040, 041, 043. Styles: use the archetype's own section `/* clue-detective */` at the end of style.css (orchestrator resolves merge conflicts there). Lab sample: add one clearly separated block.
