# 06 Fourth wall & real world — P1 notes

Budget used: 8 searches, 8 extracts. Evidence is thin on Q1 (only listicles) and Q5 (no primary study); treat those cards as low confidence.

## Topline
- Fourth-wall breaks that land (Psycho Mantis, Pony Island, Undertale) all make the game appear to reach into the player's own device or habits. Reading a memory card, touching the Steam interface, acting on save files. The surprise comes from the game seeming to know about the real world. [opinion, listicle sources only]
- Kid-safe adaptation: the "reach out" should be playful and harmless (ask the player to clap, plug in the piano, hold up a mat) and never mimic crashes, file deletion or creepy surveillance. [our inference]
- MIDI is exact for pitch and timing; microphone listening adds latency and an error rate. At least one practice tool refuses to grade rhythm from mic input. Design: MIDI for scored timing, mic only for "did you play something" or coarse pitch. [vendor claim, plausible]
- Camera finger tracking (MediaPipe) works without occlusion but fails when the thumb crosses under; a student prototype got 12 fps and ~81% keypoint accuracy at a 20 px threshold. Not good enough to grade fingering on its own. [student project]
- ArUco markers work as a calibration anchor for a camera-read physical surface (used to map a printed keyboard to the camera image). Relevant to reading Duplo mats: put a few fiducials on the mat corners. [practice]
- Tangible interfaces review (2021): novice-friendly, encourage collaboration, but most studies are short and small, and teachers' role is neglected. So don't claim learning gains from "tangible" alone. [review]
- Osmo's core trick is a mirror over the front camera so an ordinary tablet reads the table; Labo's is cheap reflective markers plus IR camera and cardboard that the child builds. Both: cheap passive objects, smart camera. [practice]
- Screen-as-conductor for unplugged instruments is already normal in classrooms: bouncing coloured cues tell each child when to play their colour-coded bell or tube, with notation shown alongside and faded in later. [practice, vendor]
- Clapping/echo/pass-the-rhythm games are well-established unplugged formats; a screen could play the pattern, listen for claps coarsely, and hand over to the human. No evidence found on apps doing this well. [gap]

## Cards

### Q1 Fourth-wall breaking

### Top 10 games that break the 4th wall (Newegg Insider)
- URL: https://www.newegg.com/insider/top-10-games-that-break-the-4th-wall
- Source: Newegg Insider editorial, undated, blog (retailer content)
- Subq: Q1
- Claims:
  - [practice] Pony Island frames itself as an arcade game that gets taken over, with in-game entities contacting the player through the Steam interface outside the game.
  - [opinion] Undertale is read as a game that judges every choice the player has made in games, not only in this one.
- For our games: A meta layer works when the game addresses the player's own choices or device, not just a joke to the camera. A kid version: the game comments on how you played ("you clapped early last time") using only data it legitimately has.
- Caveats: Listicle, shallow analysis, adult/horror titles, no kid-age evidence.

### Top 10 Fourth Wall Breaks in Video Games (WatchMojo)
- URL: https://www.watchmojo.com/articles/top-10-fourth-wall-breaks-in-video-games
- Source: WatchMojo, undated, blog/video transcript
- Subq: Q1
- Claims:
  - [practice] Psycho Mantis (Metal Gear Solid, 1998) reads the player's memory card, comments on other games played, and rattles the controller; to beat him the player moves the controller to port 2.
  - [practice] Another game fakes a crash/restart to make the player think the game broke.
- For our games: The memorable move is making the player physically do something with their hardware. Direct analogue: "plug the piano into port 2" becomes "put your piano where the camera can see it" or "switch the keyboard on".
- Caveats: Entertainment list; crash/deletion fakes are inappropriate for ages 4-10 (distress, parent support calls).

### Q2 Tangible interfaces

### Tangible Interaction for Children's Creative Learning: A Review (C&C '21)
- URL: https://www.mmi.ifi.lmu.de/pubdb/publications/pub/liyanhong2021cc/liyanhong2021cc.pdf
- Source: Li et al., 2021, review (ACM Creativity & Cognition)
- Subq: Q2
- Claims:
  - [fact] Reviewed TUIs were novice-friendly, supported cognition, promoted initiative, and encouraged communication and collaboration.
  - [fact] Main limitations: few long-term studies with enough sample size or objective evaluation; designs often lacked balance of abstractness/openness/complexity; teacher role mostly ignored.
  - [practice] Good TUIs start from the child's view, keep functions simple and make progress easy to see; one TUI should be understandable to younger children yet leave room for older ones.
- For our games: Build mat/brick games so a 4-year-old can place bricks and a 10-year-old can compose; show progress visibly. Expect engagement claims to be better supported than learning claims.
- Caveats: Creativity focus, not music accuracy; mixed study quality.

