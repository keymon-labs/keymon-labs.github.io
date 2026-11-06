# Maths Arcade

Mini games for times tables (to 12), adding and taking away (to 100) and simple fractions.
The maths is the control: the number typed decides what happens in the game, so a wrong
answer shows *why* it was wrong (the stone lands short, the wrong block gets hit).

## Layout
```
index.html, app.js, style.css   shell: hash routes (#/, #/<game>, #/<game>/<level>), menus, stars
core/                           pure logic, no DOM, unit tested
  rng.js                        seeded random
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
test/*.test.js                  node --test (run `npm test` from the repo root)
```

## Game module shape
```js
export default { id, title, emoji, blurb, levels,
  mount(host, level, { onFinish({ stars }), onExit() }) -> { destroy() } }
```
Keep rules in a DOM-free `logic.js` with tests; keep drawing in `scene.js`.

## Common edits
- **New level**: add an entry to `games/catapult/levels.json` (`id` unique, `kind`, `rounds`, `skill` = generator options). `npm test` checks every level generates valid, hittable rounds.
- **New round kind**: add to `KINDS` in `logic.js` (`make` returns answer, positions, prompt, hint; `land` maps the typed number to a landing), then a test.
- **New skill**: add a generator to `core/problems.js` + a range test.
- **New game**: `games/<id>/` with the same files, register in `games/index.js`.

UI is checked by loading pages in headless Chromium, not unit tested.

Shared modules used: `shared/pwa.js` (service worker). Test hook while a level is open:
`window.__mathsArcade.round().answer` and `window.__mathsArcade.fire(n)`.
