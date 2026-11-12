---
id: "032"
title: Celebrations, sound and result screen
model: Sonnet 5.5
why_model: UI feel work on top of the visual kit; mostly additive.
status: review
depends_on: ["030", "031"]
touches: [spanish-arcade/ui/sfx.js, spanish-arcade/ui/celebrate.js, spanish-arcade/app.js, spanish-arcade/style.css, spanish-arcade/test/sfx.test.js]
---
## Prompt
Implement E1, E2, E3 and E11 from `docs/research/ENGAGEMENT.md` §4: synthesised sound effects on `shared/audio.js` (respect the `sound` setting, unlock on first tap), celebration visuals by size (answer, leg, unit, sticker) with reduced-motion fallbacks, growth-mindset feedback wording audit with a short list of mascot lines (original Spanish; the owner reviews), and a rebuilt result screen with stars sequence and personal-best ribbon.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- No sound or motion when disabled or reduced; wording audit listed in notes for owner review; headless run with sound off and reduced motion has no errors.

## Notes
Done (E1, E2, E3 partly, E11): `ui/sfx.js` (pure pentatonic table, `createSfx`, `unlockOnFirstTap`), `ui/celebrate.js`, hooks in `app.js` (right answer good/ok/almost, exercise done step + 10 confetti, parada leg sound + 24 confetti + effort line, result unit sound + 40 confetti + sticker + pb), CSS at the end of `style.css`, `isPersonalBest` in `core/progress.js`, `test/sfx.test.js`. Test hook `__spanishArcade.answer(a)`.
Ruling: the personal-best ribbon compares with the best result before this attempt (stars or exercises without help), not the previous one, so the "mejor" label is always true; never on a first attempt.
Ruling: sticker on the result screen is cosmetic and fixed per unit (no album/storage yet); no mascot-lines.json yet (task 012), so effort and result lines are short fixed lists in `ui/celebrate.js`.
Not done: archetype strings still use ✖/❌ icons next to "Casi..." (kind words, but the cross icon is punishing-looking); changing them touches every archetype, so it is left for the owner to decide. "Echo rescued" and "Meta del día" celebrations need features that do not exist yet.
New Spanish strings for owner review: "¡Lo has conseguido!" (right after help); parada lines "¡Buen tramo, sigue así!", "¡Has probado y has avanzado!", "¡Vamos muy bien!", "¡Qué buena parada!" (+ "Faltan N ejercicios."); result lines 3 stars "¡Todo el camino y sin tropiezos!", 2 stars "¡Lo has conseguido, buen trabajo!", 1 star "¡Has llegado al final! La próxima vez, más."; "¡Tu mejor intento!"; "¡Pegatina nueva!"; "Jugar otra vez".
Checks: `npm test` pass (382), `npm run build` ok; headless 390x844 unit run, sound on (tones played after the first tap) and with reduced motion + sound off (0 tones): no page errors, ribbon shows on a better replay. Screenshots in the session gallery: 032-right-answer.png, 032-parada.png, 032-result.png.
