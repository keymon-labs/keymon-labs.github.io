// question-maker archetype: an answer with a highlighted part; build the question that asks for it (choose / tiles / type). Rules in logic.js, styles in style.css (/* question-maker */), contract in ../README.md.
import { make, judge, hint, tilesFor, textsOf } from './logic.js';
import { injectStyles, el, tapOrDrag, specialLettersRow } from '../../ui/tiles.js';

export default {
  id: 'question-maker',
  title: { es: 'Eres periodista', en: 'You are the reporter' },
  emoji: '🎙️',
  help: {
    es: 'Lee la respuesta. La parte marcada es lo que quieres saber: haz la pregunta que la pide. Recuerda los signos ¿ ? y las tildes.',
    en: 'Read the answer. The marked part is what you want to know: make the question that asks for it. Remember ¿ ? and the accents.',
  },
  skill: 'grammar',
  paramsSchema: {
    items: { type: 'array', min: 1, items: {
      answer: { type: 'string' }, focus: { type: 'string' }, question: { type: 'string' },
      accept: { type: 'array', optional: true, items: { type: 'string' } }, wrong: { type: 'array', optional: true, items: { type: 'string' } }, emoji: { type: 'string', optional: true },
    } },
    n: { type: 'int', min: 1, optional: true },
    build: { type: 'enum', values: ['choice', 'tiles', 'type'], default: 'choice' },
    decoys: { type: 'int', min: 0, max: 3, default: 0 },
  },
  defaults: (difficulty) => ({ build: ['choice', 'tiles', 'type'][difficulty - 1] ?? 'type', decoys: [0, 2, 3][difficulty - 1] ?? 3 }),
  make,
  judge,
  hint,

  mount(host, round, ctx) {
    injectStyles();
    let placed = [];
    let locked = 0;
    let busy = false;
    let revealed = false;
    const root = el('div', 'sp-root qm-root');
    const card = el('div', 'qm-card');
    const say = el('button', 'sp-key qm-say', '🔊');
    say.type = 'button';
    say.setAttribute('aria-label', 'Escuchar');
    say.hidden = !ctx.canSpeak;
    say.addEventListener('click', () => ctx.say(round.sentence));
    const text = el('p', 'qm-text');
    const mark = el('mark', '', round.focus);
    text.append(round.before, mark, round.after);
    card.append(el('span', 'qm-emoji', round.emoji || '🎙️'), text, say);
    const reveal = el('p', 'sp-reveal qm-reveal');
    reveal.hidden = true;
    const status = el('p');
    status.setAttribute('aria-live', 'polite');
    const check = el('button', 'sp-check', '✔ Comprobar');
    check.type = 'button';
    root.append(card, reveal);

    let draw = () => {};
    let readAnswer = () => null;
    let onHint = () => {};
    if (round.build === 'choice') {
      const box = el('div', 'qm-opts');
      const btns = round.options.map((o) => {
        const b = el('button', 'sp-opt qm-opt', o.text);
        b.type = 'button';
        b.addEventListener('click', () => submit(o.text));
        return b;
      });
      box.append(...btns);
      root.append(box, status);
      onHint = (r) => {
        if (r.hint.level === 1 && r.hint.remove !== null) btns[r.hint.remove].disabled = true;
        if (r.hint.level === 2) round.options.forEach((o, i) => { if (!o.ok) btns[i].disabled = true; });
      };
    } else if (round.build === 'tiles') {
      const slots = el('div', 'sp-tiles slots');
      const tray = el('div', 'sp-tiles tray');
      root.append(slots, tray, check, status);
      const tileOf = (id) => round.tiles.find((t) => t.id === id);
      const tile = (t, onTap, onDrop, isLocked) => {
        const b = el('button', `sp-tile qm-tile${/^[¿¡?!.,]$/.test(t.text) ? ' mark' : ''}${isLocked ? ' locked' : ''}`, t.text);
        b.type = 'button';
        b.disabled = isLocked || (revealed && t.decoy);
        if (!b.disabled) tapOrDrag(b, { onTap, onDrop, dropZone: () => slots });
        return b;
      };
      const place = (id) => () => { placed.push(id); draw(); };
      draw = () => {
        const free = round.tiles.filter((t) => !placed.includes(t.id));
        slots.replaceChildren(...placed.map((id, i) => tile(tileOf(id), () => { placed.splice(i, 1); draw(); }, null, i < locked)));
        tray.replaceChildren(...free.map((t) => tile(t, place(t.id), place(t.id))));
        slots.setAttribute('aria-label', textsOf(round, placed).join(' '));
        check.disabled = busy || free.some((t) => !t.decoy);
      };
      readAnswer = () => (check.disabled ? null : textsOf(round, placed));
      check.addEventListener('click', () => { const a = readAnswer(); if (a) submit(a); });
      onHint = (r) => {
        if (r.hint.level === 1) { placed = tilesFor(round, r.hint.prefix); locked = placed.length; }
        if (r.hint.level === 2) { placed = []; locked = 0; revealed = true; }
      };
    } else {
      const input = el('input', 'qm-input');
      input.type = 'text';
      input.autocapitalize = 'off';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('enterkeyhint', 'go');
      input.setAttribute('aria-label', 'Tu pregunta');
      const form = el('form', 'qm-form');
      form.addEventListener('submit', (e) => { e.preventDefault(); readAnswer(); });
      form.append(input, check);
      const letters = specialLettersRow((ch) => {
        const [a, b] = [input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length];
        input.setRangeText(ch, a, b, 'end');
        input.focus();
      }, { onBackspace: () => { input.value = input.value.slice(0, -1); input.focus(); } });
      root.append(form, letters, status);
      check.type = 'submit';
      readAnswer = () => { const v = input.value.trim(); if (!v) { input.focus(); return null; } submit(v); return v; };
      draw = () => { input.disabled = busy; check.disabled = busy; };
      onHint = (r) => {
        if (r.hint.level === 1) { input.value = `${r.hint.text} `; }
        if (r.hint.level === 2) { input.value = ''; }
        input.focus();
      };
    }

    async function submit(answer) {
      if (busy) return;
      busy = true;
      draw();
      const r = await ctx.submit(answer);
      status.textContent = `${r.correct ? '✔' : '✖'} ${r.feedback.es}`;
      ctx.sfx(r.correct ? 'right' : 'wrong');
      busy = false;
      if (r.correct) {
        reveal.textContent = `🎙️ ${round.es}`; // the reporter asks it aloud
        reveal.hidden = false;
        ctx.say(round.es);
      } else if (r.hint?.level === 2) {
        reveal.textContent = r.hint.text;
        reveal.hidden = false;
      }
      if (!r.correct && r.hint) onHint(r);
      draw();
    }

    host.append(root);
    draw();
    return { destroy() { root.remove(); } };
  },
};
