// spell-tiles archetype: build the word from letter tiles (tap or drag, or type on a keyboard). Rules in logic.js, contract in ../README.md.
import { make, judge, hint } from './logic.js';
import { key } from '../../core/spelling.js';
import { injectStyles, el, tapOrDrag } from '../../ui/tiles.js';

export default {
  id: 'spell-tiles',
  title: { es: 'Forma la palabra', en: 'Build the word' },
  emoji: '🔤',
  help: {
    es: 'Toca las letras en orden, o arrástralas, para formar la palabra. Toca una letra de arriba para quitarla.',
    en: 'Tap the letters in order, or drag them, to build the word. Tap a placed letter to take it back.',
  },
  skill: 'spelling',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    extraLetters: { type: 'int', min: 0, max: 6, default: 0 },
    hintLetters: { type: 'bool', default: false },
    accents: { type: 'enum', values: ['strict', 'lenient'], default: 'strict' },
  },
  defaults: (difficulty) => ({ extraLetters: [0, 2, 4][difficulty - 1] ?? 4, hintLetters: difficulty === 1 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    const letters = [...round.answer.normalize('NFC').toLowerCase()];
    let placed = []; // tile ids, in answer order
    let locked = 0; // leading tiles that stay (hint)
    let busy = false;
    const root = el('div', 'sp-root');
    const prompt = el('p', 'sp-prompt', `${round.emoji || round.prompt.es || ''}`);
    const say = el('button', 'sp-key', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.answer));
    say.hidden = !ctx.canSpeak;
    const reveal = el('p', 'sp-reveal');
    const slots = el('div', 'sp-tiles slots');
    const tray = el('div', 'sp-tiles');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    root.append(prompt, say, reveal, slots, tray, check, status);
    host.append(root);

    const tileOf = (id) => round.tiles.find((t) => t.id === id);
    const lock = (n) => { // place the first n letters of the answer, taking matching unplaced tiles
      placed = [];
      for (const c of letters.slice(0, n)) placed.push(round.tiles.find((t) => t.ch === c && !placed.includes(t.id)).id);
      locked = n;
    };
    const tile = (t, onTap, onDrop, isLocked) => {
      const b = el('button', `sp-tile${isLocked ? ' locked' : ''}`, t.ch);
      b.type = 'button';
      b.disabled = isLocked;
      if (!isLocked) tapOrDrag(b, { onTap, onDrop, dropZone: () => slots });
      return b;
    };
    function render() {
      slots.replaceChildren(...placed.map((id, i) => tile(tileOf(id), () => { placed.splice(i, 1); render(); }, null, i < locked)));
      tray.replaceChildren(...round.tiles.filter((t) => !placed.includes(t.id))
        .map((t) => tile(t, () => { placed.push(t.id); render(); }, () => { placed.push(t.id); render(); })));
      slots.setAttribute('aria-label', placed.map((id) => tileOf(id).ch).join(' '));
      check.disabled = busy || placed.length === 0;
    }

    async function submit() {
      if (busy || !placed.length) return;
      busy = true;
      render();
      const r = await ctx.submit(placed.map((id) => tileOf(id).ch).join(''));
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (!r.correct && r.hint?.level === 1) lock(r.hint.keep);
      if (!r.correct && r.hint?.level === 2) {
        reveal.textContent = r.hint.answer; // stays visible; the child now builds it again
        placed = [];
        locked = 0;
      }
      render();
    }
    check.addEventListener('click', submit);

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input,textarea')) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button')) return; // the button handles its own press
      if (e.key === 'Enter') return submit();
      if (e.key === 'Backspace') { if (placed.length > locked) { placed.pop(); render(); } return; }
      const c = e.key.length === 1 ? e.key.toLowerCase() : '';
      const free = round.tiles.filter((t) => !placed.includes(t.id));
      const t = free.find((x) => x.ch === c) ?? (round.accents === 'lenient' ? free.find((x) => key(x.ch, 'lenient') === c) : null);
      if (t) { placed.push(t.id); render(); }
    };
    document.addEventListener('keydown', onKey);

    if (round.hintLetters) lock(1);
    render();
    return { destroy() { document.removeEventListener('keydown', onKey); root.remove(); } };
  },
};
