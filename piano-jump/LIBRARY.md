# Piano Jump song libraries

A library is one JSON file with a list of songs. Load it from the menu: **Song library → choose file → Load library**. Songs are kept on that device only; **Remove library** deletes them. A library can be plain or password-protected.

Only put in songs you wrote or that are in the public domain (traditional tunes, old classical pieces). Don't copy melodies or words from a book or recording. Encrypting a file does not change that; a protected file in a public place is still shared.

## Plain format
```json
{ "songs": [
  { "id": "my-tune", "title": "My Tune", "info": "4/4 · C to G", "bpm": 100, "bar": 4,
    "notes": [ ["C4", 1, "La"], ["E4", 1, "la"], ["G4", 2, "laa", 5] ] }
] }
```
- `id`: 1-40 letters, digits, `-` or `_`, unique in the file. `title`: up to 60 characters. `info`: optional, up to 40.
- `bpm`: 30-300. `bar`: beats per bar, whole number 1-12 (3 for 3/4, 4 for 4/4).
- Each note is `[pitch, beats, lyric?, finger?]`
  - `pitch`: `C4` is middle C; sharps like `F#3`; range C2 to C6. Use `C4`-`G4` (right hand) and `C3`-`G3` (left hand) for beginner songs.
  - `beats`: one of `0.5, 1, 1.5, 2, 3, 4`.
  - `lyric`: optional, up to 24 characters; use `""` to skip it when you need a finger.
  - `finger`: optional 1-5, only to override the default C-position fingering (right hand thumb on C4, left hand pinky on C3).
- At most 200 songs and 500 notes per song. The file is checked on load; the message says which song or note is wrong.

## Password-protected format
`{"pjlib":1,"kdf":"PBKDF2-SHA256","iter":600000,"salt":…,"iv":…,"data":…}` (base64 values): the plain JSON above, encrypted with AES-256-GCM using a key from the password. Make one from a plain file:
```
PJ_PASSWORD='your password' node scripts/pj-library.mjs encrypt songs.json songs.pjlib
PJ_PASSWORD='your password' node scripts/pj-library.mjs decrypt songs.pjlib songs.json
```
The password is only used to open the file; the app never stores it. Pick a strong password: anyone who has the file can try guesses offline. Keep protected files out of the public repo.

## Prompt for an LLM to write a library
Paste this into any chat assistant, then add your songs:
```
Write a JSON song library for the Piano Jump game. Output only valid JSON.
Format: {"songs":[{"id","title","info","bpm","bar","notes"}]}
- id: letters, digits, - or _, unique. title: short. info: e.g. "4/4 · C to G". bpm 30-300. bar = beats per bar (3 or 4).
- notes: list of [pitch, beats, lyric, finger]. pitch like "C4" (middle C), "F#3", range C2-C6.
  beats must be one of 0.5, 1, 1.5, 2, 3, 4. lyric is a short syllable ("" if none). finger (1-5) is optional; leave it out unless the default is wrong.
- Beginner level: right hand C4-G4 only, or left hand C3-G3 only, steps and small skips, 8-16 bars at most.
- Beats in each bar must add up to "bar". The last note should be the home note.
- Only use public-domain tunes or write an original melody. Do not reproduce songs from books or recordings.
Songs I want: <list them here>
```
Check the result by loading it in the app; errors name the song and note.

## Later (not built yet)
Load a library from a web address (and refresh it), scan a QR code for that address, and put a whole short song into a QR code.
