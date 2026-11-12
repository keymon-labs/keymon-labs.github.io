---
id: "027"
title: Archetype order-words (with punctuation mode)
model: Sonnet 5.5
why_model: New archetype on existing tile widgets; spec is written.
status: todo
depends_on: []
touches: [spanish-arcade/archetypes/order-words/**, spanish-arcade/test/order-words.test.js]
---
## Prompt
Build `order-words` as specified in `docs/research/GAMES.md` §4.1: build a sentence from word tiles including ¿ ? ¡ ! . tiles and look-alike decoys (esta/está, Lunes/lunes); one `mode: punctuation` variant covers the old `punctuation-pick` idea (owner assumption in QUESTIONS.md). Copy `archetypes/placeholder/`, reuse `ui/tiles.js`. Write params table README, logic tests (accept lists, capitals, punctuation, scoring) and a lab entry if the lab needs a registry line. Do NOT edit `docs/ARCHETYPES.md` (the coordinator ticks it). Write 6 original sample sentences into the README as an example only, generic and invented.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Playable in the lab page in both themes; tests for accept/score; README params table; works at 390x844.

## Notes
