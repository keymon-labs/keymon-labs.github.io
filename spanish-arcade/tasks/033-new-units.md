---
id: "033"
title: New units: a1-u1-s3, a1-u1-s5, a1-u1-s7
model: Haiku 5.5 (drafts), Sonnet 5.5 (wire and validate)
why_model: Content authoring against a validator; the owner reviews the Spanish.
status: review
depends_on: ["027", "028", "029", "031"]
touches: [spanish-arcade/units/**, spanish-arcade/data/vocab/**, spanish-arcade/docs/UNITS.md, spanish-arcade/scripts/check-units.mjs, spanish-arcade/test/**]
---
## Prompt
Author three units from the sketches in `docs/UNITS.md` and `docs/book/u1.md` using the new archetypes (order-words for sentences and ¿ ¡, fix-the-mistake, letter-lock for words) plus existing ones, following `docs/AUTHORING.md`: s3 days and ñ, s5 family and ser/estar/tener with punctuation, s7 personal data and descriptions. Original sentences only. Make the validator accept difficulty 3 and the new archetype params. Mix rule: 5-6 exercises, >=3 archetypes, one spelling, one listening, difficulty non-decreasing.

Context: the research behind this round is in `spanish-arcade/docs/research/` (GAMES, ENGAGEMENT, UI-ADVICE, VISUALS, QUESTIONS). Everything is public: no personal data.

## Acceptance
- `npm run check:units` and `npm test` green; ends in `review` for the owner to check the Spanish.

## Notes

Ruling: validator unchanged. Unit 1 is capped at difficulty 1-2 by the existing rule (tested, AUTHORING §3), and the new archetypes' params already validate, so all three units use 1,1,1,2,2,2 (s5, s7 too).
Ruling: new archetypes used: order-words (all three), fix-the-mistake (all three), letter-lock (all three). Words in listening/letter-lock/spelling come from the new vocab files (days, ñ words, pets, passport words, jobs). Names Nora, Lola, Pipa are invented.
For the owner: please check the Spanish below. Word lists are in data/vocab/a1-u1-s3|s5|s7.json.

| unit | exercise | sentence (answer) |
|---|---|---|
| a1-u1-s3 | title and intro | Los días y la ñ / ¡Hoy aprendemos los días de la semana y la letra ñ! |
| a1-u1-s3 | articles-gaps | El sábado vemos ___ película en casa. (una) |
| a1-u1-s3 | articles-gaps | En mi mochila hay ___ cuaderno azul. (un) |
| a1-u1-s3 | articles-gaps | En la cabaña hay ___ arañas. (unas) |
| a1-u1-s3 | articles-gaps | Veo ___ montaña muy alta. (una) |
| a1-u1-s3 | articles-gaps | Tengo ___ lápices nuevos. (unos) |
| a1-u1-s3 | articles-gaps | Mi vecino tiene ___ gatos negros. (unos) |
| a1-u1-s3 | enye-fix | En otoño hace mucho viento. (wrong: otono) |
| a1-u1-s3 | enye-fix | Mañana es domingo. (wrong: Manana) |
| a1-u1-s3 | enye-fix | La araña vive en la cabaña. (wrong: arana) |
| a1-u1-s3 | enye-fix | El lunes voy a la montaña. (wrong: montana) |
| a1-u1-s3 | enye-fix | El miércoles tengo sueño. (wrong: miercoles) |
| a1-u1-s3 | days-order | Hoy es lunes y mañana es martes. |
| a1-u1-s3 | days-order | El sábado vamos a la montaña. |
| a1-u1-s3 | days-order | En otoño tengo mucho sueño. |
| a1-u1-s3 | days-order | Nora come piña el domingo. |
| a1-u1-s3 | days-order | ¿Qué día es hoy? |
| a1-u1-s3 | days-order | El viernes juego con mi primo. |
| a1-u1-s5 | title/intro | Mi familia / ¡Vamos a hablar de la familia y de las mascotas! |
| a1-u1-s5 | verbs-gaps | Mi abuela ___ muy simpática. (es) |
| a1-u1-s5 | verbs-gaps | Hoy mi hermano ___ cansado. (está) |
| a1-u1-s5 | verbs-gaps | Mis primos ___ un perro negro. (tienen) |
| a1-u1-s5 | verbs-gaps | Yo ___ contento porque es sábado. (estoy) |
| a1-u1-s5 | verbs-gaps | ¿Cuántos años ___ tu tío? (tiene) |
| a1-u1-s5 | verbs-gaps | Mamá y papá ___ en la cocina. (están) |
| a1-u1-s5 | family-fix | Mi hermana tiene un hámster. (wrong: hamster) |
| a1-u1-s5 | family-fix | Mi abuelo es muy simpático. (wrong: simpatico) |
| a1-u1-s5 | family-fix | Hoy mi hermano está contento. (wrong: ermano) |
| a1-u1-s5 | family-fix | Mi tía tiene un perro. (wrong: pero) |
| a1-u1-s5 | punct-order | ¿Cómo se llama tu perro? |
| a1-u1-s5 | punct-order | ¡Qué contenta está mi abuela! |
| a1-u1-s5 | punct-order | ¿Tienes una hermana pequeña? |
| a1-u1-s5 | punct-order | Mi tío tiene un loro verde. |
| a1-u1-s5 | punct-order | ¡Qué grande es mi familia! |
| a1-u1-s5 | punct-order | ¿Dónde está el conejo? |
| a1-u1-s5 | family-read | Lola tiene una familia muy grande. En su casa viven sus padres, su abuela y dos hermanos. Tienen un gato blanco que se llama Copo y una tortuga muy lenta. Hoy Lola está contenta: es sábado y va al parque con su abuela. |
| a1-u1-s5 | family-read | ¿Cuántos hermanos tiene Lola? (dos) |
| a1-u1-s5 | family-read | ¿Cuántos animales hay en la casa de Lola? (dos) |
| a1-u1-s5 | family-read | ¿Con quién va Lola al parque? (con su abuela) |
| a1-u1-s7 | title/intro | Mi pasaporte / ¡Rellena tu pasaporte y descubre a los personajes! |
| a1-u1-s7 | questions-match | ¿Cómo te llamas? = Me llamo Nora. |
| a1-u1-s7 | questions-match | ¿Cuántos años tienes? = Tengo ocho años. |
| a1-u1-s7 | questions-match | ¿De dónde eres? = Soy de Chile. |
| a1-u1-s7 | questions-match | ¿Qué idiomas hablas? = Hablo español e inglés. |
| a1-u1-s7 | questions-match | ¿Cuándo es tu cumpleaños? = Es en mayo. |
| a1-u1-s7 | passport-fix | Mi apellido es muy largo. (wrong: apelido) |
| a1-u1-s7 | passport-fix | Mi cumpleaños es en mayo. (wrong: cumpleanos) |
| a1-u1-s7 | passport-fix | Hablo inglés y francés. (wrong: ingles) |
| a1-u1-s7 | passport-fix | ¿De qué país eres? (wrong: pais) |
| a1-u1-s7 | passport-fix | Mi hermana habla alemán. (wrong: aleman) |
| a1-u1-s7 | passport-order | ¿Cuál es tu apellido? |
| a1-u1-s7 | passport-order | Mi cumpleaños es en mayo. |
| a1-u1-s7 | passport-order | ¡Qué bien hablas inglés! |
| a1-u1-s7 | passport-order | Soy cocinero y hablo italiano. |
| a1-u1-s7 | passport-order | ¿Cuántos años tienes? |
| a1-u1-s7 | passport-order | Mi tía habla tres idiomas. |
| a1-u1-s7 | who-read | Pipa es alta y tiene el pelo rojo. Lleva una camiseta verde y unas gafas redondas. Habla español e inglés y quiere aprender francés. Es pintora y le gusta dibujar montañas. |
| a1-u1-s7 | who-read | ¿Qué idioma quiere aprender Pipa? (francés) |
| a1-u1-s7 | who-read | ¿Cuántos idiomas habla ya Pipa? (dos) |
| a1-u1-s7 | who-read | ¿Qué hace Pipa con su trabajo? (pinta cuadros) |
