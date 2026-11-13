# Age bands 7–12 and new archetypes for older children

Research note (November 2026, task R2). The question: the app was designed for about 6–8-year-olds at A1. How should it grow to 7–12, and which new game types suit ages 10–12 best? Inputs: [PLAN.md](../PLAN.md), [ARCHETYPES.md](../ARCHETYPES.md), [UNITS.md](../UNITS.md), [GAMES.md](GAMES.md), [ENGAGEMENT.md](ENGAGEMENT.md), [archetypes/README.md](../../archetypes/README.md), the params tables of the 11 built archetypes, `units/*.json`, `core/schema.js` and the sources at the end. Every example sentence below is invented. No book text, characters or brands are used.

**Who the learners are.** Heritage or home learners: they speak and understand Spanish at home, go to school in another language, and learn written Spanish in ALCE-style classes or with a parent. So speaking and listening are well ahead of reading and spelling. The bands below describe **written** Spanish. A 10-year-old here may read like a Spanish 2nd–3rd grader but understand stories meant for an older child. Two consequences: keep texts **short** but not **childish**, and keep the speaker button everywhere.

**How sure we are.** The Spanish primary curriculum (LOMLOE, RD 157/2022) sets *saberes básicos* per two-year cycle, not per year. Where I name a school year for a topic (e.g. *agudas/llanas/esdrújulas* in 3rd–4th grade), that is common textbook practice, not law. Attention and session lengths are design judgement backed by weak evidence (see §1.4).

---

## 1. Three age bands

