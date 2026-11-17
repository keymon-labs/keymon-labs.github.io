# 03 Engagement — P1 notes

Budget used: 8 searches, 8 extracts. Q2 (MDA/juice/core loops/flow) and Q6 session length are thin; see Gaps.

## Topline
- Expected, tangible, engagement-contingent rewards (stickers, points paid for doing the activity) reliably lower later free-choice interest (d about -0.40 in Deci et al. 1999, 128 experiments). Verbal/informational feedback does not, and mildly helps. Debate (Cameron & Pierce) is about size and scope, not direction for expected tangible rewards.
- What matters is whether feedback feels controlling (autonomy) or informational (competence). Design rule: feedback should say "you got better at X", never "do X to earn Y".
- Gamification meta-analysis: big positive average effect on learning (g 0.82), largest in primary-school users and in longer interventions. But a mapping of 87 papers lists badges, leaderboards, competitions and points as the elements most often tied to negative effects (no effect, worse performance, gaming the system).
- Streaks and loss framing are a documented harm for children: kids report doing "something quick" to keep the streak, anxiety, guilt when the mascot "misses" them. Reward mastery that survives gaps instead.
- Ability praise ("you're clever") makes children avoid challenge and attribute failure to ability; process/effort praise preserves persistence (Mueller & Dweck, replicated in children). Effort praise can raise test anxiety in kids over ~11, so keep it informational.
- Toca Boca's stance: "digital toys, not games" — open-ended, no instructions, no win/lose, no ads or in-app purchases; designers are "play designers". Useful model for the toy-like half of a music game (sandbox first, goals optional).
- Co-play: apps that are symmetrical, multi-player, interruptible and have natural stopping points support parent-child talk and self-regulation; single-user, auto-play designs do the opposite.
- Manipulative design is the norm in kids' apps (only about 20% of apps used by 3–5 year olds had none: parasocial pressure, fake time pressure, navigation constraints, lures). Our no-ads/no-tracking/no-sign-in rule is a differentiator; add "no guilt mascots, no countdowns, no streak loss".
- Dynamic difficulty adjustment: most studies show positive effects on enjoyment/flow, but results are mixed and mostly adult players; no single DDA method wins. Simple, transparent adaptation is enough for a prototype.

## Cards

### Q1 Motivation theory

### Deci, Koestner & Ryan 1999 reward meta-analysis (via secondary summary)
- URL: https://yukaichou.com/behavioral-analysis/overjustification-effect-lepper-greene-intrinsic-motivation
- Source: Yu-kai Chou (gamification consultant), blog summarising Deci, Koestner & Ryan 1999 (Psych Bulletin) and Cameron & Pierce 1994; type: blog (secondary; primary not read)
- Subq: Q1, Q3
- Claims:
  - [number] Meta-analysis of 128 experiments: expected tangible rewards reduce free-choice intrinsic motivation, aggregate d about -0.40; verbal rewards d about +0.31.
  - [fact] Mechanism in Cognitive Evaluation Theory: rewards have a controlling aspect (hurts autonomy) and an informational aspect (supports competence).
  - [fact] Cameron & Pierce 1994 (96 experiments) argued the average effect across all reward types is near zero; the disagreement is about aggregation and moderators.
  - [fact] Lepper et al. 1973 preschool "marker study" is the classic demonstration.
- For our games: avoid paying kids with stickers/points for practising something they already enjoy; give informational feedback ("your rhythm was steadier").
- Caveats: Blog by a gamification vendor-consultant, figures need checking against the primary paper. Wikipedia notes mixed evidence in very young children (Feingold & Mahoney 1975, token rewards did not reduce interest).

### Ryan & Deci history of Deci 1971 (SDT site)
- URL: https://selfdeterminationtheory.org/wp-content/uploads/2019/03/2019_RyanRyanDiDomencio_Deci1971.pdf
- Source: Ryan, Ryan, DiDomenico & Deci, 2019, review by SDT authors; type: review
- Subq: Q1
- Claims:
  - [fact] Rewards used to motivate engagement or performance ran greater risk of undermining free-choice behaviour than non-contingent or no rewards.
  - [fact] Verbal rewards can be delivered informationally or controllingly; only the informational kind enhances intrinsic motivation.
  - [fact] The more salient the controlling aspect, the larger the undermining effect; rewards matter via perceived locus of causality and perceived competence.
  - [fact] Unexpected rewards, or rewards not tied to task engagement, did not reduce motivation.
