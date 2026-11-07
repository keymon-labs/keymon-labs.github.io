---
id: "014"
title: Authoring guide and unit validator
model: Sonnet 5.5
why_model: Tooling and docs on top of the core validators; unblocks safe data tasks for cheaper models.
status: done
claimed: 2026-11-07
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

Ruling: the mix-rule exemption keys on `"dev": true`, not on an id suffix — cost if wrong: none.
Ruling: each exercise is generated once with a sample seed and fewer than min(3, n) rounds is an error naming the likely cause (words skipped for no emoji, spaces or no matching focus) — archetypes skip words silently, so this is where authors find out — cost if wrong: a false error on a very short exercise.
Ruling: picture archetypes reject a selector that can reach words without an emoji, so authors get an error instead of short rounds — cost if wrong: a stricter selector than needed.
Reviewed by Opus, then a scoped Sonnet re-review: clean. Small extra: `core/content.js` exposes `unitByFile` (one line, outside `touches`). Known limits: PLAN 4.3 still says the pool "demands emoji on nouns" (core) while the checker covers the other words; a new unit can only pass the mix rule once a spelling archetype is merged (task 009).
