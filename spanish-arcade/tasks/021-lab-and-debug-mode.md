---
id: "021"
title: Lab page and hidden debug mode
model: Sonnet 5.5
why_model: New page reusing the existing archetype contract plus a small shell hook; two disjoint parts.
status: done
claimed: 2026-11-07
depends_on: ["018", "019"]
touches: [spanish-arcade/lab/**, spanish-arcade/app.js (debug toggle and menu link only), spanish-arcade/ui/settings.js, spanish-arcade/core/profiles.js (a `debug` setting only), spanish-arcade/test/**, spanish-arcade/README.md]
---
## Prompt
Owner wants to iterate fast on games from his phone. Part A: a lab page `spanish-arcade/lab/index.html` that loads any archetype with editable params (JSON plus simple toggles) and sample vocab, plays rounds with the real archetype `mount` and a fake session (hint after 1 miss, reveal after 2, same rules as the real session), a new-seed button, a hint/reveal state view, an exercise picker for any unit (`?unit=a1-u1-s1&exercise=traps-type`), a result log, and a button that copies a short feedback note. No profiles, nothing saved except the debug flag. Part B: hidden debug mode: tapping the version/footer line 10 times in the main app toggles a `debug` setting; while on, the main menu shows a 'Laboratorio' link to `./lab/` and a 'Salir del modo de pruebas' control; tapping 10 times again also turns it off. The lab is public but not linked from the landing page and is marked 'no es para niños'. All UI text Spanish (the guard test applies).

## Acceptance
- Lab plays every archetype in the repo and the real unit's exercises; debug toggle works headless; tests for the toggle count logic and the fake session rules; `npm test`, build pass; offline/service worker unaffected.

Ruling: the lab replicates the app footer (the app's footer builder lives in app.js and is not exported) — cost if wrong: export it later.
Ruling: the lab's "Saltar ronda" resumes a snapshot one round further, not session.skip() — cost if wrong: switch it to session.skip().
Fixed by the coordinator: a stray "null" printed on the home and profile screens when debug mode was off.
