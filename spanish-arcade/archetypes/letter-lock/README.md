# letter-lock

Riddle word-guess: the child reads a riddle (2-3 authored clue lines, never naming the word), types the word in a normal text field (device keyboard; Enter or **Comprobar** submits) and gets Wordle-style feedback as compact coloured letter chips, newest guess on top. The ñ á é í ó ú ü ¿ ¡ helper row inserts at the caret. Any letters are accepted (not a dictionary check). Chip marks: `ok` ✔ right place, `near` ↔ elsewhere in the word, `tilde` ´ right base letter and place but wrong accent (a/á, u/ü; never n/ñ), `no` · not in the word. Repeated letters follow Wordle counting.

**Clue ladder** (`clueLadder` in `logic.js`): the first clue shows at the start; each wrong try reveals the next. After the authored lines come auto hints: "Empieza por P", "Tiene N letras", then "Lleva ñ" / "Lleva tilde" / "Lleva ü" when the word has one. A word with no authored `clues` starts with "Tiene N letras". The emoji is never a clue: it appears with the word only after the round is solved, as a reward. `clue: "audio"` hides the riddle: the child hears the word (🔊) and types it; only auto hints follow wrong tries (no Spanish voice: falls back to the riddle).

**Scoring contract (unchanged):** only the final result reaches the session. A correct guess is a `submit` (correct), and so is the `tries`-th wrong guess. That miss gives the level-1 hint (the word pattern with the first letter and every `tilde` letter shown, e.g. `P _ _ _ _`) and **2 more tries**; the next miss shows the word in `.sp-reveal` and the child types it (every further guess is judged). Wrong guesses before that never count as misses, so there is no fail state.

Data: the riddle lines live on the vocab word, `"clues": ["…", "…", "…"]` (2 to 4 non-empty lines; the validator rejects a clue that contains the word). Keep them kind, generic and original.

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | selector | required | Letters only, length 3-8; others are skipped. |
| `tries` | int 4-8 | 6 (5 at d3) | Guesses before the judged miss. |
| `clue` | `riddle` \| `audio` | `riddle` | `audio` needs a Spanish voice, else riddle. |
| `firstLetter` | bool | true at d1 | "Empieza por X" is shown from the start. |

```json
{ "archetype": "letter-lock", "difficulty": 1, "params": { "from": { "tag": "colours", "n": 3 } } }
```

Rules in `logic.js` (`score`, `autoHints`, `clueLadder`, `cluesShown`, `make`, `judge`, `hint`); tests in `test/letter-lock.test.js`. Compare via `core/spelling.js`. Shared UI: `specialLettersRow` from `ui/tiles.js`.
