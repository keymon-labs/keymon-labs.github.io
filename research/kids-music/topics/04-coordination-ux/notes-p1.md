# 04 Coordination & UX — P1 notes

Budget used: 8 searches, 8 extracts (1 extract failed: ACM CHI 2022 page).

## Topline
- Beat synchronisation is immature before ~5 and approaches adult levels around 7-10; expect big variance within 4-10, and gradual (not stepwise) gains.
- Children drift toward their own preferred tempo and tap behind the beat (adults tap slightly ahead); design for generous, early-skewed or symmetric tolerance, not strict windows.
- Preferred tempo (~400-450 ms IOI in toddlers, ~630 ms adults) means mid tempi (roughly 90-120 bpm) are the likely sweet spot; fast metronome (~124 bpm) discriminated age groups in 6-11s.
- Rhythm-game latency is a solved-but-fiddly engineering problem: schedule audio on the audio clock, timestamp input separately, offer a tap-to-calibrate step, keep the offset stable across restarts.
- Reactive sounds (played on tap) cannot be latency-compensated; backing-track-only games can. Teaching games should use native low-latency audio for tap sounds.
- Young-child UX: large targets with generous hot spots, tap over swipe/pinch, landscape, avoid edge-placed buttons (resting wrists), voice/icons not text, flat navigation.
- Short group music/rhythm training (24 weeks, ~8-year-olds) improved bimanual and eye-hand coordination; piano lessons improve finger independence over ~2 years. Games should build these slowly, not assume them.
- Rhythm games show promise for ADHD (about 300 min of play improved synchronisation, small proof-of-concept); children with ADHD and/or DCD sync worse, so need slower tempi, bigger tolerance, and options.
- Exergame evidence for motor skills is positive but moderate; much is about gross motor, not music timing.

## Cards

### Q1 Motor development

### Orff-based music training and manual dexterity (Frontiers 2018)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6308163
- Source: Frontiers in Psychology 2018, controlled study
- Subq: Q1, Q6
- Claims:
  - [fact] 74 children aged ~8 split into music, sports and control groups; music group trained collectively (Orff) for 24 weeks. [number]
  - [fact] Music group improved on bimanual coordination, eye-hand coordination and response speed, not on manipulative dexterity.
  - [fact] Gains did not need individual instrument lessons or multi-year training.
  - [fact] Earlier piano-lesson studies saw finger independence and fine-motor gains after about 2 years.
- For our games: short, repeated, two-handed rhythm play is a plausible vehicle for bimanual coordination in ages ~8; expect slow gains, so scaffold one-hand then two-hand.
- Caveats: low-income public school sample, n=25 per group, single age band, not a digital game.

### Fine motor milestones overview (Physiopedia)
- URL: https://www.physio-pedia.com/The_Development_of_Fine_Motor_Skills_in_Children
- Source: Physiopedia, reference summary (snippet only, not extracted)
- Subq: Q1
- Claims:
  - [fact] Page lists milestones by age band up to 5-6 years (dexterity, precision, bilateral coordination growing through 3-6).
  - [practice] Bilateral coordination and precise grasp are still strengthening in the 4-6 range.
- For our games: at 4-5 assume tapping with whole hand or index finger and one hand at a time; individual finger tasks are for later.
- Caveats: secondary source; no ages 7-10 coverage seen; no exact norms.

### ADHD and DCD overlap (CHADD)
- URL: https://chadd.org/attention-article/the-double-whammy-adhd-dcd
- Source: CHADD (patient organisation), expert summary (snippet only)
- Subq: Q1, Q7
- Claims:
  - [fact] Most children settle hand dominance by about 5; with motor delay both hands stay in use longer.
  - [practice] Children with DCD struggle with tasks needing both sides of the body together.
- For our games: do not hard-code a dominant hand; allow either-hand play and mirrored layouts.
- Caveats: advocacy source, general statements.

### Q2 Rhythm and timing development

### Full-body rhythmic synchronisation 6-11 (PMC 2024)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC11231307
- Source: peer-reviewed motion-capture study, 2024
- Subq: Q2
- Claims:
  - [fact] Period- and phase-locking to metronome and rhythm improved significantly from 6 to 11 years but had not reached adult level at 11.
  - [fact] Performance was better with a metronome than with rhythmic music stimuli.
  - [fact] Phase-locking jumped between 6-7 and 8-9 at a slow tempo; at a fast tempo (124 bpm) the jump was between 6-7 and 10-11.
  - [fact] Earlier work: period- and phase-locking only begins to emerge at around 4.5 years.
- For our games: plain metronome-like pulses are easier than complex music; use slow tempi for 6-7s, and expect fast tempo to separate ages.
- Caveats: whole-body movement, not touch tapping; sample sizes not checked.

