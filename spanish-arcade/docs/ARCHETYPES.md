# Archetype ideas

Reusable mini-game types. Each is parameterised (see [PLAN.md §4.3](PLAN.md)) and combined across units with rising difficulty. Status: `idea` → `task-NNN` (assigned) → `done`. When you build one, write its params table in `archetypes/<id>/README.md` and tick it here.

| id | Idea | Skill | Key params | Difficulty levers | Status |
|---|---|---|---|---|---|
| `listen-pick-word` | Hear a word (speech synthesis); tap the right word or picture | listening, vocab | `from`, `options`, `answerAs` (word/picture) | more options; similar-looking distractors; no replay | done |
| `read-answer` | Short text, then pick the answer (a/b/c or true/false), optionally with a picture | reading comprehension | `text`, `questions[]`, `kind` (choice/tf) | longer text, inference questions | done |
| `fill-gap-choice` | Sentence with a gap; pick the word that fits | grammar, vocab | `items[]` or `from`, `options`, `focus` (article, verb form, preposition) | more options; closer distractors | done |
| `spell-tiles` | Picture/audio prompt; drag letter tiles to build the word | spelling | `from`, `extraLetters`, `hintLetters` | extra decoy letters; no hint | done |
| `spell-fill-letters` | Word with missing letters (ñ, r/rr, s/x, accents, h) | spelling rules | `from`/`items`, `focus` | more gaps; two-way choice → free typing | done |
| `odd-one-out` | Tap the intruder in each cloud of words | categories | `groups[]` or `tags` | subtler intruder | done |
| `match-pairs` | Join word ↔ picture/emoji, article ↔ noun, question ↔ answer | vocab, grammar | `pairs[]` or `from`, `mode` | more pairs; text-only | done |
| `order-words` | Put words in order to make a sentence | syntax | `sentences[]` | longer sentences; accents/punctuation tiles | done |
| `word-search` | Find the words in a grid | spelling, vocab | `from`, `size`, `directions` | bigger grid, diagonals | idea |
| `sort-into-bins` | Drag words into el/la, un/una, singular/plural, masculine/feminine | grammar | `bins[]`, `from` | more bins; irregulars | idea |
| `true-false-listen` | Listen to a sentence; true or false against a picture | listening | `scene`, `statements[]` | longer statements | idea |
| `clock-reader` | Read a clock and choose/type the Spanish time | numbers, time | `times[]`, `style` (en punto / y media / y cuarto / menos cuarto) | more time forms | idea |
| `punctuation-pick` | Add ¿ ¡ at the start and end of sentences | punctuation | `items[]` | tell question from exclamation | idea |
| `verb-conjugator` | Pick/type the right present form (ser/estar/tener, -ar/-er/-ir, reflexives) | grammar | `verbs[]`, `persons[]` | irregulars; reflexive pronoun | idea |
| `memory-flip` | Flip cards to match word ↔ picture or word ↔ word | vocab | `from`, `pairs` | more pairs; hide pictures | idea |
| `spot-the-words` | Tap where to split a run-on string into words | word boundaries | `sentences[]` | longer string | idea |
| `place-the-object` | Drag objects to *encima / debajo / delante / detrás* in a scene | prepositions | `scene`, `instructions[]` | two objects; del/de la | idea |
| `code-breaker` | Number→letter code reveals a word | alphabet | `words[]` | shuffled code; longer word | idea |
| `dialogue-complete` | Chat bubbles; choose the missing reply | functional language | `dialogues[]` | more turns | idea |
| `crossword-lite` | Small crossword from vocab with picture clues | spelling | `from`, `size` | larger grid | idea |
| `who-is-who` | Ask yes/no questions to find the character (vs the computer) | questions, description | `cast[]`, `traits` | more traits | idea |
| `syllable-order` | Put syllables in order, speaking each | syllables, spelling | `from` | more syllables | idea |
| `veo-veo` | "Veo, veo… empieza por la letra…" guess the object | letters, vocab | `scene`, `from` | harder scenes | idea |
| `colour-by-code` | Colour regions by a colour-name code | colours, reading | `scene`, `legend` | more colours | idea |
| `bingo` | Pick N words, mark them as they are called | listening, vocab | `from`, `n` | bigger card | idea |
| `type-the-answer` | Picture or audio prompt, typed answer; accepts a list of correct forms (accents optional) | spelling, recall, free writing | `items[]` (prompt, `accept[]`), `hint` | accents required; no hint; longer answers | idea |
| `say-it` | Read a line aloud, then self-rate (speech recognition only as an optional extra, and only on-device with no audio stored or sent) | speaking, intonation | `lines[]`, `model` (audio) | longer lines; no model audio | idea |
| `tap-in-text` | Tap every word of one category in a short text (family words, verbs) | reading, word classes | `text`, `category`, `targets[]` | more targets; mixed categories | idea |
| `form-card` | Fill labelled fields (passport, ID card) from an invented profile | personal-data vocab | `fields[]`, `profile` | more fields; free typing | idea |
| `survey-tally` | Fixed question frame; ask the characters, tally answers in a table | question forms | `questions[]`, `characters[]` | more questions | idea |
| `whisper-chain` | Hear a whispered phrase, repeat it to pass it on | listening memory | `phrases[]`, `chain` | longer phrases | idea |
| `free-list` | Learner builds their own word list on a topic; saved for review | vocab recall | `topic`, `min` | timed; fewer hints | idea |
| `fix-the-mistake` | The mascot "wrote" a text with one spelling mistake: tap the wrong word, then fix it | error detection, spelling rules | `items[]` {text, wrong}, `from` + `focus`, `mode`, `fix`, `allowPerfect` | free typing of the fix; "it's perfect" option; subtler traps | done |
| `letter-lock` | Wordle-like: picture clue, guess the word in N tries; letters show right / elsewhere / missing tilde / absent | spelling recall, deduction | `from`, `tries`, `clue`, `firstLetter` | fewer tries; no first letter; audio-only clue | done |
| `bubble-pop` | Bubbles drift up with spellings of the pictured word; pop the right one (missed bubbles come back; speed is a bonus only) | spelling recognition | `from`, `options`, `speed`, `misspell` | faster; closer misspellings | idea |
| `dictado` | Hear a short sentence, type it; per-word marks | dictation, punctuation, accents | `items[]`, `replay`, `accents`, `punctuation` | longer; one listen; strict ¿¡ | idea |
| `story-gaps` | Mad Libs: pick words of a kind for gaps, the silly story is read aloud; agreement is checked | word classes, agreement | `story`, `choose`, `agree` | typed words; more agreement slots | idea |
| `clap-syllables` | Tap the beat of each syllable, then the loud one (leads to accent rules) | syllables, stress | `from`, `askStress`, `tempo` | stress question; faster tempo | idea |
| `letter-wheel` | Spelling Bee-like: letters around a centre letter, find taught words; ranks, no fail | spelling, recall | `letters` or `from`, `target` | fewer listed answers; longer words | idea |

**Research and next batch**: [research/GAMES.md](research/GAMES.md) compares 18 candidates and recommends `order-words`, `fix-the-mistake` and `letter-lock` next, with specs.

**First batch**: listen-and-pick, read-and-answer, complete-the-sentence with options, spelling, puzzles. Tasks 006–010.

Mix rule for units: 5–6 exercises, at least 3 different archetypes, one spelling exercise, one listening exercise, and difficulty non-decreasing.
