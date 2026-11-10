# Maths Arcade

Mini games for times tables (to 12), adding and taking away (to 100) and simple fractions.
The maths is the control: the number typed decides what happens in the game, so a wrong
answer shows *why* it was wrong (the stone lands short, the wrong block gets hit).

## Layout
```
index.html, app.js, style.css   shell: hash routes (#/, #/<game>, #/<game>/<level>), menus, stars
core/                           pure logic, no DOM, unit tested
  (seeded random: ../shared/rng.js)
  problems.js                   skill generators: multiplication, addition, subtraction, fractionOf
  session.js                    rounds, retries, hint after 1 miss, answer after 2, stars
  progress.js                   best stars per level (localStorage, injected)
ui/                             reusable DOM pieces for any game
  keypad.js                     number keypad + physical keyboard
  play-layout.js                stage + question/feedback/keypad panel, result card
games/index.js                  list of mini games (menu order)
games/catapult/
  index.js                      game module: wires session, scene, keypad (see shape below)
  logic.js                      round KINDS: maths problem -> shot; judge(); no DOM, tested
  scene.js                      canvas drawing and animation only
  levels.json                   level data
games/pop/                      Pop, and the funnel that Match reuses
  index.js                      Pop game module: pick a touching pair, type the product
  play.js                       shared by Pop and Match: layout, funnel, picking, score, streak, stars
  world.js                      physics (Matter.js): V-shaped funnel, pour, touching pairs; no DOM, tested
  logic.js                      ball size and numbers, points, hints; no DOM, tested
  scene.js                      canvas: funnel, balls, selection glow, pop bursts, results tray
  levels.json                   ball count, highest number and the tables to practise
games/match/                    Match: pick the pair that makes one of the result balls
  index.js                      game module (uses ../pop/play.js, no keypad)
  logic.js                      result balls from touching pairs; no DOM, tested
  levels.json                   as Pop, plus `targets` (2 or 3 result balls at a time)
test/*.test.js                  node --test (run `npm test` from the repo root)
```

## Game module shape
```js
export default { id, title, emoji, blurb, levels,
  mount(host, level, { onFinish({ stars, heading?, detail? }), onExit() }) -> { destroy() } }
```
`heading` and `detail` (both optional) replace the catapult wording on the result card and add a line (the score).
Keep rules in a DOM-free `logic.js` with tests; keep drawing in `scene.js`.

## Common edits
- **New level**: add an entry to `games/catapult/levels.json` (`id` unique, `kind`, `rounds`, `skill` = generator options). `npm test` checks every level generates valid, hittable rounds.
- **New round kind**: add to `KINDS` in `logic.js` (`make` returns answer, positions, prompt, hint; `land` maps the typed number to a landing), then a test.
- **New skill**: add a generator to `core/problems.js` + a range test.
- **New game**: `games/<id>/` with the same files, register in `games/index.js`.
- **New Pop or Match level**: add an entry to `games/pop/levels.json` or `games/match/levels.json` (`balls` even and at most 36, or the funnel overflows; `max` ≤ 12; `tables` = numbers to practise, `[]` for all; Match also `targets` 2 or 3). About 60% of the balls come from `tables`. `npm test` pours and plays every level.

## Pop and Match
Balls numbered 1 to `max` pour into a funnel (a V with a small dip at the bottom) and pile up at the bottom
centre, bumping into each other (Matter.js). The ball for 1 is the smallest and `max` the biggest, on a soft
curve, not proportional. Two balls count as touching when their edges are within a few units.
- **Pop**: pick two touching balls, type their product, both pop.
- **Match**: 2 or 3 result balls roll into a tray under the funnel, each the product of a pair that touches
  right now. Pick a pair that makes one of them: the pair and that result ball pop. No typing.

When a pair pops, the balls above fall and the pile resettles. Score: 10 + the product, plus up to +100% for a
streak of first-try pops. Stars come from how many pairs were popped first try. The bottom is a small V and the
balls are slippery on purpose: loose balls always roll together, so with an even count there is always a move
(a test plays random games to prove it; `nudge()` in `world.js` is only a safety net).

UI is checked by loading pages in headless Chromium, not unit tested.

Library: Matter.js (MIT), see the root README and CREDITS.md. Shared modules used: `shared/pwa.js` (service worker),
`shared/rng.js`. Test hook while a level is open: `window.__mathsArcade`. Catapult: `round().answer`, `fire(n)`.
Pop: the same two (`round()` is `null` until two touching balls are picked), plus `tap(ball)`, `world`, `pairs()`, `ready()`.
Match: `tap(ball)`, `world`, `pairs()`, `targets()`, `ready()`. A ball is `{ id, n, r, body }`; its position is `body.position`.
