// letter-lock archetype: Wordle-like guessing of a picture's word; any letters allowed. Rules in logic.js, contract in ../README.md.
import { make, judge, hint, score, keyStates, SYMBOL, triesLine } from './logic.js';
import { injectStyles, el } from '../../ui/tiles.js';

const ROWS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const ACCENTS = 'áéíóúü';
const CSS = `
.ll-grid{display:grid;gap:4px;justify-content:center;margin:8px 0}
.ll-row{display:flex;gap:4px;justify-content:center}
.ll-cell{box-sizing:border-box;width:min(48px,calc((100vw - 32px - 4px * (var(--n) - 1)) / var(--n)));min-width:0;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid currentColor;border-radius:8px;font-size:1.3rem;font-weight:bold;line-height:1;text-transform:uppercase;perspective:200px}
.ll-cell small{font-size:.65rem;height:.7rem}
.ll-cell.cur{outline:3px solid currentColor}
.ll-cell.locked{opacity:.75;border-style:dashed}
.ll-cell.ok,.ll-key.ok{background:#2e7d32;color:#fff;border-color:#2e7d32}
.ll-cell.near,.ll-key.near{background:#f9a825;color:#000;border-color:#f9a825}
.ll-cell.tilde,.ll-key.tilde{background:#1565c0;color:#fff;border-color:#1565c0}
.ll-cell.no,.ll-key.no{background:#616161;color:#fff;border-color:#616161}
.ll-cell.flip{animation:ll-flip .3s ease both}
@keyframes ll-flip{from{transform:rotateX(90deg)}to{transform:none}}
body.reduced .ll-cell.flip,.ll-nomotion .ll-cell.flip{animation:none}
.ll-kb{display:flex;flex-direction:column;gap:6px;margin:10px 0}
.ll-kb .sp-row{margin:0;gap:4px;flex-wrap:nowrap}
.ll-key{flex:1 1 0;min-width:0;max-width:44px;padding:4px 0;text-transform:uppercase}
.ll-key.wide{max-width:none;flex:1.6 1 0}
.ll-tries{text-align:center;margin:0;font-size:.95rem}
`;

