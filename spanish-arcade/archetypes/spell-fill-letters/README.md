# spell-fill-letters

A word with blanks for one spelling focus. `mode: "choice"` picks the missing letter(s) from two options; `mode: "type"` types them with an on-screen special-letters row (the gap's own letters such as r, rr, x, s, h, then ñ á é í ó ú ü ¿ ¡, and a backspace; the fields use `inputmode="none"`, so the phone keyboard stays away; a physical keyboard works too). A full gap starts again on the next key, so o then ó gives ó. One round per word, answer = the whole word. Feedback is the rule of the first wrong gap in one friendly sentence. In type mode a full gap passes the caret to the next empty gap.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector, optional | | Words to practise. Use `items` instead for sentences. |
| `items` | list of `{ es, en?, emoji? }` | | Own texts (e.g. `¿Cómo estás?`). Used when `from` is unset. |
| `focus` | `auto` `ñ` `rr` `r` `x` `s` `h` `accent` `ü` `¿¡` `ll` `bv` `gj` `any` | `auto` | `auto` uses the word's `spell` tag, else the first focus that applies. `r` and `rr` only blank between vowels. `ll` = ll/y, `bv` = b/v, `gj` = g before e/i and j. `any` makes every trap of the word (ñ rr ll bv gj h ü accent x) a candidate gap, each gap with its own rule, so one word mixes traps. |
| `mode` | `choice` \| `type` | `choice` | Difficulty 3 defaults to `type`. |
| `gaps` | int 1-4 | 1 | Blanks per word (capped by what the word has); difficulty 3 gives 2. |
| `plain` | bool | false | Tops the word up to `gaps` blanks with ordinary letters (never the first letter, never inside rr ll ch qu gu or a trap). The other option is a letter children mix up (e/a, m/n, d/t...), never one that spells another taught word. Use with `focus: "any"`: the hardest setting is `gaps: 4, plain: true, mode: "type"`. |
| `accents` | `strict` \| `lenient` | `strict` | `lenient` accepts a missing accent; `ñ` is never `n`. Always strict for focus `accent` and `ü` (lenient would make both options right). |

`make` silently skips words that have no safe blank for the focus, so an exercise can yield fewer rounds than `n` (or none): pick words that match the focus. A wrong option never spells another taught word (perro/pero); a word with no safe alternative is skipped. `pictures` is not required (items exercises have no emoji); with no emoji the prompt is empty (the speaker still says the word); English glosses are never shown. Hints (a nudge only): first miss highlights the gap and shows the rule; with 3+ options it also greys a wrong one, and in type mode it fills the first letter only for multi-letter gaps (rr); second miss shows the word to copy.

```json
{ "archetype": "spell-fill-letters", "difficulty": 1, "params": { "from": { "spell": "rr", "n": 4 }, "focus": "rr" } }
{ "archetype": "spell-fill-letters", "difficulty": 3, "params": { "items": [{ "es": "¿Cómo estás?", "en": "How are you?" }], "focus": "¿¡", "mode": "type" } }
```

Rules in `logic.js` (`make`, `judge`, `hint`, `sameWord`); tests in `test/spell.test.js`; UI helpers in `ui/tiles.js`.
