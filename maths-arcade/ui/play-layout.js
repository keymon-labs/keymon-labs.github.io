// Standard screen for a keypad mini game: a stage (canvas) plus a side/bottom
// panel with the question, feedback and keypad. Landscape: side by side.
// Portrait: stacked. Games fill `stage` and call the setters.

export function createPlayLayout(host, { title, onExit }) {
  host.innerHTML = `
    <section class="play">
      <div class="stage">
        <div class="stage-bar">
          <button type="button" class="icon-btn back" aria-label="Back to levels">‹</button>
          <span class="level-name"></span>
          <span class="rounds" aria-label="Rounds"></span>
        </div>
      </div>
      <div class="panel">
        <div class="question">
          <p class="q-title"></p>
          <p class="q-text"></p>
          <p class="q-expr"></p>
        </div>
        <p class="feedback" aria-live="polite"></p>
        <div class="keypad-host"></div>
      </div>
    </section>`;
  const $ = (s) => host.querySelector(s);
  $('.level-name').textContent = title;
  $('.back').addEventListener('click', () => onExit?.());

  return {
    stage: $('.stage'),
    keypadHost: $('.keypad-host'),
    setQuestion({ title = '', text = '', expr = '' }) {
      $('.q-title').textContent = title;
      $('.q-text').textContent = text;
      $('.q-expr').textContent = expr;
    },
    /** kind: '' | 'good' | 'bad' | 'hint' */
    setFeedback(message = '', kind = '') {
      const el = $('.feedback');
      el.textContent = message;
      el.className = `feedback ${kind}`;
    },
    setRounds(done, total) {
      $('.rounds').innerHTML = Array.from({ length: total }, (_, i) =>
        `<i class="${i < done ? 'on' : i === done ? 'now' : ''}"></i>`).join('');
    },
  };
}

/** Modal card at the end of a level. `heading` overrides the default (catapult) title; `detail` is an extra line (e.g. the score). */
export function showResult(host, { stars, heading, detail, improved, hasNext, onAgain, onNext, onMenu }) {
  const el = document.createElement('div');
  el.className = 'result';
  el.innerHTML = `
    <div class="result-card">
      <p class="result-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></p>
      <h2>${heading ?? (stars === 3 ? 'Perfect!' : stars === 2 ? 'Great shooting!' : 'Castle down!')}</h2>
      ${detail ? `<p class="result-detail">${detail}</p>` : ''}
      ${improved ? '<p class="muted">New best!</p>' : ''}
      <div class="result-actions">
        <button type="button" data-a="menu" class="btn ghost">Levels</button>
        <button type="button" data-a="again" class="btn ghost">Again</button>
        ${hasNext ? '<button type="button" data-a="next" class="btn">Next ›</button>' : ''}
      </div>
    </div>`;
  el.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a) return;
    el.remove();
    ({ again: onAgain, next: onNext, menu: onMenu })[a]?.();
  });
  host.appendChild(el);
}
