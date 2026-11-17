# Cross-topic plan for P2 (P1.5 mixer)

Read: all six `brief.md` and `notes-p1.md`. Topic ids: 01 pedagogy, 02 technique, 03 engagement, 04 coordination-ux, 05 rhythm-games, 06 fourth-wall. Claims below cite the topic notes that hold the source card; items marked [ours] are our own inference.

## 1. Emerging picture

- **One unlock ladder fits pedagogy, levels and adaptivity.** Kodály's small-step pitch order (so-mi → la → do, re → fa, ti; 01) and steady beat → rhythm (01, 02) map directly onto game levels. "Success breeds success" (01) is the same idea as visible competence in SDT (03). Fixed age gates are wrong: the bands overlap (01), and sync ability varies widely between 4 and 10 (04). So: one ladder, with adaptive steps along it (03 DDA) instead of an age setting. [ours]
- **Four-step unlock = sound before symbol × call-and-response × sandbox.** Every new note or rhythm goes play it → play with it → hear it → see it written (01). PaRappa's "rap Simon-says" prototype (05), Orff's imitate → explore → improvise → compose (01) and Toca-style free play (03) all fit this as game modes: echo, answer, free play, then a "write it down" step. [ours]
- **Steady beat is its own game, done with the body first.** Pedagogy wants a year of beat before rhythm (01); it is felt through touch and movement (02, Feierabend); children sync better to a plain pulse than to music (04); whole-hand drumming suits the youngest better than finger taps (04). Input: large touch pads or a mic onset check for claps. Scoring: against the child's own mean asynchrony, not zero (04), with NecroDancer-style drift correction (05).
- **Input mode decides what may be graded.** MIDI: exact pitch and timing, so it can score rhythm and pitch (06). Mic: coarse "played / roughly this pitch", no rhythm score (06), and singing targets in the D4–A4 range (01). Camera: zone-level hand position and brick or mat reading with ArUco corners, but not fingering (06). Touch: timing with latency calibration (04). Posture and finger curve can't be checked reliably by any of these, so they get prompts, gestures and task shrinking, not grades (02). [ours, from 02/04/06]
- **Technique is taught through task design, not through checking.** Non legato first, with a reset beat between notes (02, Piano Safari); move the hand early instead of stretching; flat fingers come from load and reaching (02). A game can schedule rests, keep patterns inside one hand position, slow down when errors rise, and use animal gesture images. That trains good habits without a camera judging the hand. [ours]
- **Rewards: informational, unexpected, about mastery.** Expected tangible rewards lower free-choice interest (03). Paying children to practise goes with quitting (02, Faulkner et al.). Streaks cause guilt (03). Process praise beats ability praise (03). The common rule: feedback says what got better ("steadier beat"), delight is a surprise, and progress marks never expire.
- **Physical objects work best with the screen as conductor.** Boomwhacker-style bouncing colour cues that fade into notation (06), Osmo's per-piece confirmation (06), Beat Tiles' word cards and Kodály manipulatives (01), and cheap passive objects read by a camera (06, Labo/Osmo) point the same way: the screen cues, checks and confirms, and the hands stay on real objects. This suits Brick Beats. [ours]
- **Co-play is a design requirement for ages 4–7.** Parents are the main motivational influence at young ages (02). Joint-play apps need symmetry, interruptibility and natural stops (03). Clapping games give a partner role (06), and the Suzuki triangle puts the parent in home practice (02). Every game should have a second-player role that a non-musician adult can fill. [ours]
- **Pre-readers need audio-first cues.** Rhythm Heaven's audio motifs (05), voice and icon UX (04) and pedagogy's ear-first order (01) agree. Text and notation are later layers, not the way into the game.
- **Existing apps placed on the map** [ours]: Beat Tiles = Kodály word-chant rhythm with manipulatives (good fit; the sound-before-symbol step comes before the cards). Brick Beats = colour-coded tangible notation (needs a fade-to-staff path). Finger Moles = five-finger position (check: does it reward rapid repeated taps, which is a tension risk in 02?). Piano Jump = real-instrument platformer (check: does it teach reading or just cue-following?).

## 2. Tensions

