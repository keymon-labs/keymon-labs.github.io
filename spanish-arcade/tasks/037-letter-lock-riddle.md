---
id: "037"
title: letter-lock v2: normal text field and riddle clues instead of grid, keyboard and emoji
model: Sonnet 5.5
why_model: Rework of one archetype plus its three units' data; contained.
status: review
depends_on: ["029", "033"]
touches: [spanish-arcade/archetypes/letter-lock/**, spanish-arcade/units/a1-u1-s3.json, spanish-arcade/units/a1-u1-s5.json, spanish-arcade/units/a1-u1-s7.json, spanish-arcade/data/vocab/**, spanish-arcade/lab/logic.js, spanish-arcade/test/letter-lock.test.js]
---
## Prompt
Owner (Spanish): the game with a big grid of empty cells and a whole on-screen keyboard is strange and hard to navigate; use a normal text field instead. And instead of an emoji, give a riddle with clues, for example "planta tropical grande, con escamas, corazón muy dulce" (piña), adding clues as the child tries: "empieza por P y lleva ñ".

Build: (1) a normal `<input type="text">` (device keyboard; autocapitalize/spellcheck/autocorrect off, lang es, enterkeyhint "go", Enter submits) plus a Comprobar button and the existing special-letters helper row (ñ á é í ó ú ü) that inserts into the field; no matrix, no custom keyboard. (2) Wordle-style feedback stays but as compact coloured letter chips for each previous guess (a short list), not an empty grid. (3) The prompt is a riddle: item `clues: [..]` (2-3 authored lines, written like a riddle, never naming the word) shown one at a time; each wrong try reveals the next clue; once authored clues run out, auto-generated hints follow: "Empieza por P", "Tiene N letras", "Lleva ñ" (or "Lleva tilde") when the word has one. The emoji is not shown as a clue; show it only after the round ends as a reward. The audio-only variant (hear the word, type it) stays. (4) Keep the scoring contract: no fail state that blocks the round; after the last hint the word is shown and the round continues; stars and hint rules as in the README. (5) Rewrite the clues for the letter-lock exercises of a1-u1-s3, s5, s7 (original riddles, generic, kind, no personal data) and the lab sample. Update the archetype README params table and tests (guess marking, clue ladder, accents/ñ). List every new Spanish riddle and string in the task Notes for the owner to check.

## Acceptance
- Playable at 390x844 and 844x390 with the phone keyboard open (no layout jump, field visible); `npm test`, `npm run check:units`, `npm run build` pass; screenshots saved for the gallery.

## Notes
Status review. Built: plain text field (autocapitalize/spellcheck/autocorrect off, enterkeyhint go, Enter submits) + Comprobar + special-letters row (ñ á é í ó ú ü ¿ ¡, inserts at caret); newest-first coloured letter chips; riddle clue ladder; emoji only as a reward after solving. `clue` param is now `riddle` | `audio` (default `riddle`; `both` and `picture` removed, since audio plus a riddle would speak the answer). Unit revs bumped to 2 (saved in-progress rounds have the old shape).

Rulings:
- Ruling: scoring contract kept as before: the `tries`-th wrong guess is the judged miss 1 (level-1 hint = word pattern like `L _ _ _`), 2 more guesses, then the next miss reveals the word and every further guess is judged. The authored/auto clue ladder ends before that on short words (5 lines max); extra wrong guesses just add chips.
- Ruling: `clues` live on the vocab word (2-4 lines, validator rejects a clue containing the word), and the lab sample words got clues too (15 words). Removed unused `keyStates`/`STATES`. `firstLetter` (d1) now shows "Empieza por X" as the second line from the start. Dropped `lang` on the input (spanish-only test forbids it; the page is already `lang=es`). Added one line to docs/AUTHORING.md.

Checks: npm test (387 pass), npm run check:units, npm run build ok. Headless Chromium 390x844, 844x390, 390x420 (keyboard-sized), light and dark, units s3/s5/s7: no page errors, no horizontal scroll, input visible. Screenshots: scratchpad gallery 037-riddle-*, 037-wrong-*, 037-solved-*, 037-ladder-revealed-390x844.png. Not checked: a real phone keyboard (only a keyboard-sized viewport), real Spanish voice for `clue: audio` (no unit uses it).

New Spanish strings for the owner to check:
UI: "Comprobar", "Tu respuesta" (aria), "Pistas" (aria), "Intentos" (aria), "Casi. Mira la pista nueva.", "Letras que ya sabes" (aria), help text "Lee la adivinanza, escribe la palabra y toca Comprobar. Si fallas, llega otra pista. ..."
Auto hints: "Empieza por P", "Tiene N letras", "Lleva ñ", "Lleva tilde", "Lleva ü".

| Word | Riddle lines |
|---|---|
| otoño | Llega después del verano. / Las hojas de los árboles se vuelven marrones y caen. / Es la estación de las castañas y los paraguas. |
| montaña | Es muy alta y su cima toca las nubes. / Se sube con botas y mochila. / Arriba, a veces, hay nieve. |
| piña | Fruta tropical, grande y con escamas por fuera. / Por dentro es amarilla y muy dulce. / Lleva una corona de hojas verdes. |
| araña | Tiene ocho patas. / Teje una red muy fina para atrapar insectos. / Vive en su tela, en un rincón. |
| cabaña | Casita de madera en medio del bosque. / Tiene chimenea y es un buen sitio para descansar. / Es pequeña y sencilla, como una casa de cuento. |
| sueño | Llega por la noche, cuando cierras los ojos. / A veces es una aventura que imaginas mientras duermes. / Si tienes mucho, bostezas. |
| gato | Es pequeño, suave y tiene bigotes. / Se lava con la lengua y duerme muchas horas. / Dice miau. |
| perro | Mueve la cola cuando está contento. / Es muy leal y le gusta pasear. / Dice guau. |
| conejo | Tiene las orejas largas y el pelo suave. / Salta y le encantan las zanahorias. / Vive en una madriguera. |
| tortuga | Lleva su casa en la espalda. / Camina muy despacio. / Tiene un caparazón duro. |
| loro | Tiene plumas de muchos colores. / Vuela y tiene el pico curvo. / Puede repetir lo que dices. |
| hámster | Es un roedor muy pequeño y redondito. / Corre sin parar en su rueda. / Guarda comida en las mejillas. |
| bombero | Trabaja con mangueras y mucha agua. / Conduce un camión rojo con sirena. / Ayuda cuando hay fuego. |
| cocinero | Trabaja con ollas y sartenes. / Lleva un gorro blanco y alto. / Prepara comidas ricas para otras personas. |
| médico | Lleva una bata blanca. / Escucha tu corazón con un estetoscopio. / Te ayuda cuando estás malito. |
| pintor | Usa pinceles y muchos colores. / Mezcla los colores en una paleta. / Hace cuadros para colgar en la pared. |
| cartero | Reparte cartas y paquetes de casa en casa. / Lleva una bolsa grande y a veces va en bici. / Llama a la puerta para traerte el correo. |
| perro (lab) | Mueve la cola cuando está contento. / Es muy leal y le gusta pasear. |
| gato (lab) | Es pequeño, suave y tiene bigotes. / Se lava con la lengua y duerme muchas horas. |
| pez (lab) | Vive en el agua y nunca se moja el pelo. / Nada con aletas y respira con branquias. |
| pájaro (lab) | Tiene plumas y dos alas. / Canta por la mañana desde las ramas. |
| vaca (lab) | Da la leche que bebemos. / Vive en el prado y dice muuu. |
| manzana (lab) | Fruta redonda, roja o verde. / Crece en un árbol y cruje al morderla. |
| pera (lab) | Fruta dulce con forma de campana. / Es jugosa y su piel es verde o amarilla. |
| pan (lab) | Se hornea y huele muy bien. / Se come con mantequilla o con queso. |
| queso (lab) | Se hace con leche y es amarillo o blanco. / A los ratones de los cuentos les encanta. |
| piña (lab) | Fruta tropical, grande y con escamas por fuera. / Por dentro es amarilla y muy dulce. |
| casa (lab) | Es el lugar donde vives con tu familia. / Tiene puerta, ventanas y tejado. |
| mesa (lab) | Tiene cuatro patas pero no camina. / Ahí se pone la comida para comer. |
| cama (lab) | Es muy blanda y se usa por la noche. / Tiene sábanas, manta y almohada. |
| puerta (lab) | Se abre y se cierra. / Hay que llamar antes de pasar por ella. |
| reloj (lab) | Tiene números y agujas que giran. / Te dice qué hora es. |