### Ensemble of tangible user interfaces to foster music learning (CHIRA 2021)
- URL: https://pdfs.semanticscholar.org/d3e0/c81447daaec787547dfb64fe0c3c10a124c7.pdf
- Source: CHIRA 2021 paper, study/experience report
- Subq: Q2, Q4
- Claims:
  - [fact] Learners aged 7-50 with social disadvantage and some impairments used an ensemble of tangible digital instruments; reported gains in music skills plus social and soft skills.
  - [fact] Background survey lists fiducial-marker music systems: reacTable, D-Touch (consumer PCs), TuneTable (programmable fiducials for music coding in a museum exhibit).
- For our games: Fiducial-based music is well precedented; group play with several simple tangibles builds cooperation, which suits parent-child play.
- Caveats: Only abstract and background read; small non-typical sample; skill-gain evidence not independently checked.

### Osmo (game system) overview
- URL: https://en.wikipedia.org/wiki/Osmo_(game_system)
- Source: Wikipedia, encyclopaedia (company-sourced in parts)
- Subq: Q2, Q4
- Claims:
  - [fact] Osmo uses a clip-on mirror over the tablet's front camera so the device recognises objects on the play surface.
  - [practice] Founders were prompted by watching a five-year-old with her face glued to a tablet; aim is to make the screen a partner in physical play.
  - [practice] Tangram: on-screen outline recolours when pieces are correctly placed.
- For our games: Per-piece instant visual confirmation when a physical piece is right is a proven pattern; a phone on a stand with a cheap mirror clip or just propped at an angle may be enough.
- Caveats: Wikipedia; commercial product; no learning outcome data here.

### Osmo CEO interview (Business Insider, 2018)
- URL: https://www.businessinsider.com/osmo-ceo-pramod-sharma-interview-2018-10
- Source: Business Insider, 2018, designer/founder interview
- Subq: Q2, Q5
- Claims:
  - [practice] Osmo tries to cap a session at around 30 minutes.
  - [opinion] Founder says puzzles solved matters more than time spent as a success metric.
- For our games: Measure success by correct patterns produced, not minutes. Built-in session ends are a design norm to copy.
- Caveats: Founder talking about own product.

### Nintendo Labo developer interview, part 2
- URL: https://www.nintendo.com/au/news-and-articles/nintendo-labo-developer-interview-part-2-prototyping-and-development
- Source: Nintendo, developer interview, vendor
- Subq: Q2, Q4
- Claims:
  - [practice] Early prototype "Big-Con": big cardboard buttons move a reflective marker inside the box, read by the IR camera.
  - [practice] Cardboard chosen so users can build, repair and modify it themselves; this led to the Toy-Con Garage mode.
  - [practice] Team tested durability by repeating motions hundreds and thousands of times.
- For our games: Making the object is part of the fun and the learning; cheap passive markers moved by the child are enough sensing. Paper/cardboard kits can be printable.
- Caveats: Vendor marketing tone; Nintendo-specific IR hardware not available to a web app.

### Q3 Real-instrument input

