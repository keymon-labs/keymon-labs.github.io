# UI and gameplay usability advice (kids 6–10, phone first)

Review of build `040528c` on headless Chromium at 390×844 (portrait) and 844×390 (landscape), light and dark, text size 1 and 1.5, real unit `a1-u1-s1` plus the lab page for `match-pairs` and `odd-one-out`. Complements tasks 023 (in-game look), 024 (stickers) and 025 (home extras); where an item belongs to one of them it says so.

## What the research says (short)
- Children's motor control is weaker than adults': NN/g recommends touch targets of about 2×2 cm for ages 3–8, tapping a destination instead of dragging to it, forgiving drop zones, and no two-handed or precise gestures; dragging becomes comfortable only around 9–12. <https://www.nngroup.com/articles/children-ux-physical-development/>
- Respond to every action, show small wins and visible progress, large text (≈18–19 px body), pair text with icons and sound, keep controls away from the bottom edge where kids tap by accident, ≥75 px targets. <https://smart-interface-design-patterns.com/articles/design-guidelines-children/>
- Children miss small targets and drift during taps (touch-accuracy studies): <https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf>, <https://init.cise.ufl.edu/wp-content/uploads/sites/378/2017/05/Woodward-et-al-CHI2016_0.pdf>
- WCAG 2.2 adds 2.5.7 Dragging Movements (a single-pointer alternative to every drag) and 2.5.8 Target Size (24 px floor; we aim far higher). <https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/>
- On Chrome Android the on-screen keyboard resizes only the visual viewport by default; `<meta name="viewport" content="…, interactive-widget=resizes-content">` makes the layout shrink instead so an input can't be hidden. <https://developer.chrome.com/blog/viewport-resize-behavior>, <https://htmhell.dev/adventcalendar/2024/4/>

**House numbers** used below: answer tiles/choices **≥64 px** tall, every other control **≥56 px** (`--tap`), keypad keys **≥48 px with ≥8 px gaps** (absolute floor), nothing interactive within 8 px of another target that does something different.

## What works already (keep)
Tap-or-drag on every tile (no drag required); wrong choices stay in place disabled instead of vanishing (fill-gap, listen, odd-one-out); `inputmode="none"` + on-screen ñ/accents row so the phone keyboard never covers the word; letters + colours on match pairs (colour is never the only cue); progress saved after every round; reduced-motion flag in `ctx`; `aria-live` feedback.

## Prioritised list

### P0 — breaks play or causes wrong taps

