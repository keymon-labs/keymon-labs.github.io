# Writing a Word Quest episode

An episode is **one JSON file**: `word-quest/episodes/<id>/episode.json`. No code. The child writes a sentence; the first **rule** whose words match picks an **outcome**; the outcome changes the **state** and plays **beats** (animations) on the **scene**. Sentences no rule covers go to Claude, which makes the hero do something silly but never finishes the mission.

Two ways to try one:
- **On a phone:** in the app, Help → *Make your own episode* → paste the JSON → *Try it*. It's checked on the spot and kept on that device.
- **For everyone:** add the folder to the repo, run `npm test` (it lists every problem with its path, e.g. `rules[2].outcome: no outcome "win"`), then push.

Start from a copy of [`episodes/frog/episode.json`](episodes/frog/episode.json). A tiny complete example is [`test/fixtures/door.json`](test/fixtures/door.json).

## Top level
| Key | What |
|---|---|
| `id` | Lowercase, numbers, dashes. Same as the folder name. |
| `languages` | `["en", "es"]`. Every text below needs one entry per language: `{"en": "…", "es": "…"}`. |
| `title`, `mission`, `intro` | Texts for the episode list and the box under the scene. |
| `target` | Words the child must use, per language: `{"en": ["throw", "through"], …}`. Shown to the child. |
| `bonus` | Optional word group needed for 3 stars (without it, 2 at most). |
| `hero` | The actor the child controls. Claude can only move this one. |
| `improvPoses` | Poses Claude may pick for the hero when it improvises. |
| `order` | Optional number to sort the episode list. |
| `scene`, `state`, `words`, `rules`, `between`, `outcomes`, `tutorial` | Below. |
| `poses`, `fx` | Optional extra poses and effects (same shape as [`library.json`](library.json)); they override the library. |

## Scene
The world is 1000 × 600; (0, 0) is the top left. `groundTop` is where the grass starts (470 is good).
```json
"scene": {
  "sky": ["#8fd8ff", "#e6f8ff"], "ground": "#6cc451", "groundTop": 470,
  "actors": {
    "kid":  {"art": "kid", "x": 120, "y": 250, "w": 150, "h": 240, "idle": "breathe", "shadow": true, "icon": "🧒"},
    "cake": {"emoji": "🎂", "x": 600, "y": 400, "w": 80, "h": 80}
  },
  "spots": { "cake": {"table": {"x": 600, "y": 400}, "gone": {"x": 600, "y": 400, "opacity": 0}} }
}
```
- **Actors** are drawn in the order listed (later ones in front). `art` names an SVG in [`art/`](art/) (or in `episodes/<id>/art/`); `emoji` works too. `idle` is a pose that loops; `shadow` adds a ground shadow; `icon` labels the actor's lines in the box.
- **Art available:** `kid` (stick figure with parts `torso, head, mouth, armL, foreL, armR, foreR, legL, shinL, legR, shinR`), `frog` (`mouth, legs`), `ball`, `hoop`, `sun` (`rays`), `cloud`, `hills`. New art: an SVG with `viewBox`; mark movable groups with `data-part="name"` and `style="transform-box:view-box;transform-origin:Xpx Ypx"` (the joint).
- **Spots** are named places an actor can move to (top-left corner, plus optional `opacity`).

## State
Named facts about the scene: `"state": {"cake": "table", "door": "locked"}`. When a key is also an actor with spots, its value is the spot where that actor stands, and the scene keeps them in step automatically.

## Words and rules
```json
"words": {
  "en": {"eat": ["eat", "eats", "ate"], "take": ["take", "pick up"]},
  "es": {"eat": ["come", "comer", "comela"], "take": ["coge", "toma"]}
},
"rules": [
  {"words": ["eat"], "without": ["take"], "when": {"cake": "!hand"}, "outcome": "no_cake"},
  {"words": ["eat"], "outcome": "yum"}
]
```
- A **word group** is a list of words or short phrases. Matching ignores capitals, punctuation and accents (write Spanish without accents: `comela`, `a traves`). List every form a child might write.
- Rules are tried **in order; the first that fits wins**. Put specific rules before general ones.
  - `words`: all these groups must appear. `without`: none of these may appear.
  - `when`: state conditions: `"cake": "hand"`, not: `"cake": "!hand"`, any of: `"cake": ["hand", "table"]`.
