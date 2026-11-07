// Settings screen (shown behind the parent gate). Other tasks fill NAMED SLOTS without editing this file:
// add ui/settings-slots/<name>.js exporting default { slot: 'transfer' | 'reports', render(host, ctx) }.
// ctx = { store, content, diagnostic() }. Slots render in file-name order inside <section data-slot="...">.
const slotModules = import.meta.glob('./settings-slots/*.js', { eager: true, import: 'default' });

const SLOTS = [['transfer', 'Backup and restore'], ['reports', 'Reports and badges']];
const SLOT_NAMES = SLOTS.map(([name]) => name);

function general(host, { store, diagnostic, applySettings }) {
  const s = store.data.settings;
  const lang = document.createElement('label');
  lang.textContent = 'Help language ';
  const sel = document.createElement('select');
  sel.id = 'set-lang';
  for (const [v, t] of [['en', 'English'], ['es', 'Español']]) sel.add(new Option(t, v, false, s.lang === v));
  sel.onchange = () => { store.setSettings({ lang: sel.value }); applySettings(); };
  lang.append(sel);

  const size = document.createElement('label');
  size.textContent = 'Text size ';
  const sz = document.createElement('select');
  sz.id = 'set-size';
  for (const [v, t] of [[1, 'Normal'], [1.25, 'Large'], [1.5, 'Extra large']]) sz.add(new Option(t, v, false, s.textSize === v));
  sz.onchange = () => { store.setSettings({ textSize: Number(sz.value) }); applySettings(); };
  size.append(sz);

  const sound = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.id = 'set-sound'; cb.checked = s.sound;
  cb.onchange = () => store.setSettings({ sound: cb.checked });
  sound.append(cb, ' Sound');

  const backup = document.createElement('p');
  backup.className = 'muted';
  backup.textContent = s.lastBackupAt
    ? `Last backup ${Math.floor((Date.now() - Date.parse(s.lastBackupAt)) / 864e5)} days ago.`
    : 'No backup yet. Progress lives only in this browser.';

  const copy = document.createElement('button');
  copy.type = 'button'; copy.id = 'copy-diag'; copy.textContent = 'Copy diagnostic info';
  const out = document.createElement('p');
  out.className = 'muted'; out.setAttribute('aria-live', 'polite');
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(diagnostic()); out.textContent = 'Copied.'; }
    catch { out.textContent = 'Could not copy; select the text below.'; const pre = document.createElement('pre'); pre.textContent = diagnostic(); out.after(pre); }
  };
  const credits = document.createElement('p');
  credits.className = 'muted';
  credits.textContent = 'An unofficial game inspired by «Mis unidades de español. Primer cuatrimestre A1, Serie Luna» and following the topics and levels of the ALCE classes. Artwork, sentences, jokes and sounds are original.';
  host.append(lang, size, sound, backup, copy, out, credits);
}

export function renderSettings(host, ctx) {
  const root = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = 'Settings';
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
