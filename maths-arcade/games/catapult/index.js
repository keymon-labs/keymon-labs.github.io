// Catapult mini game. Every game module exports the same shape:
//   { id, title, emoji, blurb, levels, mount(host, level, { onFinish, onExit }) -> { destroy() } }
// onFinish({ stars }) is called once when the level is complete.

import levels from './levels.json' with { type: 'json' };
import { makeRound, judge } from './logic.js';
import { createScene } from './scene.js';
import { createRng } from '../../core/rng.js';
import { createSession } from '../../core/session.js';
import { createKeypad } from '../../ui/keypad.js';
import { createPlayLayout } from '../../ui/play-layout.js';

export default {
  id: 'catapult',
  title: 'Catapult',
  emoji: '🏰',
  blurb: 'Work out the sum to load the catapult and knock down the castle.',
  levels,
  mount,
};

function mount(host, level, { onFinish, onExit }) {
  const rng = createRng();
  const layout = createPlayLayout(host, { title: level.title, onExit });
  const scene = createScene(layout.stage);
  const session = createSession({ rounds: level.rounds, makeRound: () => makeRound(level, rng) });
  const keypad = createKeypad(layout.keypadHost, { onSubmit: fire, goLabel: 'Fire!' });
  let alive = true;

  function showRound() {
    const r = session.round;
    layout.setQuestion(r.prompt);
    layout.setFeedback('');
    layout.setRounds(session.index, session.total);
    scene.setRound(r);
    keypad.clear();
    keypad.setEnabled(true);
  }

  async function fire(value) {
    keypad.setEnabled(false);
    const r = session.round;
    const result = judge(r, value);
    layout.setFeedback(result.hit ? '' : '…');
    await scene.shoot(result);
    if (!alive) return;

    const { done } = session.submit(result.hit);
    if (result.hit) {
      layout.setFeedback(result.message, 'good');
      layout.setRounds(session.index, session.total);
      if (done) return onFinish({ stars: session.stars });
      setTimeout(() => alive && showRound(), 500);
      return;
    }
    let msg = result.message;
    if (session.revealAnswer) msg += ` The answer is ${r.answer}. Type it in!`;
    else if (session.showHint) msg += ` ${r.hint}`;
    layout.setFeedback(msg, session.showHint ? 'hint' : 'bad');
    keypad.clear();
    keypad.setEnabled(true);
  }

  // Test hook for headless play-throughs: read the answer, fire a number.
  window.__mathsArcade = { round: () => session.round, fire: (n) => fire(n) };
  showRound();
  return {
    destroy() { alive = false; delete window.__mathsArcade; keypad.destroy(); scene.destroy(); host.innerHTML = ''; },
  };
}
