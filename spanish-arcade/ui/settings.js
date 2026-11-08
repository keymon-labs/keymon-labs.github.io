// Settings screen (shown behind the parent gate). Other tasks fill NAMED SLOTS without editing this file:
// add ui/settings-slots/<name>.js exporting default { slot: 'transfer' | 'reports', render(host, ctx) }.
// ctx = { store, content, diagnostic() }. Slots render in file-name order inside <section data-slot="...">.
const slotModules = import.meta.glob('./settings-slots/*.js', { eager: true, import: 'default' });

const SLOTS = [['transfer', 'Copia de seguridad'], ['reports', 'Informes e insignias']];
const SLOT_NAMES = SLOTS.map(([name]) => name);

function general(host, { store, diagnostic, applySettings, speech }) {
  const s = store.data.settings;
  const size = document.createElement('label');
  size.textContent = 'Tamaño del texto ';
  const sz = document.createElement('select');
  sz.id = 'set-size';
  for (const [v, t] of [[1, 'Normal'], [1.25, 'Grande'], [1.5, 'Muy grande']]) sz.add(new Option(t, v, false, s.textSize === v));
  sz.onchange = () => { store.setSettings({ textSize: Number(sz.value) }); applySettings(); };
  size.append(sz);

  const sound = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.id = 'set-sound'; cb.checked = s.sound;
  cb.onchange = () => store.setSettings({ sound: cb.checked });
  sound.append(cb, ' Sonido');

  const voiceRow = document.createElement('label');
  voiceRow.textContent = 'Voz ';
  const vs = document.createElement('select');
  vs.id = 'set-voice';
  const fill = () => {
    const list = speech?.voices() ?? [];
    vs.replaceChildren(new Option('Automática (España primero)', '', false, !s.voice));
    for (const v of list) vs.add(new Option(`${v.name} (${v.region})`, v.id, false, s.voice === v.id));
  };
  fill();
  speech?.ready?.().then(fill);
  vs.onchange = () => { store.setSettings({ voice: vs.value }); speech?.setPreferred(vs.value); };
  const test = document.createElement('button');
  test.type = 'button'; test.id = 'test-voice'; test.textContent = 'Probar voz';
  test.onclick = () => speech?.say('Hola, me llamo Lola y tengo siete años.');
  const voiceNote = document.createElement('p');
  voiceNote.className = 'muted';
  voiceNote.textContent = 'Si no hay ninguna voz de España (es-ES), el teléfono usará otra de español. Puedes instalar una en los ajustes de voz del teléfono.';
  voiceRow.append(vs);

  const backup = document.createElement('p');
  backup.className = 'muted';
  backup.textContent = s.lastBackupAt
    ? `Última copia de seguridad: hace ${Math.floor((Date.now() - Date.parse(s.lastBackupAt)) / 864e5)} días.`
    : 'Todavía no hay copia de seguridad. El progreso solo está en este navegador.';

  const copy = document.createElement('button');
  copy.type = 'button'; copy.id = 'copy-diag'; copy.textContent = 'Copiar datos de diagnóstico';
  const out = document.createElement('p');
  out.className = 'muted'; out.setAttribute('aria-live', 'polite');
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(diagnostic()); out.textContent = 'Copiado.'; }
    catch { out.textContent = 'No se pudo copiar; selecciona el texto de abajo.'; const pre = document.createElement('pre'); pre.textContent = diagnostic(); out.after(pre); }
  };
  const credits = document.createElement('p');
  credits.className = 'muted';
  credits.textContent = 'Juego no oficial inspirado en «Mis unidades de español. Primer cuatrimestre A1, Serie Luna», que sigue los temas y niveles de las clases de ALCE. Las ilustraciones, las frases, los chistes y los sonidos son originales.';
  host.append(size, sound, voiceRow, test, voiceNote, backup, copy, out, credits);
}

export function renderSettings(host, ctx) {
  const root = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = 'Ajustes';
  title.tabIndex = -1;
  const gen = document.createElement('section');
  gen.dataset.slot = 'general';
  general(gen, ctx);
  root.append(title, gen);
  for (const [path, m] of Object.entries(slotModules)) if (!SLOT_NAMES.includes(m?.slot)) ctx.logError(`${path}: unknown settings slot "${m?.slot}"`);
  for (const [name, heading] of SLOTS) {
    const mods = Object.entries(slotModules).filter(([, m]) => m.slot === name).sort(([a], [b]) => a.localeCompare(b));
    if (!mods.length) continue; // nothing fills this slot yet
    const section = document.createElement('section');
    section.dataset.slot = name;
    const h2 = document.createElement('h2');
    h2.textContent = heading;
    section.append(h2);
    for (const [, m] of mods) m.render(section, ctx);
    root.append(section);
  }
  host.append(root);
  return { destroy: () => root.remove() };
}
