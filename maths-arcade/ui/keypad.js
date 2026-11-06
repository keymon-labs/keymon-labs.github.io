// Numeric keypad with a display and a Go button. Reusable by any game.
// createKeypad(host, { onSubmit, maxLength, goLabel }) ->
//   { value, clear(), setEnabled(bool), destroy() }
// Also listens to a physical keyboard (digits, Backspace, Enter).

export function createKeypad(host, { onSubmit, maxLength = 3, goLabel = 'Fire!' } = {}) {
  let value = '';
  let enabled = true;

  host.classList.add('keypad');
  host.innerHTML = `
    <output class="keypad-display" aria-live="polite"></output>
    <div class="keypad-keys">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" data-key="${d}">${d}</button>`).join('')}
      <button type="button" data-key="del" class="key-del" aria-label="Delete">⌫</button>
      <button type="button" data-key="0">0</button>
      <button type="button" data-key="go" class="key-go">${goLabel}</button>
    </div>`;
  const display = host.querySelector('.keypad-display');
  const goBtn = host.querySelector('.key-go');

  function render() {
    display.textContent = value || '?';
    display.classList.toggle('empty', !value);
    goBtn.disabled = !enabled || !value;
    host.classList.toggle('disabled', !enabled);
  }

  function press(key) {
    if (!enabled) return;
    if (key === 'del') value = value.slice(0, -1);
    else if (key === 'go') { if (value) onSubmit?.(Number(value)); return; }
    else if (value.length < maxLength) value = value === '0' ? key : value + key;
    navigator.vibrate?.(8);
    render();
  }

  const onPointer = (e) => {
    const btn = e.target.closest('button[data-key]');
    if (!btn) return;
    e.preventDefault(); // fast taps, no double-tap zoom
    press(btn.dataset.key);
  };
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') press('go');
  };

  host.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKey);
  render();

  return {
    get value() { return value; },
    clear() { value = ''; render(); },
    setEnabled(on) { enabled = on; render(); },
    destroy() { host.removeEventListener('pointerdown', onPointer); window.removeEventListener('keydown', onKey); host.innerHTML = ''; },
  };
}