- For our games: surprise delight (unexpected sparkle after a good phrase) is safer than announced reward schedules.
- Caveats: Authors defend their own theory; mostly adult/college lab tasks plus some child studies.

### SDT interventions in education meta-analysis (2024)
- URL: https://selfdeterminationtheory.org/wp-content/uploads/2024/06/2024_WangWangEtAl_MetaEdu.pdf
- Source: Wang, Wang et al., 2024, systematic review + meta-analysis; type: review
- Subq: Q1
- Claims:
  - [number] 36 interventions (31 articles, 9,433 participants): autonomy/competence/relatedness-based programmes raise students' intrinsic motivation, effect size about 0.58 vs controls.
  - [fact] Within-group pre/post change was not significant overall, so effect is relative to controls.
- For our games: supports designing for choice, visible competence and shared play, not for rewards.
- Caveats: Teaching interventions, not games; age mix not extracted.

### Q2 Game design frameworks, difficulty

### DDA systematic review and comparison studies
- URL: https://www.semanticscholar.org/paper/Dynamic-difficulty-adjustment-approaches-in-video-a-Mortazavi-Moradi/aa76957a57c533fe5ed560e9c0f524da59d097a6
- Source: Mortazavi & Moradi systematic review (via Semantic Scholar listing), plus linked experiments (e.g. Baldwin et al. 2013/14; Robb/Zhang performance-based DDA); type: review
- Subq: Q2, Q5
- Claims:
  - [fact] Most reviewed studies find DDA improves enjoyment, flow, motivation, engagement, immersion.
  - [fact] A controlled 2D-game experiment found DDA improved performance but not enjoyment or flow.
  - [fact] A comparison of performance-, emotion- and hybrid-based DDA found no single best method and modest effects.
  - [fact] One serious-game study: adaptive difficulty gave better scaffolding for learning than fixed incremental difficulty.
- For our games: simple adaptive steps (slow down tempo or widen timing window after misses, step up after streaks of success) are worth it; do not invest in complex DDA.
- Caveats: Adult/older players mostly; abstracts only, none about children's music tasks.

### Q3 Gamification evidence

### Gamification in education meta-analysis (2023)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC10591086
- Source: Frontiers in Psychology, 2023, meta-analysis; type: study (meta-analysis)
- Subq: Q3, Q6
- Claims:
  - [number] Overall effect on learning outcomes g = 0.822 (CI 0.567 to 1.078).
  - [fact] Primary-school users showed a significantly larger effect than secondary-school users; authors speculate younger kids are less focused on external rewards.
  - [fact] Interventions lasting more than one semester had larger effects than shorter ones.
- For our games: the age band is a good fit for game layers; long-horizon progress (a term of play) beats a one-off novelty.
- Caveats: Large heterogeneity, publication bias likely; mostly classroom settings, not home music practice; authors' explanations are speculative.

### Negative effects of gamification in education software (2022)
- URL: https://www.sciencedirect.com/science/article/abs/pii/S0950584922002518
- Source: Information and Software Technology, 2022, systematic mapping + focus group; type: review
- Subq: Q3, Q7
- Claims:
  - [number] 87 papers reported undesired effects of game elements.
  - [fact] Badges, leaderboards, competitions and points are most often linked to negative effects.
  - [fact] Most cited negatives: no effect, worse performance, motivation problems, lack of understanding, irrelevance; also gaming the system and cheating.
  - [fact] Developers in the focus group were unaware of many of these effects.
- For our games: avoid leaderboards between children; make rewards depend on correct technique so gaming the system also teaches the right thing.
- Caveats: Counts reports of effects, not rates; mostly older learners.

### Streaks and exit dark patterns in gamified educational apps (IDC 2026)
- URL: https://dl.acm.org/doi/full/10.1145/3773077.3806127
- Source: ACM Interaction Design and Children conference, 2026, qualitative study with children and parents; type: study
- Subq: Q3, Q7, Q5
- Claims:
  - [fact] Children aged about 8–11 describe doing quick low-effort tasks to protect a streak; some switch to easier content.
  - [fact] Loss framing links to anxiety, perfectionism, and guilt when a mascot says it misses them.
  - [practice] Authors recommend mastery-centred progress, flexible practice windows, mastery badges kept through gaps, a pause mode without guilt messaging, and no re-contact after exit.
