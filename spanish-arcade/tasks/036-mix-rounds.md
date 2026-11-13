---
id: "036"
title: Mix games inside a leg (runs of at most 3 rounds)
model: Sonnet 5.5
why_model: Session logic change with saved-data risk; Opus reviews the diff.
status: review
depends_on: ["031"]
touches: [spanish-arcade/core/session.js, spanish-arcade/core/progress.js, spanish-arcade/app.js, spanish-arcade/test/session.test.js]
---
## Prompt
Owner remark: too many rounds of the same game in a row. Today each exercise plays its ~5 rounds back to back (task 031 only orders whole exercises). Split each exercise into runs of at most 3 rounds and alternate the runs of the exercises in a leg (for example A3 B3 C3 A2 B2 C2), keeping the difficulty-band order and `pin`. Show the exercise's instruction line again when the game changes. Per-exercise stats and stars must stay per exercise; old snapshots must still load (fixture). Needs the owner's yes first (QUESTIONS.md M1); if working unattended, take the recommendation and record it as a Ruling.

## Acceptance
- Tests: no more than 3 consecutive rounds of one exercise in a leg; every round is still played once; resume mid-run works; old snapshot fixture loads. Opus review of the diff before merge.

## Notes
- Ruling (owner said YES to the recommendation, QUESTIONS.md M1): runs of at most 3 rounds, alternating the exercises of a leg, difficulty bands and `pin` unchanged. Not a round-by-round shuffle.
- Done: `core/session.js` plays a leg as runs of RUN_MAX=3 in leg order (A3 B3 C3 A2 B2 C2). At a switch it prefers another archetype than the run just ended and checks the rest can still be played without a run over 3 (`feasible`); a lone exercise with rounds left may run on. Snapshot adds `finished` (ids), `run` ({id,n}) and `played` (rounds per exercise); `exerciseIndex` = number finished. `current` gains `position`, `finished`, `switched`. `resolveOrder` returns `finished`; `unitProgress` uses it. Old snapshots (no new fields, or a roundIndex/exerciseIndex moved by hand as lab/logic.js does) still load: fixture `test/fixtures/snapshot-pre-036.json`.
- App: trail marks done by id, segment marks kept per exercise, a "Otro juego" line above the instruction when the game changes (no CSS added: style.css belongs to task 038, which may style `.game-switch`).
- Stats, stars, exerciseDone (fires at an exercise's last round) and legDone (end of the leg) are unchanged in meaning.