- **Engaging cues vs reading.** Falling notes, colours and finger numbers hook children and lower load, but reviewers say they become crutches (05). Pedagogy wants notation eventually, with labels for sounds already known (01). The boomwhacker fade (06) is the only bridge found so far. Open: how and when to fade.
- **Forgiving vs accurate timing.** Wide, drift-corrected windows feel best and suit children who tap late and drift (04, 05). But the skill is a steady, accurate pulse. PaRappa found that loose timing removes tension and the feeling of performing (05). We need forgiveness that still shows the truth (e.g. a wide pass window plus an honest early/late display). [ours]
- **Tempo: slow vs the child's own tempo.** Vendor tables say start slow (60–80 BPM for 3–5; 02). Research says children drift toward a fast preferred tempo (~400–450 ms in toddlers), sync worst at slow tempi when they have motor difficulty, and Feierabend uses 120–136 for movement (02, 04). These sources disagree; P2 or P4 has to resolve it, probably by seeding tempo from the child's own taps. [04]
- **Fun vs correct technique.** Fast, repetitive, high-score loops (whack-a-mole, speed bonuses) reward tension and finger-only playing (02). Juice and speed drive engagement (03, 05). Rest beats and caps on repetitions cut into the core loop. [ours]
- **Extrinsic structure vs intrinsic motivation.** Gamification shows large average gains in primary school (03, g 0.82), yet points, badges and leaderboards top the list of negative effects (03), and rewards undermine interest (03). Very young children may be less affected (Feingold & Mahoney, 03). The question is which game elements are safe.
- **Toy vs game.** Toca's no-goals sandbox and Chrome Music Lab invite exploration (03, 05), but practice needs a task layer (05, teachers add one). Orff improvisation needs limits (01). Both are needed; open question is how a child moves between them.
- **Fixed vs movable do.** Spanish and European users expect fixed do (do = C); Kodály and Gordon use movable do (01). Theory snippets and on-screen labels depend on this choice.
- **Kodály vs Gordon rhythm syllables.** Both are in wide use and neither has data behind it (01). Beat Tiles already uses word chants. Pick one and note why.
- **Fourth-wall surprise vs child safety.** Memorable breaks fake crashes or watch the player (06); for children only the playful "do something in the real room" kind is acceptable. [ours]
- **Session caps vs flow.** Caps of 5–15 minutes (02), Osmo's 30-minute limit and natural stops (03, 06) work against long engaging sessions. Short plus frequent is the pedagogy answer (02).

## 3. Cross-topic questions for P2

One cross gatherer, 8 searches, 8 extracts. Do not redo per-topic leads (Iwata Asks, judgement-window numbers, Kodály grade sequences, MDA/juice, latency). Each question is about how two or more topics fit together. Budget split in brackets.

### X1 Fading scaffolds: from cues to notation [2 searches, 2 extracts]
How do methods and apps move children from colour, falling-note or finger-number cues to reading, and does motor-learning research on feedback fading (the guidance hypothesis: too much concurrent feedback creates dependence) apply?
- Queries: `guidance hypothesis concurrent feedback dependency motor learning children faded feedback`; `colour-coded notation transition standard notation children study`; `stick notation Kodaly transition to staff`.
- Targets: motor-learning reviews (Salmoni/Schmidt guidance hypothesis, Wulf on feedback frequency); music-ed studies on colour notation (JRME, IJME, Psychology of Music); Kodály stick-notation practice.
- Feeds: tension 1; design principle on scaffolds; Piano Jump and Brick Beats.

### X2 Intrinsic integration: the skill as the core mechanic [1 search, 2 extracts]
Is there evidence that learning games work better when the content is the core mechanic, not a quiz between levels? This joins 03 (motivation) with 05 (rhythm mechanics) and 01 (what to teach).
- Queries: `Habgood Ainsworth intrinsic integration educational game children study`; fallback `endogenous fantasy educational games Malone`.
- Targets: Habgood & Ainsworth 2011 (J. Learning Sciences, Zombie Division); Malone & Lepper intrinsic motivation taxonomy.
- Feeds: the core rule in design-principles ("the correct musical action is the move"), game-seeds.

### X3 Moving vs tapping vs screen: does embodiment improve rhythm learning? [2 searches, 1 extract]
Do movement-based (Dalcroze), manipulative or tangible rhythm activities beat screen-only practice for 4–10s, and does whole-body work transfer to finger and instrument timing?
- Queries: `Dalcroze movement intervention children rhythm accuracy study`; `embodied movement vs tapping rhythm learning children experiment`.
- Targets: Psychology of Music, JRME, Frontiers studies; Dalcroze society research pages.
- Feeds: choosing input per skill in skill-map (camera/movement vs touch vs MIDI); Brick Beats and Beat Tiles.