- Quote: "If I miss, it's like I failed." (11-year-old participant)
- For our games: replace daily streaks with "you have played N times this month" or mastery marks that never expire.
- Caveats: Small qualitative sample (details not extracted), focus on language app, children mostly at top of our age range.

### Duolingo "gamification misuse" (secondary summary)
- URL: https://www.taalhammer.com/gamification-in-language-learning-apps
- Source: Taalhammer blog (competitor vendor), summarising Mogavi et al. 2022; type: blog (vendor)
- Subq: Q3
- Claims:
  - [fact] Nine years of forum posts and interviews: users chase leagues and streaks, grinding easy lessons, mechanics displacing learning.
  - [opinion] A streak rewards showing up, not learning.
- For our games: corroborates the IDC finding from adult users.
- Caveats: Vendor with a commercial interest; primary paper not read.

### Q4 Play types

### Toca Boca CEO on "digital toys, not games" (CNBC 2015)
- URL: https://www.cnbc.com/2015/04/30/how-to-market-kids-in-the-mobile-app-age-toca-boca-ceo.html
- Source: CNBC interview with Toca Boca's CEO, 2015; type: expert practitioner
- Subq: Q4, Q7
- Claims:
  - [fact] Company positions its products as digital toys that emphasise open-ended play over competing or winning.
  - [practice] Gender-neutral range letting kids choose what they like.
- For our games: offer a free sandbox mode (make any sounds, no scoring) next to goal-driven modes; sandbox is where exploration of sound happens.
- Caveats: Marketing context; not outcome data on learning.

### Toca Boca design process (Motionographer 2016) and designer talk
- URL: https://motionographer.com/2016/04/27/the-design-process-behind-toca-bocas-infectious-apps
- Source: Interview with Toca Boca staff, 2016; type: expert practitioner. Related talk: https://www.youtube.com/watch?v=7QUdG7AIJ1s (search snippet only, not extracted)
- Subq: Q4, Q7
- Claims:
  - [practice] No in-app purchases or advertising; open-ended play for its own sake.
  - [practice] They employ "play designers", with design from the kids' perspective and real-world imperfection (quirky, not polished).
  - [practice] Talk snippet: a good toy needs no instructions; set an environment and characters and let kids play.
- For our games: onboarding by doing, no text tutorials for ages 4–6; test with children early.
- Caveats: Commercial studio, self-reported process.

### Q5 Failure, feedback and praise

### Dweck on praise: perils and promises
- URL: https://teaching.temple.edu/sites/teaching/files/resource/pdf/Dweck-Perils%20&%20Promises%20of%20Praise.pdf
- Source: Dweck (summary of Mueller & Dweck 1998 studies); type: expert practitioner/researcher, secondary write-up
- Subq: Q5
- Claims:
  - [fact] Children praised for intelligence mostly chose an easy follow-up task; effort-praised children mostly chose the challenging one (a video retelling gives 67% vs 92%, not verified in primary).
  - [fact] After failure, intelligence-praised students lost confidence and enjoyment; effort-praised stayed eager.
  - [practice] Praise process (strategies, effort), not traits.
- For our games: feedback text and sound like "that pattern worked" or "steady hands", not "you are a natural".
- Caveats: Participants were upper-primary (about 10–12); mindset interventions have shown weaker effects in later large replications (not checked here).

### Ability vs effort praise and failure (2018 study)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6176062
- Source: Frontiers in Psychology, 2018, experiment with fifth graders in China (N about 103); type: study
- Subq: Q5
- Claims:
  - [fact] Ability praise led to self-serving failure attribution, self-handicapping and less improvement after failure vs plain informational feedback.
  - [fact] Effort praise also had some disruptive effects for children over about 11: higher test anxiety.
  - [practice] Simple informational feedback (score only) is a sound baseline.
- For our games: show what happened (timing, notes right) and let the child judge; keep praise light and about the process.
- Caveats: Ages 10–13, one country, one-off lab task; our band is 4–10.

