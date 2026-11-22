# PianoFun: hosted copy

A copy of someone else's game, kept here so it can be played in a web browser. **Not made, changed or endorsed by keymon-labs, and no relation to its author.**

| | |
|---|---|
| Game | PianoFun! (piano learning game, falling notes, Web MIDI) |
| Author | Victor Antofica |
| Original and source | https://github.com/victorantos/PianoFun |
| Original live version | https://victorantos.github.io/PianoFun/ |
| Listing where it was found | https://hnshowcase.com/post/47476499/pianofun-browser-piano-learning-game-with-midi-vanilla-javas |
| Licence | GNU GPL v3.0, text in [game/LICENSE](game/LICENSE) |
| Copied from | commit `428aed744cb55527b368fcb895e63712498868b4` (25 March 2026) |
| Copy made | 22 November 2026 |

## What is in the copy
The folder [game/](game/) is the upstream repository as it was at that commit. It has no build step, so these files are the source.

## What was changed
- One line in `game/sw.js`: `__GIT_HASH__` was replaced by `428aed74`, which is what the author's own deploy script does.
- Left out: `.git`, `.github` (author's deploy workflow) and `screenshots/` (README images only).

Nothing else. The code, text, icons and licence are as published.

## Notes
- The game loads the font Fredoka from Google Fonts when it runs (upstream does this; it is not stored here).
- Because the game is under the GPL, anyone may copy it from this folder under the same licence. keymon-labs' own licence (CC BY-NC-SA 4.0) does **not** apply to it.
- To update the copy, repeat the copy from upstream, redo the one-line change, and update the commit above.