- `between`: checked before every sentence, to reset things: `{"when": {"frog": "away"}, "set": {"frog": "here"}, "beats": [...]}`.

## Outcomes
```json
"yum": {
  "say": {"en": "Yum!", "es": "¡Ñam!"},
  "text": {"en": "You ate the whole cake. Burp!", "es": "Te comiste la tarta entera. ¡Burp!"},
  "set": {"cake": "gone"},
  "beats": [{"pose": "eat"}, {"fx": "yum", "at": "kid"}],
  "win": true
}
```
- `text` goes in the box under the scene and is read aloud. Short and a bit funny.
- `say` is the hero's speech bubble (2–5 words); it's repeated in the box.
- `set` changes the state. `win: true` finishes the mission (one outcome needs it).
- `beats` are optional: actors whose spot changed walk there anyway.

## Beats
Played one after another; **a list inside the list plays at the same time**. Any beat can wait first with `"delay": ms`.
| Beat | Does |
|---|---|
| `{"move": "ball", "to": "hand", "dur": 500, "arc": 120, "spin": 360}` | Move an actor to a spot. `arc` = height of the jump in px, `spin` = degrees. |
| `{"pose": "throw"}` / `{"pose": "leap", "actor": "frog"}` | Play a pose (hero unless `actor`). |
| `{"say": {"en": "Nope!", "es": "¡No!"}, "actor": "frog"}` | Speech bubble, also shown in the box. |
| `{"fx": "boom", "at": "frog"}` | Emoji burst. |
| `{"sound": "boing"}` | Sound effect. |
| `{"shake": 400}` | Shake the screen. |
| `{"wait": 300}` | Pause. |

**Poses** (from [`library.json`](library.json)): for the kid: `hop, jump, cheer, wave, throw, shrug, dance, sing, eat, point, laugh, sad, nod, run`; for any actor: `breathe, bob, float, spin, wobble, pulse, squash, leap`; `croak` needs a `mouth`, `shine` needs `rays`.
**Fx:** `boom, sparkle, music, hearts, smoke, splash, confetti, yum, question`.
**Sounds:** `good, bad, pop, win, whoosh, boing, splat, croak, munch, giggle, sing`.

New pose: a list of tweens; each moves the whole actor or one `part` through steps:
```json
"poses": { "bow": {"tweens": [{"part": "torso", "rotate": [0, 40, 40, 0], "at": [0, .3, .7, 1], "dur": 1200}], "sound": "pop"} }
```
Tween keys: `rotate` (degrees), `x`, `y` (px), `scale` (number or `[x, y]`), all with the same number of steps; `at` (0–1 per step), `dur`, `delay`, `easing`, `loop`, `hold` (keep the last step), `origin` (for the whole body, e.g. `"50% 100%"`). On the kid, raising `armL` is positive degrees and raising `armR` negative.

## Tutorial
Optional steps shown in the box with a **Next** button, the first time the episode opens. A step with `demo` plays that sentence and the test checks it gives `expect`:
```json
"tutorial": [
  {"text": {"en": "Write one sentence, take a photo…", "es": "…"}},
  {"text": {"en": "Example: \"Eat the cake.\"", "es": "…"}, "demo": {"sentence": {"en": "Eat the cake.", "es": "Come la tarta."}, "expect": "no_cake"}}
]
```

## Checklist
- Every rule's `words` exist in every language; every text has every language.
- The winning sentence needs the target words; near misses get their own funny outcome.
- `npm test` passes (or *Try it* says it's added).