export default {
  id: 'letter-lock',
  title: { es: 'Descubre la palabra', en: 'Crack the word' },
  emoji: '🔐',
  help: {
    es: 'Escribe una palabra y toca Probar. ✔ verde: letra bien. ↔ naranja: está en otro sitio. ´ azul: falta la tilde. · gris: no está.',
    en: 'Type a word and tap Probar. ✔ green: right spot. ↔ orange: elsewhere. ´ blue: wrong accent. · grey: not in the word.',
  },
  skill: 'spelling',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    tries: { type: 'int', min: 4, max: 8, default: 6 },
    clue: { type: 'enum', values: ['picture', 'audio', 'both'], default: 'both' },
    firstLetter: { type: 'bool', default: false },
  },
  defaults: (difficulty) => ({ tries: difficulty >= 3 ? 5 : 6, firstLetter: difficulty === 1 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    if (!document.getElementById('ll-styles')) {
      const s = el('style');
      s.id = 'll-styles';
      s.textContent = CSS;
      document.head.append(s);
    }
    const len = [...round.answer].length;
    const pictureOnly = round.clue === 'picture' || !ctx.canSpeak;
    const showPicture = round.clue !== 'audio' || !ctx.canSpeak;
    let budget = round.tries; // tries in the current grid
    let rows = []; // submitted guesses in the current grid
    let past = []; // every guess of this round, for the keyboard colours
    let current = []; // letters of the row being typed
    let locked = new Map(); // index -> letter pre-filled and fixed in every new row
    let busy = false;
    if (round.firstLetter) locked.set(0, [...round.answer][0]);

    const root = el('div', 'sp-root');
    const prompt = el('p', 'sp-prompt', showPicture ? round.emoji || round.prompt.es || '' : '🔊');
    const say = el('button', 'sp-key', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.answer));
    say.hidden = !ctx.canSpeak || pictureOnly;
    const reveal = el('p', 'sp-reveal');
    const grid = el('div', 'll-grid');
    grid.style.setProperty('--n', len);
    const tries = el('p', 'll-tries');
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    const keys = new Map();
    const kb = el('div', 'll-kb');
    const addKey = (parent, text, fn, label, cls = '') => {
      const b = el('button', `sp-key ll-key ${cls}`, text);
      b.type = 'button';
      if (label) b.setAttribute('aria-label', label);
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.addEventListener('click', fn);
      parent.append(b);
      return b;
    };
    ROWS.forEach((r, ri) => {
      const row = el('div', 'sp-row');
      for (const c of r) keys.set(c, addKey(row, c, () => type(c)));
      if (ri === 2) addKey(row, '⌫', back, 'Borrar', 'wide');
      kb.append(row);
    });
    const accRow = el('div', 'sp-row');
    for (const c of ACCENTS) keys.set(c, addKey(accRow, c, () => type(c)));
    const go = addKey(accRow, 'Probar', submit, null, 'wide');
    kb.append(accRow);
    root.append(prompt, say, reveal, grid, tries, status, kb);
    host.append(root);

    const lockedLetters = () => [...Array(len)].map((_, i) => locked.get(i) ?? null);
    const freeIdx = () => lockedLetters().flatMap((l, i) => (l ? [] : [i]));
    const rowText = () => { const l = lockedLetters(); let k = 0; return l.map((x) => x ?? current[k++] ?? '').join(''); };
    const full = () => current.length === freeIdx().length;

    function cell(ch, cls, mark) {
      const c = el('div', `ll-cell ${cls}`);
      c.append(el('span', '', ch), el('small', '', mark ?? ''));
      return c;
    }
    function render(flipRow = -1) {
      const out = [];
      rows.forEach((g, r) => {
        const marks = score(g, round.answer);
        const row = el('div', 'll-row');
        [...g].forEach((ch, i) => {
          const c = cell(ch, marks[i], SYMBOL[marks[i]]);
          c.setAttribute('aria-label', `${ch}: ${{ ok: 'bien', near: 'en otro sitio', tilde: 'falta la tilde', no: 'no está' }[marks[i]]}`);
          if (r === flipRow && !ctx.reducedMotion) { c.classList.add('flip'); c.style.animationDelay = `${i * 0.12}s`; }
          row.append(c);
        });
        out.push(row);
      });
      if (rows.length < budget) {
        const row = el('div', 'll-row');
        const l = lockedLetters();
        let k = 0;
        let curSet = false;
        l.forEach((x) => {
          if (x) return row.append(cell(x, 'locked'));
          const ch = current[k++];
          const c = cell(ch ?? '', ch ? '' : (curSet ? '' : 'cur'));
          if (!ch && !curSet) curSet = true;
          row.append(c);
        });
        out.push(row);
      }
      for (let r = rows.length + 1; r < budget; r++) {
        const row = el('div', 'll-row');
        for (let i = 0; i < len; i++) row.append(cell('', ''));
        out.push(row);
      }
      grid.replaceChildren(...out);
      tries.textContent = `Intentos: ${Math.min(rows.length + 1, budget)}/${budget}`;
      const best = keyStates(past, round.answer);
      for (const [c, b] of keys) b.className = `sp-key ll-key ${b.classList.contains('wide') ? 'wide' : ''} ${best[c] ?? ''}`;
      go.disabled = busy || !full();
    }
    function type(c) { if (!busy && current.length < freeIdx().length) { current.push(c); render(); } }
    function back() { if (!busy && current.length) { current.pop(); render(); } }

    async function submit() {
      if (busy || !full()) return;
      const guess = rowText();
      rows.push(guess);
      past.push(guess);
      current = [];
      busy = true;
      render(rows.length - 1);
      const solved = score(guess, round.answer).every((m) => m === 'ok');
      if (!solved && rows.length < budget) { busy = false; status.textContent = ''; render(); return; } // internal guess: not judged
      const r = await ctx.submit(guess);
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (r.correct) {
        ctx.mascot('happy');
        status.textContent = `✔ ${triesLine(past.length, round.tries)}`;
        return render();
      }
      status.textContent = `✖ ${r.feedback.es}`;
      rows = []; // new grid, 2 more tries, hint applied
      budget = 2;
      if (r.hint?.level === 1) for (const f of r.hint.fixed) locked.set(f.index, f.ch);
      if (r.hint?.level === 2) reveal.textContent = r.hint.answer; // stays visible; the child types it once
      render();
    }

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input,textarea')) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button')) return;
      if (e.key === 'Enter') return submit();
      if (e.key === 'Backspace') return back();
      const c = e.key.length === 1 ? e.key.toLowerCase() : '';
      if (keys.has(c)) type(c);
    };
    document.addEventListener('keydown', onKey);
    render();
    return { destroy() { document.removeEventListener('keydown', onKey); root.remove(); } };
  },
};
