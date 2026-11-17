# 04 Coordination & UX — P2 plan

Budget: 10 searches, 10 extracts. Planned: 9 searches, 9 extracts (1 spare of each for retries or verification).

## 1. What we know (judged)
- **Solid:** Sync to a beat improves gradually 6→11 and is not adult-level at 11. A plain metronome is easier than music. At 124 bpm the age jump comes later than at a slow tempo (PMC11231307, extracted).
- **Solid:** About 24 weeks of group Orff training at age ~8 improved bimanual and eye-hand coordination but not manipulative dexterity. Finger-independence gains from piano take ~2 years (PMC6308163, extracted, n≈25/group).
- **Solid but qualitative:** Tapping is the most reliable gesture for under-6s. Pinch and flick are hard. Landscape grip with wrists resting on the bottom edge causes accidental taps there. Give spoken instructions to non-readers (Cooney Center synthesis, extracted, preschool only, early-2010s tablets).
- **Solid, but written for adults:** Arcade judgement windows are about 16–60 ms. Reactive tap sounds cannot be latency-compensated, and a calibrated offset must persist (Native Audio, vendor).
- **Weak (review or snippet):** Children tap *behind* the beat and adults slightly ahead. Children drift toward their own spontaneous tempo. Adult-level sync comes at 7, or at 8–10, depending on the source. These are second-hand or snippet-only, and the ages disagree.
- **Weak (snippet):** Toddler spontaneous tempo is ~400–450 ms IOI vs ~630 ms for adults. Our "90–120 bpm sweet spot" is an inference from this and is not measured for ages 4–10.
- **Weak (secondary):** a ~2 cm child touch target attributed to NN/g, not verified.
- **Missing:** child-specific timing windows in ms, touch→sound latency on Android Chrome, feedback/anticipation-cue evidence with children, left-handed layouts.

## 2. Phase 2 questions (ranked)

### Q-A. Tap asynchrony and variability (ms) by age 4–10, and the best tempo per age
- Why: this is the single number set our judgement windows need. If the 7-year-old SD of asynchrony is ~X ms, a "perfect" window of about ±1 SD and an "ok" window of about ±2 SD is a defensible default. It also checks the 90–120 bpm guess and the behind-the-beat bias.
- Queries: `children finger tapping asynchrony age` · `synchronization tapping development tempo children` · `spontaneous motor tempo children age`
- Sources: developmental SMS studies (Drake, Jones & Baruch 2000; McAuley et al. 2006 lifespan; Provasi & Bobin-Bègue 2003), Repp & Su 2013 review tables.
- Extract: https://www.researchgate.net/publication/361093434_Sensorimotor_synchronization_with_music_and_metronome_in_school-aged_children ; https://spectrum.library.concordia.ca/id/eprint/983691/1/Penhune-Frontiers-2018.pdf (child rhythm norms 7–13). Retry https://www.nature.com/articles/s41598-026-38073-x if the search does not give a better primary source.
- Budget: 2 searches, 3 extracts.

### Q-B. Real touch→sound and MIDI→sound latency in Chrome on Android, and how to measure and calibrate it in a web app
- Why: the latency floor sets how tight any window can be. Hardware latency of 100+ ms on a cheap tablet would swamp a child window, so we need typical ranges and the Web Audio knobs (`latencyHint`, `baseLatency`, `outputLatency`, `event.timeStamp`, Web MIDI timestamps).
- Queries: `Android Chrome Web Audio latency` · `AudioContext outputLatency Android`
- Sources: Android audio latency docs (source.android.com), Chrome/web.dev articles, measured latency tables (Superpowered or similar, mark as vendor), MDN.
- Extract: the best Android latency doc and the best Chrome/Web Audio latency article from the results.
- Budget: 2 searches, 2 extracts.