### X4 Accuracy standards: what counts as "correct enough" for a child? [1 search, 1 extract]
What tolerances do music educators and assessment rubrics use for beat and rhythm accuracy at ages 5–10, and how do they balance encouragement with honest correction? This joins 01/02 (correct technique) with 04/05 (windows).
- Queries: `steady beat assessment rubric children accuracy criteria elementary music`; `children beat competence measurement tolerance asynchrony criterion`.
- Targets: music-ed assessment literature (Gordon's tests, beat-competence studies such as Weikart), teacher rubric documents.
- Feeds: tension 2; scoring guidance in design-principles.

### X5 The non-musician parent as practice partner [1 search, 1 extract]
How can a screen coach a parent who can't play to support practice (Suzuki role) without the screen taking over? This joins 02 (parent role), 03 (joint media engagement) and 06 (off-screen tasks).
- Queries: `joint media engagement design guidelines parent child` (the ACM 3816918 lead, if 03's planner hasn't taken it; otherwise) `music app parent involvement home practice young children study`.
- Targets: ACM IDC/CHI joint media engagement papers; Suzuki Association parent guidance; Cooney Center.
- Feeds: co-play principle; a "partner role" field in every game seed.

### X6 Short theory explanations in play: when and how long? [1 search, 1 extract]
For 4–10s, does just-in-time explanation (after an attempt, by voice, a few seconds long) work better than up-front tutorials? Which metaphors do teachers use for core concepts (beat vs rhythm, high/low, note length, rests, chord "home")?
- Queries: `just-in-time instruction educational games children explanation timing`; `explaining beat vs rhythm to young children metaphor`.
- Targets: educational game research (e.g. Wouters & van Oostendorp, instructional support in serious games meta-analysis); teacher blogs and method associations for metaphors.
- Feeds: theory-snippets.md (format, length, trigger points).

Leftover budget: none. If a search misses, drop X4 before the others; P4 can settle it by reasoning from 04/05.

## 4. Synthesis frame (P4)

### cross/synthesis.md
The combined answer in about 2–3 pages:
- What we know with good evidence vs practitioner consensus vs our inference, marked as such.
- The model: one skill ladder × game modes (echo, answer, free play, write it down) × input that checks it × feedback style.
- How each tension in §2 was resolved, or left open with both sides cited.
- What our four existing apps should change, one or two lines each.
- Open questions and evidence gaps.

### cross/skill-map.md
A table, one row per core skill. Skills: steady beat, tempo awareness, rhythm (ta/ti-ti, rests), metre, pitch matching/singing, high/low and contour, solfège ladder, intervals, five-finger position, articulation (non legato → legato → staccato), hand independence, posture and setup, reading (pre-staff → staff), chords and harmony (root drone → I-IV-V), improvisation/composition, and ukulele strum and one-finger chords.
- Columns: age band where it typically emerges (4–5 / 6–7 / 8–10, marked as a guide); prerequisites; direct practice (on the instrument); indirect practice (body, objects, theory game); input that can check it and how well (MIDI / mic / camera / touch / parent check / cannot check); common mistake to avoid training; source ids.

### cross/design-principles.md
10–15 numbered rules, each with a one-line why and its sources. Examples: sound before symbol; skill = mechanic; informational feedback and surprise delight, never pay-per-minute; no streak loss, guilt mascots or countdowns; wide adaptive timing with an honest early/late display; tempo seeded from the child; grade only what the input can measure; technique through task design (reset beats, rests, repetition caps); scaffolds that fade; sandbox next to goals; co-play role and natural stops; audio- and icon-first for pre-readers; kid-safe fourth wall. Then a short anti-pattern checklist to run against any new game.

### cross/theory-snippets.md
20–40 short explanations a child can understand, ready to drop into games. Each entry:
- concept; age band; a one-sentence voice line (≤15 words, our own wording); a visual or gesture to show it; when to trigger it (unlock, after a miss, after success); the misconception it prevents.
- Note-naming setting: fixed do / movable do / letters.
- Every snippet checked against mainstream pedagogy, with sources. No text copied from method books.

### cross/game-seeds.md
8–15 game ideas that mix topics. Each seed:
- one-line pitch; skill(s) from skill-map; input; core loop; how it fades scaffolds; partner role; theory snippets used; risks (technique, motivation); closest existing app to start from.
- Include upgrades to existing apps where they are seeds.
- Mark which are Prototype-sized.
