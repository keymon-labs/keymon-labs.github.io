# Game research: new archetypes for Spanish Arcade

Research note (November 2026). Question: which mini-game types ("archetypes") should come next for a written-Spanish app for 6–10-year-olds who mostly already speak Spanish? Inputs: [ARCHETYPES.md](../ARCHETYPES.md), [UNITS.md](../UNITS.md), [BOOK-NOTES.md](../BOOK-NOTES.md), the seven built archetypes, and the web sources at the end. All wording is ours; no text or assets were copied.

## 1. What the research says

### What works for ages 6–10
- **Learning inside the mechanic, not a quiz before the fun.** In the *Zombie Division* study, the version where the maths *was* the combat taught more and was picked far more often than the version with a quiz bolted on ([KQED MindShift](https://www.kqed.org/mindshift/20765/whats-the-secret-sauce-to-a-great-educational-game)). If the reward has nothing to do with the skill (a "maths tax"), children guess and click through to get to the reward ([ScreenWise](https://screenwiseapp.com/guides/when-educational-games-aren-t-actually-educational)). **For us:** the spelling decision should *be* the move (a tile, a fix, a guess), not a gate in front of a separate mini-game.
- **Some difficulty is good.** "Desirable difficulty" and retrieval beat smooth, frictionless tasks, which give an illusion of competence. Failure should be a quick, safe, reversible signal, not an end state ([Filament Games](https://www.filamentgames.com/blog/why-effective-educational-games-require-friction)). **For us:** recall (type or build the word) is worth more than recognition (pick the word). Right now most of our games are recognition.
- **Clear progression and a world.** Teach Your Monster to Read was built from play-based literacy research. Reviewers praise its logical progression and its role-play, and it has very large reach (tens of millions of players, recommended by the UK DfE) ([REF 2021 impact case](https://results2021.ref.ac.uk/impact/7c8d1f47-70f3-45ac-8a99-9f1e9d42f162/pdf)). Gus on the Go uses a map, a short teach step, a quick review, then a small arcade reward, with calm pacing. Its weak point is depth: single nouns and flashcard matching, so it gets used up in an afternoon or two ([ScreenWise on Gus on the Go](https://screenwiseapp.com/media/gus-on-the-go-game)).
- **Variety, but with a path.** Lingokids is praised for variety and playfulness. It is criticised for games of uneven quality, goals that aren't always clear, and a big library with no guided path ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/lingokids-playlearning)). **For us:** we already have a unit path. Each new archetype needs a goal that is obvious in one screen.
- **Wordle-style deduction works for children.** Parents and teachers report that children ask for it daily. The colour feedback turns spelling into strategy ([The Courier](https://thecourier.co.uk/fp/education/3180710/wordle-for-kids-why-its-good), [Mumsnet thread](https://www.mumsnet.com/talk/primary/4475422-Its-like-wordle-but-for-kids-spellings)). One caveat: it trains spelling patterns but does little for vocabulary links ([Tes](https://www.tes.com/magazine/teaching-learning/secondary/do-vocabulary-games-boost-literacy)). That doesn't matter for us, because spelling is the goal.
- **No-lose word hunts.** Spelling Bee has no failure state, only rising praise ranks and a bonus for a word that uses every letter ([Wikipedia](https://en.wikipedia.org/wiki/The_New_York_Times_Spelling_Bee)). Bookworm rewards longer words and adds pressure with "burning" tiles that end the game ([Wikipedia](https://en.wikipedia.org/wiki/Bookworm_(video_game))). Keep the first idea; avoid the game-over.
- **Silly sentences motivate reluctant writers.** Mad Libs practises word classes, spelling and reading aloud through humour ([Rainbow Resource](https://www.rainbowresource.com/blog/mad-libs-and-ela-the-benefits-outweigh-the-nonsense/)).
- **Compose with movable letters before handwriting.** In the Montessori movable alphabet the child builds words from loose letters ([Montessori Mom](https://montessorimom.com/moveable-alphabet/)). Our `spell-tiles` already works this way. The same idea scales to **word tiles for sentences**.

### What fails, and why children quit
- **Time pressure with harsh penalties.** Duolingo's timed modes (Match Madness, XP Ramp Up) are popular with adults chasing points, but they are described as stressful, and a slip sends you back a level ([DuoPlanet](https://newsletter.duoplanet.com/posts/when-duolingo-makes-you-sweat-2)). Research on low-stakes timed practice with 9–11-year-olds found no extra anxiety, but anxiety rose with harder items. Public comparison embarrasses children, while beating your own time motivates them ([EdWeek](https://www.edweek.org/teaching-learning/do-timed-tasks-really-worsen-math-anxiety/2024/08)). **Rule:** a timer may only add a bonus. It never ends a round, never costs progress and is never shown against other players. It is off at difficulty 1.
- **Hearts and lives push learners to easy content and speed-running**, because points measure activity, not learning ([DEV, a competitor's view, weak evidence](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4)). We have no lives. Keep it that way.
- **Fine motor and coordination limits.** Under about 9, precise dragging is hard. Use large targets (about 2 cm) and let the child either drag or tap the destination. Keep timed or two-handed actions to a minimum under 8 ([NN/g, physical development](https://www.nngroup.com/articles/children-ux-physical-development/)). Small working memory, subtle feedback that goes unnoticed, audio that the browser blocks, and rigid instructions all cause frustration ([NN/g, cognition](https://www.nngroup.com/articles/kids-cognition/)). **For us:** exaggerated, explicit feedback (icon + words + mascot), no audio-only information, tap-tap for every drag (already a rule).
- **Hangman.** Teachers drop it because of the theme and swap in "the picture disappears" or "the picture builds up" versions with the same letter-guessing core ([Teach Starter](https://www.teachstarter.com/gb/blog/kid-friendly-alternatives-to-hangman-in-the-classroom-2)). Letter guessing by frequency also teaches little spelling. A Wordle-style whole-word guess is a better fit.
- **Shallow content and repetition.** See Gus on the Go above. Data-driven archetypes reused across 12 units with rising params are our answer, as long as each archetype has real **difficulty levers**, not only "more options".

### Design rules for new archetypes
1. The skill is the move (intrinsic). 2. Make recall more common than recognition. 3. Hint, reveal, copy; never fail (the session already does this). 4. Timers are a bonus only, off at difficulty 1. 5. One-screen goal, an explicit mascot line and an icon on every result. 6. Tap-tap for every drag, targets ≥ 48 px (56 px for word tiles). 7. Humour and role reversal (the child corrects the mascot) for motivation. 8. Every round has `wordIds` when it uses vocab, so the tricky-words review gets data.

### Fit with the session engine
One round = one judged `submit`. Miss 1 gives a hint, miss 2 a reveal, later misses retry. A game with *internal* tries (Wordle guesses, letter hunts) must collect them inside `mount` and submit once. Otherwise each try counts as a miss and the hints arrive too early. `ctx.sfx` and `ctx.mascot` are currently no-ops in `app.js`. Archetypes should call them anyway, and the feedback must still work without them.

## 2. Mapping to the book and units
The book's sessions follow the same rhythm: word list and odd-one-out (S1), comic + rule + writing (S3), story + verbs (S5), writing + clue picture + bingo (S7), recap (ordering, coded word, word search). Gaps in our current set against that rhythm:
- **Sentence building and punctuation** (¿? ¡!, capitals, ordering): every session from U1-S5 on and every recap. No archetype yet → `order-words`, `punctuation-pick`.
- **Error spotting** in written Spanish (accents, h, b/v, ll/y, ñ, rr). This is the core need of native speakers. `spell-fill-letters` points at the gap for them; nothing asks them to *find* the error → `fix-the-mistake`.
- **Free recall / dictation** (S7 writing, recap): `type-the-answer`, `dictado`, `letter-lock`.
- **Grammar tables** (ser/estar/tener in U1-S5, -ar/-er/-ir in U2-S5, reflexives in U3-S3): `verb-conjugator`, `sort-into-bins`.
- **Recap puzzles** (coded word, word search, crossword): `code-breaker`, `word-search`.
- **Positions and time** (U2-S3): `place-the-object`, `clock-reader`.

## 3. Candidates (18)
Cost: S ≈ one Sonnet session reusing `ui/tiles.js`; M = new widget or generator; L = new rendering or data model. Fun and Edu are 1–5. "Units" are UNITS.md ids.

| # | id | One-line idea | Skill | Key params | Difficulty levers | Units | Cost | Fun | Edu | Avoids boredom by | Risks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `order-words` *(existing idea)* | Word tiles (and ¿ ? ¡ ! . tiles) to build a sentence | syntax, punctuation, capitals | `items[]` {es, accept[]?, emoji?}, `punctuation`, `decoys`, `n` | separate punctuation tiles; look-alike decoy tiles (esta/está, Lunes/lunes); no 🔊 | u1-s5, u1-s7, u1-recap, u2-s5, u3-s5 | S | 3 | 5 | the sentence is read aloud on success; decoys turn it into a spelling puzzle at d3 | several valid orders (`accept[]` fixes it); long sentences crowd the screen on phones |
| 2 | `fix-the-mistake` *(new)* | The mascot "wrote" something with one mistake: tap the wrong word, then fix it | error detection, spelling rules, accents | `items[]` {text, wrong}, `from` + `focus`, `mode` (sentence/list), `fix` (choice/type), `allowPerfect` | free typing of the fix; "it's perfect" option; subtler traps (accent, b/v) | every unit; strongest in u1-s3 (ñ), u2-s3 (r/rr), u3-s3 (s/x), recaps | S–M | 4 | 5 | role reversal and mascot humour; a different trap per item | a child reads the wrong form many times (keep one error per item, reveal fast, always show the right form last) |
| 3 | `letter-lock` *(new, Wordle-like)* | Picture clue; guess the word in up to 6 tries; each letter shows right / in the word / not in it / missing tilde | spelling recall, deduction | `from`, `tries` 4–8, `clue` (picture/audio/both), `firstLetter` | fewer tries; no first letter; longer words; audio-only clue | u1-s1 (numbers, colours), u1-s3 (days), u2-s1 (school things), all recaps | M | 5 | 4 | deduction makes each word a puzzle; different word each play | colour-only feedback (add shapes); guesses that aren't words need no dictionary check (any letters accepted) |
| 4 | `bubble-pop` *(new, arcade)* | Bubbles drift up with spellings of the pictured word; pop the right one before it floats away (it comes back) | spelling recognition, speed | `from`, `options` 2–4, `speed` 0–3, `misspell` focus | faster drift; closer misspellings; more bubbles | u1-s1, u1-s3, u2-s3, u3-s3 | M | 5 | 3 | motion and sound; a speed bonus only | motion sickness (respect `reducedMotion`: static grid), speed favours older siblings; recognition only |
| 5 | `type-the-answer` *(existing idea)* | Picture or audio prompt; type the word with the special-letters row | recall, free writing | `items[]` {prompt, accept[]}, `from`, `hint`, `accents` | accents strict; no hint; phrases | u1-recap, u1-s7, u2-s7 | S | 2 | 5 | short; pairs well as the last exercise | dry on its own; soft keyboard (keep `inputmode=none` + row) |
| 6 | `dictado` *(new)* | Hear a short sentence, type it; per-word colour feedback | dictation, punctuation, accents | `items[]` {es}, `replay`, `accents`, `punctuation` | longer sentences; one listen; strict ¿¡ | u1-s7, u2-s7, u3-s7, recaps | M | 2 | 5 | per-word marks show progress; mascot "teacher" voice | needs a Spanish voice (fallback: show for 3 s, hide, type it = memory dictation) |
| 7 | `story-gaps` *(new, Mad Libs)* | Pick words of a kind (an animal, a colour, a feeling) for gaps; the silly story is read aloud; agreement is checked | word classes, gender/number agreement | `story` {text with `{tag}` slots}, `choose` (tiles/type), `agree` | type instead of tiles; agreement on more slots | u1-s5, u2-s1 (me gusta), u3-s1, u3-s7 | M | 5 | 4 | every play gives a different funny story | "any answer is right" weakens judging (judge on category + agreement only); avoid unkind outputs (curated pools) |
| 8 | `punctuation-pick` *(existing idea)* | Tap where ¿ ¡ ? ! go in a sentence; tell question from exclamation | punctuation | `items[]`, `marks` | both ends; question vs exclamation; intonation audio | u1-s5, u1-s7, u1-recap | S | 2 | 4 | could also be an `order-words` mode | overlaps `order-words` and `spell-fill-letters` focus `¿¡` |
| 9 | `sort-into-bins` *(existing idea)* | Drag or tap words into el/la, un/una, singular/plural bins | grammar, gender | `bins[]`, `from`, `by` (article/number) | more bins; irregulars (el agua) | u1-s3, u2-s1 | S–M | 3 | 4 | a satisfying "drop" | duplicate of match-pairs `article-noun` unless bins add plural/number |
| 10 | `verb-conjugator` *(existing idea)* | A person tile + a verb: pick or type the present form | verb forms | `verbs[]` {inf, forms}, `persons[]`, `mode` | type; irregulars; reflexive pronoun | u1-s5, u2-s5, u3-s3, u3-s5 | M | 2 | 5 | a "verb machine" animation | vocab has no conjugation data yet (author forms per item) |
| 11 | `word-search` *(existing idea)* | Find taught words in a grid | spelling, scanning | `from`, `size`, `directions` | bigger grid; diagonals; words not listed (picture list) | all recaps | M | 4 | 2 | calm puzzle; good bonus | weak learning; drag-select hard under 8 (tap first and last letter) |
| 12 | `code-breaker` *(existing idea)* | A number→letter key reveals a word or a short phrase | alphabet, letter names incl. ñ | `items[]`, `key` (fixed/shuffled) | shuffled key; a phrase | u1-s3, u1-recap | S | 4 | 2 | secret-message feel | low spelling value; it's decoding |
| 13 | `memory-flip` *(existing idea)* | Flip cards to match word ↔ picture | vocab | `from`, `pairs` | more pairs; word ↔ word (article ↔ noun) | u1-s5, u2-s1 | S | 4 | 2 | a classic | duplicates match-pairs' learning; mostly memory |
| 14 | `dialogue-complete` *(existing idea)* | Chat bubbles; choose the missing line | functional language | `dialogues[]` | more turns; typed reply | u2-s5, u2-s7 | S | 3 | 3 | characters and short stories | close to fill-gap-choice (could be a `layout: chat` param there) |
| 15 | `place-the-object` *(existing idea)* | Put an object encima/debajo/delante/detrás of another, from a written instruction | prepositions, reading | `scene`, `instructions[]` | two objects; del/de la | u2-s3, u2-s7 | L | 4 | 4 | physical and visual | scene art and drop zones are real work |
| 16 | `spot-the-words` *(existing idea)* | Tap the gaps in a run-on string to split it into words | word boundaries | `items[]` | longer strings; capitals removed | u1-s5, recaps | S | 3 | 3 | detective feel | small screens wrap long strings |
| 17 | `clap-syllables` *(new, rhythm)* | Tap the beat of each syllable, then tap the loud one; this leads to accent rules | syllables, stress, accent rule | `from`, `askStress`, `tempo` | stress question; words with tilde; faster tempo | u1-s3 (tilde), u3-s3 (syllable-order), all accent work | M | 4 | 4 | rhythm + Web Audio claps | syllable splitting needs a correct algorithm and tests; timing must be very forgiving |
| 18 | `letter-wheel` *(new, Spelling Bee-like)* | 6–7 letters around a centre letter; find taught words that use it; ranks, no fail | spelling, word search in memory | `letters` or `from`, `target` | fewer listed answers; longer words | recaps; a "weekly challenge" unit | M | 4 | 3 | open-ended, ranks only go up | only taught words count, so valid real words get rejected (show "¡Bien! Pero aquí no vale" kindly); generation needs a good letter set |

**Also looked at, not proposed:** hangman (theme, guessing by letter frequency, see `letter-lock`), crossword-lite (layout generator is L for low gain over `word-search` + `letter-lock`), bingo (needs several players or a caller; better as a `listen-pick-word` variant), falling-letters typing games (typing speed is not our goal).

## 4. Build first: the top 3

| Rank | id | Why |
|---|---|---|
| 1 | `order-words` | The book uses it in nearly every session and in every recap. It is the cheapest new game: word tiles are `spell-tiles` with words instead of letters (`ui/tiles.js` `tapOrDrag`, `.sp-tiles`). It unlocks punctuation and capitals, which no current game trains. Edu 5. |
| 2 | `fix-the-mistake` | Best fit for *native speakers learning written Spanish*: finding an error is a different skill from filling a pointed gap, and correcting the mascot is fun. Reuses the trap rules and messages already written in `spell-fill-letters` (`FOCI`, `RULES`) and its option and typing widgets. Edu 5, fun 4. |
| 3 | `letter-lock` | The fun pick (5) that is still recall, not recognition. Wordle-style deduction fits children well, and an extra "missing tilde" state teaches accents in a way no other game does. Reuses `specialLettersRow` and `sameWord`/`key`. |

Next after these: `bubble-pop` (arcade variety) and `type-the-answer` / `dictado` (pure recall).

### 4.1 `order-words` (skill: grammar)
**Screen.** Prompt line (exercise prompt, e.g. "Ordena la frase."). Optional emoji above. An answer row (`.sp-tiles.slots`), then the tile pool (`.sp-tiles`) of word tiles in shuffled order (never already in order, same loop as spell-tiles). A 🔊 button reads the full sentence, shown only at difficulty 1 and when `ctx.canSpeak` (it gives the order away, like `fill-gap-choice`). A "Comprobar" button (`.sp-check`) is enabled when the pool is empty of non-decoy tiles, or when all tiles are used.
**Interaction.** Tap a pool tile to append it to the answer row, or drag it there (`tapOrDrag`). Tap a placed tile to send it back. Keyboard: none needed. Tiles ≥ 56 px tall, wrap freely. Punctuation tiles are narrower but still ≥ 48 px wide.
**Tokenising (pure, in `logic.js`).** `tokens(es, punctuation)`. With `punctuation: true`, `¿ ¡ ? ! . ,` are their own tokens. With `false`, they stay glued to the neighbouring word ("¿Cómo", "estás?"). Spaces split words. Case and accents are kept.
**Decoys (`decoys` 0–3).** Pick words of the sentence and add a look-alike tile: accent toggled (está→esta, only if the result differs), first-letter case flipped (only for the sentence's first word or a day/month), ¿↔¡ and ?↔!. A decoy is never equal to a real token. Seeded via `rng`.
**Judge.** Answer = list of tile texts in order. Correct if `answer.join(' ')` equals one of `[es, ...accept]` after the same tokenising, comparing **exactly** (case and accents strict, spaces normalised). Feedback on a wrong answer, in this order of checks: same words but wrong order → "Las palabras están bien; cambia el orden."; an accent or case decoy used → "Mira bien las tildes y las mayúsculas."; otherwise "Casi. Lee la frase otra vez."
**Hint.** Level 1: the leading tiles that are right stay locked (at least the first), the rest go back to the pool (same idea as `spell-tiles` `leadingTiles`). Level 2: show the sentence in `.sp-reveal` to copy, decoys disabled.
**Params.**
| param | type | default |
|---|---|---|
| `items` | array of `{ es: string, accept?: [string], emoji?: string, en?: string }`, min 1 | required |
| `n` | int ≥ 1 | all |
| `punctuation` | bool | false, true at d2+ |
| `decoys` | int 0–3 | d1 0, d2 1, d3 2 |
**Validation (`make` throws, shown by `check:units`).** 2–9 tokens; `accept` entries must contain the same multiset of tokens. **Scoring:** the session's normal stars. `wordIds: []` (authored text), unless an item has `ids`. Leave that for later.
**Tests (`test/order-words.test.js`).** Tokenising both modes; same seed gives the same tiles; the shuffle is never the solved order; decoys never equal a real token; judge accepts `accept[]` orders and rejects case/accent decoys; hint level 1 locks the right prefix.
**Test hook.** None needed beyond `window.__spanishArcade.session`. Headless run: tap tiles in `round.answer` order and expect `next`.
**Units.** u1-s5 (¿Cómo te llamas?), u1-s7, u1-recap, u2-s5, u3-s5 (primero/luego/después).

### 4.2 `fix-the-mistake` (skill: spelling)
**Screen.** Mascot line in a bubble: "He escrito esto. ¿Hay algún error?". Below it, the text as a row of word buttons (one button per word, punctuation glued to the word). Step 2 appears under it after a tap: the chosen word in a box, plus either 2–3 option buttons (`.sp-opt`) or, in `fix: "type"`, a field with `specialLettersRow` (like `spell-fill-letters` type mode). With `allowPerfect`, a "¡Está perfecto!" button sits under the text.
**Interaction.** Tap a word to select it (outline). Tap another to change it. Then pick or type the fix, then "Comprobar". One submit per round: `{ at: wordIndex | -1, fix: string }` (`-1` = perfect).
**Data.**
- Authored: `items[]` of `{ text: "Mi hermano tiene un perro.", wrong: { at: 4, as: "pero" } }`. `text` is the correct sentence; `wrong.at` is the index of the word to spoil (after splitting on spaces), and `as` is the spoiled form. Or `{ text, perfect: true }` for a text with no error (needs `allowPerfect`).
- Generated: `from` (selector) + `focus` (same values as `spell-fill-letters`: `ñ rr h accent bv ll gj x …`, or `auto`). `mode: "list"` shows 3–4 taught words (by `size`), one of them misspelled with the focus's alternative spelling. `mode: "sentence"` is authored only.
**Reuse.** Move the trap table from `spell-fill-letters/logic.js` (`FOCI`, `spans`, `pickFocus`, `RULES`) into `core/spelling.js` and export a pure `misspell(word, focus, rng) -> { as, rule } | null`. A second archetype now needs it, which is the repo's rule for moving code. Update `spell-fill-letters` imports in the same commit and keep its tests green. A misspelling must never spell another taught word (reuse the existing "never another taught word" check against `pool`).
**Judge.** Correct if `at === round.at` and `sameWord(fix, round.answer, 'strict')`. For a perfect item: correct if `at === -1`. Feedback: tapped a right word → "Esa palabra está bien escrita."; right word but wrong fix → the rule line from `RULES[focus]` (or "Casi: fíjate en la tilde." for an accent slip); said "perfect" when it wasn't → "Mira otra vez: hay una palabra mal."
**Hint.** Level 1: say the rule family ("Busca una tilde que falta", from the focus) and dim the words that are clearly fine, down to 3 candidates. Level 2: outline the wrong word, show the correct form in `.sp-reveal`, and the child taps the word and picks/types it.
**Keep the wrong form short-lived.** After the round, the sentence is shown corrected (green) for 1 s before `next`. The child must see the right form last.
**Params.**
| param | type | default |
|---|---|---|
| `items` | array `{ text, wrong?: { at: int, as: string }, perfect?: bool, en? }` | optional |
| `from` | selector, optional | — |
| `focus` | enum (spell-fill-letters list + `auto`) | `auto` |
| `mode` | `list` \| `sentence` | `list` with `from`, `sentence` with `items` |
| `size` | int 3–5 | d+2 |
| `fix` | `choice` \| `type` | `choice`, `type` at d3 |
| `allowPerfect` | bool | false, true at d3 |
**Tests.** `misspell` per focus (ñ→n, rr→r, h dropped, accent dropped) and never a taught word; authored item validation (`at` in range, `as` ≠ the word); judge right/wrong index/wrong fix/perfect; same seed gives the same round; the `spell-fill-letters` tests still pass after the move.
**Test hook.** The round carries `at` and `answer`, so a headless run submits `{ at: round.at, fix: round.answer }`.
**Units.** u1-s3 (ñ), u1-s5 (¿¡ in `sentence` mode), u2-s3 (r/rr), u3-s3 (s/x), every recap.

### 4.3 `letter-lock` (skill: spelling)
**Screen.** Clue on top: the word's emoji (or 🔊 only, with `clue: "audio"`). A grid of `tries` rows × word-length cells (≥ 44 px cells; for words over 7 letters the cells shrink to fit the width). An on-screen keyboard: Spanish letter rows **including ñ** plus `á é í ó ú ü`, ⌫ and "Probar". Build it from `.sp-key` buttons, reusing `specialLettersRow` for the accent row. `inputmode=none`; a physical keyboard also works (same as spell-tiles).
**Interaction.** Type into the current row. "Probar" when the row is full. Each guess is checked **inside `mount`**, using pure `score(guess, answer)` from `logic.js`. No dictionary check: any letters are accepted (A1 children can't be expected to know valid five-letter words). Cells flip one by one (instant with `reducedMotion`). Keys take the best state seen for them.
**Letter states (colour + symbol, never colour only).** `ok` ✔ green (right letter, right place). `near` ↔ amber (in the word elsewhere). `tilde` ´ blue (right place, right base letter, wrong accent: a/á, u/ü; never n/ñ, which is a different letter). `no` · grey. Repeated letters follow Wordle counting (no more `near` marks than the letter has left).
**Submitting to the session.** When a guess is right, `submit(guess)` (correct, `next`). When the last try is wrong, `submit(lastGuess)`. The session then gives the level-1 hint and the grid resets with **2 more tries** and the hint applied. Miss 2 → reveal. Internal guesses never reach the session's counts, so stars stay fair: solving within the tries = no miss.
**Hint.** Level 1: reveal the first letter and every `tilde` position, pre-filled and locked in the new rows. Level 2: show the word in `.sp-reveal`; the child types it once to finish (copy, like other spelling games).
**Make.** Targets from `from`, letters only (`/^\p{L}+$/u`), length 3–8. Lowercase the word. Optional `firstLetter` pre-fills cell 1 of each row (on at d1). `wordIds: [id]`.
**Params.**
| param | type | default |
|---|---|---|
| `from` | selector | required |
| `tries` | int 4–8 | d1 6, d2 6, d3 5 |
| `clue` | `picture` \| `audio` \| `both` | `both`; `picture` when `!ctx.canSpeak` |
| `firstLetter` | bool | true at d1 |
`pictures: true` (the clue needs an emoji).
**Scoring and fun.** The session's stars are unchanged. Inside the game, the mascot reacts by number of tries ("¡A la primera!" … "¡Por los pelos!"). No streaks, no timer.
**Tests.** `score()` covers repeated letters (e.g. guess "perro" vs answer "pero"), the tilde state (á vs a, ü vs u), ñ ≠ n, all-correct; `make` skips words with spaces or outside 3–8; same seed gives the same rounds; judge uses `sameWord` strict.
**Test hook.** The round has `answer`; a headless run types it and presses "Probar". A second run types a wrong word `tries` times and expects the `hint` action.
**Units.** u1-s1 numbers and colours (d1, `firstLetter`), u1-s3 days, u2-s1 school things, recaps at d3 with `clue: "audio"`.

## Sources
- KQED MindShift, What's the secret sauce to a great educational game: https://www.kqed.org/mindshift/20765/whats-the-secret-sauce-to-a-great-educational-game
- Filament Games, Why effective educational games require friction: https://www.filamentgames.com/blog/why-effective-educational-games-require-friction
- ScreenWise, When educational games aren't actually educational: https://screenwiseapp.com/guides/when-educational-games-aren-t-actually-educational
- ScreenWise, Gus on the Go: Spanish: https://screenwiseapp.com/media/gus-on-the-go-game
- Common Sense Media, Lingokids: https://www.commonsensemedia.org/app-reviews/lingokids-playlearning
- REF 2021 impact case, Teach Your Monster to Read: https://results2021.ref.ac.uk/impact/7c8d1f47-70f3-45ac-8a99-9f1e9d42f162/pdf
- DuoPlanet, When Duolingo makes you sweat: https://newsletter.duoplanet.com/posts/when-duolingo-makes-you-sweat-2
- DEV, Why Duolingo's gamification works and when it doesn't: https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4
- EdWeek, Do timed tasks really worsen math anxiety?: https://www.edweek.org/teaching-learning/do-timed-tasks-really-worsen-math-anxiety/2024/08
- The Courier, Wordle for kids: https://thecourier.co.uk/fp/education/3180710/wordle-for-kids-why-its-good
- Mumsnet, Wordle for kids' spellings: https://www.mumsnet.com/talk/primary/4475422-Its-like-wordle-but-for-kids-spellings
- Tes, Do vocabulary games boost literacy?: https://www.tes.com/magazine/teaching-learning/secondary/do-vocabulary-games-boost-literacy
- Wikipedia, The New York Times Spelling Bee: https://en.wikipedia.org/wiki/The_New_York_Times_Spelling_Bee
- Wikipedia, Bookworm (video game): https://en.wikipedia.org/wiki/Bookworm_(video_game)
- Rainbow Resource, Mad Libs and ELA: https://www.rainbowresource.com/blog/mad-libs-and-ela-the-benefits-outweigh-the-nonsense/
- Montessori Mom, The moveable alphabet: https://montessorimom.com/moveable-alphabet/
- Teach Starter, Kid-friendly alternatives to hangman: https://www.teachstarter.com/gb/blog/kid-friendly-alternatives-to-hangman-in-the-classroom-2
- Nielsen Norman Group, Children's UX: physical development: https://www.nngroup.com/articles/children-ux-physical-development/
- Nielsen Norman Group, Kids' cognition: https://www.nngroup.com/articles/kids-cognition/
- Not read (fetch blocked): the Games and Learning article on Teach Your Monster to Read (gamesandlearning.com/?p=1299) and the PMC paper on retrieval practice in elementary school children (PMC4786565). The claim that recall beats recognition rests on the Filament summary of desirable difficulties, not on that paper.

## Questions for the owner
1. **May `fix-the-mistake` show misspelled words on screen?** Seeing wrong forms can stick. *Recommended: yes*, with one error per item, the corrected text always shown last, and no error-spotting at difficulty 1 in the first two units.
2. **May `letter-lock` accept guesses that aren't real words?** *Recommended: yes*. A dictionary would be large and would reject words children know but we didn't teach.
3. **Timers anywhere?** *Recommended: only in `bubble-pop` (later), as a bonus that is off at difficulty 1, never ending a round, and with a static mode for `reducedMotion`.*
4. **Move the spelling-trap table from `spell-fill-letters` into `core/spelling.js` for `fix-the-mistake`?** It touches a built archetype. *Recommended: yes, in the same task, with the existing spelling tests as the guard.*
5. **Should the mascot that "makes mistakes" be the app's fox or a book character?** *Recommended: the app's own fox mascot*, so no book character is shown getting spelling wrong and we stay clear of the book's cast.
6. **Should `punctuation-pick` become a mode of `order-words` (punctuation tiles + ¿¡ decoys) instead of a separate archetype?** *Recommended: yes*, which saves one build and gives one less game type for children to learn.
