# Research R1: Spain Spanish audio

Question: the app should sound like Spain (Castilian) Spanish, but kids on phones still hear a Latin American accent. Why, and how do we ship real `es-ES` audio under the repo's licence rules?

Status: research only, nothing built. Items marked **unverified** could not be checked from the sandbox (no phones, no ears, Hugging Face blocked).

## 1. Why phones still sound Latin American

`ui/speech.js` is correct as far as the Web Speech API lets it be: it ranks `es-ES` / `es_ES` / `spa-ESP` first, then any `es-*`, and `test/speech.test.js` covers that. The problem is what the phone reports and what it then actually plays.

| Cause | Where | Evidence |
|---|---|---|
| **Android Chrome lists languages, not installed voices.** `getVoices()` returns every language/region the engine supports, including ones whose voice pack is not downloaded. We "pick" `es_ES`, but if that pack is missing the engine plays whatever it has (often the user's default Spanish variant, frequently `es-US`, or even English). | Android, Chrome and Samsung Internet | [Readium WebSpeech notes](https://readium.org/speech/docs/WebSpeech.html): "even languages and regions which require a voice pack to be installed will show up in the list"; "Chrome will default to an English voice instead" |
| **Android uses an underscore** (`es_ES`). We copy `v.lang` into `u.lang`, so the utterance gets `es_ES`, not BCP-47 `es-ES`. Some engines match on `lang` rather than `voice`; a non-standard tag may fall back to the engine's default Spanish. | Android | Underscore: same Readium page. Effect on fallback: **unverified hypothesis**, cheap to fix (normalise to `es-ES`). |
| **Google TTS keeps one default variant per language.** In Android Settings > Text-to-speech > Google > Spanish, the variant is "Spain" or "United States". Many phones ship with `es-US` voice data only. | Android | Settings layout from common Android builds; per-device state **unverified** |
| **iOS 18 regression:** Safari no longer exposes Mónica (`es-ES`) / Paulina (`es-MX`) on real devices; only the low-quality Eloquence voices remain. Downloaded "enhanced" voices are never listed to web pages. All iOS browsers are WebKit, so Chrome on iPhone behaves the same. | iPhone / iPad | [Apple forum 764438](https://developer.apple.com/forums/thread/764438), [Readium](https://readium.org/speech/docs/WebSpeech.html) |
| **A saved voice preference wins.** `pickVoice(voices, preferred)` returns the chosen voice even if it is `es-MX`; a child or parent who once picked a Latin American voice in settings keeps it. | our code | `ui/speech.js` `pickVoice` |
| **No way to detect it.** `localService`, `default` and the name do not tell us whether the audio is really Castilian. The app cannot know it is sounding Mexican. | all | Readium page: `default` is `true` for every voice in Safari, not set on Android |

Conclusion: browser speech cannot *guarantee* Spain Spanish on phones. Better selection helps on some devices, but the only reliable fix is to ship our own audio.

## 2. Vocabulary size (today)

Counted from `units/*.json` and `data/vocab/*.json` (5 units: `a1-u0-demo`, `a1-u1-s1/s3/s5/s7`), unique Spanish strings:

| Kind | Count | Notes |
|---|---|---|
| Single words | 146 | vocab `es`, options, answers |
| Multi-word strings | 176 | intros, prompts, titles, gap sentences (spoken filled in, `round.full`); average 28.5 characters |
| **Total clips** | **~320** | upper bound: not every prompt is spoken today |

Projection for the whole A1 book (about 30 sessions, about 6x today): **~2,000 clips**.

## 3. Measured size per clip

Synthesised in the sandbox with Piper 1.8.0 (`pip install piper-tts`) and the `es_ES-davefx-medium` voice (the **older** lessac-based build from the sherpa-onnx GitHub mirror, see 4a; size and timing are the same for the newer build). Mono, 22.05 kHz, `--length-scale 1.1` (slightly slower for kids).

| Text | Duration | WAV | MP3 32 kbps | Opus 24 kbps | AAC 32 kbps |
|---|---|---|---|---|---|
| `cinco` | 0.65 s | 28.7 KB | 3.0 KB | 2.1 KB | 3.7 KB |
| `¡Hola! ¿Cómo te llamas?` | 1.4 s | 63.5 KB | 6.3 KB | 4.6 KB | 7.0 KB |

Estimate at MP3 32 kbps: words ~3 KB, sentences ~6-8 KB. **Today ~1.6 MB, whole A1 book ~10-12 MB**, fetched per unit, not all at once. MP3 plays everywhere (Opus is smaller but older iPhones are patchy); recommend MP3.

Phonemes Piper produced (espeak-ng `es`, which is Castilian): `cinco` → `θˈinko`, `llamas` → `ʎˈamas`. So the text front end does Spain *distinción* (θ for c/z). It also does *lleísmo* (`ʎ` for ll), which most Spain speakers no longer use; acceptable, and arguably helpful for spelling ll vs y. **I could not listen to the output; accent quality is unverified.** The WAV/MP3 samples were made in the scratchpad only, nothing was added to the repo.

## 4. Options

### (a) Pre-generated clips from an open es-ES TTS voice

Licences below were read from each model card. The rule: the voice **and** everything it was trained or fine-tuned from must be in the repo's allowed list (PD, CC0, MIT, BSD, Apache-2.0, ISC, OFL, CC BY, CC BY-SA).

| Voice | Quality for kids | Dataset licence | Base model it was fine-tuned from | Verdict |
|---|---|---|---|---|
| **Piper `es_ES-davefx-medium`, current build** (Piper ≥ 1.5) | Clear adult male, neutral, a bit flat. Medium = 22 kHz. | CC0 ([OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets)) | `rdh` medium, one Flemish speaker, **CC0** | **Allowed.** [Model card (main)](https://huggingface.co/rhasspy/piper-voices/raw/main/es/es_ES/davefx/medium/MODEL_CARD) |
| Piper `davefx-medium`, **old build** (v1.0.0, and the sherpa-onnx mirror) | same | CC0 | US English **lessac** (Blizzard 2013, research-only, no commercial use, no distribution without consent: [licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)) | **Do not use.** [v1.0.0 card](https://huggingface.co/rhasspy/piper-voices/raw/v1.0.0/es/es_ES/davefx/medium/MODEL_CARD) |
| Piper `es_ES-sharvard-medium` | 2 speakers (male, female), Harvard sentences | CC BY 3.0 ([Edinburgh DataShare](https://datashare.ed.ac.uk/handle/10283/574)) | lessac (as above) | **Ask owner** (lessac weights) |
| Piper `es_ES-mls_9972-low`, `mls_10246-low` | low quality (16 kHz), LibriVox readers, accent of speakers **unverified** | CC BY 4.0 ([OpenSLR 94](http://www.openslr.org/94/)) | US English **ryan** (RyanSpeech, **CC BY-NC-SA 4.0**) | **Ask owner** (NC base) |
| Piper `es_ES-carlfm-x_low` | x_low: noticeably robotic, 16 kHz; speaker's region **unverified** | Public domain ([carlfm01/my-speech-datasets](https://github.com/carlfm01/my-speech-datasets)) | trained from scratch | Allowed, but too poor for a reading game |
| Coqui XTTS-v2 | very natural, can clone a voice | mixed | [Coqui Public Model License](https://huggingface.co/coqui/XTTS-v2/blob/v2.0.1/README.md?code=true) (non-commercial) | **Ask owner / avoid** |
| Meta MMS `mms-tts-spa` | robotic, accent not stated | Bible recordings | [CC BY-NC 4.0](https://huggingface.co/facebook/mms-tts-spa/discussions/1) | **Ask owner / avoid** |
| Kokoro-82M (`ef_dora`, `em_alex`) | good engine; Spanish voices have no grade, data and accent not documented | not stated for Spanish | model Apache-2.0 ([VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)) | **Ask owner**: unknown data, accent unverified |
| Mimic 3 (archived) | older VITS, lower than Piper | per voice | collection mirror is [CC BY-SA 4.0](https://huggingface.co/mukowaty/mimic3-voices) | superseded by Piper, skip |
| eSpeak NG `es` | Castilian but clearly robotic | n/a (rules) | GPL-3.0 code; output audio is ours | fallback only; not good enough for kids |
| Cloud TTS (Google / Azure `es-ES` neural) | best quality, female voices available | proprietary | provider terms, API key, cost | **Ask owner**: not an open licence |

Tooling licences: the current Piper (`piper-tts` on PyPI, repo OHF-Voice/piper1-gpl) is **GPL-3.0**. It is a dev-only generator, not shipped, and its output audio is not covered by the GPL, so no CREDITS row is needed for the tool; the **voice model** needs one.

Runs in this sandbox? Partly:
- `pip install piper-tts` works (PyPI is allowed); synthesis on CPU takes well under a second per clip, so 2,000 clips is a few minutes.
- **Hugging Face is blocked** by the sandbox proxy (CONNECT 403), so the current CC0 davefx build cannot be downloaded here.
- The GitHub mirror (`k2-fsa/sherpa-onnx` release `tts-models`) is reachable but contains the **old lessac-based** davefx (its bundled MODEL_CARD says so). Do not use it for shipped audio.
- So generation must run on the owner's machine or in a GitHub Action (both reach Hugging Face).

### (b) Recorded human clips

- Best for kids: warm, natural, can be a woman or a younger-sounding voice; real Castilian guaranteed.
- Licence: the contributor signs a one-line release putting the clips under **CC0** (or CC BY 4.0 with their chosen credit name). PLAN.md already says recorded clips must be a **non-family voice** (public-data rule): no owner or children's voices.
- Effort: ~320 clips today (~1 hour with a phone in a quiet room, plus trimming), ~2,000 for the book. Every new unit needs the same person again, or the voice changes mid-course.
- Size: same as TTS (~3-8 KB per clip as MP3).
- Runs in the sandbox: trimming/normalising/encoding yes (`ffmpeg` is installed); recording no.

### (c) Better browser voice selection + warning

Cheap, keeps working for text we have no clip for:
- Normalise the utterance tag: `u.lang = 'es-ES'` when the voice is a Spain voice (not the raw `es_ES` / `spa-ESP`).
- Settings: show the voice name and region; a "Probar voz" button that says `zapato, cielo` (a θ word) so a parent can hear whether it is Spain Spanish.
- If no Spain voice is listed (or the saved voice is not `es-ES`), show a small "Acento: no es de España" chip with help: Android: Settings > Text-to-speech > Google > Spanish > Spain, download voice data. iOS 18: no fix from the web page (see section 1).
- Limit: on Android the list is unreliable, so the chip can be wrong in both directions. It reduces the problem, does not solve it.

### (d) Hybrid (recommended shape)

Bundled clips for every text in the units; browser voice (c) only for text without a clip (new content before regeneration, typed answers). Recorded human clips can replace TTS clips one by one later through the same manifest.

## 5. Recommendation

1. **Ship (d): Piper `es_ES-davefx-medium`, current CC0 build, MP3 32 kbps mono, generated from the unit data**, committed under `spanish-arcade/audio/`. Licence is clean (CC0 data, CC0 base), size is small (~1.6 MB now, ~10-12 MB for the book), works offline once a unit is cached, and the same on every phone.
2. Do the cheap parts of (c) at the same time: `es-ES` tag normalisation and the "Probar voz" check in settings, because browser speech stays the fallback.
3. Before merging, the owner **listens** to ~20 clips (numbers, `ll`, `c/z`, questions with `¿?`) and decides if a male adult TTS voice is good enough for the children. If not, (b) with a CC0 recording by a non-family adult through the same manifest.
4. Never use the sherpa-onnx davefx mirror, `sharvard`, `mls_*`, XTTS or MMS without the owner's explicit OK.

## 6. CREDITS.md rows needed

Add when the first clips are committed (pin the Hugging Face commit used):

| What | Used in | Source | Licence | Notes |
|---|---|---|---|---|
| Spoken Spanish clips generated with the Piper voice `es_ES-davefx-medium` (current build, rdh base) | spanish-arcade (`audio/`) | [rhasspy/piper-voices `es/es_ES/davefx/medium`](https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium) @ `<commit>` | Model card: dataset CC0, base model `rdh` CC0 | Voice dataset: [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets) (CC0). No attribution required; credited as courtesy. Generated with Piper (GPL-3.0, dev tool, not distributed). |
| (only if b) Recorded Spanish clips by `<credit name chosen by contributor>` | spanish-arcade (`audio/`) | contributor | CC0 1.0 (or CC BY 4.0) | Release text kept in `spanish-arcade/audio/RELEASE.md`; non-family voice |

## 7. Proposed design

### Files

```
spanish-arcade/audio/manifest.json      text -> clip, written by the script
spanish-arcade/audio/<id>.mp3           id = first 12 hex of sha1(voice + "|" + normalised text)
spanish-arcade/scripts/gen-audio.mjs    lists speakable texts, calls Piper, encodes, writes manifest
```

Normalised text: Unicode NFC, trimmed, inner spaces collapsed, `___` gaps already filled (the spoken `round.full`). Case and punctuation kept (`¿Hola?` and `Hola.` intonate differently).

### Manifest

```json
{ "schema": 1,
  "voice": "piper:es_ES-davefx-medium@<hf-commit>;length_scale=1.1",
  "clips": {
    "cinco": "3f9c2b1a7e04",
    "¡Hola! ¿Cómo te llamas?": "a71d09c2be55"
  } }
```

Keyed by text, so the browser needs no hashing (`crypto.subtle` is async and needs a secure context; a plain lookup is simpler). The id includes the voice, so changing voice or settings gives new file names, which matters because `sw.js` caches same-scope files cache-first. ~2,000 entries is ~70 KB of JSON; split per unit later only if it grows.

### `speak()`

```js
// ui/speech.js (sketch): bundled clip first, browser voice second.
async say(text, opts) {
  if (activation && !activation.hasBeenActive) return false;
  const id = (await manifest())?.clips[norm(text)];
  if (id && await playClip(`./audio/${id}.mp3`, opts)) return true; // HTMLAudioElement; resolves on 'ended', false on 'error'/timeout
  return sayWithBrowserVoice(text, opts);                            // today's code path
}
```

- `available` becomes "clips or a Spanish voice", so listening games stay on even when the phone has no Spanish voice at all.
- `rate`: clips are generated at a kid-friendly speed; `playbackRate` (with `preservesPitch`) covers the slow-replay button.
- One `Audio` element reused; `stop()` pauses it and cancels speech.
- Tests (node, fake fetch/Audio): clip found → played, no browser speech; clip missing or fails → browser voice; no tap → false.
- Offline: the unit start can prefetch its clips (`cache.addAll`) so the first round works offline; otherwise they cache on first play.

### Contributor workflow for a new unit

1. Add/edit `units/*.json` and `data/vocab/*.json` as today.
2. `npm run audio` (wraps `node spanish-arcade/scripts/gen-audio.mjs`): collects every speakable text (vocab `es` and `forms`, `intro.es`, prompts, gap sentences filled with the answer, read-answer texts), skips texts already in the manifest with an existing file, pipes the rest through `python -m piper` then `ffmpeg -ac 1 -b:a 32k`, deletes clips no text uses, rewrites `manifest.json`.
3. Requirements printed by the script: Python 3.10+, `pip install piper-tts` (≥1.5), `ffmpeg`, and the voice files from Hugging Face (script downloads to a cache dir outside the repo and checks the pinned commit).
4. `scripts/check-units.mjs` gains a warning (not an error) for spoken texts with no clip, so the browser fallback stays visible.
5. Optional later: a manual GitHub Action (`workflow_dispatch`) that runs step 2 and opens a PR, for contributors without Python. Chat sandboxes cannot reach Hugging Face, so audio regeneration cannot happen from the Claude mobile app today.

Collecting speakable texts belongs next to the archetypes (each `logic.js` knows what it says); a small `speakables(unit, vocab)` export avoids the script guessing from JSON keys.

## 8. Questions for the owner

| # | Question | Assumed answer |
|---|---|---|
| A1 | OK to commit generated MP3 clips (~2 MB now, ~10-12 MB for the whole book) to the public repo? | Yes |
| A2 | Voice: adult male TTS (davefx, the only clean es-ES option found) good enough, after you listen to samples? | Try it; switch to (b) if not |
| A3 | Want a recorded human voice instead/later? Who (non-family adult), under CC0? | Later, only if A2 fails |
| A4 | Allow any "ask owner" voice (sharvard female voice: lessac base; Kokoro: undocumented data; cloud TTS)? | No |
| A5 | Who runs generation: you locally, or a GitHub Action that opens a PR? | Local script first, Action later |
| A6 | Should prompts/instructions ("Escucha y toca…") also be spoken, or only the Spanish being practised? | Practice text only, prompts later |
| A7 | `ll` pronounced as `ʎ` (lleísmo) by the TTS front end: fine for a spelling app? | Yes |

## Not verified

- How any clip actually sounds (accent, naturalness): no listening possible here.
- The current davefx build itself: Hugging Face is blocked in the sandbox; licence facts come from its model card via web fetch. The measured sample used the old build.
- Accent of the `carlfm` and `mls_*` speakers; Kokoro's Spanish data.
- Real phone behaviour (which voices a given Android/iPhone lists and plays), and whether the `es_ES` underscore tag causes fallback.
