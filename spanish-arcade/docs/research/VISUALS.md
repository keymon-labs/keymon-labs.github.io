# Visual kit for Spanish Arcade: research and recommendation

Scope: ages 6-10, light/dark, 3 palettes via CSS tokens (`--hue`, `--acc-l`, `--soft`, `--bg`...). Today: emoji + CSS only, no bundled assets. Licences checked 2026-11-12 (npm registry metadata; others from known project pages, re-verify the exact file when adding a CREDITS row).

## 1. Options

| Source | Licence | Size | npm | Style fit | Follows theme tokens? | Verdict |
|---|---|---|---|---|---|---|
| **A. Own inline SVG/CSS/canvas** | ours (CC BY-NC-SA, original) | tiny (KBs) | none | Exactly what we design | **Yes**, `fill: var(--accent)` | **Core** |
| Fredoka (variable) | OFL-1.1 | ~250 KB npm, ~30-60 KB woff2 subset | `@fontsource-variable/fredoka` 5.3.0 | Rounded, playful, great for headings and big buttons | n/a | **Use** |
| Nunito (variable) | OFL-1.1 | ~310 KB npm, subset ~40 KB | `@fontsource-variable/nunito` 5.3.0 | Friendly, very readable body; already first in `--font` list | n/a | **Use** (body) |
| Baloo 2 | OFL-1.1 | similar | `@fontsource/baloo-2` | Cute, a bit heavier than Fredoka | n/a | Skip (redundant) |
| Lucide | ISC | 56 MB package, but we copy ~15 SVGs | `lucide-static` 1.72.0 | Clean line icons, slightly adult | **Yes** (`stroke: currentColor`) | **Use** for UI chrome (settings, back, sound, help) |
| Phosphor | MIT | 6.5 MB, ~15 copied | `@phosphor-icons/core` 2.1.1 | Has a "duotone" and "fill" weight, friendlier | **Yes** (currentColor, duotone opacity) | Alternative to Lucide; pick one. Phosphor duotone is the nicer fit for kids |
| OpenMoji | CC BY-SA 4.0 (ShareAlike: our CC BY-NC-SA 4.0 is a compatible one-way target, but it means the emoji files stay CC BY-SA) | 43 MB package; copy only used ones (~1-2 KB each) | `openmoji` 17.0.0 | Flat, outlined, colourful, consistent; best emoji fit | No (fixed colours) | **Optional** for stickers and unit icons if native emoji look inconsistent |
| Twemoji (jdecked fork) | Graphics CC BY 4.0, code MIT (the npm `@twemoji/svg` metadata says MIT but the artwork is CC BY 4.0: attribute it) | 8 MB | `@twemoji/svg` 15.0.0 | Glossy-flat, familiar | No | Second choice to OpenMoji |
| Noto Color Emoji | Font OFL-1.1, images Apache-2.0 | font 10+ MB, SVGs per file | `@fontsource/noto-color-emoji` | Android look | No | Skip (large, no gain) |
| Kenney | CC0 | packs 1-20 MB | none (zip) | Game UI, shapes, particles; many sets are pixel/vector flat, not Spanish-school themed | PNG/SVG mostly fixed colours | Optional: "Particle Pack", "UI Pack" for ideas only; PNG adds weight |
| OpenGameArt | per-item (CC0/CC-BY/GPL mixed) | varies | none | Inconsistent between items | No | Skip (licence audit per item, style mismatch) |
| unDraw | Custom "unDraw licence": free, no attribution, but it is not an OSI/CC licence and forbids redistributing as a competing library | ~5-20 KB each | none | Corporate-flat illustrations | Yes (single accent colour is editable) | **Ask first** (not on the allowed list); style too corporate for a kids' game |
| Open Peeps | CC0 | SVG kit | none | Hand-drawn people, black-line, sketchy | Partly | Skip (human avatars, wrong tone; children's faces feel off) |
| Humaaans | CC0 (per site; older repo said CC BY) | SVG | none | Mix-and-match people | Partly | Skip |

Conclusions
- No illustration library gives us (a) a kids' Spanish-school feel, (b) a colour system that follows 3 palettes x light/dark, (c) a mascot we own. Illustration sets are fixed-colour and corporate.
- Fonts and line icons are solved problems: use OFL fonts and a small copied subset of one MIT/ISC icon set.
- Our art needs are small (one mascot, ~10 stickers, a few backgrounds). Hand-written SVG using tokens is cheap, tiny, themeable and avoids third-party attribution entirely.

## 2. Recommendation: (C) mix, mostly own art

**Own (inline SVG/CSS):** mascot, sticker shapes, backgrounds/patterns, progress path, confetti, buttons/frames.
**Third party (minimal):** Fredoka + Nunito (OFL, npm, self-bundled by Vite), Phosphor duotone icons (MIT, ~15 files copied, or Lucide if you prefer line style).
**Emoji:** keep native emoji for in-content words and unit dots (zero cost, works offline, fits current code). Only if platforms look inconsistent in tests, switch stickers to OpenMoji (CC BY-SA, copy ~30 files, add credits).

### Kit list
1. **Fonts:** headings/buttons Fredoka (wght 500-700), body Nunito. Latin subset only (Spanish needs ñ, accents, ¿¡). `--font-display` token added; `--font` stays the body fallback stack.
2. **Icons:** Phosphor duotone, ~15: gear, speaker-high, speaker-slash, question, house, arrow-left, arrow-right, check, x, lock, star, trophy, ear, pencil, book-open, puzzle-piece. Colour via `currentColor`; duotone second layer via `opacity`.
3. **Backgrounds (6-8, all SVG using `--bg`, `--soft`, `--art-1..3`):**
   - `dots-stars` repeating pattern (sample) for home
   - `hills` layered landscape (sample) for unit map header
   - `clouds` soft clouds for listening games
   - `waves` for the ocean palette feel (works in all palettes)
   - `confetti-bg` sparse shapes for results
   - `notebook` ruled lines + margin for reading/spelling
   - `night-stars` (dark-theme variant: stars and moon appear when `data-theme=dark`)
   - `path-trail` dotted trail tile for the unit map
   Each is a function or file taking no args; colours from tokens, so palettes switch live.
4. **Mascot:** invent a new original character (a round little creature with two ear-points; name TBD by the owner), NOT the book cast (task 002 note: stay our own). One `<symbol>` head + body parts; expressions are swapped groups (eyes, mouth, brows) driven by `data-mood="happy|cheer|oops|think"`. Fill from `--accent` (fur), `--soft` (belly), `--art-2` (cheeks), `--art-ink` (features). Animation via CSS (`bob`, `hop`, blink) disabled under `prefers-reduced-motion`.
5. **Stickers (album, task 024):** one shared sticker frame (white die-cut outline, drop shadow, shine highlight) with an inner shape. Two tiers: (a) emoji inside the frame (cheapest, now), (b) own SVG icon shapes (star, rocket, butterfly, planet, fish, heart, crown, balloon) coloured from `--art-1..3`. Grey locked slot = same frame with `filter: grayscale(1) opacity(.5)`.
6. **Celebration:** (a) small own canvas confetti (~60 lines, colours read from computed `--art-1..3` and `--accent`; no dependency); alternative `canvas-confetti` 1.9.4 (ISC, 92 KB unpacked, ~6 KB min) if we want ready-made presets, add CREDITS row. (b) CSS "pop" keyframes for stickers, (c) star burst SVG behind result stars. All skip under `prefers-reduced-motion` (show static).
7. **Progress path:** SVG path (`stroke-dasharray` dotted) with stone nodes; completed segments `--accent`, remaining `--line`.
8. **Buttons/frames:** CSS only (existing). Add a 3D pressed-bottom-border variant and a "card with corner badge" frame.

### New tokens
`--art-1: hsl(var(--hue) 90% 60%)`, `--art-2: hsl(calc(var(--hue) + 40) 80% 62%)`, `--art-3: hsl(calc(var(--hue) + 180) 65% 58%)`, `--art-ink`, `--font-display`. Dark mode lowers lightness; contrast of text on fills uses existing `--on-accent`. See samples' `tokens.css`.

### Theming caveat
`<img src="x.svg">` and CSS `background-image: url(x.svg)` do NOT inherit page CSS variables. To follow tokens: inline the SVG (JS template strings or `import raw from './x.svg?raw'` with Vite) or use `<use href="#id">` against an inline sprite. Plan: one `art.js` module returning SVG strings; build-time no extra deps.

### File layout (under spanish-arcade/ui/art/)
```
ui/art/README.md            what each piece is, tokens used, how to add
ui/art/art.js               export bg(name), sticker(name,{locked}), mascot(mood), icon(name)
ui/art/mascot.svg.js        mascot parts + moods (strings)
ui/art/backgrounds/*.svg    8 files, tokens as var(--x, fallback), loaded ?raw
ui/art/stickers/*.svg       sticker inner shapes
ui/art/icons/*.svg          copied Phosphor subset + LICENSE-phosphor.txt
ui/art/confetti.js          ~60-line canvas confetti, reduced-motion aware
ui/art/fonts.css            @import of fontsource variable latin subset
test/art.test.js            every file parses, only var(--...) colours (no hard-coded hex outside fallbacks), mood list complete
```
Fonts via npm (`@fontsource-variable/fredoka`, `@fontsource-variable/nunito`), imported from `app.js` or `index.html` so Vite hashes them; add `/assets/` caching already in the service worker. Bump SW cache name.

### Attribution for CREDITS.md (draft rows)
- Fredoka, Nunito | spanish-arcade (fonts) | https://fonts.google.com/specimen/Fredoka , /Nunito via `@fontsource-variable/*` | SIL OFL 1.1 | "Fredoka: Copyright The Fredoka Project Authors. Nunito: Copyright 2016 The Nunito Project Authors." (verify exact notice in each package's LICENSE)
- Phosphor Icons (subset) | spanish-arcade icons | https://github.com/phosphor-icons/core | MIT | "Copyright (c) 2023 Phosphor Icons"
- Optional OpenMoji | stickers | https://openmoji.org | CC BY-SA 4.0 | "OpenMoji, the open-source emoji and icon project. License: CC BY-SA 4.0"
- Optional Twemoji | | https://github.com/jdecked/twemoji | CC BY 4.0 | "Graphics © Twitter, Inc and other contributors, CC BY 4.0"
- Optional canvas-confetti | | https://github.com/catdad/canvas-confetti | ISC | "Copyright (c) 2020 Kiril Vatev"
- Own art: no row needed; README says "original".

### Cost and risk
- Weight added: fonts ~80-100 KB (subset), icons ~10 KB, art ~30 KB. Offline OK (hashed, cached).
- Risk: drawing a good mascot takes iteration; samples below are rough. Owner approval of character before wide use (task 002).
- Not checked: font file exact copyright lines, final subset sizes, Phosphor weight/duotone rendering on old Android Chrome (plain SVG, low risk).

## 3. Samples (outside repo)
`/tmp/claude-0/-home-claude/2e3c35af-d89b-56e2-b1ca-ff4abbe73054/scratchpad/visuals-samples/`
- `mascot-moods.svg` happy / cheer / oops heads
- `pattern-dots-stars.svg` home background tile
- `scene-hills.svg` layered hills header
- `sticker-star.svg` die-cut star sticker with face
- `tokens.css`, `preview.html` (token sets for palettes/dark; open preview.html with inline SVG to see theming)
All colours are `var(--token, fallback)`.

## Questions for the owner
1. Mascot: a new original round creature (recommended), or an elk-like nod to the book? Recommended: new original, name chosen by the child.
2. Icons: Phosphor duotone (friendlier, recommended) or Lucide line (cleaner)?
3. Stickers: start with emoji in our own frame (recommended, cheapest) and add own SVG shapes later, or switch to OpenMoji now (adds a CC BY-SA credit)?
4. Confetti: write our own 60 lines (recommended, no dependency) or add `canvas-confetti`?
