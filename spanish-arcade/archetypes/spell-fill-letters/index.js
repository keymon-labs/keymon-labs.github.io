// spell-fill-letters archetype: fill the blanks of a word (pick a letter, or type with the special-letters row). Rules in logic.js, contract in ../README.md.
import { make, judge, hint, FOCUS_CHOICES } from './logic.js';
import { injectStyles, el, specialLettersRow } from '../../ui/tiles.js';

export default {
  id: 'spell-fill-letters',
  title: { es: 'Completa la palabra', en: 'Fill in the letters' },
  emoji: '✏️',
  help: {
    es: 'Faltan letras. Elige o escribe las que faltan y toca Comprobar. Cuidado con la ñ, la rr y las tildes.',
    en: 'Some letters are missing. Pick or type them, then tap Check. Watch out for ñ, rr and accent marks.',
  },
  skill: 'spelling',
  paramsSchema: {
    from: { type: 'selector', optional: true },
    items: { type: 'array', optional: true, items: { es: { type: 'string' }, en: { type: 'string', optional: true }, emoji: { type: 'string', optional: true } } },
    focus: { type: 'enum', values: FOCUS_CHOICES, default: 'auto' },
    mode: { type: 'enum', values: ['choice', 'type'], default: 'choice' },
    gaps: { type: 'int', min: 1, max: 4, default: 1 },
    plain: { type: 'bool', default: false },
    accents: { type: 'enum', values: ['strict', 'lenient'], default: 'strict' },
  },
  defaults: (difficulty) => ({ mode: difficulty >= 3 ? 'type' : 'choice', gaps: difficulty >= 3 ? 2 : 1 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    const typing = round.mode === 'type';
    const gapCells = round.cells.filter((c) => c.gap);
    const values = gapCells.map(() => null); // choice mode: picked option ('' = no letter) or null
    const off = gapCells.map(() => new Set()); // options greyed by a hint
    let active = 0;
    let busy = false;
    let lastInput = null;
    let hinted = -1; // gap to highlight after a level-1 hint

    const root = el('div', 'sp-root');
    const prompt = el('p', 'sp-prompt', round.emoji || round.prompt.es || '');
    const say = el('button', 'sp-key sp-say', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.word));
    say.style.visibility = ctx.canSpeak ? '' : 'hidden'; // keeps its space
    const reveal = el('p', 'sp-reveal');
    const wordEl = el('div', 'sp-word');
    const options = el('div', 'sp-row');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    const status = el('p', 'status');
    status.setAttribute('aria-live', 'polite');
    root.append(prompt, say, reveal, wordEl);
    const gapLetters = [...new Set(gapCells.flatMap((c) => c.options))].filter(Boolean);
    if (typing) root.append(specialLettersRow(insert, { letters: gapLetters, onBackspace: backspace, backLabel: 'Borrar' }));
    else root.append(options);
    root.append(check, status);
    host.append(root);

    const inputs = [];
    const answer = () => {
      let g = 0;
      return round.cells.map((c) => (c.gap ? (typing ? inputs[g++].value : values[g++] ?? '') : c.ch)).join('');
    };
    const maxLen = (i) => Math.max(...gapCells[i].options.map((o) => o.length));
    const idx = (inp) => inputs.indexOf(inp);
    function insert(ch) { // adds to the gap that last had focus; a full gap starts again, so o + ó never gives oó
      const i = lastInput ?? inputs[active];
      if (!i) return;
      const v = i.value + ch;
      i.value = v.length > maxLen(idx(i)) ? ch : v;
      i.focus();
      advance(i);
    }
    function advance(i) { // a full gap hands the caret to the next empty gap, so 4 gaps need no extra taps
      const next = inputs[idx(i) + 1];
      if (next && !next.value && i.value.length >= maxLen(idx(i))) next.focus();
    }
    function backspace() {
      const i = lastInput ?? inputs[active];
      if (i) { i.value = i.value.slice(0, -1); i.focus(); }
    }

    function render() {
      let g = 0;
      wordEl.replaceChildren(...round.cells.map((c) => {
        if (!c.gap) return el('span', '', c.ch);
        const idx = g++;
        if (typing) { inputs[idx].classList.toggle('hinted', idx === hinted); return inputs[idx]; }
        const b = el('button', `sp-gap${idx === active ? ' active' : ''}${idx === hinted ? ' hinted' : ''}`, values[idx] === null ? '_' : values[idx] || '·');
        b.type = 'button';
        b.addEventListener('click', () => { active = idx; render(); });
        return b;
      }));
      if (!typing) {
        options.replaceChildren(...gapCells[active].options.map((o) => {
          const b = el('button', 'sp-opt', o || '—');
          b.type = 'button';
          b.disabled = off[active].has(o);
          b.setAttribute('aria-label', o || 'sin letra');
          b.addEventListener('click', () => {
            values[active] = o;
            const next = values.findIndex((v) => v === null);
            if (next >= 0) active = next;
            render();
          });
          return b;
        }));
        check.disabled = busy || values.includes(null);
      } else check.disabled = busy;
    }

    if (typing) {
      gapCells.forEach((_, i) => {
        const inp = el('input', 'sp-gap');
        inp.type = 'text';
        inp.setAttribute('inputmode', 'none'); // no phone keyboard; the special-letters row does the work
        inp.autocomplete = 'off';
        inp.autocapitalize = 'off';
        inp.spellcheck = false;
        inp.setAttribute('aria-label', `Letras que faltan ${i + 1}`);
        inp.addEventListener('focus', () => { lastInput = inp; active = i; });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') return submit();
          // a full gap restarts on the next letter, so o then ó works with a physical keyboard too
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && inp.value.length >= maxLen(i)) inp.value = '';
        });
        inp.addEventListener('input', () => advance(inp));
        inputs.push(inp);
      });
    }

    async function submit() {
      if (busy || check.disabled) return;
      busy = true;
      render();
      const r = await ctx.submit(answer());
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (!r.correct) {
        const h = r.hint;
        const clear = (i) => { values[i] = null; if (typing) inputs[i].value = ''; };
        if (!h || h.level === 2) { gapCells.forEach((_, i) => clear(i)); active = 0; }
        if (h?.level === 2) reveal.textContent = h.answer; // stays visible; the child now copies it
        if (h?.level === 1) { // a nudge only: look at this gap, here is the rule
          clear(h.gap);
          active = h.gap;
          hinted = h.gap;
          if (h.remove) off[h.gap].add(h.remove);
          if (typing && h.first) inputs[h.gap].value = h.first;
        }
      }
      render();
    }
    check.addEventListener('click', submit);
    render();
    return { destroy: () => root.remove() };
  },
};
