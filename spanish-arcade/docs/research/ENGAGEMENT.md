# Making Spanish Arcade more engaging (and not addictive)

Research notes and a spec for children of about 6–10. Written 2026-11-12. Nothing here is implemented yet.

Constraints that shape every choice (from [CLAUDE.md](../../../CLAUDE.md) and [PLAN.md](../PLAN.md)): no tracking, no ads, no sign-in, no network calls, progress only in the browser, Spanish-only interface, sounds synthesised, art original (emoji/CSS/SVG), plain JS, pure logic unit-tested.

---

## 1. What the research says (and how much to trust it)

Evidence quality is mixed. Where a source is a news summary, a blog or an adult study, I say so. The spec treats these as design judgement, not proven facts.

### 1.1 Motivation: autonomy, competence, relatedness
- Self-determination theory (SDT) says people stay motivated when three needs are met: *autonomy* (choosing), *competence* (feeling capable, getting useful feedback), *relatedness* (feeling connected). In studies of video games, the sense of autonomy and competence predicted enjoyment and wish to keep playing better than flashy content did. A university summary of the research: [Rochester news release](https://www.rochester.edu/news/printable.php?id=2719); the underlying paper family, e.g. [Przybylski, Ryan & Rigby 2009](https://selfdeterminationtheory.org/wp-content/uploads/2014/04/2009_PrzbylskiRyanRigby_PSPB-1.pdf) (adults and teens playing commercial games, not children learning).
- Translation for us: let the child choose (unit, practice mode, whether to continue), give clear "I can do this" goals and honest feedback, and give the mascot a friendly, consistent personality. We have no social features and will add none; relatedness comes from the mascot and from showing the app to a family member.
- A 2025 SDT-based learning game ([Frontiers in Psychology](https://public-pages-files-2025.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1536513/pdf)) raised motivation but not test scores in 60 college students. Small, short, adult: I use it only as a reminder that "more fun" is not the same as "more learning".

### 1.2 Rewards: helpful or corrosive
- Classic result: preschoolers who liked drawing and were *promised* a certificate drew less afterwards than those who got none or got it as a surprise ([Lepper, Greene & Nisbett 1973](https://www.structural-learning.com/post/overjustification-effect), summary page). Rewards hurt less when unexpected, when they carry useful information about progress, and when they are not about ranking or pressure.
- Streak research is mostly adult and marketing based, but the child-relevant points are consistent ([Tes, "Streaks: helpful or harmful?"](https://www.tes.com/magazine/article/streaks-motivational-tool-helpful-or-harmful)): streaks can become compulsive, a broken streak can reduce later motivation, children often cannot control whether they play on a given day, and repair options help. A parent-guide site ([Screenwise](https://screenwiseapp.com/agents/the-dopamine-learning-trap-why-most-5-star-educational-apps-are-skinner-boxes-in?format=md)) makes stronger claims about "Skinner box" educational apps without citing studies for them; treat as opinion.
- Design tricks that keep children hooked, per a university explainer ([University of Wollongong](https://www.uow.edu.au/media/2024/the-design-tricks-keeping-your-kids-hooked-on-games-and-apps.php)): no stopping points (autoplay, endless scroll), random rewards/loot boxes, streaks where loss pulls you back, leaderboards, emotional bonds with characters used to sell things.
- Regulators define dark patterns as design that tricks or manipulates people into choices they would not otherwise make ([FTC report summarised by Fenwick](https://fenwick.com/insights/publications/ftcs-aggressive-enforcement-of-childrens-privacy-and-dark-patterns-a-cautionary-tale-and-simple-steps-companies-can-take-to-reduce-risk); [overview of children's cases](https://www.privacyworld.blog/2022/09/dark-patterns-under-the-regulatory-spotlight-again/)). Those cases are about money and data; we have neither, so our version of the rule is: no design whose purpose is to make a child play longer than they want to.

### 1.3 Feedback and failure
- Fifth graders praised for being smart persisted less, enjoyed tasks less and did worse after a failure than those praised for effort; they also saw intelligence as fixed ([Mueller & Dweck 1998](https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf)). So: praise what the child did (tried again, used the hint, rescued a tricky word), never "eres un genio".
- Mistakes are information. Our engine already gives hint after 1 miss, reveal after 2, never "failed". The spec adds second chances later and warmer wording.

### 1.4 Spacing, retrieval, mixing
- Short lessons on separate days beat the same minutes in one block for young children. In one study, first and second graders given four 5-minute lessons on four days learned much more than those given all four in one day; a younger group learned reading more from three 2-minute sessions than one 6-minute session ([summary with study names](https://parentingscience.com/spaced-learning/): Vlach & Sandhofer 2012; Seabrook et al. 2005). The same page notes small studies and no universal interval; adult vocabulary work favours gaps of a few days to a week. Nothing here is tuned for 6–10-year-olds, so use simple fixed gaps.
- Mixing problem types ("interleaving") improved a test a month later for 787 seventh-grade maths learners (61% vs 38%, [summary](https://www.structural-learning.com/research-briefings/mix-it-up)). Caveats on that page: one age, one subject, and it works *after* each type has been taught, not as a first introduction. So: shuffle for review and across the day, not for first exposure.
- No source I found gives a solid "ideal session length" for 6–10-year-olds. The spacing studies above used 5-minute lessons. The spec picks 5–8 minutes per sitting as a judgement call and makes it adjustable.

### 1.5 Decoration costs attention
- Interesting but irrelevant extras ("seductive details"), including decorative animation, can reduce recall, especially for children with smaller working memory; effects are weaker under low load ([overview](https://en.wikipedia.org/wiki/Seductive_details)). Rule: celebrate *after* the answer is judged, keep it short, and never animate while the child is reading or deciding.

### 1.6 Not found / not used
A page on selfdeterminationtheory.org could not be fetched (permission not granted), so SDT claims rest on the Rochester summary and the 2009 paper above.

---

## 2. Principles for this app

1. **Reward doing and learning, never time or presence.** Nothing is earned by merely opening the app or playing longer.
2. **Compete only with yesterday's self.** No leaderboards, no comparing profiles, no time-pressure records.
3. **Every ending is a stopping point.** Screens end with a clear "done" and a calm main button; nothing auto-starts.
4. **Mistakes lead to a second chance and often a small win.**
5. **Random only in *which*, never *whether*.** A surprise may vary which cosmetic sticker appears, never whether an effort is rewarded.
6. **Finite and completable.** Albums have a known size; no currency, no lives, no timers, no shop, no "you'll lose X".
7. **Quiet by default.** Small things are small. Sound off or reduced motion loses nothing the child needs.

---

## 3. Spec

Terms: *round* = one judged answer; *exercise* = rounds of one archetype (4–7); *unit* = 5–6 exercises (about 25–35 rounds, so 8–10 minutes: longer than I want, see 3.1); *leg* (tramo) = half a unit.

### 3.1 Session shape

**Legs.** A unit is played in legs of up to 3 exercises (about 12–16 rounds, 4–6 minutes). After a leg, a "parada en el camino" screen (small celebration, mascot, progress path) offers *Seguir* and *Guardar y salir*. Resume already exists (`inProgress`), so "save and leave" needs only UI. The unit result screen and stars rules do not change.

**Order inside a unit.** Today the order is fixed by the unit JSON (difficulty never decreases). New rule in `core/session.js` (`orderExercises(unit, seed)`):
1. Keep difficulty bands in order (1 before 2 before 3).
2. Inside a band, shuffle with the session seed (same seed, same order, so resume is safe).
3. Never put the same archetype twice in a row when the band allows; swap to fix.
4. The last exercise of the unit is the lowest-pressure one in its band (prefer `match-pairs` or `odd-one-out`) so a leg ends on a lighter note: warm-up, peak, cool-down.
5. Opt-out: an exercise can carry `"pin": true`, or authors give it its own difficulty. Teaching order in the first exposure (intro before traps) must stay pinned.

Stats are keyed by exercise id, so order does not affect progress. Note `a1-u1-s1` has `traps-choice` and `traps-type` both on `spell-fill-letters`; rule 3 would separate them if their difficulty matches.

**Rounds inside an exercise** keep the archetype's own order (already seeded-shuffled targets).

**Tricky words come back (echo).** When a word needed a hint or reveal (`session.words[id].wrong` increments on first miss), the session re-queues one extra round for that word later in the *same* exercise, 3–4 rounds after (or at the exercise end if fewer remain), once per word per session. The echo:
- is built with the same archetype and `make()` on a one-word target so no archetype code changes (add `core/session.js` `echo(roundWordId)`; needs `make(params, {targets:[word], pool})`);
- never affects stars, hints or reveals counts (it is a bonus, kept in a separate `s.echo` tally);
- on first-try success shows the "palabra rescatada" mini-celebration (3.3).

**Across days (word memory).** Extend `profile.words[id]` with `box` (0–3) and `due` (ISO day). Pure functions in new `core/words.js`:
- After a session, per word seen: if no miss that session and not already credited today, `box = min(3, box + 1)`; if a miss, `box = max(0, box - 1)`.
- `due = today + [1, 3, 7, 14][box]` days; wrong this session forces `due = tomorrow`.
- *Mastered* = `box >= 3` (first-try correct on three different days). Mastered words still appear but not as priority.
- `dueWords(profile, now)` returns words with `due <= today`, ordered by lowest box, then oldest `lastAt`.
The old fields (`seen`, `wrong`, `lastAt`) stay; the store schema stays 1 because the fields are additive, but check the store validator in `core/schema.js` accepts unknown optional keys. Merge rule on import (PLAN §4.5): max `seen`/`wrong` as now; for `box`/`due` take the entry with the later `lastAt`.

**Across the day: "Repaso del día" (mixed practice).** New practice mode, 8–10 rounds, built as a *virtual unit* handed to the existing `createUnitSession`: 3–4 exercises of different archetypes (chosen at random from archetypes already met), each with `from: { ids: [...], n }` taken from `dueWords` first, then recent words. Flag `practice: true` on that unit so `recordUnit` is skipped (no stars, no `units` entry); only `words`, the play log and `doneToday` are updated. This is also the "practice by skill" mode in task 025 (one archetype/skill pre-chosen). Shown on home when at least 3 words are due ("Palabras para repasar: 5"), but it can always be started. Capped at one mix per tap; no auto-restart.

**Warm-up.** The first round of a normal unit session may be one due word (an "echo from yesterday") in the first exercise's archetype if it fits; skip if the unit is brand new.

### 3.2 Visible progress

*Inside a session*
- **Trail** (top of play screen): one stone per exercise using the existing `stoneEmoji`, the mascot hops to the next stone when an exercise ends. Done stones show a tick shape as well as colour. Leg end gets a flag.
- **Segmented bar** under the trail: one segment per round of the current exercise. States: empty, done first try (filled, star shape), done with help (filled, dot shape). `role="progressbar"` with `aria-valuenow`/`aria-valuemax`, and shape differences so colour is not the only cue. Echo rounds appear as a small extra segment tagged "bonus", never as a drop in progress.
- No timers, no countdown, no score number during play.

*Across days*
- **Mi camino** (profile map, exists): stars per unit as now.
- **Álbum** (3.4): the long-term visible record.
- **Flor de la semana** instead of a streak: seven petals, one per day played this week (Monday start, local time). Missing days are simply empty petals; there is no counter that can drop. A finished week's flower is kept as a sticker in the album ("Flor 3"), so a quiet week never erases anything. A cumulative "días jugados: 14" chip is fine because it only goes up.
- **Meta del día**: replaces `DAILY_GOAL = 5` exercises with a goal of 12 rounds (about one leg), shown as the existing ring on home (`doneToday` in `core/home.js` becomes `roundsToday`, read from the play log in 3.5).

### 3.3 Celebration moments

All sound uses Web Audio synthesis through a new `ui/sfx.js` built on `shared/audio.js` `tone()`, with notes from one pentatonic set (C D E G A) so nothing can clash, soft gain (0.06–0.12), no harsh buzzers. `ctx.sfx(name)` is already part of the archetype contract and is a stub in `app.js` (line ~230). `unlockAudio()` runs on the first tap. Sound follows the existing `sound` setting. Visuals use CSS/SVG/canvas, last as short as listed, and in `prefers-reduced-motion` turn into a static change (colour/size jump, no travel) while sound is unchanged.

| Moment | Size | What appears | Sound (`sfx` name) | Reduced motion |
|---|---|---|---|---|
| Right answer (first try) | tiny, ≤0.6 s | Tile pulses, tick icon + green outline, segment fills with a star shape; mascot `happy` | `good`: two rising notes, e.g. C5→E5, 120 ms each | No pulse; tick and fill only |
| Right after help | tiny | Same, dot shape, wording "¡Lo has conseguido!" | `ok`: single soft G5 | same |
| Miss (hint) | none/gentle | Tile wobbles once ≤0.3 s with a "?" icon, hint text "Casi. Mira esta pista."; mascot `think`. Never red-only | `almost`: one low soft note, no falling "wah" | No wobble |
| Reveal | gentle | Answer shown, "Ahora tú: cópiala"; mascot `think` | none | n/a |
| Echo rescued | small, ≤1 s | Small "¡Palabra rescatada!" badge pops by the word, bonus segment lights | `rescue`: C5-E5-G5 quick arpeggio | Badge appears without pop |
| Exercise done | medium, ≤1.2 s | Mascot hops to next stone; stone gets its tick; one line from `mascot-lines.json` (task 012); a few confetti pieces (≤12) | `step`: C5-E5-G5-C6 arpeggio | No hop; stone changes state |
| Leg done ("parada") | medium | Flag on trail, mascot `cheer`, 24 confetti pieces, line of effort-praise; may reveal a surprise sticker (3.4) | `leg`: arpeggio plus a held chord | Static flag, no confetti |
| Unit done | large, ≤3 s | Result screen: stars fill one by one, badge sticker flips in, confetti ≤40 pieces (canvas, stops by itself), a joke/riddle (012) | `unit`: ascending pentatonic run into a triad, soft shimmer | Stars and badge shown at once; no confetti |
| New sticker | medium | Slot in the album (or a toast on the result screen) pops from grey to colour with a gentle glow; "Nuevo" dot on the album button until opened | `sticker`: 2–3 high plucks, random pitch from the set | Glow only |
| Personal best | medium | "¡Tu mejor intento!" ribbon next to the stars, comparing with the previous attempt only (more exercises without help, or fewer hints); never a time record | `pb`: pentatonic run | Ribbon without motion |
| Meta del día | medium | Ring completes, mascot `cheer`, "¡Meta cumplida!" | `leg` | Static |

Frequency rules: a right answer never gets more than the tiny treatment even in a streak of right answers (no escalating combos); big moments happen only at natural boundaries, so the rhythm of answering is not slowed (celebrations run after judging and never block the next question for more than the existing `NEXT_DELAY`). At most one big celebration per screen change.

Mascot (Toni, art per task 002): moods `neutral`, `happy`, `think`, `cheer`, `sleepy`, `wave`, as classes on one SVG or, until the art exists, an emoji swap. Lines come from `data/mascot-lines.json` (task 012) chosen by `speaker`, event and level, avoiding the last 10 shown.

**Wording guide** (all Spanish, owner reviews):
- Say: "Casi", "Todavía no", "Otra vez, tú puedes", "¡Has probado otra vez!", "¡Buena pista!", "¡Eso ha costado y lo has conseguido!".
- Avoid: "Incorrecto", "Fallaste", "Eres muy listo", "Perdiste", any "no has jugado desde hace…". Praise the action, not the person.

### 3.4 Rewards and collection (extends task 024)

Keep 024's album of emoji stickers and extend with four shelves. Everything is cosmetic, finite and earned by doing the learning.

1. **Unidades** (024 as written): stickers per unit: finish, 2 stars, 3 stars, plus the unit badge. *Derived* from `profile.units`, nothing new stored.
2. **Palabras** (new, main long-term collection): when a word reaches *mastered* (3.1) its emoji joins the album (nouns have `emoji` already; verbs/adjectives without an emoji are skipped). Grey silhouettes show the words of unlocked units, so the album size is known and every sticker means "I know this word". Tapping a mastered sticker says the word (speech) and shows its spelling. *Derived* from `profile.words`, nothing new stored.
3. **Rescatadas** (new): a small marker on a word sticker if the child once got that word wrong and later mastered it ("palabra rescatada"). Teaches that mistakes can turn into wins. Derived from `wrong > 0 && box >= 3`.
4. **Sorpresas** (new, the only random part): ~12 cosmetic stickers (animals, weather) given at the end of a leg or unit, chosen by seeded rng without repeats until the set is complete, then a final "Álbum completo" sticker. Guaranteed on every leg completion, so it is a surprise in *which*, not *whether*. Stored as `profile.stickers: [{ id, at }]` (this answers 024's "event log" question; export/import merges by union on `id`, earliest `at`).
5. **Flores** (3.2): one per completed week of play.

Album screen: shelves in that order, "Nuevo" dot, unseen count in `profile.albumSeenAt` (ISO timestamp). No sharing of the album outside the badge card in task 005.

**Not doing:** pets that need feeding or die, daily login gifts, currency, shop, rarity tiers, trading, limited-time items, lives/hearts. Optional later (not in this spec): a "Rincón de Toni" scene where the child places earned stickers (autonomy through decoration, no mechanics).

### 3.5 Healthy limits

**Play log** (`profile.play`): `{ day: 'YYYY-MM-DD', rounds, ms }` for today (reset when the local day changes), plus `profile.days`: last 60 played day keys. `ms` counts only time with the play screen visible (`document.visibilityState`), not wall-clock. Pure function `playToday(profile, now)`.

**Thresholds** (constants in `core/home.js`, settings override):
- *Meta del día* = 12 rounds. Reaching it is celebrated once.
- *Suficiente por hoy* = 24 rounds or 15 minutes, whichever first, checked at a leg boundary or an exercise end, never mid-round.

**"Suficiente por hoy" screen:** sleepy mascot, "¡Por hoy, suficiente! Tu cabeza ha trabajado mucho.", a recap of today in pictures (rounds, words rescued, stickers), a silhouette of something to find tomorrow ("Mañana: palabras nuevas te esperan") as a calm invitation, not a threat. Buttons: **Guardar y salir** (primary) and a quiet **Un ratito más** that allows 6 more rounds, after which the screen returns. Extra rounds earn the same things as normal ones and no bonus. No countdown, no sad mascot, no loss messaging.

**Parent setting** (behind the existing gate, `ui/settings.js`): daily limit off / 10 / 15 / 20 / 30 minutes (default off, since the soft screen already exists). When set, "Un ratito más" is replaced by "Hasta mañana" and only the parent gate extends it.

**Stopping cues elsewhere:** the unit result screen makes "Volver al mapa" the primary button; "Siguiente unidad" is secondary and never auto-starts. "Repaso del día" ends with its own result and no follow-on.

**Coming back after a gap:** "¡Qué bien verte!" with no mention of days missed, no lost items; the week flower simply has empty petals.

**Checklist (dark patterns we must not ship):** streak counters that reset; guilt or sadness from the mascot on leaving; timers pressing the child; push or any notifications; autoplay into the next unit; random reward whose chance depends on playing longer; comparison with other children; hearts/lives; purchases, ads, tracking (already forbidden).

### 3.6 Privacy and storage notes
Everything above lives in the existing `localStorage` store (`spanish-arcade:v1`) via `core/profiles.js`: new profile fields are `words.box/due`, `stickers`, `albumSeenAt`, `play`, `days`. Add them to the export/merge rules in PLAN §4.5 and keep fixtures invented. No network, no analytics, no per-event logs beyond these.

---

## 4. Tasks to implement

Order assumes 022 is done; 005 and 024 are existing todo tasks. Model names follow `tasks/` conventions. "Opus review" = one review at the end for core/saved-data risk, as AGENTS.md asks.

| # | Title | Scope | Files touched | Model |
|---|---|---|---|---|
| E1 | Sound effects | `ui/sfx.js` with the names in 3.3 on `shared/audio.js`; wire `ctx.sfx` and `unlockAudio()`; respect `sound` setting; note names pure table tested | `ui/sfx.js`, `app.js`, `test/sfx.test.js` | Sonnet 5.5 |
| E2 | Celebration visuals | Confetti (capped pieces, self-stopping), pop/wobble/hop classes, reduced-motion fallbacks; mascot mood swap (emoji now, SVG after 002) | `ui/celebrate.js` (merge with 012's chooser), `style.css`, `app.js` | Sonnet 5.5 |
| E3 | Feedback wording and mascot lines | Audit archetype `feedback`/hint strings against the wording guide; add event lines (rescue, leg, tomorrow, welcome back); Spanish review by owner | `archetypes/*/logic.js` strings, `data/mascot-lines.json` | Haiku 5.5 draft, Sonnet 5.5 wire |
| E4 | Progress trail and segmented bar | Trail + bar on the play screen, `progressbar` roles, shape cues; leg flag | `app.js` (`playUnit`/`show`), `style.css`, `core/home.js` (stone helper stays) | Sonnet 5.5 |
| E5 | Exercise ordering and legs | `orderExercises`, `pin` flag in schema/AUTHORING, leg boundaries and "parada" screen, save-and-leave | `core/session.js`, `core/schema.js`, `docs/AUTHORING.md`, `app.js`, `test/session.test.js` | Sonnet 5.5, Opus review |
| E6 | Word memory | `core/words.js` (`box`, `due`, `dueWords`, mastered), update in `recordUnit`, merge rule, fixtures | `core/words.js`, `core/progress.js`, `core/schema.js`, `test/words.test.js`, `test/store.test.js`, PLAN §4.4–4.5 | Sonnet 5.5, Opus review |
| E7 | Echo rounds | Re-queue one round per tricky word 3–4 rounds later; excluded from stars; "rescatada" event | `core/session.js`, `core/generate.js` (one-target make), `test/session.test.js` | Sonnet 5.5, Opus review |
| E8 | Repaso del día | `core/mix.js` virtual unit, `practice` flag skipping `recordUnit`, home button with due count; doubles as skill shortcuts from 025 | `core/mix.js`, `core/progress.js`, `app.js`, `test/mix.test.js` | Sonnet 5.5 |
| E9 | Play log, daily goal, "suficiente" screen, parent limit | `profile.play`/`days`, `roundsToday`, thresholds, screen, setting behind the gate; replaces `DAILY_GOAL` | `core/home.js`, `core/progress.js`, `ui/settings.js`, `app.js`, `test/home.test.js` | Sonnet 5.5 |
| E10 | Album 2.0 | Extends 024: shelves (unidades, palabras, rescatadas, sorpresas, flores), `profile.stickers`, "Nuevo" dot, pop on win, export/import union | `core/stickers.js`, `ui/album.js`, `app.js`, `style.css`, `test/stickers.test.js` | Sonnet 5.5, Opus review (saved data) |
| E11 | Result screen and personal best | Rebuild `finish()`: stars sequence, badge, personal-best ribbon vs previous attempt, stop-cue buttons | `app.js`, `core/home.js` or `core/progress.js` (pb helper), `style.css` | Sonnet 5.5 |
| E12 | Week flower (replaces streak chip) | Update task 025: drop streak, add flower and "días jugados" | `core/home.js`, `app.js`, `style.css`, `tasks/025-ui-home-extras.md` | Haiku 5.5 |
| E13 | Smoke and audit | Headless play-through: no errors with sound off, reduced motion, 24-round day, resume mid-leg; checklist from 3.5; no personal data | `test/` fixtures, scripted Playwright run (not committed unless useful) | Sonnet 5.5 |
| E14 | Docs | PLAN §5 rules (legs, echo, limits), README, tasks 012/024/025 updated to point here | `docs/PLAN.md`, `README.md`, `tasks/*.md` | Haiku 5.5 |

Suggested order: E1, E2, E3 (feel); E4, E11 (visible progress); E6, E7, E5 (learning engine); E9, E8, E10, E12 (long term); E13, E14.

Risk notes: E5–E7 and E10 change `core/session.js` and saved data (resume snapshots, import merge): fixtures for old snapshots and old words entries must still load. Echo rounds assume every archetype's `make()` works with a single target; E7 starts with an audit of the eight archetypes.

---

## Questions for the owner

1. **Streaks.** Drop the streak chip planned in task 025 and use the week flower plus a cumulative "días jugados"? *Recommended: yes.* Streaks risk anxiety and the cost lands on the child.
2. **Shuffle.** Shuffle exercise order inside a difficulty band, never the same archetype twice in a row, with `pin` to opt out? *Recommended: yes*, because order stays teachable via difficulty and variety helps.
3. **Daily limits.** Goal 12 rounds, soft "suficiente" at 24 rounds or 15 minutes, parent hard limit off by default? *Recommended: yes*; the soft screen is enough for most families and the hard limit stays a parent choice.
4. **Random surprises.** Allow a guaranteed cosmetic surprise sticker at each leg end (random only in which one, finite set of about 12)? *Recommended: yes*, with no duplicates until complete.
5. **Word stickers as the main collection.** Album slots for each mastered word (3 first-try successes on 3 different days)? *Recommended: yes*, because it ties the collection to real learning; nouns without an emoji are skipped.
6. **Mascot art.** Ship moods first with emoji and CSS, then swap to original SVG Toni when task 002 art exists? *Recommended: yes*, so the feel work is not blocked on artwork.
