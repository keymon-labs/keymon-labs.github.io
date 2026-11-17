# 06 Fourth wall & real world: P2 plan

Budget for the P2 gatherer: 10 searches, 10 extracts. The plan uses 10 searches and 10 extracts across Q1–Q6 below, highest value first. If a question's first search finds a strong primary source, skip its remaining queries and move the budget down the list.

## 1. What we know (judged)
- **Solid:** tangible UIs for children help engagement, collaboration and novice entry. Learning-gain evidence is weak (short, small studies; teachers left out). Source: Li et al. 2021 review. Don't claim "tangible = learns better".
- **Solid (practice):** the "cheap passive object + smart camera" pattern works: the Osmo mirror and Labo's reflective markers plus cardboard. Per-piece instant visual confirmation (Osmo Tangram) is a proven feedback loop. Sources are vendor or Wikipedia, but the mechanics are not in dispute.
- **Fairly solid:** ArUco/AprilTag fiducials are a reliable calibration anchor for a camera-read surface (homography). One student project plus a CV blog, with wide precedent (reacTable, TuneTable). Nothing yet on reading Duplo colours from a phone.
- **Weak (vendor/blog):** MIDI is exact and mic input adds latency and errors, so grade rhythm only from MIDI. Plausible and consistent across two sources, but there are no measurements, nothing on browsers and nothing on kids' voices or claps.
- **Weak (one unreviewed project):** MediaPipe finger tracking works for "which zone is the hand in" but not for grading fingering (thumb crossing fails; 81% at 20 px; 12 fps; adult hands).
- **Practice, vendor-only:** a screen conducting colour-coded bells and boomwhackers (bounce cue, then fade to colour notation) is normal in classrooms. It is a good template for brick colours, but there is no outcome data.
- **Weak (listicles only):** fourth-wall breaks land when the game seems to reach into the player's real device or behaviour. The kid-safe version (playful requests, no fake crashes or surveillance) is our own inference, with no design source.
- **Gap:** no evidence on apps that hand control to an off-screen activity (clap, sing, move) and listen back, or on parent co-play effects on music learning.

## 2. Phase 2 questions (ranked)

### Q1. Can a phone camera reliably read a Duplo/LEGO brick mat, and what setup makes it robust?
Why: Brick Beats depends on it. It is the riskiest real-world input and P1 has nothing on brick colour reading, lighting or the phone angle.
- Queries: `LEGO brick detection camera colour`, `Duplo color recognition OpenCV`, `LEGO tangible music sequencer camera`
- Sources: technical writeups (hobbyist and maker CV), HCI papers on LEGO tangibles, GitHub READMEs.
- Extract: Magic Leap marker guide (duplicate-ID and size advice): https://developer-docs.magicleap.cloud/docs/guides/features/marker-tracking, plus the best 1–2 brick-reading writeups found.
- Budget: 2 searches, 3 extracts.

### Q2. What does a screen-led "do it off-screen, then the game listens" loop look like when it works for kids (clap, echo, sing, move)?
Why: this is the core mechanic for the off-screen goal. P1 found only an OT blog and a general exergame summary.
- Queries: `clap detection children music app`, `call and response game children tablet`, `Rhythm Heaven clapping microphone`
- Sources: IDC/CHI papers on children's voice or clap interaction, designer interviews (Rhythm Heaven, Wii Music, SingStar Kids), teacher writeups.
- Extract: https://trill.studio/blog/pitch-matching-app (singing feedback: does it work for kids, what latency).
- Budget: 2 searches, 2 extracts.

### Q3. What does research say about tangible or fiducial music systems used by children: what they learned and which design choices mattered?
Why: this gives Brick Beats and Beat Tiles an evidence base beyond "engaging". P1 read only the abstracts.
- Queries: `TuneTable children tangible music`, `tangible music interface children study`
- Sources: TEI/IDC/CHI papers (Xambo et al. 2017 TuneTable), ImproviSchool, the O'Malley and Stanton Fraser 2004 NESTA review.
- Extract: the TuneTable paper (TEI 2017, Xambo et al.) and the CHIRA 2021 paper body (results section): https://pdfs.semanticscholar.org/d3e0/c81447daaec787547dfb64fe0c3c10a124c7.pdf
- Budget: 2 searches, 2 extracts.

