# Contributing a new game type (archetype)

Open an issue first with the idea (what the child does, which skill: listening, spelling, reading, grammar or puzzle). Ideas, mechanics and genres are fine to copy; names, art and designs of other games are not. Read [archetypes/README.md](../archetypes/README.md) for the module contract.

## Steps
1. `npm run new:archetype <id>` (lowercase, dashes: `word-sort`). It copies `archetypes/_template/` into `archetypes/<id>/` (`index.js`, `logic.js`, `README.md` with the params table, `example.json`) and `test/<id>.test.js`. The sample game is "pick the right option"; replace it. The id is the folder name and never changes.
2. **Try it in the lab.** `npm run dev`, then open `http://localhost:5173/spanish-arcade/lab/?archetype=<id>`. The lab starts from `archetypes/<id>/example.json`, so no shared file needs editing. Change the params in the lab, play right and wrong answers (hint after one miss, reveal after two), try difficulty 1-3 and a small phone window. Copy the params that worked back into `example.json`. The layout audit plays `example.json` too.
3. Write `logic.js` pure (no DOM, randomness only from the `rng` argument) and test it: same seed gives the same rounds, `judge` accepts only right answers, `hint` never reveals before level 2, bad params throw a readable error.
4. Styles: append a `/* <id> */` section to `style.css`. Tap targets at least 48px; feedback in an `aria-live` region; a tap alternative to any drag.
5. Tick the archetype in [ARCHETYPES.md](ARCHETYPES.md). Do not add it to a unit in the same PR (content PRs do that).
6. `npm test`, `npm run build`, `npm run check:content`. Open the PR and say in it what you saw in the lab.

## Rules
- Spanish only on screen; `en` is optional help text. Original art, sentences and sounds; any library or asset goes in `CREDITS.md`.
- Kids' apps: no ads, no tracking, no sign-in.
- Do not edit another archetype in the same PR.
- A lab `STARTERS` entry in `lab/logic.js` is only for a starter different from `example.json`.