### Best sight-reading apps for piano (SightReader)
- URL: https://sightreader.app/best-sight-reading-apps
- Source: SightReader (app vendor), 2026, vendor comparison
- Subq: Q3
- Claims:
  - [practice] MIDI reports exactly which key and when; microphone infers both from audio, adding latency and an error rate invisible to the player.
  - [practice] The app withholds its timing score when using the microphone, and scores rhythm separately from pitch.
  - [number] A basic 61-key controller costs roughly £70 (vendor's figure).
- For our games: Grade rhythm only from MIDI; with mic, give coarse feedback (played / not played, rough pitch). Scoring rhythm and pitch separately is a useful pattern.
- Caveats: Vendor with a stake; competitor table self-written.

### Best piano learning apps 2026 (HackerNoon)
- URL: https://hackernoon.com/best-piano-learning-apps-in-2026-an-in-depth-comparison-of-music-education-technology
- Source: HackerNoon blog, 2026
- Subq: Q3
- Claims:
  - [practice] Mic-based apps (Simply Piano, Skoove, Yousician) use FFT pitch analysis; works on any piano but struggles with noise, fast passages and polyphony.
  - [practice] MIDI apps over USB/Bluetooth give near-perfect accuracy but need a digital instrument.
- For our games: Offer both paths: MIDI when a digital piano is present, mic fallback for acoustic or singing, with simpler tasks in mic mode.
- Caveats: Secondary blog, possibly promotional; no kid-specific data.

### AR Piano Playing Using Real-Time Hand Tracking (Hiranaka)
- URL: https://misoshiruseijin.github.io/documents/ar_piano.pdf
- Source: Student project report, c.2022, study (unreviewed)
- Subq: Q3, Q4
- Claims:
  - [number] Webcam + MediaPipe Hands ran at 12 fps on commodity laptops; 81% keypoint accuracy within 20 px, 84% within 30 px (about one key width on an 8-key demo).
  - [fact] ArUco markers were used to compute a homography between the piano texture and the camera image.
  - [fact] Tracking is good with small occlusions but misplaces the thumb during crossover; accuracy drops at odd angles.
- For our games: Camera finger tracking is fine for "hand over the right zone" games, not for grading fingering. ArUco-calibrated surfaces work.
- Caveats: Class project, tiny demo, adult hands, no children tested, 2022-era model.

### Q4 Markers, AR, scan-your-creation

### Fiducial Markers Overview (it-jim)
- URL: https://www.it-jim.com/blog/fiducial-markers-types
- Source: it-jim (CV consultancy), blog
- Subq: Q4
- Claims:
  - [practice] AprilTag and ArUco are among the most reliable fiducial families; ArUco is popular because OpenCV ships it.
  - [practice] Square markers are fastest for real-time use; for general tracking ArUco or AprilTag suffice.
- For our games: Pick an ArUco dictionary for corner/ID markers on a mat; for reading brick colours use plain colour segmentation within the marker-defined grid.
- Caveats: Snippet-level read; generic, not about children or bricks. Duplicate markers can collide (Magic Leap docs note identical IDs are not reported separately).

### Q5 Movement, singing, clapping, co-play

### Clapping games and rhythm (Miss Jaime OT)
- URL: https://missjaimeot.com/why-you-should-teach-your-child-clapping-games
- Source: occupational therapist blog, expert practitioner
- Subq: Q5, Q6
- Claims:
  - [practice] Clapping games combine singing (rhythm) with a motor pattern (beat), building bilateral coordination and motor planning for later instrument or dance learning.
  - [practice] Simplify by slowing words and movements, e.g. start with self-clap then partner-clap in a 1-2 pattern; harder versions suit older children.
- For our games: Off-screen clap tasks should have an explicit easy-to-hard ladder; a partner role gives the parent a job.
- Caveats: Blog, no study cited; snippet read only.

### Exergames for children (National Center for Health Research)
- URL: https://www.center4research.org/can-children-get-exercise-through-video-games-exergaming
- Source: health research nonprofit, review summary
- Subq: Q5
- Claims:
  - [fact] Exergames increase motivation for activity; in several studies (2007-2015) students preferred them to traditional exercise, e.g. Dance Dance Revolution over solo dancing.
- For our games: Movement framed as the game, not as exercise, motivates reluctant kids. No evidence here about music learning outcomes.
- Caveats: Physical-activity outcome, not music; summary level; ages 6-17.

### Q6 Unplugged / hybrids

### Boomwhackers for the Classroom (Fun Music Company)
- URL: https://funmusicco.com/boomwhackers
- Source: curriculum publisher, vendor
- Subq: Q6
- Claims:
  - [practice] Tuned percussion from Kindergarten to Grade 2 uses Boomwhacker colours, carried across resonator bells and xylophones as a consistent visual reference.
  - [practice] On-screen animated faces bounce at the moment each child should play their colour; colour-coded notation is shown alongside; by Grade 2 children read the notated colour parts without animations.
  - [practice] Colour coding lets non-music-specialist teachers deliver structured lessons.
- For our games: Direct template for "screen conducts physical instruments": cue bounce plus colour-coded notation, then fade the cue. Matches brick colours as note colours.
- Caveats: Vendor; the "research tells us" section was not read.

## Gaps
- Q1: no primary design source (GDC talk, developer interview) on why fourth-wall breaks work; nothing on kid-appropriate meta games (e.g. Toca Boca, Pokemon-style addressing the player). 
- Q2: no outcome study specific to music tangibles with children 4-10; Marbotic, Bee-Bot, LEGO Hidden Side and Super Mario not covered.
- Q3: no data on microphone latency in browsers (Web Audio) or kids' singing pitch detection accuracy; no evidence on Web MIDI/Bluetooth latency.
- Q4: nothing on colour-brick reading by phone camera (lighting, Duplo colours); no scan-your-creation mechanics study.
- Q5: no study on kids clapping to a phone mic, or co-play (parent in the room) effects on music learning.
- Q6: no research evidence on boomwhackers/colour-coded bells outcomes; no screen-orchestrated rhythm-card examples.

## Leads
- https://www.mmi.ifi.lmu.de/pubdb/publications/pub/liyanhong2021cc/liyanhong2021cc.pdf (reference list: ImproviSchool classroom TUI music paper, O'Malley and Stanton Fraser 2004 NESTA tangible learning review)
- Xambo et al. 2017 TEI "Experience and ownership with a tangible computational music installation" (TuneTable): child learning in a museum
- https://trill.studio/blog/pitch-matching-app (singing pitch-feedback apps; check latency and kid suitability)
- https://www.gettingsmart.com/2014/12/22/osmo-playing-outside-screen (Osmo play description, early reviewer view)
- https://developer-docs.magicleap.cloud/docs/guides/features/marker-tracking (marker design best practices, collision of duplicate IDs)
- Search next: "Wii Music" / "Rocksmith kids" / "Yousician kids" reviews for off-screen/real-instrument play; GDC talks on Undertale or Toca Boca; web audio latency measurements for clap detection.
