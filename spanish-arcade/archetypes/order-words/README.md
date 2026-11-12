# order-words

Build a sentence from word tiles. Tap tiles in order or drag them onto the answer row; tap a placed tile to send it back. "Comprobar" is enabled once every real tile is placed. The prompt is the item's emoji (English glosses are never shown). A 🔊 button reads the sentence, only at difficulty 1 and when a Spanish voice exists (it gives the order away). One sentence is one round and one `submit` (a list of tile texts).

With `punctuation: true` the marks `¿ ¡ ? ! . ,` are tiles of their own (the punctuation variant of the old `punctuation-pick` idea). With `false` they stay glued to the word (`¿Cómo`, `estás?`).

| Param | Type | Default | Notes |
|---|---|---|---|
| `items` | array of `{ es, accept?, emoji?, en? }`, min 1 | required | `es` is the sentence; `accept` lists other correct orders (same tiles exactly). 2-9 tiles per sentence, counted after tokenising; `make` throws otherwise. |
| `n` | int ≥ 1 | all items | How many items to play (random pick, seeded). |
| `punctuation` | bool | false; true at difficulty 2+ | Marks as separate tiles. |
| `decoys` | int 0-3 | 0 / 1 / 2 by difficulty | Extra look-alike tiles: accent toggled (`está`/`esta`), capital flipped (first word, days, months: `lunes`/`Lunes`), `¿`/`¡` and `?`/`!`. Never equal to a real tile. |

Judge: exact match with `es` or an `accept` order (case and accents strict). Wrong-answer feedback: same tiles in another order, a tilde/capital decoy used, a mark decoy used, otherwise "read again".

Hints: first miss keeps the correct leading tiles in place (at least the first, never all); second miss shows the sentence and disables the decoys, and the child builds it again.

Example (invented sentences):
```json
{ "archetype": "order-words", "difficulty": 2, "prompt": { "es": "Ordena la frase.", "en": "Order the sentence." },
  "params": { "items": [
    { "es": "¿Dónde está el gato?", "emoji": "🐱" },
    { "es": "Hoy es lunes.", "accept": ["Hoy lunes es."], "emoji": "📅" },
    { "es": "¡Qué grande es la casa!", "emoji": "🏠" },
    { "es": "Mi perro come pan.", "emoji": "🐶" },
    { "es": "Ana y Luis están aquí.", "emoji": "👫" },
    { "es": "¿Tienes un lápiz azul?", "emoji": "✏️" }
  ], "n": 3 } }
```

Rules in `logic.js` (`tokens`, `make`, `judge`, `hint`, `tilesFor`); tests in `test/order-words.test.js`. UI helpers: `ui/tiles.js` (not edited here).