### 1.1 What the sources say
- **Spain, primary (RD 157/2022, Lengua Castellana y Literatura, block "Reflexión sobre la lengua").** First cycle (6–8): *"distintos tipos de palabras y sus relaciones de concordancia"*, *"signos básicos de puntuación"*, connectors of time, *"ortografía natural"* (spell as it sounds). Second cycle (8–10): *"las relaciones que se establecen entre sustantivos, adjetivos y verbos"*, the order of sentences and paragraphs, *"ortografía reglada básica"* (basic spelling rules). Third cycle (10–12): *"los distintos tiempos verbales"* and tense agreement, pronoun substitution, *"generalizaciones sobre la acentuación"* (accent rules), punctuation to express intent, word formation, and *"ortografía reglada en la textualización y la autocorrección"* (applying rules while writing, and correcting yourself). Text demands: 1st cycle "simple" texts, 3rd cycle *"textos escritos y multimodales de relativa complejidad"*.
- **ALCE curriculum (Spanish programme abroad).** Ten years from A1 to C1. Stage A is three years: A1, then A2.1 and A2.2 (the Australia curriculum, revised 2019). A1 language is *"referida al momento presente y a situaciones concretas"* and uses connectors such as *y*, *pero*. A2 adds past events, *por eso*, *por último*, and expects errors such as *"confusión de tiempos verbales, olvido de la concordancia"* and spelling *"no siempre normalizada"*. Themes: A1 class, personal data, family, home and school objects; A2 friends, personality, moods, likes, leisure, daily life.
- **CEFR young learner descriptors (Council of Europe, 2018).** Ages 7–10, A1: *"I can read and understand simple and short sentences underneath pictures"*; *"I can write something about myself (e.g. name, age and where I live)"*. Ages 11–15, A1: short messages on cards and postcards; *"simple phrases and sentences about myself"*. The CEFR A2 reading descriptor is about short, simple texts on familiar topics with high-frequency words.
- **Heritage learners' spelling.** Written accents are by far the most frequent error of heritage learners. *s/c/z* confusions come next (Beaudrie 2012, reviewed by Llombart-Huesca & Zyzik 2019). Bilingual children in grades 1–3 were less accurate with context-dependent rules (*c/qu*, *g/gu*) than with inconsistent letters (same review). **For us:** accent rules and agreement are the most valuable content for the older bands.
- **Attention.** Sustained attention improves quickly from 5–6 to 8–9, then levels off from 9 to 12 with small gains, and is worse under high load at every age (Betts et al. 2006, 57 children aged 5–12). Short spaced sessions beat long blocks for young children (see ENGAGEMENT.md §1.4). Children aged 7–11 start to use logic to make inferences (NN/g, kids' cognition), which makes detective and deduction games fit 9–12.
- **Games and L2 learning.** Game-based language learning has a small-to-medium effect between groups (d = 0.50; Hawaii LLT meta-analysis). The effect on vocabulary depends on **game design features** and not significantly on learner age (Chen, Tseng & Hsiao 2018). GAMES.md already has the matching rule: the skill must *be* the move.

### 1.2 The bands

| | **7–8** | **9–10** | **11–12** |
|---|---|---|---|
| Spain cycle / ALCE / CEFR | 1st cycle; ALCE A1; CEFR A1 (young learners 7–10) | 2nd cycle; ALCE A1 → A2.1; A1+ | 3rd cycle; ALCE A2.1–A2.2; A2 |
| **Reading** | 1–5 short sentences (5–8 words), one picture, literal questions. Read-aloud on every text | A paragraph of 4–8 sentences, short dialogues, timelines with *primero / luego / después / por último*. Literal plus one simple inference | 2–3 short paragraphs (about 80–200 words): stories with a plot, messages, instructions, simple facts. Inference, order of events, main idea, who said what |
| **Spelling** | Whole words; ñ, r/rr, h, c/qu, ll/y in taught words; accents copied from a model, not from a rule | Rules for frequent cases: b/v (-aba, b before consonant), g/j, c/z/s, h in common words; accents on common words; first look at stressed syllables | Accent rules applied (agudas, llanas, esdrújulas), diacritic tilde (tú/tu, él/el, sí/si, más), hiatus (*día, país*), *qué/que*, *porque/por qué*; self-correction of a paragraph |
| **Gender and number** | el/la/un/una + noun; plural with -s/-es; recognise matching adjectives (*gato negro / gatos negros*) | Full noun phrase agreement (el, noun, adjective), -z → -ces, articles with irregular nouns (el agua) | Agreement at a distance (subject far from verb or adjective, pronouns *lo/la/los/las*), over several clauses |
| **ser / estar / tener** | Fixed chunks: *soy, es, estoy, está, tengo … años* | Contrast: ser = what it is like, estar = state and place; *tener* + age/hunger/fear | Contrast in context, including tricky pairs (*es aburrido / está aburrido*); used inside longer texts |
| **Present tense** | yo / tú / él-ella of common verbs, as chunks | All six persons of regular -ar/-er/-ir; tener, ir, hacer, querer (e→ie); reflexives (*me levanto*); *me gusta / le gusta* | Stem changes (o→ue, e→i), irregular yo forms; plus past basics (*ayer fui, comí*), *ir a* + infinitive; tense agreement in a text |
| **Plurals and accents in plurals** | -s / -es | -z → -ces | Accent moves or disappears (*canción → canciones*, *joven → jóvenes*) |
| **Questions** | ¿ ? ¡ ! as marks; *¿Cómo te llamas?* as a chunk | Question words with accent (*qué, quién, dónde, cuándo, cuántos, cómo*); turning an answer into a question | *por qué / porque*; indirect questions (*no sé dónde está*); questions in dialogue punctuation |
| **Vocabulary themes** | Self, family, numbers, colours, school things, body, pets, food, days, weather | Routines and time, house, town, hobbies, feelings, clothes, seasons, animals and habitats | Travel, nature and environment, jobs, technology, opinions (*creo que, me parece*), feelings with nuance |
| **Attention (judgement)** | Developing fast. 4–6 rounds per exercise | Close to plateau. 6–8 rounds | At plateau; motivation decides. Longer single tasks are fine (one story, one case) |
| **Session length** (current: 5–6 exercises, legs of 3, about 8 min cap) | 5–8 min; legs of 3 as now | 8–12 min; legs of 3 | 10–15 min; legs of 3, but one exercise may be a single longer task |
| **Interface tone** (judgement) | Pictures, mascot, big tiles, tap over drag | Same, less help text | Less mascot chatter, a "reto" (challenge) feel, no baby pictures for abstract words; drag is fine |

**What the current content covers.** All four units (`a1-u1-s1`…`s7`) sit in the **7–8** band, with a few pieces of 9–10 (ser/estar/tener gaps in `a1-u1-s5`, accent traps typed in `a1-u1-s1`). Nothing yet trains accent *rules*, multi-clause sentences, conjugation tables or longer texts.

**Limits in the built archetypes that cap older children** (these are param ranges, cheap to widen):
- `read-answer`: `text` is 2–5 sentences, `questions` 1–3. For 11–12, allow about 8 sentences and 5 questions.
- `order-words`: 2–9 tiles. A sentence with two clauses needs 10–14.
- `fix-the-mistake`: one error per text, spelling traps only (no agreement or ser/estar errors).
- `fill-gap-choice`: one gap per sentence.

---

## 2. Difficulty 1–3 and age bands

**Keep the two axes separate.** `difficulty` (1–3) is the ramp *inside a unit*. It picks an archetype's levers through `defaults(difficulty)` and must not go down within a unit (validator rule). The age band is *which content and which archetypes* a unit uses. A 7-year-old at difficulty 3 and an 11-year-old at difficulty 1 are both reasonable.

Suggested defaults for authors:

| Band | Built archetypes | New archetypes (§3) | Units (ids) |
|---|---|---|---|
| 7–8 | difficulty 1–2 (as today) | `question-maker` at 1 only | `a1-u*` as planned |
| 9–10 | difficulty 2–3; widen `read-answer` to 6 sentences | `question-maker`, `transform-it`, `verb-forge`, `clue-detective` at 1–2 | late `a1-u3-*`, early `a2-u*` |
| 11–12 | difficulty 3 as warm-up only (first exercise of a leg) | all of §3 at 1–3 | `a2-u*` |

### 2.1 Metadata proposal (optional, backwards compatible)
The current validator ignores unknown keys at unit level and checks `difficulty`, `pin`, `prompt` and params at exercise level. So these fields can be added without breaking existing units. A unit without them behaves exactly as today.

```json
{ "schema": 1, "id": "a2-u1-s1", "rev": 1, "order": 20,
  "level": { "band": "11-12", "cefr": "A2" },
  "exercises": [
    { "id": "lighthouse-story", "archetype": "story-path", "difficulty": 2,
      "params": { "...": "..." },
      "byBand": { "9-10": { "difficulty": 1, "params": { "showTextWhileAnswering": true } } } }
  ] }
```

| field | where | type | default | meaning |
|---|---|---|---|---|
| `level.band` | unit | `7-8` \| `9-10` \| `11-12` | unset = any band | The band the unit is written for. Home can group or sort by it |
| `level.cefr` | unit | `A1` \| `A2` \| `B1` | unset | Information for parents and authors (ALCE level). No logic uses it |
| `byBand` | exercise | map band → `{ difficulty?, params? }` | unset | Overrides for a profile in that band. Same exercise id, so progress keeps working. Merge: schema defaults < `defaults(difficulty)` < `params` < `byBand[band].params`; `byBand[band].difficulty` replaces `difficulty` |
| `band` | profile setting (store, optional) | `7-8` \| `9-10` \| `11-12` | unset = use units as written | Chosen by the parent behind the gate. A band, not an age (PLAN §2 says no age is stored) |

Validator additions: enum checks for the three fields; check the merged params of every `byBand` entry against `paramsSchema`; check the "difficulty never goes down" rule once per band. Session: `resolveParams(arch, ex, band)` applies `byBand`. Nothing else changes. Vocab needs no band: words are shared, and `upToUnit` already limits them.

Why not more: a per-exercise `minBand` filter would make units of fewer than 5 exercises for some bands and break the unit mix rule. `byBand` keeps one unit file playable by every band. That matters most when a parent writes the content.

---

## 3. New archetypes for 10–12 (8 proposals)

None of these duplicates a built archetype. Where one overlaps an *idea* in ARCHETYPES.md, the row says so. Every proposal follows the GAMES.md rules: the skill is the move, recall beats recognition, hint → reveal → copy, no timers, tap-tap for every drag, `wordIds` when vocab is used. Effort: S ≈ one session reusing `ui/tiles.js`; M = a new widget or generator; L = a new data model or rule engine.

### 3.1 `story-path`: choose-your-path story (skill: `reading`)
**Trains:** reading longer texts, inference, order of events.
**Interaction:** a scene of 2–6 sentences appears (speaker button on each). The child chooses what the characters do next from 2–3 paths. The chosen path's text appears, then one comprehension "gate" question unlocks the next scene. The paths of a scene meet again at the next scene ("branch and bottleneck"), so the story stays short. A replay can take the other path.

| Param | Type | Default | Notes |
|---|---|---|---|
| `scenes` | list of `{ text[], emoji?, choose?, branches[] }`, min 1 | required | One round per scene. `branches`: 1–3 of `{ label, text[], q, options[], answer }`. With one branch, `choose` is skipped |
| `showTextWhileAnswering` | bool | `true`; `false` at difficulty 3 | Same meaning as in `read-answer` |
| `readAloud` | `tap` \| `auto` | `tap`; `auto` at difficulty 1 | `auto` reads each new text once (after the first tap) |
| `n` | int ≥ 1 | all scenes | Scenes to play, in order (never shuffled) |

```json
{ "scenes": [
  { "text": ["Es sábado y el faro de la isla está apagado.", "Marta y su primo quieren saber por qué."],
    "emoji": "🗼", "choose": "¿Qué hacen primero?",
    "branches": [
      { "label": "Subir al faro", "text": ["Suben ciento veinte escalones.", "Arriba encuentran una bombilla rota y una nota mojada."],
        "q": "¿Qué encuentran arriba?", "options": ["una bombilla rota y una nota", "una llave y un mapa", "un gato dormido"], "answer": 0 },
      { "label": "Preguntar en el puerto", "text": ["Un pescador dice que anoche hubo una tormenta muy fuerte.", "Desde entonces, nadie ha subido al faro."],
        "q": "¿Qué pasó anoche?", "options": ["Hubo una tormenta.", "Hubo una fiesta.", "Llegó un barco nuevo."], "answer": 0 } ] } ] }
```
- **Audio:** each sentence speaks on tap; `auto` at difficulty 1. Without a voice, text only.
- **Difficulty:** 1 = 2–3 sentences per scene, text stays visible, literal questions. 2 = 4–6 sentences, text hides while answering. 3 = inference questions ("¿Por qué está apagado el faro?") and a grammar gate on some scenes (pick the right verb form to continue).
- **Engine fit:** one round per scene; `submit({ branch, pick })`; `judge` uses that branch's question; `hint` level 1 brings the text back or highlights the sentence that has the answer (as `evidence` does in `read-answer`).
- **Reuses:** the text and question layout of `read-answer` (copy the pattern; it stays separate), `ui/tiles.js` `el`, `ctx.say`.
- **Effort:** M (the authoring burden is larger than the code).
- **Hook:** choice (autonomy, ENGAGEMENT §1.1), curiosity about the other path, a short ending card ("Has encontrado un final de 2"). Fits 11–12 because the text length is earned, not imposed.

### 3.2 `clue-detective`: who is it? (skill: `reading`)
**Trains:** careful reading of descriptions; ser / estar / tener / llevar; negation; comparatives and relative clauses at 3.
**Interaction:** 4–6 suspect cards (emoji, invented name, place). Clue notes appear one at a time. The child crosses out suspects that a clue rules out; crossing out is free and not judged. Then the child taps "Es este" on the last one standing. One judged answer per case.

| Param | Type | Default | Notes |
|---|---|---|---|
| `cases` | list of `{ suspects[], clues[], answer }`, min 1 | required | `suspects`: `{ name, emoji, place? }`; `clues`: Spanish sentences; `answer`: index of the culprit. Every clue must be true of the answer (the validator can't check this; the author does) |
| `reveal` | `one` \| `all` | `one`; `all` at difficulty 1 | `one`: the next clue appears on "Otra pista" |
| `crossOut` | bool | `true` | Lets the child cross out cards (tap again to restore) |
| `n` | int ≥ 1 | all cases | Cases to play |

```json
{ "cases": [ {
  "suspects": [ { "name": "Leo", "emoji": "🧑‍🍳", "place": "cocina" }, { "name": "Inés", "emoji": "👩‍🔬", "place": "jardín" },
                { "name": "Tomás", "emoji": "🧑‍🎨", "place": "cocina" }, { "name": "Clara", "emoji": "👩‍🚀", "place": "salón" } ],
  "clues": ["La persona que buscamos no está en el jardín.", "Lleva un gorro blanco.", "Está en la cocina, pero no pinta cuadros."],
  "answer": 0 } ] }
```
- **Audio:** each clue can be heard; the final reveal reads the solution sentence.
- **Difficulty:** 1 = all clues shown, one feature per clue, positive sentences. 2 = clues one by one, negation (*no lleva gafas*). 3 = relative clauses and comparisons (*es más alta que la persona del salón*), ser/estar contrasts (*está nerviosa* vs *es nerviosa*).
- **Engine fit:** composite round per case. `hint` level 1 names a clue that rules out a card still standing; level 2 marks the answer.
- **Reuses:** card grid and buttons from `ui/tiles.js`; `ctx.say`, `ctx.sfx`.
- **Overlap:** UNITS.md plans a "`who-is-who` clue version" for `a1-u1-s7`; this is that idea as its own archetype (the yes/no-question game stays separate).
- **Effort:** M.
- **Hook:** deduction, "case closed" stamp, detective framing. Children aged 7–11 begin to reason by inference (NN/g), so it scales across all bands with the clue language.

### 3.3 `verb-forge`: build the conjugation table (skill: `grammar`)
**Trains:** present tense of all six persons; endings -ar/-er/-ir; stem changes; irregular yo; past tense at 3.
**Interaction:** a verb (*cantar* 🎤) and six person slots (yo, tú, él/ella, nosotros, vosotros, ellos). The child drops ending tiles onto the stem (*cant + o*), or whole-form tiles at 2, or types at 3. Finished rows light up and speak (*yo canto*). One judged answer per table.

| Param | Type | Default | Notes |
|---|---|---|---|
| `verbs` | list of `{ inf, forms[6], emoji?, tense?, en? }`, min 1 | required | `forms` in person order; `tense` is a label shown above (`presente`, `pasado`) |
| `persons` | list of int 0–5 | all six | Subset of rows (e.g. leave out vosotros) |
| `mode` | `endings` \| `forms` \| `type` | `endings`; `forms` at 2; `type` at 3 | `endings` splits each form into the longest stem shared with the infinitive + ending; stem-changing verbs show the changed stem as its own tile |
| `decoys` | int 0–4 | 0 / 2 / 3 by difficulty | Extra tiles: endings of another conjugation, unchanged stems (*quero*) |
| `accents` | `strict` \| `lenient` | `strict` | Type mode only |

```json
{ "verbs": [ { "inf": "cantar", "emoji": "🎤", "forms": ["canto", "cantas", "canta", "cantamos", "cantáis", "cantan"] },
             { "inf": "querer", "emoji": "💛", "forms": ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"] } ] }
```
- **Audio:** each completed row is spoken with its pronoun.
- **Difficulty:** 1 = regular -ar, endings only. 2 = -er/-ir and stem changes, whole forms with decoys. 3 = typed forms, irregular yo (*tengo, hago*), or a past tense table.
- **Engine fit:** composite round (one table). `hint` level 1 marks one wrong row; level 2 fills the table.
- **Reuses:** tile drag and tap from `ui/tiles.js` (`tapOrDrag`, `specialLettersRow` for typing); `core/spelling.js` `sameWord` for lenient accents.
- **Overlap:** replaces the `verb-conjugator` idea (one form at a time) with the table, which is how Spanish schools present verbs. A small regular-verb generator in `core/` would allow `from` later; not needed now (`shortcut`: authored forms).
- **Effort:** M.
- **Hook:** a "forge" that clicks each correct row into place, a full-table flourish, and a bonus line using one form in a funny sentence.

### 3.4 `clause-builder`: sentences from card decks (skill: `grammar`)
**Trains:** sentences with two clauses; connectors (*porque, pero, cuando, y, así que*); subject–verb and noun–adjective agreement.
**Interaction:** card decks in columns (who / does what / connector / second part). The child builds a sentence that meets a goal ("Una frase con *porque*", "Dos verbos distintos"). Any sentence that meets the goal and agrees is right, including silly ones. The sentence is read aloud.

| Param | Type | Default | Notes |
|---|---|---|---|
| `decks` | object of lists: `subjects`, `verbs`, `connectors`, `rest` | required | Subject and verb cards carry `person` (1–3) and `number` (`sg`/`pl`); adjective cards carry `gender` and `number` |
| `goals` | list of `{ need?: [es], clauses?: int }` | required | One round per goal |
| `agree` | bool | `true` | Judge checks agreement between linked cards |
| `slots` | int 3–7 | 3 / 5 / 7 by difficulty | Cards in the sentence |

```json
{ "decks": {
    "subjects": [ { "es": "Mis primas", "person": 3, "number": "pl", "gender": "f" }, { "es": "El perro", "person": 3, "number": "sg", "gender": "m" } ],
    "verbs": [ { "es": "están", "person": 3, "number": "pl" }, { "es": "está", "person": 3, "number": "sg" } ],
    "rest": [ { "es": "cansadas", "number": "pl", "gender": "f" }, { "es": "cansado", "number": "sg", "gender": "m" } ],
    "connectors": [ { "es": "porque" }, { "es": "pero" } ] },
  "goals": [ { "need": ["porque"], "clauses": 2 } ] }
```
- **Audio:** the finished sentence is read aloud; nonsense is part of the fun.
- **Difficulty:** 1 = one clause, three slots. 2 = two clauses with one connector. 3 = seven slots, decoy cards that break agreement, connectors that change the tense (*cuando* + past).
- **Engine fit:** one round per goal. `hint` level 1 points to the first card that does not agree; level 2 shows one valid sentence.
- **Reuses:** tiles from `ui/tiles.js`; the punctuation handling from `order-words`.
- **Risk:** the rule engine (which card agrees with which) is the real work, and meaning is not checked (*El perro está cansado porque mis primas cantan* is accepted). Authors must tag every card.
- **Effort:** L.
- **Hook:** creativity and absurd humour; "Lee mi frase" button. Popular with 10–12s because they control the output.

### 3.5 `paragraph-editor`: fix the paragraph (skill: `spelling`)
**Trains:** self-correction (3rd cycle "autocorrección"); accents, agreement, ser/estar, ¿ ¡, capitals, b/v in one text.
**Interaction:** a short paragraph with 2–5 mistakes of mixed kinds and a counter ("Quedan 3"). The child taps a wrong word and fixes it (choice, or typed at 3). Each fix is a judged round on the same board. At the end the clean paragraph is read aloud.

| Param | Type | Default | Notes |
|---|---|---|---|
| `texts` | list of `{ text, errors[] }`, min 1 | required | `text` is the **correct** paragraph; `errors`: `{ at, as, kind? }` (`at` = word index, `as` = the wrong form; `kind`: `accent`, `agreement`, `verb`, `punctuation`, `spelling`) |
| `fix` | `choice` \| `type` | `choice`; `type` at 3 | Choice options: the right form plus 1–2 other plausible forms |
| `showCount` | bool | `true`; `false` at 3 | Shows "Quedan N" |
| `showKind` | bool | `true` at 1 | Labels the kind of each remaining mistake ("1 tilde, 1 concordancia") |

```json
{ "texts": [ {
  "text": "Ayer fuimos al río con mis tíos. El agua estaba muy fría y las piedras eran resbaladizas. ¿Quién quiere volver mañana?",
  "errors": [ { "at": 3, "as": "rio", "kind": "accent" }, { "at": 16, "as": "resbaladizos", "kind": "agreement" },
              { "at": 17, "as": "Quién", "kind": "punctuation" } ] } ] }
```
(`at` counts words split on spaces, as in `fix-the-mistake`. The third error drops the `¿`, so here `as` must replace the whole token, punctuation included.)
- **Audio:** hint level 1 can speak the correct sentence, which gives away a stress error by ear (*esta / está*), a real reading skill for these learners. The wrong version is never spoken.
- **Difficulty:** 1 = 2 errors, kinds shown, choice. 2 = 3–4 errors, kinds hidden. 3 = typed fixes, no counter, and an "Ya está perfecto" button that must be pressed when all errors are fixed.
- **Engine fit:** "per item" board (archetypes/README): one round per error, board passed in each round. A tap on a correct word gives a gentle "esta está bien" and is not a submit.
- **Reuses:** `core/spelling.js` (`misspellings` to propose choices for spelling-type errors, `sameWord`), the tap-a-word view and type row from `fix-the-mistake`.
- **Overlap:** could be a `mode: "paragraph"` of `fix-the-mistake`; a separate archetype keeps that module small (owner question 3).
- **Effort:** S–M.
- **Hook:** role reversal (the mascot's diary needs an editor), the counter going down, a "corrected" stamp.

### 3.6 `transform-it`: change the sentence (skill: `grammar`)
**Trains:** agreement chains: singular → plural, masculine → feminine, *yo → nosotros*, today → yesterday.
**Interaction:** a sentence and an order: "Ahora son muchos", "Ahora es ella", "Ahora fue ayer". The child taps each word that must change, and each tap cycles its forms (*el → los*, *gato → gatos*, *es → son*). "Listo" submits the whole sentence. The picture changes with it (🐱 → 🐱🐱🐱).

| Param | Type | Default | Notes |
|---|---|---|---|
| `items` | list of `{ es, to, answer, forms?, emoji? }`, min 1 | required | `to`: the order shown (`plural`, `femenino`, `nosotros`, `ayer`, or free text); `answer`: the target sentence; `forms`: per word index, the options to cycle (else generated for articles from a fixed table) |
| `edit` | `cycle` \| `type` | `cycle`; `type` at 3 | `type` opens the field for the tapped word |
| `markWords` | bool | `true` at 1 | Underlines the words that must change |
| `n` | int ≥ 1 | all | Items to play |

```json
{ "items": [ { "es": "El gato negro está en el tejado.", "to": "plural", "emoji": "🐱",
  "answer": "Los gatos negros están en el tejado.",
  "forms": { "0": ["El", "Los", "Las"], "1": ["gato", "gatos"], "2": ["negro", "negros", "negras"], "3": ["está", "están", "estás"] } } ] }
```
- **Audio:** reads the starting sentence, then the transformed one on success.
- **Difficulty:** 1 = two words change, underlined. 2 = 3–4 words, not underlined, with a trap word that must not change (*el tejado*). 3 = typed, and changes of person or tense.
- **Engine fit:** one round per item. `hint` level 1 underlines the words still wrong; level 2 shows the answer.
- **Reuses:** tiles; vocab `forms` (`m`, `f`, `pl`, `fpl`) can fill `forms` for nouns and adjectives taught in earlier units.
- **Effort:** M.
- **Hook:** a "transformer" machine with a short sound and the picture multiplying; quick and tactile.

### 3.7 `tilde-detective`: accent rules (skill: `spelling`)
**Trains:** stressed syllable, aguda / llana / esdrújula, when a word takes a written accent; diacritic tilde at 3.
**Interaction:** a word is shown split into syllables. Step 1: tap the stressed syllable (hear the word). Step 2: name its type. Step 3: does it need a tilde, and where? One judged answer per word (all steps). It does not ask the child to memorise the rule text: the rule card stays on screen.

| Param | Type | Default | Notes |
|---|---|---|---|
| `items` | list of `{ es, syll[], stress }`, min 1 | required | `es` with its accent; `syll`: syllables written **without** the accent; `stress`: index of the stressed syllable. Authored, so no syllabifier is needed now |
| `steps` | `stress` \| `type` \| `full` | `stress` / `type` / `full` by difficulty | `type` adds step 2; `full` adds step 3 |
| `diacritic` | bool | `false`; `true` at 3 | Adds pairs in a sentence (*Tú tienes tu libro.*) |
| `ruleCard` | bool | `true` | Shows the three rules as a small card |

```json
{ "items": [ { "es": "canción", "syll": ["can", "cion"], "stress": 1 },
             { "es": "lápiz", "syll": ["la", "piz"], "stress": 0 },
             { "es": "murciélago", "syll": ["mur", "cie", "la", "go"], "stress": 1 },
             { "es": "mesa", "syll": ["me", "sa"], "stress": 0 } ] }
```
- **Audio:** the whole word, normal then slow (`rate`). Speech synthesis cannot reliably say single syllables with stress, so only whole words are spoken.
- **Difficulty:** 1 = stress only, 2–3 syllables. 2 = stress + type, 3–4 syllables. 3 = full, includes words without accent, hiatus (*día*) and the diacritic pairs.
- **Engine fit:** composite per word (internal steps not judged separately; a wrong step is the submitted answer). `hint` level 1 speaks the word slowly and highlights the stress zone; level 2 shows the answer.
- **Reuses:** syllable tiles from `ui/tiles.js`; `ctx.say`. Later, a `core/syllables.js` shared with the `clap-syllables` idea (younger band), with tests.
- **Effort:** M.
- **Hook:** detective badges ("pista" stamps per rule); the accent "lands" on the syllable with a small animation. Matches the most frequent heritage-learner error (accents) and the 3rd-cycle goal of generalising accent rules.

### 3.8 `question-maker`: what was the question? (skill: `grammar`)
**Trains:** question words with accent, ¿ ?, person change (*vivo → vives*), *por qué / porque*.
**Interaction:** an answer appears with one part highlighted ("Vivo en **una casa azul**."). The child builds the question that asks for that part, from tiles (¿, Dónde, vives, ?) or by choosing one of three. A reporter mascot "asks" it aloud.

| Param | Type | Default | Notes |
|---|---|---|---|
| `items` | list of `{ answer, focus, question, accept?, emoji? }`, min 1 | required | `focus`: the exact substring to highlight; `question`: the target; `accept`: other correct questions (same tiles) |
| `build` | `choice` \| `tiles` \| `type` | `choice` / `tiles` / `type` by difficulty | Choice: 3 questions differing in question word or accent |
| `decoys` | int 0–3 | 0 / 2 / 3 | Look-alike tiles: *donde / dónde*, *porque / por qué*, *vivo / vives* |
| `n` | int ≥ 1 | all | Items to play |

```json
{ "items": [ { "answer": "Vivo en una casa azul.", "focus": "en una casa azul", "question": "¿Dónde vives?", "emoji": "🏠" },
             { "answer": "Llego tarde porque perdí el autobús.", "focus": "porque perdí el autobús", "question": "¿Por qué llegas tarde?", "emoji": "🚌" } ] }
```
- **Audio:** reads the answer, then the built question (question intonation comes from the `?`).
- **Difficulty:** 1 = choose from 3 (7–8 can play this). 2 = tiles with accent decoys. 3 = typed, with person and tense change.
- **Engine fit:** one round per item, as in `order-words`.
- **Reuses:** the tokeniser, tile board and decoy logic of `order-words` (move the tokeniser to `core/` if both need it, per the "second user" rule).
- **Effort:** S–M.
- **Hook:** role reversal and a reporter frame ("Eres periodista"); short rounds, fits every band.

### Looked at, not proposed
- **`dictado`** and **`story-gaps`** are already ideas in ARCHETYPES.md and suit 9–12 well as they are; for 11–12, give `dictado` two-sentence items and `story-gaps` agreement on every slot.
- **Untimed word chain** (each word starts with the last letter of the previous one): fun, but weak on spelling rules and hard to keep to taught words.
- **Categorising** is the existing `sort-into-bins` idea; for 11–12 its bins could be aguda/llana/esdrújula or ser/estar, which `tilde-detective` and `fill-gap-choice` already cover.

---

## 4. Ranking and the first three

| Rank | id | Edu (10–12) | Fun (10–12) | Effort | Reuse | Bands |
|---|---|---|---|---|---|---|
| 1 | `question-maker` | 4 | 3 | S–M | high (`order-words`) | 7–12 |
| 2 | `paragraph-editor` | 5 | 4 | S–M | high (`fix-the-mistake`, `core/spelling.js`) | 9–12 |
| 3 | `clue-detective` | 4 | 5 | M | medium | 7–12 |
| 4 | `story-path` | 4 | 5 | M (+ heavy authoring) | medium (`read-answer`) | 9–12 |
| 5 | `tilde-detective` | 5 | 3 | M | low | 10–12 |
| 6 | `transform-it` | 4 | 4 | M | medium (vocab `forms`) | 9–12 |
| 7 | `verb-forge` | 4 | 3 | M | medium | 9–12 |
| 8 | `clause-builder` | 4 | 4 | L | low | 11–12 |

**Build first:**
1. **`paragraph-editor`.** It hits the two biggest needs at once: accents (the most frequent heritage-learner error) and the 3rd-cycle goal of self-correction. Most of the code already exists in `fix-the-mistake` and `core/spelling.js`, and parents can author a paragraph in minutes.
2. **`clue-detective`.** It has the strongest pull for 10–12: deduction, a case per round, and longer reading that does not feel like a test. The same archetype scales from one-feature clues (7–8) to relative clauses (11–12). It also unblocks the planned clue game for `a1-u1-s7`.
3. **`question-maker`.** It is the cheapest (built on `order-words`), trains accents on question words and person agreement, and works in every band. It gives the current A1 units a new game straight away.

Next: `story-path` once there is time to write good stories (it is the best long-text game but its cost is content), then `tilde-detective` for a dedicated 11–12 accent unit.

---

## 5. Questions for the owner
1. **Store a band per profile?** PLAN §2 says no age is stored. A band ("9-10") is less specific than an age but still says something about the child. *Recommended: yes, optional, set by the parent behind the gate, never shown on badges or reports.*
2. **Home screen with bands:** show all units and highlight the profile's band, or show only that band and below? *Recommended: show all, sort by band, keep the "in order" unlocking within a band.*
3. **`paragraph-editor` as its own archetype or as a mode of `fix-the-mistake`?** *Recommended: its own folder, sharing `core/spelling.js`, so `fix-the-mistake` stays simple.*
4. **New error kinds:** `fix-the-mistake` today only spoils spelling. May the older-band games show agreement and verb errors on screen (e.g. *las piedras eran resbaladizos*)? GAMES.md Q1 accepted spelling errors with the correct form always shown last. *Recommended: yes, same rule.*
5. **Past tense in 11–12 units:** the book series is A1; the ALCE A2 stage brings past events. Should A2 units follow a second book, or our own topic list based on the ALCE A2 themes in §1.1? *Recommended: our own list, checked by the owner.*
6. **Widen param limits** in built archetypes (`read-answer` to 8 sentences and 5 questions; `order-words` to 14 tiles) for older children, as one small task? *Recommended: yes.*
7. **Interface tone for 11–12:** a "modo mayor" (less mascot chatter, smaller pictures, no stickers popping mid-leg)? It is a judgement call, not evidence-based. *Recommended: try it as a profile setting after the first older-band unit exists.*
8. **Who writes the stories and cases?** `story-path` and `clue-detective` need 3–6 good texts per unit. *Recommended: Claude drafts, the owner reviews every text (PLAN §8 "Spanish review").*

---

## Sources
- BOE, Real Decreto 157/2022, enseñanzas mínimas de Educación Primaria (Lengua Castellana y Literatura, saberes básicos by cycle): https://www.boe.es/boe/dias/2022/03/02/pdfs/BOE-A-2022-3296.pdf
- Ministerio de Educación, Concreción curricular ALCE Australia, revisión 2019 (levels A1–C1, stage A = A1, A2.1, A2.2; contents and errors by level): https://educacionfpydeportes.gob.es/australia/dam/jcr:b39e9b1c-43f9-4311-9b26-38c2692b7ae0/concrecio-n-curricular-alce-australia-revisio-n-2019.pdf
- BOE, Orden EDU/3122/2010, ALCE (found, not read: fetch failed): https://www.boe.es/boe/dias/2010/12/03/pdfs/BOE-A-2010-18555.pdf
- Council of Europe, Collated representative samples of descriptors for young learners, volume 1, ages 7–10 (2018): https://rm.coe.int/16808b1688
- Council of Europe, same, volume 2, ages 11–15 (2018): https://rm.coe.int/16808b1689
- Llombart-Huesca & Zyzik (2019), Linguistic factors and the spelling ability of Spanish heritage language learners, Frontiers in Education (reviews Beaudrie 2012 and child studies; its own participants are adults): https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00150/full
- Betts, McKay, Maruff & Anderson (2006), The development of sustained attention in children: the effect of age and task load, Child Neuropsychology (summary page): https://www.cogstate.com/publication/the-development-of-sustained-attention-in-children-the-effect-of-age-and-task-load/
- Second language gains through digital game-based language learning: a meta-analysis, Language Learning & Technology (abstract): https://scholarspace.manoa.hawaii.edu/handle/10125/73464
- Chen, Tseng & Hsiao (2018), The effectiveness of digital game-based vocabulary learning: a framework-based view of meta-analysis, BJET (abstract): https://docs.opendeved.net/lib/24BG25I9
- Nielsen Norman Group, Kids' cognition: https://www.nngroup.com/articles/kids-cognition/
- Earlier notes in this folder: [GAMES.md](GAMES.md) (design rules, 18 candidates), [ENGAGEMENT.md](ENGAGEMENT.md) (spacing, rewards, session shape).
