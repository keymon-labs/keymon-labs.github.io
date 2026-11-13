# Questions for the owner (ledger)

Collected from the research round (docs in this folder). Each row has the call made so far, so work was not blocked. Reply with changes only; silence keeps the assumption. Status: `assumed` until the owner confirms.

## Decisions taken by the coordinator
| # | Question | Assumed answer | Cost if wrong | Status |
|---|---|---|---|---|
| D1 | Which games first? | `order-words` (with a punctuation mode), `fix-the-mistake`, `letter-lock`. `type-the-answer` follows after. | Re-pick; archetypes are independent | assumed |
| D2 | Which units first? | `a1-u1-s3`, `a1-u1-s5`, `a1-u1-s7` (the book's order). Units 2 and 3 are digested in `docs/book/u2.md`, `u3.md` for later | Data only | assumed |
| D3 | Is `punctuation-pick` a mode of `order-words`? | Yes | One more archetype later | assumed |
| D4 | Does task 026 replace task 023? | Yes | None | assumed |

## Mixing within a session (owner remark, 12 Nov)
| # | Question | Recommendation | Status |
|---|---|---|---|
| M1 | Each exercise plays about 5 rounds of the same game in a row (about 30 rounds per unit). Mix them more? | Yes, a little: split each exercise into runs of at most 3 rounds and alternate runs of the 3 exercises in a leg (A3 B3 C3 A2 B2 C2), keeping difficulty bands. Not a full round-by-round shuffle: switching games every round costs kids a re-read of the instructions. Task 036. | open |

## UI (from UI-ADVICE.md)
| # | Question | Assumed answer | Status |
|---|---|---|---|
| U1 | Empty slots for word length in spell-tiles | Yes at difficulty 1-2, none at 3 | assumed |
| U2 | Exit guard | ✕ in header plus a two-button confirm sheet | assumed |
| U3 | match-pairs checking | Pair by pair at 1-2, whole board with Comprobar at 3 | assumed |
| U4 | After a correct answer | Auto-advance after ~1.2 s or when voice ends (max 3 s); tap to go sooner | assumed |
| U5 | Hint button costs a star | Counts as one miss | assumed |

## Engagement (from ENGAGEMENT.md)
| # | Question | Assumed answer | Status |
|---|---|---|---|
| E1 | Streak chip | Dropped; week flower plus total days played | assumed |
| E2 | Shuffle | Within a difficulty band, never the same archetype twice in a row, `pin` opts out | assumed |
| E3 | Daily limits | Parked by the owner (not now); kept as an idea in UNITS.md | deferred |
| E4 | Surprise stickers | One cosmetic surprise per leg end, finite set of ~12, no duplicates until complete | assumed |
| E5 | Word stickers | One per mastered word (3 first-try successes on 3 days) | assumed |
| E6 | Mascot art | Emoji and CSS first, own SVG fox after task 030 | assumed |

## Games (from GAMES.md)
| # | Question | Assumed answer | Status |
|---|---|---|---|
| G1 | May `fix-the-mistake` show misspelled words | Yes: one error per item, correction shown last, none at difficulty 1 | assumed |
| G2 | `letter-lock` accepts non-words | Yes | assumed |
| G3 | Timers | Only in a later `bubble-pop`, bonus, off at difficulty 1 | assumed |
| G4 | Move spelling traps into `core/spelling.js` | Yes, in task 028 | assumed |
| G5 | Mascot that makes mistakes | The app's own fox, not a book character | assumed |

## Visuals (from VISUALS.md)
Own SVG art plus Fredoka and Nunito (OFL) and Phosphor icons (MIT); OpenMoji for stickers optional. Four questions with recommended answers are at the end of VISUALS.md. Status: assumed.

## Book (from u2.md and u3.md)
Clock style (12-hour spoken only), speaking exercises postponed, which playground games to make, whether the health topic in Unit 3 suits your child, superhero builder, Christmas extras. Not blocking: those units are not in this round.

## Needs the owner (cannot be assumed)
- Check the Spanish of every new sentence, unit and mascot line (tasks 032, 033 end in `review`).
- Say if any assumption above is wrong.

## Round 2 (13 Nov): audio, pipeline, age bands
| # | Question | Assumed answer | Cost if wrong | Status |
|---|---|---|---|---|
| A1 | Commit generated MP3 clips (~2 MB now, 10-12 MB for the whole book)? | Yes | Move to a release asset | assumed |
| A2 | Is the adult male Piper voice (davefx, CC0) good enough for children? | Try it: you listen to ~20 clips before it becomes the default; otherwise recorded clips by a non-family adult (CC0) through the same manifest | Regenerate with another voice | open |
| A4 | Allow "ask owner" voices (sharvard, mls, XTTS, MMS, Kokoro)? | No | Different voice | assumed |
| A5 | Who generates the clips? | A GitHub Action that opens a PR, or a local script. The sandbox cannot reach the voice host | You run it once | open |
| A6 | Speak the prompts ("Escucha y toca...") too? | Practice text only for now | Add later | assumed |
| P1 | Existing units' status once `status` exists | `review` until you approve | None | assumed |
| P2 | May contributed units reuse the book's cast by name? | No: invented characters only (copyright risk grows with contributors) | Rename | assumed |
| P3 | Who approves `review` -> `approved`? | You | None | assumed |
| P4 | Spain Spanish only in the hints and spelling rules? | Yes | Text edits | assumed |
| B1 | Store an optional age band per profile? | Yes, picked by the parent, no birth date | Drop the field | assumed |
| B2 | `paragraph-editor`: its own archetype or a mode of `fix-the-mistake`? | Own archetype | Merge later | assumed |
| B3 | May games show agreement errors on screen (for the editor games)? | Yes, corrected last | Hide in the lowest band | assumed |
| B4 | Where do A2 and past-tense contents come from? | The next book (A1 semester 2 and A2): through the pipeline | None | open |
| X1 | The book has units 0-3 and no unit 4. Next content = units 2 and 3, then the next book | Yes | None | assumed |
| X2 | 036 wording "Otro juego" and a lone exercise may run past 3 rounds | Yes | Copy change | assumed |
| X3 | listen-pick-word with a voice shows no picture; landscape overlay of feedback | Keep | CSS | open |
