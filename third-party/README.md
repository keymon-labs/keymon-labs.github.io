# third-party/: games made by others, hosted unmodified

Not our work and not codified by us: a copy kept only so it can be played in a browser. Public elsewhere; no relation to the authors, no liability (see [NOTICE.md](../NOTICE.md)). The site section is `/third-party/`.

## Layout
```
third-party/index.html            listing page: disclaimer + one <li class="card"> per game
third-party/<game>/index.html     wrapper: disclaimer bar + <iframe src="./game/" allow="midi *">
third-party/<game>/SOURCE.md      author, original + source links, licence, upstream commit, what was changed
third-party/<game>/game/          the upstream files, verbatim (own LICENSE kept)
```
`game/` is not bundled by Vite: `vite.config.js` copies it to `dist/` as it is (no hashing, no minifying), so the copy stays the same as upstream.

## Add a game
1. Find its licence first. Fine to host: a licence that allows redistribution (MIT, BSD, Apache-2.0, GPL...) with its licence text kept. **No stated licence = all rights reserved: don't host without the author's OK.** GPL/CC BY-NC/ND: ask the owner first (CLAUDE.md).
2. Copy the upstream files into `<game>/game/` without `.git`. Change nothing except what the game needs to run (note it in SOURCE.md).
3. Copy `pianofun/index.html` and `SOURCE.md` as the starting point; fill in names, links, licence, commit.
4. Add a card in `third-party/index.html`, a row in the root `README.md` Third-party table and a row in `CREDITS.md`.
5. Check: `npm run build`, serve `dist/`, load the wrapper and play a few inputs.

## Games
| Game | Author | Licence | Original |
|---|---|---|---|
| [PianoFun](pianofun/SOURCE.md) | Victor Antofica | GPL-3.0 | https://github.com/victorantos/PianoFun |
| Falling Notes (modified fork, hosted from its own repository) | Belf186 | MIT | https://github.com/Belf186/falling-notes |
