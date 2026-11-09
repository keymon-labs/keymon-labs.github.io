// Pop mini game: a board of numbered bubbles. Touch two that are next to each other,
// type their product, and they pop. Clear the board to win. Same module shape as catapult/index.js.
// Rules in logic.js, drawing in scene.js. Test hook: window.__mathsArcade.

import levels from './levels.json' with { type: 'json' };
import { makeBoard, touching, isCorrect, removePair, remaining, hint } from './logic.js';
import { createScene } from './scene.js';
import { createRng } from '../../../shared/rng.js';
import { HINT_AFTER, REVEAL_AFTER, starsFor } from '../../core/session.js';
import { createKeypad } from '../../ui/keypad.js';
import { createPlayLayout } from '../../ui/play-layout.js';

export default {
  id: 'pop',
  title: 'Pop',
  emoji: '🫧',
  blurb: 'Multiply two bubbles that touch to pop them. Clear the board!',
  levels,
  mount,
};

function mount(host, level, { onFinish, onExit }) {
  const board = makeBoard(level, createRng());
  const totalPairs = remaining(board) / 2;
  const layout = createPlayLayout(host, { title: level.title, onExit });
  const scene = createScene(layout.stage, board, { onTap: tap });
  const keypad = createKeypad(layout.keypadHost, { onSubmit: submit, goLabel: 'Pop!' });
  let sel = [], misses = 0, firstTry = 0, busy = false, alive = true;

  function ask() {
    scene.mark(sel);
    keypad.clear();
    if (sel.length === 2) {
      layout.setQuestion({ title: 'Multiply', text: `${remaining(board)} bubbles left`, expr: `${sel[0].n} × ${sel[1].n} = ?` });
      keypad.setEnabled(true);
    } else {
      layout.setQuestion({ title: 'Pop', text: `${remaining(board)} bubbles left`, expr: sel.length ? 'Pick a bubble next to it' : 'Pick two bubbles that touch' });
      keypad.setEnabled(false);
    }
  }

  function tap(b) {
    if (busy) return;
    const i = sel.indexOf(b);
    if (i >= 0) sel.splice(i, 1);
    else if (sel.length === 1 && touching(sel[0], b)) sel.push(b);
    else sel = [b];
    misses = 0;
    layout.setFeedback('');
    ask();
  }

  async function submit(value) {
    if (busy || sel.length !== 2) return;
    const [a, b] = sel;
    if (!isCorrect(a, b, value)) {
      misses++;
      scene.shake(sel);
      const reveal = misses >= REVEAL_AFTER;
      layout.setFeedback(reveal ? `Not quite. The answer is ${a.n * b.n}. Type it in!` : misses >= HINT_AFTER ? `Not quite. ${hint(a, b)}` : 'Not quite, try again!', reveal || misses >= HINT_AFTER ? 'hint' : 'bad');
      keypad.clear();
      return;
    }
    busy = true;
    if (misses === 0) firstTry++;
    keypad.setEnabled(false);
    layout.setFeedback('Pop!', 'good');
    await scene.pop(a, b);
    if (!alive) return;
    removePair(board, a, b);
    sel = []; misses = 0; busy = false;
    scene.layout();
    ask();
    if (remaining(board) === 0) {
      const stars = starsFor(firstTry, totalPairs);
      onFinish({ stars, heading: stars === 3 ? 'Perfect!' : stars === 2 ? 'Great popping!' : 'All popped!' });
    }
  }

  window.__mathsArcade = {
    board,
    round: () => (sel.length === 2 ? { answer: sel[0].n * sel[1].n } : null),
    tap, fire: submit,
  };
  ask();
  return {
    destroy() { alive = false; delete window.__mathsArcade; keypad.destroy(); scene.destroy(); host.innerHTML = ''; },
  };
}