### Sensorimotor timing across age and music experience (Sci Rep 2026)
- URL: https://www.nature.com/articles/s41598-026-38073-x
- Source: Scientific Reports, large real-world study (snippet only)
- Subq: Q2
- Claims:
  - [fact] Synchronisation typically reaches adult levels around 8-10 years; before that, inter-tap variability and asynchrony are higher.
  - [fact] Children drift toward their own spontaneous motor tempo faster than adults.
  - [fact] Even moderate music experience lowered timing error and variability.
  - [fact] Pacing at preferred tempo, 20% faster and 20% slower was used; variability is least at preferred tempo.
- For our games: let the child's own tapping tempo seed the game's tempo (adaptive tempo), and avoid sudden tempo changes.
- Caveats: snippet only; exact age sample not confirmed.

### Rhythm processing and prediction in development (PMC 2022)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC9539453
- Source: review, 2022
- Subq: Q2, Q3, Q7
- Claims:
  - [fact] 2.5-year-olds tap near their own tempo but cannot adapt to other tempi; 4-year-olds adapt better.
  - [fact] 4-5-year-olds are still poor at synchronising; 7-year-olds are near adult level (Repp & Su summary).
  - [fact] Adults tap slightly before the beat, children tend to tap behind it.
  - [fact] Children with DCD tap more variably and struggle at slow tempi.
- For our games: measure asynchrony relative to the child's mean, not zero; avoid very slow tempi for children with motor difficulties.
- Caveats: review of mixed paradigms; age bands from different studies.

### Toddler SMT via online platform (Frontiers 2022)
- URL: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.897230/full
- Source: Frontiers in Psychology 2022 (snippet only)
- Subq: Q2
- Claims:
  - [number] Adult spontaneous motor tempo is about 630 ms between taps; very young children tap as fast as 400-450 ms.
  - [fact] Drumming (gross movement) suits young ages better than finger tapping for measuring sync.
- For our games: for the youngest, use whole-hand drum pads, not small buttons.
- Caveats: toddlers, below our age range.

### Q3 Timing windows and latency

### Rhythm Game Crash Course (Native Audio)
- URL: https://exceed7.com/native-audio/rhythm-game-crash-course/index.html
- Source: developer technical write-up (also sells a plugin: vendor)
- Subq: Q3, Q4
- Claims:
  - [number] Top judgement windows in popular mobile games range from about 25 ms to 59 ms; DDR's best is one 60fps frame (~16 ms).
  - [practice] Backing-track latency is fixed by user calibration of an offset; the offset must stay identical on every restart or players distrust it.
  - [fact] Response sounds played on a tap cannot be pre-compensated, so they need the lowest-latency audio path.
- For our games: kids' windows should be several times wider than arcade ones (e.g. 100+ ms, our assumption), but calibration and native/low-latency audio still matter for fairness.
- Caveats: aimed at adult arcade-style games and Unity; vendor.

### Rhythm Quest devlog 4 and Sound Horizons calibration devlog
- URL: https://rhythmquestgame.com/devlog/04.html ; https://www.youtube.com/watch?v=Uns9lIldV2U
- Source: indie developer devlogs (snippets only)
- Subq: Q3
- Claims:
  - [practice] Schedule the music on the audio DSP clock and derive song time from it; subtract a device-specific latency adjustment; resync if drift appears.
  - [practice] Calibration: first tap to a heard rhythm (audio+input latency sum) with no visual cue and no tap sound, then align a visual cue (display latency).
- For our games: a two-step tap-and-align calibration is short enough for kids if wrapped as a game, or defaults can be used with a parent-level slider.
- Caveats: Unity-specific; written for adults.

### Q4 Feedback design

### Gesture-based rhythm game for children (CHI 2022)
- URL: https://dl.acm.org/doi/fullHtml/10.1145/3491102.3517456
- Source: ACM CHI 2022 (extract failed; search snippet only)
- Subq: Q4, Q6
- Claims:
  - [practice] The study gave real-time visual feedback during play to boost children's motivation.
- For our games: worth a P2 extract for the actual feedback and age findings.
- Caveats: only one snippet line seen; details unverified.

### Q5 UX for young children

### Playful Interfaces (UXPA Magazine)
- URL: https://uxpamagazine.org/playful-interfaces
- Source: UXPA Magazine, expert practitioners/academics
- Subq: Q5, Q3
- Claims:
  - [practice] Younger child means larger target; accuracy is limited by fine motor control, not finger size.
  - [practice] Use large "hot spots" so near-misses count (example: a preschool puzzle game).
  - [practice] Increase tolerance in time and space for slower reactions and imprecise taps.
- For our games: apply the same forgiveness principle to tap timing and tap position.
- Caveats: opinion-led guidelines, no numeric tolerances.

### Designing touch tablet experiences for preschoolers (Sesame Workshop)
- URL: https://joanganzcooneycenter.org/publication/best-practices-designing-touch-tablet-experiences-for-preschoolers
- Source: Sesame Workshop/Cooney Center, synthesis of 50+ studies
- Subq: Q5
- Claims:
  - [practice] Tapping is most intuitive; pinching and flicking are hard for developing motor skills.
  - [practice] Use voice and visual reinforcement for non-readers; preschoolers hold tablets in landscape.
  - [practice] Wrists rest on the bottom edge, so icons placed on edges trigger accidental taps.
