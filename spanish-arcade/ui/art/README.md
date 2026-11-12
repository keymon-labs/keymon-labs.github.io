# ui/art: visual kit
Own inline-SVG art plus fonts and icons. All colours are theme tokens (`--accent`, `--soft`, `--bg`, `--art-1..3`, `--art-ink`), so light/dark and the three palettes switch live. Original art: mascot, backgrounds, stickers, burst, confetti. Third-party: Fredoka and Nunito (OFL-1.1, npm), Phosphor duotone icons (MIT, copied), see CREDITS.md and the `LICENSE-*.txt` files here.

| File | What |
|---|---|
| `art.js` | `mascot(mood, {size, anim})` moods `happy cheer oops think`; `bg(name)` (`BACKGROUNDS`: dots-stars, confetti-bg, notebook, waves, path-trail, hills, clouds, night-stars); `sticker(name, {locked, size})` (`STICKER_NAMES`: star heart crown rocket planet fish butterfly balloon); `burst()`; `icon(name, {size})` (`ICON_NAMES`) |
| `confetti.js` | `confetti({count, ms})` canvas burst in `--art-1..3` and `--accent`; no-op under reduced motion |
| `icons.js` | Phosphor duotone inner markup (data) |
| `fonts.css` | latin `@font-face` for Fredoka and Nunito (linked from `index.html`) |
| `preview.html` | dev-only page (`npx vite`, open `/spanish-arcade/ui/art/preview.html?theme=dark&palette=ocean`); not built into the site |

CSS classes (end of `style.css`): `.font-display`, `.art-host` (put a background inside one: `el.innerHTML = bg('hills') + ...`), `.art-bg`, `.art-pop`, `.art-hop` (mascot `anim:'hop'`), `.art-burst`, `.art-confetti`, `.btn.chunky`, `.frame-badge > .badge`. `--font-display` token added.

Inline SVG is required for tokens to apply: `<img src>` and CSS `url()` do not see page variables. Add a sticker: one entry in `STICKERS` (silhouette `d`, fill token, details). Mascot name is TBD by the owner.
Checks: `test/art.test.js`.
