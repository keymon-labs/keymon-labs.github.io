# 05 Rhythm games — P2 plan

Budget for P2 gatherer: 10 searches, 10 extracts. Allocation is given per question; stop at the cap and list leftovers under "Gaps".

## 1. What we know (from P1, judged)
- **Solid (primary designer source):** PaRappa's loose-timing beta felt flat; the fix was strict timing plus an improvisation bonus that rewards the player's own variation (shmuplations 1996 interview).
- **Solid (primary designer source):** NecroDancer moved from a ~100 ms window to a full-beat window plus slow auto-calibration because stressed players drift; strict accuracy was "just frustrating". Adult game, but matches topic 04's child-timing data.
- **Weak (secondary blog):** Rhythm Heaven replaces note lanes with audio motifs that cue each action, one comic scene per level. Plausible and important for pre-readers, but Iwata Asks primary not read.
- **Weak (snippet only):** Taiko uses one lane, two note types and a physical drum to reach all ages. PaRappa began as a "rap Simon-says" call-and-response demo, mechanic before characters.
- **Weak (one small study each):** Transfer evidence is a posttest-only LSU master's thesis (K-4, Rhythm Heaven, better rhythm imitation; n and effect size unread) and an ADHD tablet-game preprint (~300 min improved synchronisation). Nothing on notation or technique for ages 4-10.
- **Weak (teacher opinion):** Guitar Hero/Rock Band transfer timing, listening and motivation only (gateway, not instruction); Rocksmith's real-instrument input teaches more. No study read.
- **Weak (reviewer opinion):** Falling-note apps give binary right/wrong feedback, simplified arrangements and colour/finger-number crutches that may block reading. Consistent across reviewers but not tested.
- **Solid as practice, no outcomes:** Creative sandboxes (Chrome Music Lab) need a small teacher task layer (copy, split parts, notate) to produce practice.

## 2. Phase 2 questions (ranked)

### Q-A. How does Rhythm Heaven teach each new rhythm with sound alone, and how does it handle difficulty and failure? (3 extracts, 2 searches)
- Why: It is the best model for audio-first play for ages 4-7 who can't read. We need the primary detail: how a cue is introduced (practice/tutorial segment), how mistakes are shown, how long a level is, why there are no lanes.
- Queries: "Iwata Asks Rhythm Heaven"; "Iwata Asks Rhythm Heaven Fever Tsunku"
- Sources: Iwata Asks transcripts (Nintendo, primary designer interviews); any Tsunku/Nintendo SPD interview.
- Extract: iwata.nintendo.com Rhythm Heaven pages (GBA/DS/Wii; find exact URLs from search). Take 2 pages max, then 1 extract on the Webber thesis (see Verify 1) since it uses the same game.

### Q-B. Did real-instrument modes (Rock Band 3 Pro, Rocksmith) teach real skills, and what did the designers change to make them work? (2 searches, 2 extracts)
- Why: Our games use a real piano (MIDI) or real objects. We need to know whether a game played on a real instrument transfers to technique, and which onboarding and difficulty choices mattered.
- Queries: "Rocksmith study guitar learning"; "Rock Band 3 Pro mode Harmonix design"
- Sources: any study or thesis on Rocksmith/Pro mode outcomes; Harmonix GDC talks or postmortems; Ubisoft Rocksmith designer interviews (mark as vendor).
- Extract: the best study found plus one designer interview or GDC talk.

### Q-C. Is there evidence that rhythm or notation apps for ages 4-10 build reading or rhythm skill, beyond the two P1 studies? (2 searches, 2 extracts)
- Why: Decides whether we can claim "real skill" and which app formats (falling notes vs staff vs syllables) deserve copying.
- Queries: "music app children rhythm study"; "tablet rhythm learning children evaluation"
- Sources: peer-reviewed studies, theses, reviews of music apps in primary education.
- Extract: https://www.mdpi.com/2076-3417/7/3/258 (tablet plus robot rhythm system tested with children aged 6-9 and compared with four rhythm apps), plus the best new study found.

### Q-D. Which call-and-response and echo mechanics work for ages 5-7, and how do kids' rhythm apps sequence them? (1 search, 2 extracts)
- Why: Echo/call-and-response is the shared core of PaRappa, Patapon and classroom practice; we need a concrete progression to build Beat Tiles and future rhythm games on.
- Queries: "Rhythm Cat Rhythmic Village review teacher"
- Sources: teacher progressions, research-informed classroom activity guides.
- Extract: https://musicscience.net/resources/rhythm-activities-for-primary-school ; https://goodmusicacademy.com/best-rhythm-apps-games-for-kids

### Q-E. How did Patapon turn rhythm into commands (drum call-and-response driving a story)? (1 search, 1 extract)
- Why: Closest commercial model of "play a rhythm pattern to make something happen" with a character wrapper, which is what a kids' game needs beyond scoring.
- Queries: "Patapon designer interview rhythm"
- Sources: designer interviews (Hiroyuki Kotani, Rolito), Game Developer/GDC.
- Extract: best interview found.

### Q-F. What makes kids return to music toys and creative tools (Toca Band, Chrome Music Lab, loopers)? (1 search, 0-1 extract)
- Why: Q6 had zero retention sources; the toy half of our games needs a reason to come back without streaks. Low rank because topic 03 covers Toca Boca's philosophy.
- Queries: "Toca Band design interview"
- Sources: Toca Boca play-designer interviews, Chrome Music Lab team talks.
- Extract: only if extracts remain after Q-A to Q-E (use https://www.raphkoster.com/games/interviews-and-panels/masaya-matsuura-hyperps2-interview instead if no Toca source turns up, for Matsuura on design simplicity).

## 3. Verify (against primary source)
1. Webber 2022 LSU thesis (https://repository.lsu.edu/gradschool_theses/5546): sample size, effect size, how long children played, and whether the result is significant. Uses 1 extract (counted under Q-A).
2. ADHD rhythm-game preprint (https://www.medrxiv.org/content/10.1101/2024.03.19.24304539v1.full-text): check the ~300 min dose and d = .63 figures, and whether a peer-reviewed version now exists. 1 search ("gamified rhythm training ADHD children") if budget allows; else note as unverified.
3. Rhythm Heaven "dance lessons" and "motifs cue actions" claims: confirm in Iwata Asks (covered by Q-A).
4. Simply Piano "Trinity College London accreditation": vendor claim relayed by a review. Low priority; check only if a Q-C result touches it, otherwise mark as vendor claim.

## 4. Drop / out of scope
- Beat Saber, Thumper, Just Dance, DDR, Beatmania, Elite Beat Agents history: adult or VR/whole-body, low value for ages 4-10 piano/brick games. The one useful idea (motion matched to feel) is already captured.
- Further NecroDancer reading: P1 has the primary source.
- Adult app comparisons (Yousician vs Flowkey pricing, features); Synthesia; Melodics.
- Taiko history beyond the one-lane, two-input idea.

## 5. Hand-offs
- Timing windows, child tapping lag, tempo ranges, latency and calibration: **04-coordination-ux** (already has better child data; P2 here should not re-search it).
- Points, scores, grades, streaks and how feedback should be phrased: **03-engagement**.
- Grading by MIDI vs microphone, camera or tangible input: **06-fourth-wall**.
- When to introduce staff notation, fading colour/letter crutches, rhythm syllable system: **01-pedagogy**.
- Finger numbers versus hand shape, and what a game should correct on technique: **02-technique**.
- Cross-topic: how "audio-cue levels" (Rhythm Heaven) fit with sound-before-symbol (01) and forgiving windows (04). Suggest for the **cross** mixer.
