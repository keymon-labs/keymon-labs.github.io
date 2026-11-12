// letter-lock archetype: guess the word from a riddle (clues appear as you miss) in a normal text field. Rules in logic.js, contract in ../README.md.
import { make, judge, hint, score, SYMBOL, triesLine, cluesShown } from './logic.js';
import { injectStyles, el, specialLettersRow } from '../../ui/tiles.js';

const CSS = `
.ll-root{display:flex;flex-direction:column;gap:8px;margin:4px 0}
.ll-root p{margin:0}
.ll-root p:empty{display:none}
.ll-clues{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.ll-clues li{padding:8px 12px;border-radius:12px;border:2px solid var(--line);background:var(--card);font-size:1.05rem}
.ll-clues li.new{border-color:var(--accent)}
.ll-pattern{text-align:center;font-size:1.4rem;letter-spacing:.2em;margin:0;text-transform:uppercase}
.ll-form{display:flex;gap:8px}
.ll-input{flex:1 1 0;min-width:0;min-height:48px;padding:6px 12px;font:inherit;font-size:1.4rem;border:2px solid var(--accent);border-radius:14px;background:var(--card);color:var(--fg)}
.ll-form .sp-check{width:auto;flex:0 0 auto}
.ll-chips{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:9.5rem;overflow-y:auto}
.ll-chips ol,.ll-chips li{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin:0;padding:0;list-style:none}
.ll-chip{box-sizing:border-box;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:7px;font-weight:bold;line-height:1;text-transform:uppercase}
.ll-chip small{font-size:.6rem;height:.65rem}
.ll-chip.ok{background:#2e7d32;color:#fff}
.ll-chip.near{background:#f9a825;color:#000}
.ll-chip.tilde{background:#1565c0;color:#fff}
.ll-chip.no{background:#616161;color:#fff}
.ll-reward{text-align:center;margin:0}
.ll-reward b{display:block;font-size:2rem}
.ll-reward span{font-size:4rem;line-height:1.1}
@media (orientation:landscape) and (max-height:520px){
.ll-root{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:6px 12px}
.ll-root p{margin:0}
.ll-root p:empty{display:none}
.ll-root>.ll-clues{grid-column:1;grid-row:1 / span 4}
.ll-root>:not(.ll-clues){grid-column:2}
.ll-clues li{padding:5px 10px}
.ll-chips{max-height:6rem}
}
`;
const MEANING = { ok: 'bien', near: 'en otro sitio', tilde: 'falta la tilde', no: 'no está' };

export default {
  id: 'letter-lock',
  title: { es: 'Descubre la palabra', en: 'Crack the word' },
  emoji: '🔐',
  help: {
    es: 'Lee la adivinanza, escribe la palabra y toca Comprobar. Si fallas, llega otra pista. ✔ verde: letra bien. ↔ naranja: está en otro sitio. ´ azul: falta la tilde. · gris: no está.',
    en: 'Read the riddle, type the word and tap Comprobar. A wrong try brings another clue. ✔ green: right spot. ↔ orange: elsewhere. ´ blue: wrong accent. · grey: not in the word.',
  },
  skill: 'spelling',
  pictures: true,
  paramsSchema: {
    from: { type: 'selector' },
    tries: { type: 'int', min: 4, max: 8, default: 6 },
    clue: { type: 'enum', values: ['riddle', 'audio'], default: 'riddle' },
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
    const audioOnly = round.clue === 'audio' && ctx.canSpeak;
    const riddle = !audioOnly;
    let left = round.tries; // guesses before the next judged answer
    let revealed = false;
    let wrong = 0;
    let solved = false;
    const past = [];

    const root = el('div', 'll-root');
    const say = el('button', 'sp-key sp-say', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.addEventListener('click', () => ctx.say(round.answer));
    say.hidden = !audioOnly;
    const clues = el('ol', 'll-clues');
    clues.setAttribute('aria-label', 'Pistas');
    const pattern = el('p', 'll-pattern');
    const reveal = el('p', 'sp-reveal');
    reveal.hidden = pattern.hidden = true;
    const input = el('input', 'll-input');
    input.type = 'text';
    input.autocapitalize = 'off';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('enterkeyhint', 'go');
    input.setAttribute('aria-label', 'Tu respuesta');
    const check = el('button', 'sp-check', 'Comprobar');
    check.type = 'submit';
    const form = el('form', 'll-form');
    form.noValidate = true;
    form.append(input, check);
    const letters = specialLettersRow((ch) => {
      const [a, b] = [input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length];
      input.setRangeText(ch, a, b, 'end');
      input.focus();
    });
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    const chips = el('ol', 'll-chips');
    chips.setAttribute('aria-label', 'Intentos');
    const reward = el('p', 'll-reward');
    reward.hidden = true;
    root.append(say, clues, pattern, reveal, form, letters, status, chips, reward);
    host.append(root);

    function render() {
      const shown = cluesShown(round, wrong, riddle);
      clues.replaceChildren(...shown.map((t, i) => {
        const li = el('li', '', `💡 ${t}`);
        if (i === shown.length - 1 && wrong > 0) li.classList.add('new');
        return li;
      }));
      clues.hidden = !shown.length;
      chips.replaceChildren(...[...past].reverse().map((g) => {
        const marks = score(g, round.answer);
        const row = el('li');
        const word = el('ol');
        [...g].forEach((ch, i) => {
          const m = marks[i] ?? 'no';
          const c = el('li', `ll-chip ${m}`);
          c.append(el('span', '', ch), el('small', '', SYMBOL[m]));
          c.setAttribute('aria-label', `${ch}: ${MEANING[m]}`);
          word.append(c);
        });
        row.append(word);
        return row;
      }));
    }

    async function onSubmit(e) {
      e.preventDefault();
      if (solved || check.disabled) return;
      const guess = [...input.value.normalize('NFC').trim().toLowerCase()].filter((c) => /\p{L}/u.test(c)).join('');
      if (!guess) { input.focus(); return; }
      const right = guess === round.answer;
      past.push(guess);
      input.value = '';
      if (!right) wrong++;
      if (!right && left > 1) { left--; status.textContent = 'Casi. Mira la pista nueva.'; render(); input.focus(); return; } // not judged
      check.disabled = true;
      const r = await ctx.submit(guess);
      ctx.sfx(r.correct ? 'right' : 'wrong');
      check.disabled = false;
      if (r.correct) {
        solved = true;
        ctx.mascot('happy');
        input.disabled = check.disabled = true;
        form.hidden = letters.hidden = true;
        status.textContent = `✔ ${triesLine(past.length, round.tries)}`;
        reward.replaceChildren(el('span', '', round.emoji), el('b', '', round.word));
        reward.hidden = !round.emoji;
        return render();
      }
      status.textContent = `✖ ${r.feedback.es}`;
      left = 2;
      if (r.hint?.level === 1) {
        const fixed = new Map(r.hint.fixed.map((f) => [f.index, f.ch]));
        pattern.hidden = false;
        pattern.textContent = [...round.answer].map((_, i) => fixed.get(i) ?? '_').join(' ');
        pattern.setAttribute('aria-label', 'Letras que ya sabes');
      }
      if (r.hint?.level === 2) { reveal.hidden = false; reveal.textContent = r.hint.answer; revealed = true; left = 1; } // stays visible; the child types it once
      render();
      input.focus();
    }
    form.addEventListener('submit', onSubmit);
    render();
    return { destroy() { root.remove(); } };
  },
};
