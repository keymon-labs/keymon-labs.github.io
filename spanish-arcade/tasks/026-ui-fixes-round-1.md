---
id: "026"
title: UI fixes round 1: layout stability, exit guard, landscape, tap targets
model: Sonnet 5.5
why_model: Routine UI work from a written audit; no contracts change.
status: review
depends_on: []
touches: [spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/ui/**, spanish-arcade/archetypes/*/index.js, spanish-arcade/test/**]
---
## Prompt
Implement every P0 item and the cheap (S) P1 items of `docs/research/UI-ADVICE.md` (read it first; screenshots were taken from the current app). Headline items: spell-tiles tray keeps its tiles in place and disables used ones (no reflow; removing a letter does not shift the word; empty slots shown at difficulty 1-2); Saltar and Salir spaced apart, Salir becomes a header ✕ with a two-button confirm sheet ("Seguir jugando" is primary); feedback area has reserved height so buttons do not jump; no blank screen while voices load; every exercise fits landscape 844x390 without scrolling; scroll resets on each new round; tap targets >= 48px. Apply the assumptions in `docs/research/QUESTIONS.md` (UI section). Do not edit `archetypes/*/logic.js` (task 028 owns spelling code).

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Each P0 item verified in a headless Chromium run at 390x844 and 844x390 (list the checks in the task notes); `npm test` passes unchanged; no personal data.

## Notes
Implemented UI-ADVICE P0 #1-8 plus P1 #5 (no text change on options), #9 (tiles, Comprobar primary), #18 (no-voice chip once), #20 (speaker keeps its slot), #24 (no h1 outline), #25 (dots + round bar), #35 (no footer in a round). Skipped: #14 hint button, #15 longer correct pause, #16 match-pairs, #22/#23 navigation, #26 result screen, P2 items.

Checks (headless Chromium via dist/, 390x844 and 844x390, touch, no page errors in either):
- Tray stability: after 3 taps every tray tile box and every slot box is unchanged; removing slot 2 leaves a hole and later letters stay put; refilling takes the first empty slot.
- Exit guard: header X and history.back() open the sheet, round stays mounted, "Seguir jugando" closes it. Skip needs two taps (first shows "Toca otra vez").
- No layout shift: Saltar and Comprobar boxes unchanged after a check; CLS 0.
- No blank start: stage has content within ~40 ms of navigating to play.
- Fit: all 6 exercises of a1-u1-s1 have no page scroll and no clipped controls in both orientations; Saltar inside viewport; at text size 150% the spell-tiles round still has no page overflow.
- Scroll reset: stage scrollTop and scrollY are 0 and the prompt is in view after a new round.
- Target size: every visible button/input is at least 48x48 (the 44 px floor applies only to landscape slots of words over 9 letters).

Rulings:
- Ruling: spell-tiles slots at difficulty 3 show only the letters placed (no empty sockets), capped at the answer length — keeps the fixed-slot model so removing a letter never shifts the word.
- Ruling: Comprobar stays inside each spelling archetype (restyled primary, "Pon las letras" when empty) instead of moving to the shell action bar — avoids a contract change; the shell bar holds Saltar only.
- Ruling: the feedback strip is the archetype `.status` paragraph (min-height 2.9em, 1.5em in landscape); the shell `#live` sits left of Saltar for skip text and debug.
- Ruling: Saltar asks to tap twice (3 s window) rather than hold-to-confirm.
- Ruling: the round starts after voices are known or 400 ms, whichever is first; the speaker appears from the next round if voices arrive late.
- Ruling: no hint button (P1 #14 is M effort and touches core/session).
