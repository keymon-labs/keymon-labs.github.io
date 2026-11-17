# 02 Technique — P2 plan

Focus for P2: turn "correct technique" into things a game can **observe** (MIDI, mic, camera, a parent's tick) and **respond to** without training bad habits. P1 covered general setup and motivation well enough. It did not cover what is measurable.

Budget: 10 searches, 10 extracts. The allocation per question is shown in brackets. Stop at the cap and list leftovers under "Gaps".

## 1. What we know (judged)
- **Solid (practitioner consensus, several sources agree):** setup comes first. That means supported feet, forearms about level with the keys and a neutral but mobile wrist. Tension and finger-only playing are the main strain risks. Correct one thing at a time. None of this is from a study, but nothing in P1 contradicts it.
- **Plausible, single method source:** non legato first, then legato, then staccato (Piano Safari, reporting Hague's dissertation secondhand). This matters a lot because it sets the order of our first piano mechanics. Needs the primary source.
- **Plausible, mechanism only:** flat fingers come from reaching, cognitive load and setup, so the fix is to shrink the task, not to nag. This comes from one blog, but it matches what 06 found about camera limits. Either way, games should not grade finger curve.
- **Weak, vendor/SEO:** age bands (ukulele 5–6, guitar about 7+) and minutes per session by age. The ukulele source's tables contradict each other. The BPM bands (60–80 / 70–100) come from a music-school blog with no sources. Use these as defaults only, not as facts.
- **Mixed evidence:** interleaving. One small child study (Stambaugh, beginner clarinet) is positive, others are null, and learners prefer blocked practice. Day-scale spacing for piano is untested. It is safe to interleave inside a round, but we can't claim it is better.
- **Solid direction, secondhand detail:** rewards for practice time undermine persistence. The Faulkner/Davidson/McPherson n=157 figure is cited via Evans and was read at snippet level. 03 has the stronger primary evidence (Deci 1999 meta-analysis).
- **Steady beat is felt before it is heard** (Feierabend). This is practitioner advocacy. The Weikert transfer claim is unverified, so drop it.
- **Source hygiene:** card Q6 cites `pmc.ncbi.nlm.nih.gov/articles/PMC13252975`. The ID looks implausibly high and the article is about hearing-device users. Treat the Welch phases as unverified until a proper citation is found.

## 2. Phase 2 questions (ranked)

### P2-Q1. Which technique faults are visible in MIDI data, and how have researchers measured them? [2 searches, 2 extracts]
- Why: MIDI is our only exact sensor (per 06). Velocity evenness, note-off/note-on overlap (legato vs detached), inter-onset evenness, simultaneity of "together" notes and stray key presses could each stand in for a technique cue. We need to know which proxies are established and which thresholds are used.
- Queries: `MIDI velocity evenness piano students`; `piano legato overlap MIDI analysis`; `scale evenness MIDI piano assessment`
- Sources: music-informatics or NIME/ISMIR papers, piano pedagogy research using Disklavier/MIDI, music-psych studies of scale performance (e.g. Jabusch et al. on scale evenness, if found).
- Extract: the best paper from each of the first two queries.

### P2-Q2. Can fingering be inferred or checked without a camera, and what are the standard beginner fingering rules? [1 search, 1 extract]
- Why: correct finger numbers are the core of "correct technique" for Finger Moles and Piano Jump. If fingering estimation from MIDI exists (e.g. the PIG dataset / Nakamura et al.), a game could flag unlikely fingerings in a fixed five-finger position. Otherwise a fixed hand position must constrain it by design.
- Queries: `piano fingering estimation MIDI dataset`; `PIG piano fingering dataset`
- Sources: academic papers (arXiv, ISMIR), dataset pages.

### P2-Q3. Feedback design for motor learning in children: how often, how fast, and how specific? [2 searches, 2 extracts]
- Why: this is the biggest gap and it directly shapes the game loop. The guidance hypothesis says that constant, immediate error feedback can help performance and hurt retention. Faded or summary feedback, and "feedback after good trials", have been studied in children. This tells us whether every wrong note should beep.
- Queries: `feedback frequency motor learning children`; `guidance hypothesis children retention`; `knowledge of results music practice`
- Sources: motor-learning reviews (Wulf, Schmidt, Lee), studies with child participants, any music-specific study.

### P2-Q4. Slow practice, chunking and the "rushing" habit in young learners [1 search, 1 extract]
- Why: games tend to reward speed. Teachers say slow, chunked practice builds correct movement and that kids rush when excited. We need a sourced rule for tempo ramps (when to speed up, by how much) and chunk size, so that difficulty curves don't train tension.
- Queries: `slow practice piano children chunking`; `tempo increase practice strategy piano`
- Sources: practice-strategy studies (Duke, Simmons & Cash 2009 on expert pianists' practice; Miksza), experienced teacher writing.

### P2-Q5. Which posture and hand faults matter most for ages 4–10, and which can a parent or camera check? [1 search, 2 extracts]
- Why: this decides whether we build a camera check, a parent checklist or nothing. We need a prioritised list (bench height, wrist collapse, thumb, tension, hunching) with how teachers detect each, so we can map each fault to "observable by camera", "observable by parent" or "only by a teacher".
- Queries: `young beginner piano hand position faults`; `piano posture checklist children teacher`
- Sources: pedagogy bodies (MTNA, ABRSM teacher resources), experienced teachers, Piano Safari's other technique pages.
- Extract: https://www.teachpianotoday.com/piano-posture-and-hand-position (only snippet-read in P1) plus the best new hit.

### P2-Q6. Looking at hands vs keyboard geography: what do teachers do for 4–7s? [1 search, 1 extract]
- Why: screen-based games pull the eyes up, away from the hands. We need to know whether teachers want early beginners to look at the keys (geography, black-key groups) or to avoid it, and when. This decides whether our on-screen cues should help hand-watching or replace it.
- Queries: `piano beginners looking at hands`; `black key groups tactile navigation`
- Sources: teacher blogs with a track record, method publishers (Faber, Piano Safari, Music for Little Mozarts), any reading-eye-movement study.

### P2-Q7 (lower). Ukulele first steps that a mic can check [0 searches; only if budget remains]
- Why: a steady down-strum and clean one-finger C are checkable by mic (onset regularity, chord recognition). Mostly covered in P1. Skip unless Q1–Q6 come in under budget.

## 3. Verify [2 searches, 1 extract]
1. **Non legato first (Hague dissertation).** Find the dissertation itself (title, university, year) and the study design. Query: `Hague dissertation piano non legato`. Extract the abstract, or https://www.pianosafari.com/field-notes/foundations-of-piano-technique if the dissertation is not online.
2. **Faulkner, Davidson & McPherson 2010, the n=157 rewards finding.** Confirm the wording and ages from the original or a direct abstract. Query: `Faulkner Davidson McPherson 2010 practice`. Don't extract if the abstract in search results is enough.
3. **Stambaugh interleaved practice, beginner clarinet.** Confirm the age, sample size and effect from the abstract. No dedicated search: confirm from the PMC4989027 reference list if it was already read, otherwise list under Gaps.
4. **Welch's pitch-matching phases and the "complete by about 8" claim.** Fix the bad PMC citation. Hand off to 01-pedagogy (child voice) if it isn't found incidentally.

Totals: Q1–Q6 use 8 searches and 9 extracts, and Verify uses 2 searches and 1 extract, for 10 of each.

## 4. Drop / out of scope
- Weikert's claim that steady beat transfers to reading, maths and behaviour. It is strong and off-goal.
- Further rewards and motivation searches. 03 has the primary evidence, so don't spend P2 budget here.
- Guitar beyond ukulele (nylon vs steel, string action, fretting-hand detail). The ages are 7+, there is no game planned, and the sources are vendor-only.
- Practice-minutes tables by age. Accept them as soft defaults and don't chase them further.
- Injury incidence data in children. None exists at our level, and the design rule (rest beats, cap repetitions, slow down on tension) stands without it.
- Gross-motor/exergame evidence (04 owns it).

## 5. Hand-offs
- **06-fourth-wall:** camera hand-tracking accuracy (MediaPipe, thumb occlusion, fps) and mic vs MIDI reliability. 02 supplies the fault list (P2-Q5), and 06 says which faults are technically detectable.
- **04-coordination-ux:** timing tolerance windows, tap-behind-the-beat bias, preferred tempo by age and latency calibration. 02 should not re-research BPM bands. The vendor 60–100 BPM numbers should be checked against 04's study-based ~90–120 bpm range.
- **03-engagement:** rewards, streaks, praise wording and Faulkner-style persistence findings. 02 only verifies the one citation.
- **01-pedagogy:** pitch-matching development (Welch phases), child vocal range and solfège. 02 should drop its own singing-range claims in favour of 01's (D4–A4 for under-5s, which differs from P1's "F–G mid range").
- **05-rhythm-games:** critique of falling-note apps (finger-number crutches, binary feedback). Pairs with P2-Q3 (feedback) at synthesis time.
- **Cross (P4):** a mapping table from technique cue to sensor (MIDI, mic, camera, parent, none) to game response. Build it from 02-Q1/Q5 and 06.
