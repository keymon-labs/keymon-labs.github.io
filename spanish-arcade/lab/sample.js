// Invented sample vocab for the lab (same shape as data/vocab/*.json): 15 nouns, 3 tags, with emoji, articles and spelling tags.
const n = (id, es, en, emoji, tags, gender, extra = {}) => ({
  id: `ej-${id}`, es, en, emoji, tags, pos: 'noun', gender, number: 'sg', article: gender === 'm' ? 'el' : 'la', unit: 'lab-ejemplo', ...extra,
});

export const SAMPLE_WORDS = [
  n('perro', 'perro', 'dog', '🐶', ['animals'], 'm', { forms: { f: 'perra', pl: 'perros' }, spell: ['rr'] }),
  n('gato', 'gato', 'cat', '🐱', ['animals'], 'm', { forms: { f: 'gata', pl: 'gatos' } }),
  n('pez', 'pez', 'fish', '🐟', ['animals'], 'm', { forms: { pl: 'peces' } }),
  n('pajaro', 'pájaro', 'bird', '🐦', ['animals'], 'm', { forms: { pl: 'pájaros' }, spell: ['accent'] }),
  n('vaca', 'vaca', 'cow', '🐄', ['animals'], 'f', { forms: { pl: 'vacas' } }),
  n('manzana', 'manzana', 'apple', '🍎', ['food'], 'f', { forms: { pl: 'manzanas' } }),
  n('pera', 'pera', 'pear', '🍐', ['food'], 'f', { forms: { pl: 'peras' } }),
  n('pan', 'pan', 'bread', '🍞', ['food'], 'm'),
  n('queso', 'queso', 'cheese', '🧀', ['food'], 'm', { spell: ['qu'] }),
  n('pina', 'piña', 'pineapple', '🍍', ['food'], 'f', { spell: ['ñ'] }),
  n('casa', 'casa', 'house', '🏠', ['home'], 'f'),
  n('mesa', 'mesa', 'table', '🪑', ['home'], 'f'),
  n('cama', 'cama', 'bed', '🛏️', ['home'], 'f'),
  n('puerta', 'puerta', 'door', '🚪', ['home'], 'f'),
  n('reloj', 'reloj', 'clock', '⏰', ['home'], 'm', { spell: ['x'] }),
];
