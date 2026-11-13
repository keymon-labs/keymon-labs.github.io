// Invented sample vocab for the lab (same shape as courses/<course>/vocab/*.json): 15 nouns, 3 tags, with emoji, articles and spelling tags.
const n = (id, es, en, emoji, tags, gender, extra = {}) => ({
  id: `ej-${id}`, es, en, emoji, tags, pos: 'noun', gender, number: 'sg', article: gender === 'm' ? 'el' : 'la', unit: 'lab-ejemplo', ...extra,
});

export const SAMPLE_WORDS = [
  n('perro', 'perro', 'dog', '🐶', ['animals'], 'm', { forms: { f: 'perra', pl: 'perros' }, spell: ['rr'], clues: ["Mueve la cola cuando está contento.", "Es muy leal y le gusta pasear."] }),
  n('gato', 'gato', 'cat', '🐱', ['animals'], 'm', { forms: { f: 'gata', pl: 'gatos' }, clues: ["Es pequeño, suave y tiene bigotes.", "Se lava con la lengua y duerme muchas horas."] }),
  n('pez', 'pez', 'fish', '🐟', ['animals'], 'm', { forms: { pl: 'peces' }, clues: ["Vive en el agua y nunca se moja el pelo.", "Nada con aletas y respira con branquias."] }),
  n('pajaro', 'pájaro', 'bird', '🐦', ['animals'], 'm', { forms: { pl: 'pájaros' }, spell: ['accent'], clues: ["Tiene plumas y dos alas.", "Canta por la mañana desde las ramas."] }),
  n('vaca', 'vaca', 'cow', '🐄', ['animals'], 'f', { forms: { pl: 'vacas' }, clues: ["Da la leche que bebemos.", "Vive en el prado y dice muuu."] }),
  n('manzana', 'manzana', 'apple', '🍎', ['food'], 'f', { forms: { pl: 'manzanas' }, clues: ["Fruta redonda, roja o verde.", "Crece en un árbol y cruje al morderla."] }),
  n('pera', 'pera', 'pear', '🍐', ['food'], 'f', { forms: { pl: 'peras' }, clues: ["Fruta dulce con forma de campana.", "Es jugosa y su piel es verde o amarilla."] }),
  n('pan', 'pan', 'bread', '🍞', ['food'], 'm', { clues: ["Se hornea y huele muy bien.", "Se come con mantequilla o con queso."] }),
  n('queso', 'queso', 'cheese', '🧀', ['food'], 'm', { spell: ['qu'], clues: ["Se hace con leche y es amarillo o blanco.", "A los ratones de los cuentos les encanta."] }),
  n('pina', 'piña', 'pineapple', '🍍', ['food'], 'f', { spell: ['ñ'], clues: ["Fruta tropical, grande y con escamas por fuera.", "Por dentro es amarilla y muy dulce."] }),
  n('casa', 'casa', 'house', '🏠', ['home'], 'f', { clues: ["Es el lugar donde vives con tu familia.", "Tiene puerta, ventanas y tejado."] }),
  n('mesa', 'mesa', 'table', '🪑', ['home'], 'f', { clues: ["Tiene cuatro patas pero no camina.", "Ahí se pone la comida para comer."] }),
  n('cama', 'cama', 'bed', '🛏️', ['home'], 'f', { clues: ["Es muy blanda y se usa por la noche.", "Tiene sábanas, manta y almohada."] }),
  n('puerta', 'puerta', 'door', '🚪', ['home'], 'f', { clues: ["Se abre y se cierra.", "Hay que llamar antes de pasar por ella."] }),
  n('reloj', 'reloj', 'clock', '⏰', ['home'], 'm', { spell: ['x'], clues: ["Tiene números y agujas que giran.", "Te dice qué hora es."] }),
];
