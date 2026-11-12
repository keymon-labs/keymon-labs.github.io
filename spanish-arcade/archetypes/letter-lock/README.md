# letter-lock

Wordle-like: guess the word for a picture (and/or a speaker). Up to `tries` rows; any letters are accepted (not a dictionary check). Each letter is marked with colour and a symbol: `ok` ✔ right place, `near` ↔ elsewhere in the word, `tilde` ´ right base letter and place but wrong accent (a/á, u/ü; never n/ñ), `no` · not in the word. Repeated letters follow Wordle counting. The on-screen keyboard has ñ and á é í ó ú ü and takes the best state seen per key; a physical keyboard also works.

Only the final result reaches the session: a correct guess is a `submit` (correct), and so is the last wrong try. That miss gives the level-1 hint (first letter and every `tilde` letter pre-filled and locked) and a fresh grid of **2 tries**; the next miss shows the word in `.sp-reveal` and the child types it. Guesses inside the grid never count as misses.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector | required | Letters only, length 3-8; others are skipped. |
| `tries` | int 4-8 | 6 (5 at d3) | |
| `clue` | `picture` \| `audio` \| `both` | `both` | Picture is forced when there is no Spanish voice. |
| `firstLetter` | bool | true at d1 | Cell 1 of every row is pre-filled. |

```json
{ "archetype": "letter-lock", "difficulty": 1, "params": { "from": { "tag": "colours", "n": 3 } } }
```

Rules in `logic.js` (`score`, `keyStates`, `make`, `judge`, `hint`); tests in `test/letter-lock.test.js`. Compare via `core/spelling.js`.
