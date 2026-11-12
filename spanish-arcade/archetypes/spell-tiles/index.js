// spell-tiles archetype: build the word from letter tiles (tap or drag, or type on a keyboard). Rules in logic.js, contract in ../README.md.
import { make, judge, hint, wordOf, leadingTiles } from './logic.js';
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
    const n = [...round.answer].length;
    const fixed = ctx.difficulty <= 2; // difficulty 1-2 show one empty slot per letter; 3 shows only the letters placed
    const slotsIds = Array(n).fill(null); // tile id (or null = empty) per answer slot; removing a letter leaves a hole, never shifts
    let locked = 0; // leading slots that stay (hint)
    let busy = false;
    const root = el('div', 'sp-root');
    root.style.setProperty('--n', n); // landscape: tiles shrink so the slots stay on one row
    const prompt = el('p', 'sp-prompt', `${round.emoji || round.prompt.es || ''}`);
    const say = el('button', 'sp-key sp-say', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.answer));
    say.style.visibility = ctx.canSpeak ? '' : 'hidden'; // keeps its space so the layout does not change by device
    const reveal = el('p', 'sp-reveal');
    const slots = el('div', 'sp-tiles slots');
    slots.setAttribute('role', 'list');
    const tray = el('div', 'sp-tiles tray');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    const status = el('p', 'status');
    status.setAttribute('aria-live', 'polite');
    root.append(prompt, say, reveal, slots, tray, check, status);
    host.append(root);

    const filled = () => slotsIds.filter((id) => id !== null);
    // Tray tiles are built once, in a fixed order; a placed tile stays as a faded socket and comes back to the same spot.
    const trayBtns = new Map(round.tiles.map((t) => {
      const b = el('button', 'sp-tile', t.ch);
      b.type = 'button';
      const put = () => place(t.id);
      tapOrDrag(b, { onTap: put, onDrop: put, dropZone: () => slots });
      tray.append(b);
      return [t.id, b];
    }));
    const tileOf = (id) => round.tiles.find((t) => t.id === id);
    function place(id) {
      if (busy || slotsIds.includes(id)) return;
      const i = slotsIds.indexOf(null);
      if (i < 0) return;
      slotsIds[i] = id;
      render();
    }
    function take(i) {
      if (busy || i < locked || slotsIds[i] === null) return;
      slotsIds[i] = null;
      render();
    }
    const lock = (k) => { slotsIds.fill(null); leadingTiles(round, k).forEach((id, i) => { slotsIds[i] = id; }); locked = k; }; // the first k letters of the answer stay in place

    function render() {
      const shown = fixed ? n : Math.min(n, Math.max(locked, slotsIds.findLastIndex((x) => x !== null) + 1));
      slots.replaceChildren(...slotsIds.map((id, i) => {
        const b = el('button', `sp-tile slot${id === null ? ' empty' : ''}${i < locked ? ' locked' : ''}`, id === null ? '' : tileOf(id).ch);
        b.type = 'button';
        b.disabled = id === null || i < locked || busy;
        b.setAttribute('role', 'listitem');
        b.setAttribute('aria-label', id === null ? `Letra ${i + 1}: vacía` : `Letra ${i + 1}: ${tileOf(id).ch}`);
        if (i >= shown) b.style.visibility = 'hidden';
        b.addEventListener('click', () => take(i));
        return b;
      }));
      for (const [id, b] of trayBtns) {
        const used = slotsIds.includes(id);
        b.disabled = used || busy;
        b.classList.toggle('used', used);
        b.setAttribute('aria-label', used ? `${tileOf(id).ch}, puesta` : `${tileOf(id).ch}, toca para poner`);
      }
      check.disabled = busy || filled().length === 0;
      check.textContent = filled().length ? '✔ Comprobar' : 'Pon las letras';
    }

    async function submit() {
      if (busy || !filled().length) return;
      busy = true;
      render();
      const r = await ctx.submit(wordOf(round, filled()));
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (!r.correct && r.hint?.level === 1) lock(r.hint.keep);
      if (!r.correct && r.hint?.level === 2) {
        reveal.textContent = r.hint.answer; // stays visible; the child now builds it again
        slotsIds.fill(null);
        locked = 0;
      }
      render();
    }
    check.addEventListener('click', submit);

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input,textarea')) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button')) return; // the button handles its own press
      if (e.key === 'Enter') return submit();
      if (e.key === 'Backspace') { const i = slotsIds.findLastIndex((x) => x !== null); if (i >= locked) take(i); return; }
      const c = e.key.length === 1 ? e.key.toLowerCase() : '';
      const free = round.tiles.filter((t) => !slotsIds.includes(t.id));
      const t = free.find((x) => x.ch === c) ?? (round.accents === 'lenient' ? free.find((x) => key(x.ch, 'lenient') === c) : null);
      if (t) place(t.id);
    };
    document.addEventListener('keydown', onKey);

    if (round.hintLetters) lock(1);
    render();
    return { destroy() { document.removeEventListener('keydown', onKey); root.remove(); } };
  },
};
