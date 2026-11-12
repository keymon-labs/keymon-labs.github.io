# fix-the-mistake

The fox "wrote" a text with one spelling mistake. The child taps the wrong word, then fixes it (picks or types the right spelling) and taps Comprobar. One error per item. The corrected text is always shown last (green). One submit per round: `{ at: wordIndex | -1, fix: string }` (`-1` = "¡Está perfecto!"); punctuation glued to a word is not part of the fix. The round carries `at` and `answer`, so a headless run submits `{ at: round.at, fix: round.answer }`.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector, optional | | List mode: the taught words to spoil, one per round. |
| `items` | list of `{ text, at?, as?, perfect?, en? }` | | Sentence mode. `text` is the **correct** sentence; `at` is the index of the word to spoil (split on spaces); `as` the spoiled form (punctuation optional, kept from the text). `{ text, perfect: true }` has no error and needs `allowPerfect` and `spot` (else it is skipped). A bad `at`/`as` throws in `make`. |
| `focus` | `auto` `ñ` `rr` `r` `x` `s` `h` `accent` `ü` `ll` `bv` `gj` `any` | `auto` | List mode only; traps from `core/spelling.js`. `auto` = the word's `spell` tag, else any trap the word has. A slip never spells another taught word; a word with no safe slip is replaced by another taught word that has one (fewer rounds only if no taught word has the trap). |
| `mode` | `list` \| `sentence` | `sentence` with `items`, else `list` | List: `size` taught words, one misspelled. |
| `size` | int 3-5 | difficulty + 2 | Words in a list. |
| `fix` | `choice` \| `type` | `choice`; `type` at 3 | Choice: the right form plus other plausible slips. Type: field plus ñ á é í ó ú ü ¿ ¡ row. |
| `spot` | bool | false at 1 | false = no error-spotting: the wrong word is already pointed out and the child only fixes it. |
| `allowPerfect` | bool | true at 3 | Adds the "¡Está perfecto!" button; list mode then makes ~1 in 4 texts perfect. Ignored when `spot` is false. |
| `options` | int 2-3 | 2 at 1, else 3 | Choices in `choice` mode. |

Hints: first miss says what kind of slip to look for and dims all but 3 words (not when `spot` is false); second miss outlines the wrong word and shows the right form to copy.

```json
{ "archetype": "fix-the-mistake", "difficulty": 2, "params": { "from": { "spell": "ñ", "n": 4 }, "focus": "ñ" } }
{ "archetype": "fix-the-mistake", "difficulty": 3, "params": { "items": [{ "text": "Mi hermano tiene un perro.", "at": 4, "as": "pero" }, { "text": "Hoy todo está bien.", "perfect": true }] } }
```

Rules in `logic.js` (`make`, `judge`, `hint`, `checkItem`); the traps (`misspell`, `misspellings`) are in `core/spelling.js`, shared with `spell-fill-letters`. Tests: `test/fix-the-mistake.test.js`.
