# 05 Rhythm games — P1 notes

Budget used: 8 searches, 8 extracts (Tavily). Cards marked "(search snippet)" were not extracted.

## Topline
- Games that feel like performing beat games that feel like grading: PaRappa's beta had loose timing and no tension; the final added strict timing plus an improvisation bonus so players bring their own energy.
- Rhythm Heaven dropped note highways for audio motifs cueing each action, with a funny scene per level; it is the best-fitting model for audio-first kids' rhythm play.
- Strict timing windows punish stressed players. NecroDancer's designer widened the window to the full beat and added gentle auto-calibration. Good for novice kids: forgiving windows, drift correction.
- Small evidence base for transfer: one unpublished-style master's thesis (K-4, three Rhythm Heaven games, better rhythm imitation than control) and one preprint RCT (ADHD kids, about 300 min of a tablet rhythm game improved synchronisation). Both are small, short term and not about reading notation.
- Guitar Hero/Rock Band transfer is limited to timing, active listening and exposure to songs; a teacher sees them as a gateway, not instruction (opinion).
- Falling-note piano apps (Simply Piano, Yousician, Flowkey) are criticised for binary feedback, simplified arrangements and weak theory/technique; colour or finger-number crutches may block reading (reviewer opinion, not studies).
- Creative sandboxes (Chrome Music Lab) are strong for open exploration and need no account; teachers add structure (copy a rhythm, split parts) to get learning.
- Main gap: no study found on kids 4-10 using music apps for notation or technique; no primary sources on Beat Saber, Thumper, Patapon, DDR, Taiko, Toca Band.

## Cards

### Q1 History and mechanics

### PaRappa developer interview (1996)
- URL: https://shmuplations.com/parappa
- Source: Shmuplations translation of 1996 developer interviews (Matsuura, producer), primary designer statements, 1996, expert practitioner
- Subq: Q1, Q5
- Claims:
  - [fact] Matsuura chose rap because it best fit a scoring system built on a performance; he also tried guitar, synth and vocals.
  - [practice] Early betas had loose hit detection: easy to clear but no tension or "live stage" feel.
  - [practice] Making detection too strict would stop most people clearing it, so they added an improvisation system where a COOL rating needs the player's own arrangement.
  - [opinion] He says the tension of needing energy from the start is what makes it a game.
- Quote: "none of the feeling of being a musician performing on a live stage"
- For our games: Reward expressive deviation (adding your own variation) on top of correct timing; do not make leniency the only difficulty lever.
- Caveats: Translation of a 1996 magazine interview; adult game, no learning claims.

