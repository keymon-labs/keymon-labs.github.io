---
id: "026"
title: UI fixes round 1: layout stability, exit guard, landscape, tap targets
model: Sonnet 5.5
why_model: Routine UI work from a written audit; no contracts change.
status: todo
depends_on: []
touches: [spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/ui/**, spanish-arcade/archetypes/*/index.js, spanish-arcade/test/**]
---
## Prompt
Implement every P0 item and the cheap (S) P1 items of `docs/research/UI-ADVICE.md` (read it first; screenshots were taken from the current app). Headline items: spell-tiles tray keeps its tiles in place and disables used ones (no reflow; removing a letter does not shift the word; empty slots shown at difficulty 1-2); Saltar and Salir spaced apart, Salir becomes a header ✕ with a two-button confirm sheet ("Seguir jugando" is primary); feedback area has reserved height so buttons do not jump; no blank screen while voices load; every exercise fits landscape 844x390 without scrolling; scroll resets on each new round; tap targets >= 48px. Apply the assumptions in `docs/research/QUESTIONS.md` (UI section). Do not edit `archetypes/*/logic.js` (task 028 owns spelling code).

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- Each P0 item verified in a headless Chromium run at 390x844 and 844x390 (list the checks in the task notes); `npm test` passes unchanged; no personal data.

## Notes
