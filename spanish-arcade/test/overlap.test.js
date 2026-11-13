// Overlap check (task 045): 8-word runs between repo text and a private source, tested with invented text only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { words, findOverlaps } from '../scripts/check-overlap.mjs';

const source = 'La tortuga azul camina despacio por el camino de piedra hasta llegar al río. Mañana vuelve otra vez.';

test('words normalises case and punctuation, optionally accents', () => {
  assert.deepEqual(words('¡Hola, Mamá!'), ['hola', 'mamá']);
  assert.deepEqual(words('¡Hola, Mamá! Año', { accents: false }), ['hola', 'mama', 'ano']);
});

test('finds a shared 8-word run and reports only the repo-side snippet', () => {
  const files = [
    { file: 'a.json', text: 'Dice que la tortuga azul camina despacio por el camino y se va' },
    { file: 'b.json', text: 'El perro grande salta sobre la valla roja del jardín vecino' },
  ];
  const res = findOverlaps(source, files);
  assert.equal(res.length, 1);
  assert.equal(res[0].file, 'a.json');
  assert.equal(res[0].windows, 1);
  assert.equal(res[0].runs[0].words, 8);
});

test('seven shared words are not enough; longer runs merge into one run', () => {
  assert.equal(findOverlaps(source, [{ file: 'a', text: 'la tortuga azul camina despacio por el cielo' }]).length, 0);
  const res = findOverlaps(source, [{ file: 'a', text: 'la tortuga azul camina despacio por el camino de piedra hasta llegar' }]);
  assert.equal(res[0].windows, 5);
  assert.equal(res[0].runs.length, 1);
  assert.equal(res[0].runs[0].words, 12);
});

test('line breaks and punctuation in the source do not hide a match', () => {
  const wrapped = 'la tortuga azul\ncamina despacio,\npor el camino de piedra';
  assert.equal(findOverlaps(wrapped, [{ file: 'a', text: 'La tortuga azul camina despacio por el camino.' }]).length, 1);
});

test('accent-insensitive option matches missing tildes; strict does not', () => {
  const files = [{ file: 'a', text: 'manana vuelve otra vez y la tortuga azul camina despacio' }];
  const src = 'Mañana vuelve otra vez y la tortuga azul';
  assert.equal(findOverlaps(src, files).length, 0);
  assert.equal(findOverlaps(src, files, { accents: false }).length, 1);
});

test('--min style window size is honoured', () => {
  assert.equal(findOverlaps(source, [{ file: 'a', text: 'la tortuga azul camina despacio por' }], { n: 6 }).length, 1);
});