### PaRappa origin interview (PlayStation Blog, 2017)
- URL: https://blog.playstation.com/2017/04/04/interview-the-untold-story-of-parappa-the-rapper
- Source: PlayStation.Blog, 2017, interview with Matsuura (publisher blog, so partly vendor)
- Subq: Q1, Q5
- Claims:
  - [fact] The rhythm game design came first; the characters were developed afterwards by an artist from the game description.
  - [practice] Matsuura wanted a music game built on sampled voices; development took about two and a half years.
  - [fact] The first prototype was a "rap Simon-says" animation demo (call and response) that the artist then reskinned (also in Wikipedia citing artist's post).
- For our games: Design the rhythm mechanic first, wrap a character around it later; call-and-response is an old, proven structure.
- Caveats: Snippet-level read (search snippet only); retrospective; publisher-hosted.

### Rhythm Heaven and Tsunku (scrmbl)
- URL: https://scrmbl.com/post/rhythm-heaven-music-tsunku
- Source: scrmbl blog, music/game writer, undated, blog (secondary; refers to Iwata Asks interviews)
- Subq: Q1, Q5
- Claims:
  - [fact] Rhythm Heaven (GBA, 2006) discarded scrolling note beatmaps; each level is a distinct scenario where the player acts in time with music and on-screen events.
  - [practice] Musical motifs inside the song cue what action to perform instead of notation, so attention stays on the art/scene.
  - [practice] Producer Tsunku had the dev team take dance lessons to understand the beat itself, not just the music.
  - [opinion] The sound design and tuning are what define the franchise.
- For our games: Audio-only cues plus a scene per level is feasible and engaging; build cues into the music, not a separate note lane. Good for pre-readers (ages 4-6).
- Caveats: Fan/critic blog; primary Iwata Asks transcripts not read.

### Crypt of the NecroDancer design deep dive
- URL: https://www.gamedeveloper.com/audio/game-design-deep-dive-finding-the-beat-in-i-crypt-of-the-necrodancer-i-
- Source: Gamasutra/Game Developer, designer's own deep dive, game postmortem
- Subq: Q1, Q5
- Claims:
  - [number] Initial design used about 20% leeway around the beat (100 ms at 120 bpm); it felt worst when players were stressed.
  - [fact] Widening the window to the full beat felt best; challenge shifted from accuracy to tactics.
  - [practice] Logs showed players drift off the beat under stress and drift back; he added a leaky-integrator auto-calibration that slowly shifts effective beat position.
  - [opinion] He says copying rhythm games' strict accuracy was a mistake for this design.
- Quote: "Requiring accuracy is just frustrating."
- For our games: For beginners, tolerance should be wide and adaptive; separate "keeping a steady pulse" from "hitting a tight window", and show drift as feedback instead of failure.
- Caveats: Single designer; adult roguelike, not children; movement game, not pitch/notation.

### Taiko no Tatsujin history (documentary transcript, search snippet)
- URL: https://www.youtube.com/watch?v=szcV1yagHEI
- Source: YouTube documentary, fan-made, undated, blog
- Subq: Q1
- Claims:
  - [fact] The Taiko arcade cabinet used a single horizontal lane with two note types (centre/rim) to attract casual players of all ages, unlike Bemani games popular with teens and adults.
  - [opinion] Narrator frames Beatmania (1997) as a leap in polish and replayability.
- For our games: Two-input simplicity and a physical drum make a game accessible across ages; a single lane is enough for early rhythm.
- Caveats: Snippet only, fan documentary, not verified.

### Beat Saber as "instructed motion" (search snippet)
- URL: https://www.youtube.com/watch?v=EoOeO7S9ehw
- Source: VR Design Unpacked, YouTube design analysis, opinion
- Subq: Q1, Q5
- Claims:
  - [opinion] Beat Saber is closer to a motion game where music tells you when to move; designing the motions to feel good is the core.
- For our games: Whole-body gestures matched to the beat can carry the game; match the motion to the feeling you want.
- Caveats: Snippet only; one creator's opinion, VR hardware.

### Q2 Real-instrument games

### Teacher view on Guitar Hero/Rock Band transfer
- URL: https://michiganrockschool.com/can-guitar-hero-or-rock-band-make-you-a-better-guitar-player
- Source: Michigan Rock School, guitar teacher blog, ~2015, expert practitioner (opinion, commercial school)
- Subq: Q2, Q4
- Claims:
  - [opinion] Timing and locking to a beat is the main skill that transfers; the controller is not a guitar.
  - [opinion] Active listening to song structure and exposure to new music also carry over.
  - [practice] Some students started real instruments because they were good at Rock Band (gateway effect).
- For our games: Expect rhythm and listening gains, not fretting or reading gains, from button games; use them as a gateway into the real instrument.
- Caveats: Anecdote from one teacher with a business interest; not a study.

### Rocksmith from a guitar teacher
- URL: https://startteachingguitar.com/rocksmith
- Source: Start Teaching Guitar, teacher blog, ~2011-2012, expert practitioner (search snippet)
- Subq: Q2
- Claims:
  - [opinion] Rock Band/Guitar Hero are "guitar karaoke": help timing a little; Rocksmith uses a real guitar, teaches holding the pick, fretting and tuning.
  - [practice] Rocksmith checks tuning before each song and starts with basics before songs.
  - [opinion] Not everything is taught, but good as a funnel into lessons.
- For our games: Real-instrument input with tuning/setup checks and posture basics beats toy controllers for transfer.
- Caveats: Snippet only; early version of the game; teacher promoting lessons.

### Q3 Learning apps

### Piano/guitar app review (Yousician, Simply Piano, Flowkey)
- URL: https://musickanheal.com/is-yousician-worth-it
- Source: Music Kan Heal, comparison blog, 2026, blog (affiliate-style, adult focus)
- Subq: Q3
- Claims:
  - [practice] These apps teach via falling notes or on-screen notation; both require memorising finger patterns or building reading fluency over months.
  - [opinion] Falling-tab format suits guitar; for piano it gives shallower learning than piano-specific apps.
  - [opinion] Progress bars can fill faster than actual skill improves.
- For our games: Falling notes hook attention; add explicit steps that map pitch to staff and finger so progress bars match skill.
- Caveats: Adult learners; reviewer opinion; likely affiliate links.

### Simply Piano critical review (search snippet)
- URL: https://pianoers.com/simply-piano-review-the-honest-truth-about-learning-piano-with-an-app
- Source: Pianoers, review blog, 2026, blog
- Subq: Q3
- Claims:
  - [fact] Simply Piano listens through the device mic and judges notes and timing; vendor says lessons were built by teachers and curriculum is accredited by Trinity College London (vendor claim, relayed).
  - [opinion] Feedback is binary (right/wrong), with no fingering or dynamics coaching; arrangements heavily simplified; limited theory and technique.
- For our games: Do better on fingering, dynamics and posture feedback, which cheap pitch detection cannot give; MIDI input is more accurate than mic.
- Caveats: Snippet only; reviewer opinion; adult-targeted.

### Piano app video comparison on colour crutches (search snippet)
- URL: https://www.youtube.com/watch?v=pAv98K0AtLY
- Source: YouTube comparison, non-sponsored per title, opinion
- Subq: Q3
- Claims:
  - [opinion] Colour-coded notation can become a crutch that leaves learners lost on real sheet music; reviewer thinks staff notation should be learned early.
  - [opinion] Many apps use a middle-C approach, which another reviewer thinks can lead to reading by finger number rather than recognising notes, patterns and intervals.
- For our games: Fade colour support out gradually; teach interval/pattern recognition not only finger numbers.
- Caveats: Two reviewers' opinions from transcript snippets; method debates are contested among teachers.

### Q4 Evidence

### Rhythm Heaven in elementary music class (thesis)
- URL: https://repository.lsu.edu/gradschool_theses/5546
- Source: Webber, LSU Master of Music Education thesis, 2022, study (small, unreviewed)
- Subq: Q4
- Claims:
  - [fact] Kindergarten to grade 4 children were randomly assigned to control or treatment; treatment played three Rhythm Heaven games, then both did a rhythm imitation test.
  - [fact] Reported result: treatment group showed better rhythm reproduction and rhythmic memory.
  - [fact] Design is posttest-only, so no baseline; it looked at length of rhythms, score relationships and grade level.
- For our games: Supports short rhythm-game play as warm-up for echo/imitation skills; sample size and effect size not extracted.
- Caveats: Master's thesis, not peer reviewed; one session; test measured imitation, not reading or long-term retention.

### Gamified rhythm training in children with ADHD (preprint)
- URL: https://www.medrxiv.org/content/10.1101/2024.03.19.24304539v1.full-text
- Source: medRxiv preprint, 2024, study (RCT proof of concept, preprint)
- Subq: Q4
- Claims:
  - [fact] Parallel-arm randomised trial with a tablet rhythm game versus a matched non-rhythmic control game, run remotely.
  - [number] About 300 minutes of training improved sensorimotor synchronisation; gains correlated with playing time.
  - [number] Executive function showed a medium effect (d = .63) for the rhythm game group, speed but not accuracy.
- For our games: A modest dose (several hours) of tap-to-beat play can shift synchronisation; use a matched control mindset when testing our own games.
- Caveats: ADHD sample, small, preprint, finger taps only; authors call for larger RCTs.

### Q6 Creative tools

### Chrome Music Lab classroom ideas (Midnight Music)
- URL: https://midnightmusic.com/2018/09/50-lesson-ideas-for-the-chrome-music-lab
- Source: Midnight Music (music teacher resource), updated, expert practitioner
- Subq: Q6, Q5
- Claims:
  - [fact] Free, browser-based, no downloads or logins; works on phones, tablets and Chromebooks.
  - [practice] Recommended starting experiments: Rhythm, Song Maker, Arpeggios.
  - [practice] Teachers add structure: clap the beat while it plays, split the class across rhythm lines, copy a drawn picture into Kandinsky, notate a rhythm on paper.
- For our games: Open sandboxes need a small task layer (copy, split parts, notate) to produce practice; no account required matches our conventions.
- Caveats: Teacher guide, no outcome data.

### Chrome Music Lab FAQ and Kandinsky description (search snippet)
- URL: https://musiclab.chromeexperiments.com
- Source: Google Chrome Experiments, vendor page
- Subq: Q6
- Claims:
  - [fact] Built with Web Audio, Web MIDI and Tone.js; open source on GitHub (vendor).
  - [fact] Kandinsky maps drawing height to pitch and shape to sound (via Kindermusik description of it).
- For our games: Tone.js and Web Audio are proven for kid creative tools; drawing-to-sound is an approachable mapping for ages 4-6.
- Caveats: Vendor; not researched for engagement.

## Gaps
- No primary or designer sources on Beat Saber, Thumper, Patapon, Elite Beat Agents, DDR, Beatmania, Just Dance (budget used on breadth).
- No peer-reviewed studies on Rock Band Pro / Rocksmith transfer; only teacher opinion.
- No study of Simply Piano, Flowkey, Melodics, Piano Maestro, Toca Band, Rhythm Cat; app claims remain vendor or reviewer opinion.
- No evidence on notation-reading gains for ages 4-10 from apps; Webber thesis effect size and sample size not read.
- Q6 retention and what keeps kids returning: no sources.

## Leads
- https://www.iwata.nintendo.com (Iwata Asks: Rhythm Heaven) - primary designer interviews on audio cues and difficulty (find exact URL).
- GDC Vault talks on Guitar Hero/Rock Band design and Harmonix postmortems - primary sources for Q1.
- Gamasutra/Game Developer postmortems for Thumper and Patapon - designer reasoning on motion and commands.
- https://www.mdpi.com/2076-3417/7/3/258 - tablet plus robot rhythm learning system tested with children aged 6, 7 and 9 and compared against four rhythm apps (Q4, Q6).
- https://goodmusicacademy.com/best-rhythm-apps-games-for-kids - teacher's progression of rhythm apps (Rhythm Cat, Rhythmic Village, etc.) (Q3).
- https://musicscience.net/resources/rhythm-activities-for-primary-school - research-informed rhythm activities for Years 1-2 (call and response, Simon Says) to map onto game mechanics (Q5).
- https://apps.apple.com/us/app/learn-music-rhythmic-village/id1351762757 - vendor description of Kodaly/Takadimi-based rhythm app with microphone feedback on real drums (Q3).
- https://www.raphkoster.com/games/interviews-and-panels/masaya-matsuura-hyperps2-interview - Matsuura on VibRibbon and design simplicity (Q1).