### Q4. How do parent–child co-play designs for physical or tangible play assign roles, and does a parent in the room improve learning?
Why: "play with a parent" is a project goal. Topic 03 covers co-play for screen apps; this topic needs the physical version (who holds the phone, who claps, who checks).
- Queries: `joint media engagement tangible parent child`, `Osmo parent child play study`
- Sources: IDC papers on joint media engagement (Takeuchi & Stevens line), the early Osmo reviewer piece.
- Extract: https://www.gettingsmart.com/2014/12/22/osmo-playing-outside-screen and the best joint-media-engagement paper found.
- Budget: 1 search, 2 extracts.

### Q5. Kid-appropriate fourth-wall breaks: has any designer of a children's or family game explained using the real world or the player's hardware as a mechanic?
Why: this is the topic's distinctive idea, and every P1 source is an adult-horror listicle. One primary designer source would change it from opinion to evidence.
- Queries: `Wii Music developer interview`, `Nintendo Labo Piano Toy-Con interview`, `breaking fourth wall children's game design`
- Sources: designer interviews (Nintendo "Iwata Asks", Labo Piano and Studio), GDC talks or postmortems.
- Extract: 1 interview, preferably the Labo Piano Toy-Con, which is both a real-world instrument and a "build the object" design.
- Budget: 2 searches, 1 extract.

### Q6. How do classroom tools use a screen to orchestrate unplugged instruments (rhythm cards, colour bells) in practice?
Why: this is the cheapest game format (no sensing at all) and lowest priority, because the P1 boomwhacker card already gives a usable template.
- Queries: `screen play-along colour bells classroom`
- Sources: music teacher blogs and classroom curriculum publishers (mark as vendor).
- Extract: none unless budget is left over.
- Budget: 1 search, 0 extracts.

## 3. Verify (against a primary source)
1. The Hiranaka figures (12 fps, 81%/84% keypoint accuracy, thumb-crossover failure): re-read the PDF method and results sections, and check the frame size behind "20 px" and the hardware used. https://misoshiruseijin.github.io/documents/ar_piano.pdf (can share Q1's extract budget only if needed; otherwise use 1 extract here).
2. The claim that SightReader withholds timing scores with mic input: confirm on the vendor's own help or docs page rather than the comparison page. Low priority.
3. Osmo's ~30-minute session cap: P1's source is a founder interview paraphrase. Keep it as founder opinion unless a second source appears; no budget is spent here.
4. The CHIRA 2021 gains in music, social and soft skills: check the results section during the Q3 extract. Are the gains measured or self-reported, and how big is the sample?

## 4. Drop / out of scope
- Adult and horror fourth-wall techniques (fake crashes, save deletion, creepy surveillance, Doki Doki-style distress): note once as "never do", with no more research.
- Toys-to-life business models (Skylanders, LEGO Dimensions figure sales), and LEGO Hidden Side or Super Mario as products. Only their sensing mechanics matter, and Q1 covers that.
- Projection and AR headsets (Magic Leap, HoloLens) beyond the marker-design guidance; the target is an Android Chrome phone.
- Labo's IR camera hardware; it is not available to a web app.
- Bee-Bot and Marbotic, unless a Q3 search returns them with music-specific results.

## 5. Hand-offs
- **Browser audio, MIDI and mic latency, and tap calibration** (Web Audio, Web MIDI, Bluetooth MIDI): go to **04-coordination-ux**, which already holds the latency-engineering findings. 06 keeps only "which input to trust for what".
- **Children's singing range and pitch-matching development** (what to accept as "in tune" for ages 4–6): go to **01-pedagogy**, which has the D4–A4 range and the 4–6 development window.
- **Co-play design for screen apps and reward framing** (symmetric, interruptible, no streaks): go to **03-engagement**. 06 covers only the physical or off-screen role split (Q4).
- **Rhythm Heaven / PaRappa audio-cue design and timing-window tolerance**: go to **05-rhythm-games**. 06 looks only at whether those games' mic or clap modes exist and work (Q2).
- **Fingering and hand-shape correctness** (what a camera should check, if anything): go to **02-technique**, which defines the target. 06 reports only what the camera can see reliably.
- **Cross-topic:** whether a camera-read brick mat can carry Kodály/Orff sequencing (pentatonic bricks first) is for **cross/plan-p2** to join with 01.
