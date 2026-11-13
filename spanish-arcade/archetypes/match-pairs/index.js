// match-pairs: join the left items to the right items by tapping (tap one on each side); one submit for the whole board. Rules in logic.js, params in README.md.
import { make, judge, hint, wrongLefts } from './logic.js';

const COLOURS = ['#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4db6ac'];
const MARKS = ['A', 'B', 'C', 'D', 'E', 'F']; // a letter as well as a colour, so colour is never the only cue

export default {
  id: 'match-pairs',
  title: { es: 'Une las parejas', en: 'Match the pairs' },
  emoji: '🔗',
  help: { es: 'Toca una cosa de la izquierda y luego su pareja de la derecha.', en: 'Tap something on the left, then its partner on the right.' },
  skill: 'puzzle',
  paramsSchema: {
    from: { type: 'selector', optional: true },
    pairs: { type: 'array', min: 2, optional: true, items: { a: { type: 'string' }, b: { type: 'string' } } },
    mode: { type: 'enum', values: ['word-picture', 'article-noun'], default: 'word-picture' },
    size: { type: 'int', min: 2, max: 6, default: 3 },
  },
  defaults: (difficulty) => ({ size: Math.min(6, difficulty + 2) }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    const root = document.createElement('div');
    root.className = 'match-pairs';
    const status = document.createElement('p');
    status.className = 'status';
    status.setAttribute('aria-live', 'polite');
    const byId = Object.fromEntries(round.pairs.map((p) => [p.id, p]));
    const join = new Map(); // leftId -> rightId
    const locked = new Set(); // left ids revealed by a level-2 hint
    let picked = null; // selected left id
    let busy = false;
    const slot = new Map(); // leftId -> colour index (kept while joined)

    const btn = (side, id, text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.side = side;
      b.dataset.id = id;
      b.className = 'mp-btn';
      b.textContent = text;
      b.addEventListener('click', () => tap(side, id));
      return b;
    };
    const lefts = round.left.map((id) => btn('left', id, byId[id].a));
    const rights = round.right.map((id) => {
      const b = btn('right', id, byId[id].b);
      if (round.mode === 'word-picture') b.setAttribute('aria-label', byId[id].a); // the picture's Spanish word, for screen readers
      return b;
    });
    const col = (list) => { const d = document.createElement('div'); d.className = 'mp-col'; d.append(...list); return d; };
    const cols = document.createElement('div');
    cols.className = 'mp-cols';
    cols.append(col(lefts), col(rights));

    const mark = (b, i, lock) => { // joined items show a colour and the same letter on both sides
      b.querySelector('.mp-mark')?.remove();
      b.style.outline = '';
      if (i == null) return;
      const m = document.createElement('span');
      m.className = 'mp-mark';
      m.textContent = (lock ? '🔒' : '') + MARKS[i];
      m.style.cssText = `background:${COLOURS[i]};color:#000;border-radius:50%;min-width:1.6em;text-align:center;font-size:.9rem`;
      b.append(m);
    };
    const lockStyle = (b, on) => { // a locked pair stays fully readable: solid border, no greyed look
      b.style.opacity = on ? '1' : '';
      b.style.color = on ? 'inherit' : '';
      b.style.border = on ? '3px solid currentColor' : '';
    };
    function paint() {
      const rightOwner = new Map([...join].map(([l, r]) => [r, l]));
      for (const b of lefts) {
        const id = b.dataset.id;
        mark(b, join.has(id) ? slot.get(id) : null, locked.has(id));
        lockStyle(b, locked.has(id));
        b.style.outline = picked === id ? '4px solid currentColor' : '';
        b.setAttribute('aria-pressed', String(picked === id));
        b.disabled = locked.has(id) || busy;
      }
      for (const b of rights) {
        const owner = rightOwner.get(b.dataset.id);
        mark(b, owner ? slot.get(owner) : null, owner && locked.has(owner));
        lockStyle(b, owner && locked.has(owner));
        b.disabled = (owner && locked.has(owner)) || busy;
      }
    }
    const freeSlot = () => Math.max(0, COLOURS.findIndex((_, i) => ![...join.keys()].some((l) => slot.get(l) === i))); // boards have at most 6 pairs

    async function tap(side, id) {
      if (busy) return;
      if (side === 'left') {
        if (join.has(id)) join.delete(id); // tap a joined item again to unjoin it
        picked = picked === id ? null : id;
        return paint();
      }
      const owner = [...join].find(([, r]) => r === id)?.[0];
      if (owner) { join.delete(owner); picked = null; return paint(); }
      if (!picked) { status.textContent = 'Toca primero algo de la izquierda.'; return; }
      const l = picked;
      slot.set(l, freeSlot());
      join.set(l, id);
      picked = null;
      paint();
      status.textContent = `Unido: ${byId[l].a} + ${byId[id].b}`;
      if (join.size < round.pairs.length) return;
      busy = true;
      paint();
      const answer = [...join];
      const r = await ctx.submit(answer);
      busy = false;
      if (r.ignored) return paint();
      status.textContent = (r.correct ? '✅ ' : '❌ ') + (r.feedback.es);
      ctx.sfx(r.correct ? 'right' : 'wrong');
      if (r.correct) { busy = true; return paint(); }
      if (r.hint?.level === 1) {
        join.clear(); // a nudge only: how many were wrong, then start again
        status.textContent += ` (${r.hint.wrongCount} mal)`;
      } else {
        for (const x of wrongLefts(round, answer)) join.delete(x); // keep the right pairs
        if (r.hint?.pair) {
          const [pl, rt] = r.hint.pair;
          for (const [x, y] of [...join]) if (x === pl || y === rt) join.delete(x);
          slot.set(pl, freeSlot());
          join.set(pl, rt);
          locked.add(pl);
        }
      }
      paint();
      lefts.find((b) => !b.disabled)?.focus(); // keep focus on the board after a miss
    }

    root.append(cols, status);
    host.append(root);
    paint();
    return { destroy: () => root.remove() };
  },
};