| # | Screen / archetype | Problem (seen) | Fix | Files | Effort |
|---|---|---|---|---|---|
| 1 | spell-tiles | Tapping a tray letter **removes it from the tray and the remaining tiles reflow** (`render()` rebuilds the tray from `tiles not in placed`); the next letter the child aimed at is now somewhere else. The slot row also grows from 0 to 1 row and pushes the tray down ~10 px. | Tray is fixed: render every tile once, in a stable order; a placed tile stays in its spot as an empty dashed "socket" (`visibility` kept, `aria-disabled`, opacity .3, no pointer) and comes back to the **same spot** when removed. Slot row has a fixed height from the start (one row of 64 px). | `archetypes/spell-tiles/index.js`, `ui/tiles.js` (CSS) | S |
| 2 | spell-tiles | Removing a placed letter from the middle (`placed.splice`) shifts every later letter left, so the word the child built rearranges itself. | Fixed answer slots (one per letter of the answer, see Q1). Tapping a filled slot returns that letter to its tray socket and leaves that slot empty; the next tray tap fills the **first empty slot**. Keyboard Backspace empties the last filled slot. | `archetypes/spell-tiles/index.js`, `logic.js` (`wordOf` with holes) + test | M |
| 3 | all in-game | `Saltar` and `Salir` are two identical outline pills **6 px apart**, directly under the answer area; `Salir` leaves the unit with one tap and no confirmation; both move down when feedback text appears. A missed tap on an answer can skip or exit. | Fixed action bar (see layout). `Salir` becomes a ✕ icon button in the **top-left of the header**, opens a small sheet "¿Salir? Tu progreso se guarda." [Seguir jugando] (primary) [Salir]. `Saltar` (⏭️) stays bottom-right, ≥16 px from any answer control, and asks once per round on first press ("Toca otra vez para saltar", 3 s) or is a hold-to-confirm. | `app.js`, `style.css` | M |
| 4 | all in-game | Status/feedback paragraphs start empty (0 px) and grow on the first answer; skip text appears in `#live` below; the action buttons and `Comprobar` jump down by one or two lines. | Reserve a fixed feedback strip (min-height 2 lines at current text size) in the shell between answer area and action bar; archetypes write into `ctx.feedback(text, kind)` or keep their status `<p>` with `min-height:2.9em`. | `app.js`, `style.css`, each `archetypes/*/index.js` (status) | M |
| 5 | fill-gap-choice | A wrong choice gets "✖ " prepended, a revealed one "👉 ": the button gets wider and the whole option row re-wraps (seen: `llama` → `✖ llama`). | Never change a button's text after mount. Show state with an absolutely positioned badge (✖ / 👉) in a corner and a class (`.wrong`, `.reveal`), with `min-width` set at mount from the longest option. Same for read-answer "✔ " (full width so less visible, still fix). | `archetypes/fill-gap-choice/index.js`, `archetypes/read-answer/index.js` | S |
| 6 | play start | `playUnit` waits for `speech.ready()` before the first round; on a device with no Spanish voice that is the full **2 s timeout on a blank page** (seen in headless). Kids re-tap or leave. | Render the round immediately with `canSpeak=false` placeholder hidden speakers, or show a loader card ("🦊 Preparando…") at once; never more than 300 ms of blank. Cache the voice result for the session so later units start instantly. | `app.js`, `ui/speech.js` | S |
| 7 | landscape (844×390) | Page scrolls in every exercise: H1 + "Ejercicio 3/6 · 1/8" + prompt eat ~120 px, `Comprobar` sits at y≈337, `Saltar/Salir` below the fold, and the focused H1 is half cut off. | Landscape layout below: compact header (40 px), prompt left column, answer right column, action bar always visible. Use `100dvh` grid, no page scroll during a round. | `style.css`, `app.js` (stage structure) | M |
| 8 | after a round | The next round keeps the old scroll position (seen after `Saltar` at text size 1.5: new round starts with the prompt above the fold). | On `show()`, `stage.scrollIntoView({block:'start'})` (or scroll to 0) and focus the prompt, not the H1. Fixed layout (#7) removes most scrolling anyway. | `app.js` | S |

### P1 — friction, confusion, accessibility gaps

| # | Screen / archetype | Problem | Fix | Files | Effort |
|---|---|---|---|---|---|
| 9 | spell-tiles, spell-fill-letters | Tiles and keys are 48×48 with Canvas background and 10 px radius; answer tiles in the other archetypes are 64 px pills. Primary `✔ Comprobar` is a 48 px outlined box, looks disabled even when enabled (grey border in the disabled state is almost the same). | Tiles 64×64 (56 at ≥8 letters on 360 px wide: compute `min(64px, (100vw - 32px - gaps)/perRow)`), 8 px gaps, token colours (`--card`, `--accent`). `Comprobar` moves to the action bar as the **primary** accent button (filled), ≥56 px, full width in portrait; disabled = outlined + "Pon las letras" label. | `ui/tiles.js`, `style.css`, both spelling `index.js` | S |
| 10 | spell-fill-letters (type) | Gap inputs are 3 ch wide with only a dashed underline; four adjacent gaps read as one long line (`ping________`); active gap is an outline that overlaps neighbours; it is unclear how many letters go in each gap. | Each gap a separate box ≥48×56 with 6 px margin, solid border on the active one plus a blinking caret bar (static under reduced motion); show one underscore per expected letter for multi-letter gaps (`rr`, `ll`) at difficulty ≤2. Tap a gap to make it active (already). | `ui/tiles.js`, `archetypes/spell-fill-letters/index.js` | S |
| 11 | spell-fill-letters (type) | The letter row always includes `¿ ¡` (and ü) even for a single word; `¡` next to `i` is easy to mis-tap; 16 keys in 3 rows. | Row = gap letters + distractors + only the accented vowels of the same base letters (á if a is offered…) + ñ; `¿ ¡` only when the expected answer contains them. Fixed alphabetical-ish order so keys don't move between rounds; ⌫ always at the right end, visually distinct. | `ui/tiles.js` (`specialLettersRow` options), `archetypes/spell-fill-letters/index.js` | S |
| 12 | future free typing | If an archetype ever uses the real phone keyboard, it will cover the input; accents need a long-press the child may not know. | Keep the on-screen row as the default. When a real keyboard is used: add `interactive-widget=resizes-content` to the viewport meta, `scrollIntoView({block:'center'})` on focus and on `visualViewport` resize, `autocapitalize=off autocorrect=off spellcheck=false`, `lang="es"` on the input, and still show the ñ/accent row above the keyboard. | `index.html`, `ui/tiles.js` | S |
| 13 | spell-fill-letters (choice) | The options row is swapped when the active gap changes; the child doesn't see which gap the options belong to. | Draw a small arrow/line from the active gap to the option row, or label the row "Hueco 2"; keep the row height fixed (always reserve space for the largest option set). | `archetypes/spell-fill-letters/index.js` | S |
| 14 | all in-game | No visible hint button; hints only appear after a miss, so a stuck child either guesses or skips. | 💡 button in the action bar (task 023). Press = `session.hint()` with the same level-1 nudge a miss gives, counted like a miss for stars; disabled after level 2. | `app.js`, `core/session.js` (+ test), archetypes already render hint specs | M |
| 15 | all in-game | After a correct answer the next round comes after **700 ms**; fill-gap and listen also start speaking the full sentence, which gets cut by the next round. Kids barely see "¡Muy bien!". | Correct: show a big ✓ / 🎉 in the feedback strip, fill the answer in green, wait `max(1200 ms, speech end)` capped at 3 s; a tap anywhere during the wait advances at once. Skip: show the correct answer **inside the answer area** (slots/gap filled in a "revealed" style) for 2 s, not only as text in `#live` below the fold. | `app.js`, `ui/speech.js` (`say` resolves on end), archetypes (reveal render) | M |
| 16 | match-pairs | Joining the last pair submits at once (no chance to look); a level-1 miss **clears the whole board** ("2 mal") so a 6-year-old redoes 6 pairs. | Difficulty 1–2: judge pair by pair (correct pairs lock green, wrong pair shakes and unjoins; one round per board is still one submit at the end, see Q3). Difficulty 3: keep whole-board submit but behind an explicit `✔ Comprobar`, and on a miss unjoin only the wrong pairs. | `archetypes/match-pairs/index.js`, `logic.js` + test | M |
| 17 | match-pairs | Picture side uses emoji at 1.4 rem (≈22 px) inside 171 px wide buttons; pictures are the content. Left/right columns are equal grey pills with no "words | pictures" cue. | Emoji 2.4–3 rem; picture cards square 72–88 px; left column words, right column pictures with distinct card style; selected item gets a thick accent ring + slight lift (not only outline). | `archetypes/match-pairs/index.js` | S |
| 18 | listen-pick-word (no voice) | The 3-line notice "Este aparato no tiene voz…" repeats every round, the picture sits left-aligned, and options are pushed below the fold at text size 1.5. | Show the notice once per session as a one-line chip ("🔇 Sin voz: mira el dibujo"); picture centred, 4 rem, in the prompt area. | `archetypes/listen-pick-word/index.js`, `app.js` (session flag in ctx) | S |
| 19 | listen-pick-word | Auto-play on mount silently fails without user activation and there is no visual cue the word is playing. | Speaker button pulses (or shows "🔊…" state) while speaking; if autoplay fails, the speaker gets a gentle "tócame" bounce (static ring under reduced motion). Replay unlimited unless `replay:false`. | `archetypes/listen-pick-word/index.js`, `ui/speech.js` (speaking events) | S |
| 20 | spell-tiles / spell-fill | Speaker 🔊 is hidden when there is no voice, so the button row reflows by device; in spell-tiles the speaker is a 48 px key below the emoji. | Speaker lives in a fixed slot of the prompt area (56 px round), always the same place; hidden = `visibility:hidden` (space kept) or a muted 🔇 that explains on tap. | archetypes, `style.css` | S |
| 21 | read-answer | "Ya lo he leído" sits right above `Saltar`; sentence spans have 4 px side padding so the text shows double spaces/indent. | "Ya lo he leído" becomes the primary action in the action bar (replacing `Comprobar` for that step). Remove horizontal padding on sentence spans (use `box-decoration-break:clone` padding only when marked). | `archetypes/read-answer/index.js` | S |
| 22 | navigation | Profile → unit intro → play: "Empezar" on the Continue card leads to an intro page with a second "Empezar"; intro shows a dense text list ("Forma la palabra: ○ pendiente"). | Continue card goes straight to `#/unit/<id>/play`. Unit intro (from the trail) becomes a visual list of exercise emoji with ✓/●/○ and one big ▶️ button. | `app.js`, `style.css` | S |
| 23 | home / profile | `🏠 Inicio` on the profile page goes to a profile chooser that has only one profile (MVP) – a dead end loop. `⚙️ Ajustes` is open to kids (gate is a placeholder). | Hide `Inicio` while there is one profile. Settings behind the parent long-press (task 025 / 004). | `app.js` | S |
| 24 | all screens | Programmatic focus on the H1 at route change draws the 3 px focus outline box in dark mode (seen on home and in play). | `h1[tabindex="-1"]:focus{outline:none}` (focus still moves for screen readers). | `style.css` | S |
| 25 | in-game | Progress is "Ejercicio 2/6 · 1/7" in 15 px muted text – unreadable for a 6-year-old and two numbers. | Header progress: 6 exercise dots (done/current/todo) + a thin bar for rounds inside the exercise (task 023). `aria-label="Ejercicio 2 de 6, pregunta 1 de 7"`. | `app.js`, `style.css` | S |
| 26 | result | Result screen puts "Volver al mapa" **above** the result, stars are body-text size, no celebration, and "0 de 6 ejercicios sin ayuda" reads as failure. | Big stars (3 rem, pop-in animation, static under reduced motion), positive line first ("¡Unidad terminada!"), then [▶️ Siguiente unidad / Jugar otra vez] primary and [🗺️ Mapa] secondary at the bottom. Phrase help as "con ayuda: 6" rather than "0 sin ayuda". | `app.js`, `style.css` (task 023/024) | S |

### P2 — polish

| # | Screen / archetype | Problem | Fix | Files | Effort |
|---|---|---|---|---|---|
| 27 | spell-tiles drag | Dragging moves the tile with `transform` but there is no drop-target highlight; a drop outside snaps back with no motion. | Highlight the slot row (accent dashed border) while dragging; animate the snap back (none under reduced motion). Drag stays optional. | `ui/tiles.js` | S |
| 28 | odd-one-out, listen | Tap submits immediately (fine for kids), but there is no pressed/selected state before the verdict and a double tap on two cards within 100 ms is possible. | Immediate `.pressed` class on pointerdown; ignore further taps until the verdict returns (the shell `busy` covers correct answers only). | archetypes `odd-one-out`, `listen-pick-word`, `read-answer`, `fill-gap-choice` | S |
| 29 | all | Inline styles in four archetypes (`match-pairs`, `odd-one-out`, `listen-pick-word`, `read-answer`) bypass tokens: hard-coded `#222` mark text, `#000` on pastel letter badges, no dark-mode check. | Move to one injected stylesheet per archetype (like fill-gap) using `--accent/--card/--fg`; check 4.5:1 on mark colours in both themes. | those `index.js` files | M |
| 30 | all | Disabled options use opacity .35–.45; together with strike-through it's fine, but locked hint letters in spell-tiles (opacity .6) look disabled rather than "given". | Locked/given letters: solid accent background with 🔒-free styling ("this one is done"), not faded. | `ui/tiles.js` | S |
| 31 | reduced motion | Only the mascot bob, button scale and fill-gap `land` respect it; future confetti/sticker pops must too. | One global rule: `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}` plus `ctx.reducedMotion` for JS animations; also a settings toggle "Menos movimiento". | `style.css`, `ui/settings.js` | S |
| 32 | screen readers | Icon-only buttons are labelled (🔊, ⌫); but the spell-tiles slot row's label is a space-separated letter list, tiles are announced as single letters without position, and match-pairs picture buttons are labelled with the Spanish word (gives the answer away). | Slots: `role="list"`, each slot "Letra 2: a" / "Letra 3: vacía". Tray tiles: "a, toca para poner". Picture buttons: keep the word (a screen-reader child needs it) but say "dibujo de …" — acceptable trade-off, document it. | spelling archetypes, `match-pairs` | S |
| 33 | text size 1.5 | Most screens hold, but tile rows wrap into 3 rows and options fall below the fold. | Cap answer-area text at 1.25× (tiles grow in size, not font only), and let the prompt area scroll inside itself, never the answer area. | `style.css`, `ui/tiles.js` | S |
| 34 | orientation | Manifest has no `orientation`; fine, but there is no layout decision. | Keep `"orientation": "any"` (explicit) and implement the landscape layout below. | `manifest.webmanifest`, `style.css` | S |
| 35 | footer | Licence/build footer is shown under every round, 2–3 lines in landscape, and the 10-tap debug toggle sits where kids rest their thumbs. | In play, hide the footer (keep it on home/settings/result; CLAUDE.md only requires it per app/page, it is on the home). Debug toggle only on the settings screen footer. | `app.js` | S |

## Proposed navigation map

```
            first run                       one profile                     ⚙️ long-press (parent)
[Bienvenida: nombre] ──► [Inicio del jugador] ◄──────────────────────────► [Ajustes]
                            │  ▶️ Continuar ───────────────┐
                            │  🗺️ unidad del camino        │
                            ▼                              │
                       [Unidad] (emoji de ejercicios, ▶️) ─┤
                                                           ▼
                                                     [Ronda] ⇄ [Ronda] …  (auto-advance after feedback)
                                                       │ ✕ → hoja "¿Salir? Tu progreso se guarda." → Inicio
                                                       │ ⏭️ (confirm) → respuesta mostrada 2 s → siguiente
                                                       ▼
                                                 [Resultado: estrellas, pegatina]
                                                   ├─ ▶️ Siguiente unidad → [Ronda]
                                                   ├─ 🔁 Otra vez → [Ronda]
                                                   └─ 🗺️ Mapa → [Inicio del jugador]
     (several profiles later: [Elige jugador] before Inicio; 📒 Álbum from Inicio, task 024)
```
Rules: at most **2 taps from opening the app to playing** (Continuar). Android back / browser back in a round = the ✕ sheet, never a silent exit (push a history state on round start, intercept `popstate`). Every non-home screen has one obvious way back in the same place (top-left).

## Proposed in-game layout

One shell grid owned by `app.js`; archetypes render only into the prompt and answer areas (and optionally a tray), so every game has the same skeleton and nothing jumps.

### Portrait (≈360–430 × 640–900)
```
┌───────────────────────────────┐
│ ✕   ● ● ◉ ○ ○ ○   ▂▂▂▃░░  ⭐3 │  header 48 px: exit, exercise dots, round bar, stars
├───────────────────────────────┤
│  Completa la palabra.   (🔊)  │  prompt area (flex, max 35%): instruction, picture,
│            🪑                  │  speaker in a fixed slot; scrolls inside if long (read-answer)
│     [s][i][l][ ][ ]            │  answer area: slots / gap sentence / choices (fixed height)
├───────────────────────────────┤
│  [f][a][i][p][í]               │  tray (fixed rows, stable positions; empty sockets stay)
│  [l][í][s][l]                  │
├───────────────────────────────┤
│  🙂 ¡Casi! Prueba otra vez.    │  feedback strip, min 2 lines, never collapses
├───────────────────────────────┤
│ 💡        [ ✔ Comprobar ]   ⏭️ │  action bar 72 px, 16 px above the safe-area inset
└───────────────────────────────┘
```
- Action bar order: 💡 left, primary centre/right-wide, ⏭️ far right; ≥16 px between them; nothing destructive here (✕ is in the header).
- Choice archetypes (listen, fill-gap, odd-one-out, read) have no tray: choices take the tray area; primary button hidden (tap = answer).

### Landscape (≈640–900 × 360–420)
```
┌──────────────────────────────────────────────────────────┐
│ ✕  ● ● ◉ ○ ○ ○  ▂▂▃░░                                ⭐3 │ header 40 px
├────────────────────────┬─────────────────────────────────┤
│ Completa la palabra.   │   [s][i][l][ ][ ]               │
│        🪑   (🔊)        │   [f][a][i][p][í][l][í][s][l]   │
│ 🙂 ¡Casi!              │                                 │
├────────────────────────┴─────────────────────────────────┤
│ 💡                           [ ✔ Comprobar ]          ⏭️ │ action bar 64 px
└──────────────────────────────────────────────────────────┘
```
- Two columns (`grid-template-columns: minmax(0,2fr) minmax(0,3fr)`), prompt + feedback left, answer + tray right; no page scroll at 844×390.
- Respect `env(safe-area-inset-left/right)` for notches.

## Acceptance checks a headless test could run
Playwright on `dist/`, phone contexts 390×844 and 844×390, `hasTouch`, driving `window.__spanishArcade`:
1. **Tray stability**: in spell-tiles, record every tray tile's bounding box, tap 3 tiles, assert each unplaced tile's box is unchanged (±1 px) and placed tiles left a socket of the same size; remove one, assert it returns to its original box.
2. **No layout shift on feedback**: `PerformanceObserver('layout-shift')` cumulative score < 0.02 across a wrong answer, a hint and a skip in each archetype; the action bar's `top` is identical before and after.
3. **Target sizes**: every visible `button, a, input` in a round ≥ 48×48; answer tiles/choices ≥ 64 px high; no two targets with different actions closer than 8 px (bounding-box gap).
4. **Fits without scroll**: during a round `document.scrollingElement.scrollHeight <= innerHeight` in both orientations at text size 1, and the primary action and ⏭️ are fully inside the viewport at text size 1.5.
5. **Exit is guarded**: clicking ✕ (or `history.back()`) shows the sheet; the round is still mounted until "Salir" is pressed.
6. **No blank start**: with `speechSynthesis` stubbed to never fire `voiceschanged`, a round or loader is in the DOM within 300 ms of navigating to `#/unit/<id>/play`.
7. **Feedback timing**: after a correct answer the next round appears no sooner than 1 s and no later than 3.5 s; a tap during the wait advances immediately.
8. **Labels**: every button whose text is only emoji/symbols has an `aria-label`; no English words (existing `spanish-only` test extends to the new controls).
9. **Reduced motion**: with `reducedMotion: 'reduce'`, `document.getAnimations().length === 0` after a correct answer and on the result screen.
10. **Scroll reset**: after a skip, the prompt area's top is inside the viewport.

## Questions for the owner
1. **Show the word length in spell-tiles as empty slots?** Recommended: yes at difficulty 1–2 (kids of 6–8 need the scaffold), no slots at difficulty 3 (free-length row).
2. **How should exit be guarded?** Recommended: ✕ in the header plus a two-button sheet ("Seguir jugando" primary); progress is already saved, so no stronger gate.
3. **Match-pairs: check pair by pair or the whole board?** Recommended: pair by pair at difficulty 1–2 (immediate feedback, nothing to redo), whole board with a Comprobar button at difficulty 3.
4. **After a correct answer: auto-advance or a "Siguiente" button?** Recommended: auto-advance after ~1.2 s or when the voice finishes (max 3 s), tap anywhere to go on sooner; no extra button.
5. **Should a visible 💡 hint button cost stars?** Recommended: yes, counted like one miss (same as today's level-1 hint), so stars still mean "without help"; the button never takes away the chance to finish.
