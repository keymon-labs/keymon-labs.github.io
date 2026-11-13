# 3. Draft a unit (repo only; the assistant never sees the book)

```text
You are drafting one Spanish Arcade unit in spanish-arcade/. Read docs/AUTHORING.md, courses/<courseId>/course.json,
docs/courses/<courseId>/<notes file>, and the README of every archetype you use (archetypes/<id>/README.md).
Do not open anything under content-private/.

Write courses/<courseId>/vocab/<unitId>.json and courses/<courseId>/units/<unitId>.json:
- "status": "review", "rev": 1, 5 or 6 exercises, at least 3 different archetypes, at least one listening
  and one spelling exercise, difficulty 1-3 never going down (units 1-4 of a course: 1-2 only).
- Exercise ids meaningful and stable (animals-listen), never e1/e2. All learner text is { "es", "en" }.
- Every sentence, text, riddle and option is ORIGINAL, written by you on the notes' topics. Do not reproduce
  text from any published course book.
- Spain Spanish, kid-safe, present tense, short sentences. Accents, ñ, ¿ ? and ¡ ! at both ends, agreement.
- Learners already speak Spanish: test WRITTEN Spanish (rr/r, silent h, tildes, ñ, b/v, ll/y), per AUTHORING §5.
- Invented names only, no real people, schools or small places.
Run `npm run check:units` and fix every error. Then list each Spanish string you wrote as a table
(exercise id | string | answer) for the reviewer.
```

## Archetypes and params (summary; the README of each archetype is the source of truth)
Every exercise: `{ "id", "archetype", "difficulty", "params": {...}, "prompt": { "es", "en" } }`. A selector is `{ "tag"|"ids"|"spell"|"pos", "exclude"?, "n", "upToUnit"? }`.

| Archetype (skill) | Main params |
|---|---|
| `listen-pick-word` (listening) | `from` selector, `distractorFrom`?, `options` 2-6, `answerAs` word\|picture, `replay`, `similar` |
| `spell-tiles` (spelling) | `from`, `extraLetters` 0-6, `hintLetters`, `accents` strict\|lenient |
| `spell-fill-letters` (spelling) | `from` or `items: [{ es, en?, emoji? }]`, `focus` (ñ rr r x s h accent ü ll bv gj any), `mode` choice\|type, `gaps` 1-4, `plain`, `accents` |
| `fix-the-mistake` (spelling) | `items: [{ text, at?, as?, en? }]` or `from`, `mode` list\|sentence, `fix` choice\|type, `spot`, `allowPerfect`, `options` 2-3 |
| `paragraph-editor` (spelling) | `texts: [{ text, errors: [{ at, as, kind?, alts? }] }]`, `fix`, `options`, `showCount`, `showKind`, `allowPerfect` |
| `letter-lock` (spelling) | `from` (words need 2-4 `clues` in vocab, not containing the word), `tries` 4-8, `clue` riddle\|audio, `firstLetter` |
| `read-answer` (reading) | `text: [2-5 sentences]`, `emoji`?, `kind` abc\|tf, `questions: [{ q, options, answer }]` (abc) or `[{ q, ok }]` (tf), `showTextWhileAnswering` |
| `clue-detective` (reading) | `cases: [{ suspects, clues, answer, rules? }]`, `reveal` one\|all, `crossOut`, `n` |
| `fill-gap-choice` (grammar) | `items: [{ text with one ___, options, answer, en? }]` or `from` + `focus` article\|feeling, `n`, `options` 2-4 |
| `order-words` (grammar) | `items: [{ es, accept?, emoji?, en? }]` (2-9 tiles), `n`, `punctuation`, `decoys` 0-3 |
| `question-maker` (grammar) | `items: [{ answer, focus (a substring of answer), question, accept?, wrong?, emoji? }]`, `build` choice\|tiles\|type, `decoys`, `n` |
| `match-pairs` (puzzle) | `from` + `mode` word-picture\|article-noun, or `pairs: [{ a, b }]`, `size` 2-6 |
| `odd-one-out` (puzzle) | `from`, or `groups: [{ words: [es...], odd, theme? }]`, `size` 3-6 |

Example exercise:
```json
{ "id": "family-order", "archetype": "order-words", "difficulty": 2,
  "params": { "items": [ { "es": "Mi abuela vive aquí" }, { "es": "¿Cómo te llamas?" } ], "punctuation": true },
  "prompt": { "es": "Ordena la frase.", "en": "Put the sentence in order." } }
```
