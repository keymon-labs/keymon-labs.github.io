---
id: "036"
title: Mix games inside a leg (runs of at most 3 rounds)
model: Sonnet 5.5
why_model: Session logic change with saved-data risk; Opus reviews the diff.
status: todo
depends_on: ["031"]
touches: [spanish-arcade/core/session.js, spanish-arcade/core/progress.js, spanish-arcade/app.js, spanish-arcade/test/session.test.js]
---
## Prompt
Owner remark: too many rounds of the same game in a row. Today each exercise plays its ~5 rounds back to back (task 031 only orders whole exercises). Split each exercise into runs of at most 3 rounds and alternate the runs of the exercises in a leg (for example A3 B3 C3 A2 B2 C2), keeping the difficulty-band order and `pin`. Show the exercise's instruction line again when the game changes. Per-exercise stats and stars must stay per exercise; old snapshots must still load (fixture). Needs the owner's yes first (QUESTIONS.md M1); if working unattended, take the recommendation and record it as a Ruling.

## Acceptance
- Tests: no more than 3 consecutive rounds of one exercise in a leg; every round is still played once; resume mid-run works; old snapshot fixture loads. Opus review of the diff before merge.

## Notes
