---
id: "006"
title: Archetype listen-pick-word
model: Sonnet 5.5
why_model: Clear contract; the main risk is audio behaviour on the target device.
status: done
claimed: 2026-11-07
depends_on: ["001"]
touches: [spanish-arcade/archetypes/listen-pick-word/**, test/listen-pick-word.test.js]
---
## Prompt
Implement `listen-pick-word` (see `docs/ARCHETYPES.md`): speak the target word via `speechSynthesis` (`es-ES`, falling back to any `es-*` voice), with a replay button and a slow-speed button; the child picks the word or picture. Params: `from`, `options`, `answerAs`, `replay`. Use `ui/speech.js` from task 001 (don't rewrite it). When no Spanish voice exists, switch to picture → pick the word (never matching identical words) with a small notice. Pure `make`/`judge` in `logic.js` with tests (distractors never equal the answer; difficulty raises similarity).

## Acceptance
- Works in headless Chromium (mock speech); fallback path tested. Tap targets large; picture mode uses emoji or our own art.
- `archetypes/listen-pick-word/README.md` documents params and a copy-paste unit example.

## Notes
Record any voice-quality concerns; recorded clips are a later task.

Ruling: extra `similar` param kept — the validator rejects unknown params, so difficulty can only raise similarity through a declared field — cost if wrong: one param to drop.
Ruling: distractors that sound like the answer (hola/ola, vaca/baca) are always dropped, with ñ and ch protected; the z/ce/ci rule is deliberately conservative — a child cannot tell homophones apart by ear — cost if wrong: fewer options in rare pools.
Ruling: a no-voice round for a target without an emoji is dropped by `make` as a last-resort guard; the guarantee belongs to the unit validator (task 014): reject an exercise whose selector can pick non-emoji words for an archetype that needs pictures — cost if wrong: authors get short rounds instead of an error.
Reviewed by Opus, then two scoped Sonnet re-reviews of the fix rounds: clean. Not checked: real voice quality and autoplay on the target device (the speaker button is the reliable path); the mount is verified only by a throwaway harness until the shell plays a real unit.
