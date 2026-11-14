# Credits: third-party material

Everything not listed here is keymon-labs' own work under [NOTICE.md](NOTICE.md). Items below keep **their own** licence. Add a row whenever third-party material is added (see CLAUDE.md).

## Distributed with the site (code, assets, data)
| What | Used in | Source | Licence | Notes |
|---|---|---|---|---|
| Module preload polyfill and helpers injected by Vite | built pages | [vitejs/vite](https://github.com/vitejs/vite) | MIT | Copyright (c) 2019-present VoidZero Inc. and Vite contributors |
| Matter.js 2D physics engine (bundled into the page) | maths-arcade (Pop, Match) | [liabru/matter-js](https://github.com/liabru/matter-js) | MIT | Copyright (c) Liam Brummitt and contributors |
| Fonts Fredoka (headings) and Nunito (body), latin subset, via `@fontsource-variable/fredoka` and `@fontsource-variable/nunito` | spanish-arcade | [fontsource.org](https://fontsource.org), upstream [Fredoka](https://github.com/hafontia/Fredoka-One), [Nunito](https://github.com/googlefonts/nunito) | SIL Open Font License 1.1 | Copyright 2016 The Fredoka Project Authors; Copyright 2014 The Nunito Project Authors. Licence texts: `spanish-arcade/ui/art/LICENSE-fredoka.txt`, `LICENSE-nunito.txt` |
| Phosphor Icons, duotone subset of 16 icons | spanish-arcade (`ui/art/icons.js`) | [phosphor-icons/core](https://github.com/phosphor-icons/core) | MIT | Copyright (c) 2023 Phosphor Icons. Licence text: `spanish-arcade/ui/art/LICENSE-phosphor.txt` |
| Melodies: Humpty Dumpty, Hot Cross Buns, Mary Had a Little Lamb, Twinkle Twinkle Little Star | piano-jump/songs.json | Traditional | Public domain | Note sequences only |
| Song "Bow, Wow, Wow": words are the traditional nursery rhyme; the melody is our own, written for this app | piano-jump/songs.json | Traditional rhyme (public domain) + keymon-labs | Public domain words; melody under repo licence | |
| Melody: Ode to Joy (Beethoven, Symphony No. 9, 1824) | piano-jump/songs.json | Traditional | Public domain | Note sequence only |
| Spoken Spanish clips generated with the Piper voice `es_ES-davefx-medium` (current build, `rdh` base) | spanish-arcade (`audio/`) | [rhasspy/piper-voices `es/es_ES/davefx/medium`](https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium) at the commit in `spanish-arcade/audio/manifest.json` (`voiceRev`) | Model card: dataset CC0, base model `rdh` CC0 | Voice dataset: [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets) (CC0). No attribution required; credited as courtesy. Generated with Piper (GPL-3.0, dev tool, not distributed). No clips are committed yet; this row applies once `npm run audio` has run. |

## Inspiration (nothing copied)
| What | Used in | Notes |
|---|---|---|
| The Kodály and Orff rhythm-syllable methods and classroom "fruit rhythm" cards (ta, ti-ti, ti-ka-ti-ka) | beat-tiles | Teaching ideas only; the words, pictures, sounds and grooves are original. |
| The Zoomquilt (zoomquilt.org) and infipix: infinite-zoom pictures | zoom-tunnel | Idea only; all pictures are drawn in code by us |
| «Mis unidades de español. Primer cuatrimestre A1, Serie Luna» and the topics and levels of the ALCE classes | spanish-arcade | An unofficial game inspired by the book and following the topics and levels of the ALCE classes. Artwork, sentences, jokes and sounds are original. No book text, images or audio are distributed. |

## Loaded from third parties at runtime (not stored here)
| What | Used in | Source | Licence |
|---|---|---|---|
| Fonts Baloo 2, Noto Music | piano-jump | [Google Fonts](https://fonts.google.com) | SIL Open Font License 1.1 |

## Development only (not distributed)
| What | Licence | Notes |
|---|---|---|
| Vite and its build dependencies (`package-lock.json`) | MIT, ISC, BSD-3-Clause | Build tooling; only the Vite helpers above end up in the site |
| ponytail skill (`.claude/skills/ponytail/`) | MIT | Vendored with its LICENSE and SOURCE.md |
