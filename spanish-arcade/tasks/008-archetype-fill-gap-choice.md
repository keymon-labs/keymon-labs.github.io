---
id: "008"
title: Archetype fill-gap-choice
model: Sonnet 5.5
why_model: Clear contract.
status: todo
depends_on: ["001"]
touches: [spanish-arcade/archetypes/fill-gap-choice/**, test/fill-gap-choice.test.js]
---
## Prompt
Implement `fill-gap-choice`: a sentence with one gap and 2–4 options (tap or drag into the gap); correct word animates into place and the sentence is read aloud if speech is available. Params: `items[{text:"Yo ___ ocho años", options, answer}]` or `from` + `focus` (article, verb-form, preposition, feeling) to generate items from vocab metadata. Distractors for generated items come from the same category. Handle accents and ¿¡ correctly in options.

## Acceptance
- Tests: generated items have exactly one correct option; no duplicates; seeded determinism. README + example unit snippet.

## Notes
`focus: "article"` needs gender/article metadata from `vocab.json`; coordinate field names with PLAN §4.1.
