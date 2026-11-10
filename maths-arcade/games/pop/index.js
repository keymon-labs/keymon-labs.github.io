// Pop mini game: numbered balls pile up in a funnel. Pick two that touch, type their product,
// and both pop. Clear the funnel to win. Same module shape as catapult/index.js.
// Shared funnel, scoring and selection: play.js. Test hook: window.__mathsArcade.

import levels from './levels.json' with { type: 'json' };
import { isCorrect, hint } from './logic.js';
import { touchingPairs } from './world.js';
import { createPlay } from './play.js';
import { HINT_AFTER, REVEAL_AFTER } from '../../core/session.js';
import { createKeypad } from '../../ui/keypad.js';

export default {
  id: 'pop',
  title: 'Pop',
  emoji: '🫧',
  blurb: 'Balls pile up in a funnel. Multiply two that touch to pop them!',
  levels,
  mount,
};

function mount(host, level, { onFinish, onExit }) {
  let misses = 0;
  const play = createPlay(host, level, { onExit, onFinish, onSelect, onReady: ask });
  const { layout } = play;
  const keypad = createKeypad(layout.keypadHost, { onSubmit: submit, goLabel: 'Pop!' });

  function ask() {
    const s = play.sel;
    keypad.clear();
    keypad.setEnabled(play.ready && s.length === 2);
    if (!play.ready) layout.setQuestion({ title: 'Pop', text: '', expr: 'Here they come…' });
    else if (s.length === 2) layout.setQuestion({ title: 'Multiply', text: `${play.left} balls left`, expr: `${s[0].n} × ${s[1].n} = ?` });
    else layout.setQuestion({ title: 'Pop', text: `${play.left} balls left`, expr: s.length ? 'Pick a ball touching it' : 'Pick two balls that touch' });
  }

  function onSelect() { misses = 0; layout.setFeedback(''); ask(); }

  function submit(value) {
    const [a, b] = play.sel;
    if (!b) return;
    if (!isCorrect(a, b, value)) {
      misses++;
      play.miss(play.sel);
      layout.setFeedback(
        misses >= REVEAL_AFTER ? `Not quite. The answer is ${a.n * b.n}. Type it in!` : misses >= HINT_AFTER ? `Not quite. ${hint(a, b)}` : 'Not quite, try again!',
        misses >= HINT_AFTER ? 'hint' : 'bad');
      keypad.clear();
      return;
    }
    const pts = play.hit(a, b, misses === 0);
    misses = 0;
    layout.setFeedback(`+${pts}`, 'good');
    ask();
    play.finishIfDone();
  }

  window.__mathsArcade = {
    world: play.world, ready: () => play.ready, pairs: () => touchingPairs(play.world),
    round: () => (play.sel.length === 2 ? { answer: play.sel[0].n * play.sel[1].n } : null),
    tap: play.tap, fire: submit,
  };
  ask();
  return {
    destroy() { delete window.__mathsArcade; keypad.destroy(); play.destroy(); },
  };
}