### Q6 Session length and co-play

### Ganz Cooney Center: preschool apps, family engagement and self-regulation
- URL: https://joanganzcooneycenter.org/2018/05/21/research-suggests-well-designed-preschool-apps-can-encourage-family-engagement-and-self-regulation
- Source: Joan Ganz Cooney Center blog summarising an observational study of parents and preschoolers, 2018; type: expert practitioner/research summary
- Subq: Q6, Q7
- Claims:
  - [fact] Most apps observed were single-user, one-orientation; children hunched over them, excluding the parent.
  - [fact] Symmetrical apps usable from all sides invited shared play, like building bricks or crayons.
  - [fact] Apps that can be interrupted, let the child control the action and have natural stopping points support conversation and self-regulation; endless auto-play hinders it.
  - [fact] With toys only, parent-child talk was richer than with a tablet.
- For our games: design for two players on one screen or instrument, built-in end-of-round "stop here" moments, no auto-chaining.
- Caveats: Small observational study, preschoolers, blog summary of the research.

### Q7 Ethical design

### Manipulative design in apps used by young children (JAMA Network Open 2022)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186
- Source: Radesky et al., 2022, cross-sectional study; type: study
- Subq: Q7
- Claims:
  - [number] 160 children (mean age 4.0) and 133 apps coded; about 80% of apps had at least one manipulative design feature; only about 20% had none.
  - [number] Navigation constraints appeared in 45.9% of apps (to prolong play); lures 45.1%; parasocial pressure from characters 24.8%; fake time pressure 17.3%.
  - [fact] Children from lower-education households played apps with more manipulative design.
  - [fact] Links the findings to the UK Age Appropriate Design Code, EU Digital Services Act and US proposals.
- For our games: write a short anti-pattern checklist (no guilt characters, no countdowns, no hidden exits, no lures); keep "no ads, no tracking, no sign-in".
- Caveats: US sample, mostly white, college-educated; preschool ages.

## Gaps
- Q2: no source yet on MDA (Hunicke et al.), flow (Csikszentmihalyi) in children, game feel/juice (Swink, Jonasson & Purho "Juice it or lose it" GDC), core-loop or mastery-curve design. No evidence on whether juice helps learning or distracts children.
- Q4: collection mechanics, pretend/narrative play and toy-like vs game-like for musical learning not covered; no source on 4-7 vs 7-10 differences.
- Q5: nothing specific on retries/forgiveness for ages 4–6, or error-handling in learning games (e.g. wrong note feedback). Dweck replication/weaker-effect evidence not gathered.
- Q6: no direct evidence on ideal session length or attention span by age, nor practice-length norms for beginners.
- Q3: no source on music-practice-specific gamification evidence; Duolingo primary paper not read; Deci 1999 primary not read.
- Source checks: the 67%/92% Dweck figures come from a video snippet; verify before citing.

## Leads
- https://www.gamedeveloper.com/design/mda-a-formal-approach-to-game-design-and-game-research — original MDA paper (check URL via search), Q2 framework.
- GDC "Juice it or lose it" (Jonasson & Purho) and Swink "Game Feel" — Q2 juice.
- https://www.youtube.com/watch?v=7QUdG7AIJ1s — Toca Boca talk on developing games for kids, extract the transcript for the three play types (story lover, creator, master).
- Deci, Koestner & Ryan 1999 primary (Psychological Bulletin) — confirm numbers and child-specific moderators.
- https://dl.acm.org/doi/10.1145/3816918 — "Design Guidelines for Parent-Child Joint Media Engagement": direct Q6 guidance.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11823321 — Joint Media Engagement Scale, measuring co-play.
- https://www.ovid.com/journals/psys/fulltext/10.1002/pits.70056~a-metaanalysis-of-gamifications-impact-on-student-motivation — 2025 meta-analysis of gamification and motivation in K-12 (Q3, age-specific).
- https://www.mdpi.com/1660-4601/18/7/3550 — gamification meta-analysis incl. K-12 short-term effects by element type.
- Mogavi et al. 2022 on Duolingo gamification misuse (primary) and Renaud et al. 2024 on 11–12-year-olds' dark-pattern mental models — Q3/Q7.
