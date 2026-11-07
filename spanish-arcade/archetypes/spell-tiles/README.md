# spell-tiles

Build a word from letter tiles. The prompt is a picture (the word's emoji, or its English gloss) plus a speaker button. Tap tiles in order or drag them onto the answer row; tap a placed tile to take it back. A physical keyboard also works (letters, Backspace, Enter). The whole word is one round and one `submit`.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector | required | Words with spaces or symbols are skipped (letters only). |
| `extraLetters` | int 0-6 | 0 | Decoy tiles. Never lets the tiles spell a taught word the answer's letters could not. Difficulty 1/2/3 gives 0/2/4. |
| `hintLetters` | bool | false | First letter is placed from the start. On at difficulty 1. |
| `accents` | `strict` \| `lenient` | `strict` | `lenient` accepts a missing accent; `ñ` is never `n`. |

Hints: first miss keeps the correct leading letters in place (at least the first); second miss shows the word, and the child builds it again.

```json
{ "archetype": "spell-tiles", "difficulty": 2, "params": { "from": { "tag": "animals", "n": 4 }, "extraLetters": 3 } }
```

Rules live in `logic.js` (`make`, `judge`, `hint`, `formable`); tests in `test/spell.test.js`. UI helpers: `ui/tiles.js`. Accent/ñ comparison is shared with `spell-fill-letters/logic.js` (`sameWord`).
