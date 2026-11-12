---
id: "037"
title: letter-lock v2: normal text field and riddle clues instead of grid, keyboard and emoji
model: Sonnet 5.5
why_model: Rework of one archetype plus its three units' data; contained.
status: todo
depends_on: ["029", "033"]
touches: [spanish-arcade/archetypes/letter-lock/**, spanish-arcade/units/a1-u1-s3.json, spanish-arcade/units/a1-u1-s5.json, spanish-arcade/units/a1-u1-s7.json, spanish-arcade/data/vocab/**, spanish-arcade/lab/logic.js, spanish-arcade/test/letter-lock.test.js]
---
## Prompt
Owner (Spanish): the game with a big grid of empty cells and a whole on-screen keyboard is strange and hard to navigate; use a normal text field instead. And instead of an emoji, give a riddle with clues, for example "planta tropical grande, con escamas, corazón muy dulce" (piña), adding clues as the child tries: "empieza por P y lleva ñ".

Build: (1) a normal `<input type="text">` (device keyboard; autocapitalize/spellcheck/autocorrect off, lang es, enterkeyhint "go", Enter submits) plus a Comprobar button and the existing special-letters helper row (ñ á é í ó ú ü) that inserts into the field; no matrix, no custom keyboard. (2) Wordle-style feedback stays but as compact coloured letter chips for each previous guess (a short list), not an empty grid. (3) The prompt is a riddle: item `clues: [..]` (2-3 authored lines, written like a riddle, never naming the word) shown one at a time; each wrong try reveals the next clue; once authored clues run out, auto-generated hints follow: "Empieza por P", "Tiene N letras", "Lleva ñ" (or "Lleva tilde") when the word has one. The emoji is not shown as a clue; show it only after the round ends as a reward. The audio-only variant (hear the word, type it) stays. (4) Keep the scoring contract: no fail state that blocks the round; after the last hint the word is shown and the round continues; stars and hint rules as in the README. (5) Rewrite the clues for the letter-lock exercises of a1-u1-s3, s5, s7 (original riddles, generic, kind, no personal data) and the lab sample. Update the archetype README params table and tests (guess marking, clue ladder, accents/ñ). List every new Spanish riddle and string in the task Notes for the owner to check.

## Acceptance
- Playable at 390x844 and 844x390 with the phone keyboard open (no layout jump, field visible); `npm test`, `npm run check:units`, `npm run build` pass; screenshots saved for the gallery.

## Notes
