---
id: "005"
title: Progress report and badge cards
model: Sonnet 5.5
why_model: Straightforward rendering once the data contracts exist.
status: todo
depends_on: ["002", "004"]
touches: [spanish-arcade/ui/report.js, ui/badge-card.js, report.css, test/report.test.js]
---
## Prompt
Per profile: a print-friendly report page (`window.print()` → PDF) with full name, class, date, per-unit stars and accuracy, per-exercise results, badges earned, and the credit line. Badge cards: canvas-drawn PNG (original art) with badge, unit title, name, class, date, credit line; download and Web Share. Default name = first name + surname initial; full name is an opt-in setting. A "badges" gallery where earned badges can be re-opened and re-shared later. Pure data → report-model function tested without DOM.

## Acceptance
- Report fits A4 portrait, readable in black and white. Badge PNG shows the name chosen by the setting and the class given in the profile. Works offline.
- Tests use invented profiles.

## Notes
The teacher may only receive a PNG or PDF, so everything needed to identify the child and unit must be on the card.