- For our games: keep interactions to tap/drag, narrate instructions, keep controls off the bottom edge.
- Caveats: older (tablet-era early 2010s), preschool only.

### Touch target sizing (NN/g, Material)
- URL: https://www.nngroup.com/articles/touch-target-size ; https://m3.material.io/foundations/designing/structure
- Source: NN/g and Google Material guidelines (snippets only)
- Subq: Q5
- Claims:
  - [number] Adult minimum is 1 cm x 1 cm; Material suggests 48 dp (~9 mm), 7-10 mm recommended.
  - [number] A design blog cites NN/g as suggesting about 2 cm x 2 cm for young children (secondary, unverified).
  - [opinion] Young children need larger, well-spaced controls.
- For our games: use at least ~2 cm game pads, generous spacing; verify the child figure in P2.
- Caveats: child figure is second-hand.

### Child-Computer Interaction (Hourcade textbook)
- URL: https://jphourcade.com/book/child-computer-interaction-first-edition.pdf
- Source: academic textbook (snippet only)
- Subq: Q5
- Claims:
  - [practice] Hidden menus and pull-down structures are problematic for children; keep choices visible.
  - [practice] ScratchJr uses icons rather than text, large icons, and few options at once for 5-7-year-olds; tutorials matter.
- For our games: icon-first navigation, few visible choices, onboarding via a guided first level.
- Caveats: textbook summary; no numbers.

### Q6 Games known to train coordination

### Exergaming, executive function and motor ability (PLOS One 2024)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC11379181
- Source: systematic review and meta-analysis, 2024
- Subq: Q6
- Claims:
  - [number] Meta-analysis of 16 studies: exergame groups beat controls on gross motor scores (SMD 0.61).
  - [practice] Real-time visual feedback of one's own movement is proposed as the mechanism for implicit motor learning.
- For our games: movement mirrored on screen in real time is a good pattern; camera-based or pad-based tasks are credible.
- Caveats: gross motor, mixed ages, heterogeneity ~60%; not musical timing.

### Q7 Accessibility and attention differences

### Children with ADHD cannot move to the beat (PMC 2017)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC5599521
- Source: peer-reviewed study (snippet only)
- Subq: Q7, Q2
- Claims:
  - [fact] Children with ADHD tapped to a metronome and music less consistently; those with ADHD plus DCD were worst.
  - [fact] Hyperactive-type ADHD seems linked to the rhythm perception difficulty.
- For our games: use wider tolerance and clear steady pulse; show progress against own baseline.
- Caveats: clinical sample, not game-based.

### Gamified rhythmic training for ADHD (medRxiv 2024)
- URL: https://www.medrxiv.org/content/10.1101/2024.03.19.24304539v1.full-text
- Source: preprint, proof-of-concept
- Subq: Q7, Q4, Q6
- Claims:
  - [number] About 300 min of tap-to-the-beat game play improved synchronisation and some executive functions in children with ADHD.
  - [practice] Levels increased difficulty using measured synchronisation consistency of each song, with moving "distractor" enemies added on a second pass.
  - [practice] Child version tested first on 6-13-year-olds; royalty-free music chosen.
- For our games: rank songs by measured sync difficulty; add distractors only after a clean first pass.
- Caveats: preprint, small sample, not peer reviewed.

## Gaps
- Actual judgement-window numbers for children (ms) and evidence on early/late asymmetry in games; no study found.
- Which tempi (bpm) 4-10-year-olds sync best with in touch tapping on screens.
- Feedback design specifics (anticipation cues, approach circles, early/late indicators) with children; CHI 2022 paper unread.
- Finger independence norms by age; what is realistic for 4-6.
- Left-handed and small-hand layouts; no sources found.
- Voice/onboarding: only generic CCI sources; no rhythm-game-specific onboarding.
- Evidence for DDR/Simon/clapping games on coordination.

## Leads
- https://dl.acm.org/doi/fullHtml/10.1145/3491102.3517456 : CHI 2022 children's gesture rhythm game; likely feedback and age findings (retry extract).
- https://www.mdpi.com/2073-431X/15/8/485 : preschool app CCI quality criteria scoping review (navigation, controls, feedback).
- https://pmc.ncbi.nlm.nih.gov/articles/PMC13047359 : dance-based exergaming and general motor coordination (pilot).
- https://childmind.org/blog/rhythm-based-video-games-exploring-the-cognitive-and-learning-potential : rhythm game and learning research group; may link to a game study.
- https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2026.1808386/full : rhythmic music game for ADHD children (tablet, staged tasks).
- https://www.researchgate.net/publication/361093434_Sensorimotor_synchronization_with_music_and_metronome_in_school-aged_children : age and sex effects in SMS, music vs metronome.
- https://spectrum.library.concordia.ca/id/eprint/983691/1/Penhune-Frontiers-2018.pdf : child rhythm tasks, ages 7-13 norms.
