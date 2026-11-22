# Voice Pad

A touch pad that sings. Slide a finger across it and Gloop, a blob character, sings the note under your finger with the vowel you pick. Live: https://keymon-labs.github.io/voice-pad/

Prototype. The sound is made in the browser with Web Audio. No library, no samples.

## What it is
A singing instrument played with one finger. Pad mode is free play. Song mode sings words for you while you pick the notes. Left to right sets the pitch. Top to bottom sets the vowel: oo, oh, ah, eh, ee. A formant voice makes the sound: a buzzy sawtooth wave shaped by three filters, the way a mouth shapes a voice. Gloop opens its mouth to match the vowel and bounces higher as the pitch rises.

The menu has a voice type (bass, tenor, alto, soprano), a note set (pentatonic, major, minor, every note, free glide) and a theory panel.

## How to play
1. Tap Start singing in the menu, or tap the pad. The browser needs a tap before any sound.
2. Slide left and right to move the pitch. Notes snap to the chosen scale. Free glide moves smoothly.
3. Slide up and down to change the vowel.
4. Hold still for a little vibrato. Swipe fast and the wobble goes away.
5. Lift your finger and the voice hushes.
6. Use the menu to change the voice type and note set, and read the theory panel.

## Song mode
Tap Song in the top bar. Pick a baby song or choose "Own words" and type lyrics in any language. Use a hyphen to mark a syllable (sing-ing).
1. Press Sing. Four click beats count you in. Then the words come one syllable per beat at your tempo.
2. Your finger picks the notes: left to right is pitch, height is volume. The vowel and the consonant sound come from the word.
3. For a built-in song a gold ring on the pad shows the next note and two smaller rings show the ones after.
4. Hear it plays the song by itself. Click adds a metronome tick.
5. Every Sing is saved as a take on this device (the last 12). Tap a take to play it back, or the cross to delete it.
Songs: Twinkle Twinkle, Row Row Row Your Boat, Hot Cross Buns, Mary Had a Little Lamb, Old MacDonald (first lines), Frère Jacques. All are traditional and in the public domain.

## What it teaches
- **Voice types**: each voice type covers a different range. Bass E2 to E4, tenor C3 to C5, alto F3 to F5, soprano C4 to C6. These are textbook ranges. Real voices vary.
- **Registers**: the lowest third of a range is chest voice, buzzy and strong. The middle is mixed. The top third is head voice, lighter and thinner. This split is a simplified teaching model.
- **Formants**: every vowel is the same buzz shaped by the mouth. Three bands of boosted sound, called formants, make each vowel. Moving down the pad moves those bands, so oo turns into ah and then ee.
- **Vibrato**: a small, steady wobble of pitch, the kind trained singers keep alive on a long note.

## Files
| File | Contents |
|---|---|
| `index.html`, `style.css` | Page, menu, theory panel, styles |
| `pad.js` | Canvas drawing, touch input, Gloop the character, menu, song session, takes |
| `lyrics.js` | Text in any language to syllables: onset consonants and one or two vowel ids each |
| `songs.json` | Built-in songs: `lyrics` (shown), `sing` (respelled so the vowels sound right), `notes` (`C4:2` = note and beats). Same number of syllables in all three, a test checks it. Adding a song is data only |
| `voice.js` | Web Audio formant voice: saw wave, three vowel filters, vibrato, consonant noise bursts, metronome click |
| `logic.js` | Pure rules: pitch from x, vowel from y, voice ranges, scales, register, vibrato, song timing, take lookup |
| `test/logic.test.js`, `test/lyrics.test.js` | Tests for the rules, the syllable splitter and the song data |

Shared module used: `shared/music.js` (note names only).

## Test hook
`window.__vp` exposes `state`, `touch(x, y)`, `release()`, `mode("pad"|"song")`, `sing(songId|null, bpm)`, `hear(songId, bpm)`, `playTake(n)`, `takes()` and `stop()`. The x and y values run from 0 to 1 across the pad, so a headless run can sing without a real finger. `touch` also starts the audio.

## Similar ideas
The theremin, played by moving a hand through the air, and gesture synths that map a finger's position to pitch and timbre. Song mode is in the spirit of karaoke and follow-the-dots music games. Idea only: no code, sounds or artwork are copied. Formant frequencies are general acoustic-phonetics facts.

## Known shortcuts
- Vowels come from letters, not sounds, so English spelling is only roughly right ("high" would sound like "hee"). The built-in songs use a respelled `sing` line. For your own words, type a respelling such as "hai" or "wan".
- Consonants are short noise bursts for s, z, x, c, j, f, v, h, t, k, p, d, g, b and q. Voiced consonants (m, n, l, r, w, y) are skipped.
- Takes live in this browser only (localStorage, last 12, about 30 samples a second). No export or import yet.
- A take records the finger only. Playback uses the same words, so it follows the song as saved.
- A song cycles its tune when the text is longer, and text is cut at 400 syllables.
- Own AudioContext: `voice.js` makes its own audio context, because `shared/audio.js` keeps its context private. Move it to `shared/` when a second app sings.
- No PWA files: the app is not installable or offline yet.
- Formants are simple linear blends between neighbouring vowels, not a model of the vocal tract.
- Register zones are a simplified teaching model, split into thirds.
- Voice ranges are textbook ranges. Real voices vary.
- Only checked in headless Chrome (pitch and vowel mapping, no page errors). Not yet heard on a real phone, so the sound balance is untested.
- Sound needs a tap to start, because browsers block audio until the user gestures.
