---
id: "014"
title: Authoring guide and unit validator
model: Sonnet 5.5
why_model: Tooling and docs on top of the core validators; unblocks safe data tasks for cheaper models.
status: todo
depends_on: ["001"]
touches: [spanish-arcade/docs/AUTHORING.md, scripts/check-units.mjs (or spanish-arcade/scripts/), package.json (script only), test/units.test.js]
---
## Prompt
Write `docs/AUTHORING.md` (how to add a word, a unit and an exercise; stable exercise ids; `rev`; difficulty progression: units 1–4 use difficulty 1–2, later units up to 3; the mix rule from ARCHETYPES.md; Spanish-quality checklist: accents, ñ, ¿¡, gender/article, Spain Spanish, our own sentences, no book text) and `npm run check:units`, which loads every unit and vocab file through `core/schema.js`, prints errors with file and path, and is also run by `npm test`. Checks: schema, unique ids across vocab files, article matches gender, nouns used in picture games have emoji, ≥ 3 archetypes per unit, one listening and one spelling exercise, difficulty non-decreasing, exercise ids unique and stable-looking (no `e1`), params valid for the archetype, every referenced word exists.

## Acceptance
- A deliberately broken fixture produces each error; the real units pass.
- AUTHORING.md is enough for a Haiku chat to write a unit without asking questions.

## Notes
Keep the script small; reuse `core/schema.js` rather than duplicating rules.