### Q-C. Feedback and anticipation cues for children in rhythm or timing games
- Why: deciding between note highways, approach cues, audio count-ins and early/late indicators, and between real-time and summary feedback, changes every game's screen.
- Queries: `children rhythm game feedback study` · `anticipatory cues timing children game`
- Sources: CHI/IDC papers, the CHI 2022 gesture rhythm game, game-UX research with children.
- Extract: https://dl.acm.org/doi/fullHtml/10.1145/3491102.3517456 (retry; if blocked, look for an arXiv or author PDF in the search), https://childmind.org/blog/rhythm-based-video-games-exploring-the-cognitive-and-learning-potential (only if it links to a primary study).
- Budget: 2 searches, 2 extracts.

### Q-D. Children's touch accuracy: target size, spacing and miss rates by age
- Why: sizes the drum pads and on-screen keys. We need a number (mm) and evidence on edge and gesture errors for ages 4–10, not only preschool.
- Queries: `children touchscreen target size study` (expect Anthony et al. 2012/2013, Hourcade, Vatavu)
- Sources: CHI/IDC papers on child touch input, NN/g children article.
- Extract: the best child touch-accuracy paper from the results (should also verify the 2 cm figure, see Verify).
- Budget: 1 search, 1 extract.

### Q-E. Slower tempo, wider window or both: what helps ADHD/DCD children in tablet rhythm games
- Why: it sets the defaults of the "easy" mode and checks the preprint's levelling method in a peer-reviewed tablet study.
- Queries: none planned (use the lead directly).
- Extract: https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2026.1808386/full
- Budget: 0 searches, 1 extract.

### Q-F. Onboarding, navigation and controls for non-readers in apps for ages 3–7
- Why: every game needs a voice- and icon-first first run. A recent scoping review may give checkable criteria instead of 2012-era advice.
- Queries: none planned.
- Extract: https://www.mdpi.com/2073-431X/15/8/485
- Budget: 0 searches, 1 extract (skip if budget is short; rank last).

Spare: 3 searches and 0–1 extract, held for Verify.

## 3. Verify (primary source)
1. "Synchronisation reaches adult levels around 8–10" (Sci Rep 2026, snippet) vs "7-year-olds near adult" (Repp & Su via PMC9539453). Find which measure each uses. Covered by Q-A.
2. "Children tap behind the beat, adults ahead" (negative mean asynchrony in adults, positive or less negative in children). Check in a primary developmental study. Covered by Q-A.
3. "NN/g recommends ~2 cm × 2 cm targets for young children." Check on nngroup.com (one spare search: `nngroup children touch target`).
4. "Toddler SMT 400–450 ms, adult ~630 ms" (Frontiers 2022 snippet). Accept a primary SMT-by-age figure from Q-A instead.

## 4. Drop / out of scope
- Gross-motor exergame meta-analyses and dance-exergame pilots (PMC13047359): not about music timing. Already enough for "mirror movement on screen".
- General fine-motor milestone charts (Physiopedia-style). Hand finger-specific norms to 02.
- DDR, Simon or clapping-game evidence as a separate search: no primary evidence likely within this budget. Note it as a gap.
- Unity- and native-plugin specifics (DSP clock APIs): use only the Web Audio equivalents.
- Left-handed or small-hand layouts as a search: no sources in P1. Treat it as a design default (mirror toggle, either hand) and record it as our own idea.

## 5. Hand-offs
- **05-rhythm-games:** judgement windows and auto-calibration in shipped games (NecroDancer, Rhythm Heaven, PaRappa), and how they tell players early vs late. 04 gives the child timing data; 05 gives the game conventions.
- **06-fourth-wall:** mic and camera onset-detection latency and error rates, and MIDI vs mic grading. 04 covers only touch/Web Audio output latency and Web MIDI timestamps.
- **02-technique:** finger independence and realistic finger tasks by age on the piano, and session length.
- **03-engagement:** dynamic difficulty methods (adaptive tempo or window as DDA), and wording of error feedback (informational vs controlling).
- **01-pedagogy / cross:** tempo choice for songs. Feierabend's 120–136 bpm for movement (02) conflicts with our 90–120 bpm tapping guess. Cross should reconcile them: whole-body movement vs finger tap, perhaps.
