# spell-fill-letters

A word with blanks for one spelling focus. `mode: "choice"` picks the missing letter(s) from two options; `mode: "type"` types them with an on-screen special-letters row (ñ á é í ó ú ü ¿ ¡; the fields use `inputmode="none"`, so the phone keyboard stays away; a physical keyboard works too). One round per word, answer = the whole word. Feedback is the focus rule in one friendly sentence.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector, optional | | Words to practise. Use `items` instead for sentences. |
| `items` | list of `{ es, en?, emoji? }` | | Own texts (e.g. `¿Cómo estás?`). Used when `from` is unset. |
| `focus` | `auto` `ñ` `rr` `r` `x` `s` `h` `accent` `ü` `¿¡` | `auto` | `auto` uses the word's `spell` tag, else the first focus that applies. `r` and `rr` only blank between vowels. |
| `mode` | `choice` \| `type` | `choice` | Difficulty 3 defaults to `type`. |
| `gaps` | int 1-3 | 1 | Blanks per word (capped by what the word has); difficulty 3 gives 2. |
| `accents` | `strict` \| `lenient` | `strict` | `lenient` accepts a missing accent; `ñ` is never `n`. |

A wrong option never spells another taught word (perro/pero); a word with no safe alternative is skipped. Hints: first miss names the gap, greys a wrong option (choice) or fills its first letter (type); second miss shows the word to copy.

```json
{ "archetype": "spell-fill-letters", "difficulty": 1, "params": { "from": { "spell": "rr", "n": 4 }, "focus": "rr" } }
{ "archetype": "spell-fill-letters", "difficulty": 3, "params": { "items": [{ "es": "¿Cómo estás?", "en": "How are you?" }], "focus": "¿¡", "mode": "type" } }
```

Rules in `logic.js` (`make`, `judge`, `hint`, `sameWord`); tests in `test/spell.test.js`; UI helpers in `ui/tiles.js`.
