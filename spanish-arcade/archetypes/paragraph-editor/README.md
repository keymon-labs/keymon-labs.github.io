# paragraph-editor

The fox's diary has 2-6 mistakes of mixed kinds (tilde, agreement, verb, punctuation, spelling). The child taps a wrong word and fixes it (taps the right form, or types it at difficulty 3). Each fix is one judged round on the same board; a counter ("Quedan 3") goes down and, at the end, the clean paragraph is read aloud and stamped "Corregido". Tapping a word that is fine says "Esta palabra está bien" and costs nothing (it is not a submit).

Board: one round per mistake (plus a closing round when `allowPerfect`), every round of a text carries the whole text. The child may fix the mistakes in any order: `mount` keeps the fixed word indexes between rounds and sends them with each answer (`fixed`); a resumed round assumes the first `k` mistakes in text order are fixed.

Answer: `{ at, fix, fixed }` (`at` = word index, `fix` = the whole right token, punctuation and capitals included) or `{ perfect: true }`. A headless run submits `{ at: e.at, fix: e.right, fixed }` for each `round.errors` entry, then `{ perfect: true }` if `round.finish`.

| Param | Type | Default | Notes |
|---|---|---|---|
| `texts` | list of `{ text, errors[] }`, min 1 | required | `text` is the **correct** paragraph. `errors`: 1-6 of `{ at, as, kind?, alts? }`: `at` = word index (split on spaces, as in fix-the-mistake), `as` = the wrong form that **replaces the whole token** (punctuation included, so `río,` -> `rio,`), `kind` = `accent` `agreement` `verb` `punctuation` `spelling` (default: `accent` if only the tilde differs, else `spelling`), `alts` = other plausible wrong forms for the choices. A bad text throws in `make`. |
| `fix` | `choice` \| `type` | `choice`; `type` at 3 | Choice: the right token plus other plausible forms (authored `alts`, else a lost or added tilde, flipped ending o/a, os/as, flipped capital, lost ¿¡). Type: field plus ñ á é í ó ú ü ¿ ¡ row. |
| `options` | int 2-3 | 3 | Choices in `choice` mode. |
| `showCount` | bool | true; false at 3 | Shows "Quedan N". |
| `showKind` | bool | true at 1 only | Shows the kinds left ("1 tilde, 1 concordancia"). |
| `allowPerfect` | bool | true at 3 | Adds a «Ya está perfecto» button and a last round per text in which pressing it is the answer (pressing it earlier is a miss). |

Hints: first miss says which kind of mistake to look for and reads the **correct** sentence aloud when a Spanish voice exists (the wrong version is never spoken); second miss shows the right form of the word just tried (else the first mistake left) to copy.

Difficulty 1 = 2 mistakes, kinds shown, choice. 2 = 3-4 mistakes, kinds hidden. 3 = typed, no counter, «Ya está perfecto». (Mistake counts are authoring, not params.)

```json
{ "archetype": "paragraph-editor", "difficulty": 2, "params": { "texts": [ {
  "text": "Ayer fuimos al río con mis tíos. El agua estaba muy fría y las piedras eran resbaladizas. ¿Quién quiere volver mañana?",
  "errors": [ { "at": 3, "as": "rio", "kind": "accent" }, { "at": 16, "as": "resbaladizos.", "kind": "agreement" }, { "at": 17, "as": "Quién", "kind": "punctuation" } ] } ] } }
```

Rules in `logic.js` (`make`, `judge`, `hint`, `checkText`, `variants`, `sentenceOf`); spelling comparison from `core/spelling.js`. Tests: `test/paragraph-editor.test.js`. Keep a paragraph to about 30 words so it fits a 360x640 phone without scrolling.
