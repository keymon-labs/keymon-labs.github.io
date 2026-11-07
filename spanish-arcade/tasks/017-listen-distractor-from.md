---
id: "017"
title: listen-pick-word distractorFrom param
model: Sonnet 5.5
why_model: Small contract-compatible extension plus unit data tweak.
status: in-progress
claimed: 2026-11-07
depends_on: ["006", "011"]
touches: [spanish-arcade/archetypes/listen-pick-word/**, spanish-arcade/units/a1-u1-s1.json, spanish-arcade/test/listen-pick-word.test.js]
---
## Prompt
`listen-pick-word` draws distractors from every taught word, so a numbers exercise often shows one number and two unrelated words. Add an optional `distractorFrom` selector param (same selector type as `from`, default unchanged) so distractors come from that pool, falling back to the full pool only when it has too few words. Use it in exercise `numbers-listen` of `a1-u1-s1` (numbers only). Update the archetype README and tests.

## Acceptance
- With `distractorFrom` numbers, every distractor over 200 seeds is a number; default behaviour unchanged; `npm test`, `check:units` and build pass.
