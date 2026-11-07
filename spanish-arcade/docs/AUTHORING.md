# Authoring units

Everything a unit needs is data: a vocab file and a unit file. Contracts: [PLAN.md §4.1–4.2](PLAN.md). Games available: [archetypes/](../archetypes/) (each has a params table and a copy-paste exercise, e.g. [listen-pick-word](../archetypes/listen-pick-word/README.md)).

Check your work with `npm run check:units` (also part of `npm test`). It prints `error: <file> <path>: <problem> [exercise "<id>"]`; fix them all, run again.

## 1. Add words: `data/vocab/<unitId>.json`
One file per unit, named like the unit (`a1-u9-s1.json`).
```json
{ "schema": 1, "words": [
  { "id": "tortuga", "es": "tortuga", "en": "turtle", "emoji": "🐢", "tags": ["animals"], "pos": "noun",
    "gender": "f", "number": "sg", "article": "la", "forms": { "pl": "tortugas" }, "unit": "a1-u9-s1" },
  { "id": "agua", "es": "agua", "en": "water", "emoji": "💧", "tags": ["drinks"], "pos": "noun",
    "gender": "f", "number": "sg", "article": "el", "elException": true, "unit": "a1-u9-s1" }
] }
```
- `id`: the word, lowercase, no spaces (`-2` on a clash). **Never changed or reused**: progress refers to it, and ids must be unique across all vocab files.
- `unit` must equal the file name. Nouns need `gender` and `article`; the article must match (`el`/`la`/`los`/`las`). Feminine nouns taking `el` (agua, hada) need `"elException": true`.
- `emoji` is required for any word a picture game can pick (listening games drop or reject words without one). Use an emoji; never copy images.
- `tags` are topics (`animals`, `family`, `colours`...). `spell` lists tricky spellings: `ñ rr r x s h accent qu gu ü ¿¡`.

## 2. Add a unit: `units/<unitId>.json`
Ids look like `a1-u<unit>-s<session>`. 5 or 6 exercises (dev units are exempt from the mix rules, not from this count).

**Archetypes that exist now**: `listen-pick-word` (listening), `spell-tiles` and `spell-fill-letters` (spelling), `read-answer` (reading) and `placeholder` (a simple tap-the-word game, skill puzzle). `odd-one-out` (puzzle) and `match-pairs` (puzzle). Coming: `fill-gap-choice` (008); `order-words` and `word-search` are later. Use only archetypes that exist in `archetypes/`; the `params` come from that archetype's README. Until the spelling games land, a new unit cannot satisfy the mix rule below; the checker will say so, and that is expected.

Copy this and change it (add three more animal words so `n: 4` can be met; it is cut to four exercises, so it needs `"dev": true` to be checked; a real unit has 5 or 6, including a spelling one):
```json
{ "schema": 1, "id": "a1-u9-s1", "rev": 1, "order": 9,
  "title": { "es": "Los animales", "en": "Animals" },
  "bookRef": { "unit": 9, "session": 1 },
  "theme": "sunny",
  "intro": { "es": "¡Vamos a conocer a los animales!", "en": "Let's meet the animals!" },
  "badge": { "name": { "es": "Amigo de los animales", "en": "Animal friend" }, "icon": "🐢" },
  "pass": { "minCorrect": 3 },
  "exercises": [
    { "id": "animals-listen", "archetype": "listen-pick-word", "difficulty": 1,
      "params": { "from": { "tag": "animals", "n": 4 }, "options": 3, "answerAs": "picture" },
      "prompt": { "es": "Escucha y toca.", "en": "Listen and tap." } },
    { "id": "animals-tap", "archetype": "placeholder", "difficulty": 1,
      "params": { "from": { "tag": "animals", "n": 3 } },
      "prompt": { "es": "Toca la palabra.", "en": "Tap the word." } },
    { "id": "animals-listen-2", "archetype": "listen-pick-word", "difficulty": 2,
      "params": { "from": { "tag": "animals", "n": 4 }, "options": 4 },
      "prompt": { "es": "Escucha y toca.", "en": "Listen and tap." } },
    { "id": "animals-tap-2", "archetype": "placeholder", "difficulty": 2,
      "params": { "from": { "tag": "animals", "n": 3 }, "options": 4 },
      "prompt": { "es": "Toca la palabra.", "en": "Tap the word." } }
  ] }
```
`from` picks words by `tag`, `ids`, `spell`, `pos`, `exclude` (ids to leave out), `n` (how many rounds) and `upToUnit` (default true: only words taught up to this unit; `false` allows later words).

## 3. Rules the checker enforces
- **Mix**: 5-6 exercises, at least 3 different archetypes, at least one `listening` and one `spelling` exercise. An archetype's `skill` (`listening|spelling|reading|grammar|puzzle`) decides what counts; an archetype with no `skill` only gives a warning and counts for nothing.
- **Difficulty** 1-3, never going down within a unit. Units 1-4 use 1-2 only; later units may use 3. The unit number comes from `bookRef.unit` (set it); without `bookRef` the unit's `order` is used.
- **Exercise ids**: meaningful and stable, like `animals-listen`; never `e1` or `2`. Unique in the unit, never reused. Bump `rev` when exercises change meaningfully.
- **Enough rounds**: each exercise is generated once with a sample seed. Fewer than min(3, `n`) rounds is an error: archetypes skip words silently (no emoji, spaces, no matching focus), so widen the selector or add words.
- **Params** are checked against the archetype (unknown or wrong params are errors); every `ids` word must exist; the selector must match at least `n` words.
- **Pictures**: if the archetype shows pictures (`pictures: true`, e.g. listen-pick-word), the `from` selector must only reach words that have an `emoji`. Narrow it with `tag`, `ids` or `pos: "noun"`.
- All learner text is `{ "es": ..., "en": ... }`.
- Units with `"dev": true` are placeholders and skip the mix rules.

## 4. Content rules
- Write **our own** sentences, words and examples. **No text from the book or any other source**, and no copied pictures.
- Spain Spanish (ordenador, bolígrafo, vosotros), kid-safe and friendly. Names and places are invented.
- Spanish quality checklist: accents (á é í ó ú), `ñ`, `ü`, `¿...?` and `¡...!` at both ends, right article for the gender, singular/plural agreement, English help text that is simple and short.
- No personal data: the repo is public.
