// Pop board drawing: one div per bubble, moved with CSS transforms so gravity animates itself.
// createScene(stage, board, { onTap(bubble) }) -> { layout(initial), mark(list), shake(list), pop(a, b) -> Promise, destroy() }
// Purely visual: positions (c, r) come from logic.js.

import { bubbles } from './logic.js';

const BAR = 56; // room for the level name bar at the top of the stage

export function createScene(stage, board, { onTap }) {
  const frame = document.createElement('div');
  frame.className = 'pop-board';
  stage.appendChild(frame);
  const cols0 = board.stacks.length, rows0 = board.stacks[0].length;
  const els = new Map(); // bubble id -> { slot, ball }
  let cell = 48, lw = 0, lh = 0;

  for (const b of bubbles(board)) {
    const slot = document.createElement('div'); slot.className = 'pop-slot';
    const ball = document.createElement('div'); ball.className = 'pop-ball'; ball.textContent = b.n;
    const hue = b.n * 30;
    ball.style.background = `radial-gradient(circle at 30% 28%, hsl(${hue} 90% 78%), hsl(${hue} 70% 52%) 62%, hsl(${hue} 70% 40%))`;
    slot.appendChild(ball); frame.appendChild(slot);
    slot.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(b); });
    els.set(b.id, { slot, ball });
  }

  function size() {
    const W = stage.clientWidth, H = stage.clientHeight;
    lw = W; lh = H;
    cell = Math.max(24, Math.floor(Math.min((W - 16) / cols0, (H - BAR - 8) / rows0, 76)));
    frame.style.width = cell * cols0 + 'px';
    frame.style.height = cell * rows0 + 'px';
    frame.style.left = (W - cell * cols0) / 2 + 'px';
    frame.style.top = BAR + (H - BAR - 8 - cell * rows0) / 2 + 'px';
  }

  /** Move every bubble to its place. initial: drop in from above, column by column. */
  function layout(initial = false) {
    const offset = ((cols0 - board.stacks.length) * cell) / 2; // keep what is left centred
    for (const b of bubbles(board)) {
      const { slot, ball } = els.get(b.id);
      const d = cell * b.size;
      ball.style.width = ball.style.height = d + 'px';
      ball.style.fontSize = Math.round(d * 0.48) + 'px';
      slot.style.width = slot.style.height = cell + 'px';
      const x = offset + b.c * cell, y = (rows0 - 1 - b.r) * cell;
      if (initial) {
        slot.style.transition = 'none';
        slot.style.transform = `translate(${x}px, ${-(rows0 + 1) * cell}px)`;
        void slot.offsetWidth;
        slot.style.transition = '';
        slot.style.transitionDelay = b.c * 40 + b.r * 50 + 'ms';
      } else {
        slot.style.transitionDelay = '0ms';
      }
      requestAnimationFrame(() => { slot.style.transform = `translate(${x}px, ${y}px)`; });
    }
  }

  const ro = new ResizeObserver(() => {
    if (stage.clientWidth === lw && stage.clientHeight === lh) return; // first call and no-ops
    size(); layout(false);
  });
  ro.observe(stage);
  size();
  layout(true);

  return {
    layout,
    mark(list) { for (const [id, { ball }] of els) ball.classList.toggle('sel', list.some((b) => b.id === id)); },
    shake(list) {
      for (const b of list) {
        const { ball } = els.get(b.id);
        ball.classList.remove('wrong'); void ball.offsetWidth; ball.classList.add('wrong');
      }
    },
    pop(a, b) {
      for (const x of [a, b]) { const { ball } = els.get(x.id); ball.classList.remove('sel'); ball.classList.add('pop'); }
      return new Promise((resolve) => setTimeout(() => {
        for (const x of [a, b]) { els.get(x.id).slot.remove(); els.delete(x.id); }
        resolve();
      }, 230));
    },
    destroy() { ro.disconnect(); frame.remove(); },
  };
}
