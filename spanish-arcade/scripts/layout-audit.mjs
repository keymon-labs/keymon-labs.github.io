// Layout audit: plays every archetype (real units' params, difficulty 1-3, several seeds) in the real round screen of a built site
// at phone sizes and reports how many px the exercise overflows the viewport. Usage:
//   npm run build && python3 -m http.server -d dist 8765 &
//   node spanish-arcade/scripts/layout-audit.mjs [--base http://localhost:8765/spanish-arcade/] [--shots dir] [--tag before] [--json out.json]
// Needs Playwright (dev tool, not bundled). Pure helpers are exported and unit-tested in test/layout.test.js.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const VIEWPORTS = [{ name: '390x844', width: 390, height: 844 }, { name: '360x640', width: 360, height: 640 }, { name: '844x390', width: 844, height: 390 }];
export const DIFFICULTIES = [1, 2, 3];
export const MIN_TAP = 44;

/** Measurements taken in the page -> px of overflow (0 = fits). The stage scrolling inside itself counts: it is the scroll the child sees. */
export function overflowOf(m) {
  return Math.max(0, m.docH - m.viewH, m.stageScroll - m.stageClient, m.skipBottom - m.viewH, m.docW - m.viewW);
}

/** Params for an archetype: the first real exercise using it, else a small generic selector. */
export function paramsFor(archetypeId, units) {
  for (const u of units) {
    const e = u.exercises?.find((x) => x.archetype === archetypeId);
    if (e) return structuredClone(e.params ?? {});
  }
  return { from: { n: 6 } };
}

/** One row per archetype x difficulty x viewport, worst seed kept. */
export function worstCase(results) {
  const out = new Map();
  for (const r of results) {
    const k = `${r.archetype}|${r.difficulty}|${r.viewport}`;
    if (!out.has(k) || r.overflow > out.get(k).overflow) out.set(k, r);
  }
  return [...out.values()];
}

const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const base = arg('base', 'http://localhost:8765/spanish-arcade/');
  const shots = arg('shots', null);
  const tag = arg('tag', 'run');
  const seeds = +arg('seeds', 4);
  const only = arg('vp', null);
  const { chromium } = createRequire(import.meta.url)('playwright');
  const units = readdirSync(path.join(root, 'units')).map((f) => JSON.parse(readFileSync(path.join(root, 'units', f), 'utf8'))).filter((u) => !u.dev);
  const archetypes = readdirSync(path.join(root, 'archetypes'), { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'placeholder').map((d) => d.name).sort();
  if (shots) mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const vp of VIEWPORTS.filter((v) => !only || v.name === only)) {
    const page = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })).newPage();
    const errors = [];
    // headless Chrome has no voices: fake a Spanish one so the listen buttons render like on a phone
    await page.addInitScript(() => {
      const voice = { lang: 'es-ES', name: 'Audit', voiceURI: 'audit', localService: true };
      const synth = { getVoices: () => [voice], addEventListener() {}, removeEventListener() {}, speak(u) { setTimeout(() => u.onend?.(), 10); }, cancel() {}, speaking: false };
      Object.defineProperty(window, 'speechSynthesis', { value: synth });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForFunction(() => window.__spanishArcade?.content?.units?.length);
    const pid = await page.evaluate(() => window.__spanishArcade.store.addProfile({ firstName: 'Auditor' }).id);
    for (const a of archetypes) {
      for (const difficulty of DIFFICULTIES) {
        const params = paramsFor(a, units);
        let worst = null;
        for (let s = 0; s < seeds; s++) {
          const uid = `audit-${a}-${difficulty}-${s}`;
          await page.evaluate(({ uid, a, difficulty, params, pid }) => {
            const { content } = window.__spanishArcade;
            if (!content.unitById[uid]) {
              const unit = { ...content.units[0], id: uid, order: 999, rev: 1, pass: { minCorrect: 1 }, exercises: Array.from({ length: 6 }, (_, i) => ({ id: `x${i}`, archetype: a, difficulty, params, prompt: { es: 'Elige la palabra correcta.' } })) }; // six, so the progress trail is as wide as in a real unit
              content.units.unshift(unit); content.unitById[uid] = unit;
            }
            location.hash = `#/profile/${pid}`;
          }, { uid, a, difficulty, params, pid });
          await page.waitForTimeout(60);
          await page.evaluate((uid) => { location.hash = `#/unit/${uid}/play`; }, uid);
          await page.waitForSelector('#round', { timeout: 4000 }).catch(() => null);
          await page.waitForTimeout(150);
          const m = await page.evaluate((minTap) => {
            const st = document.getElementById('stage'), sk = document.getElementById('skip');
            const small = [...document.querySelectorAll('#round button, #round input')].filter((b) => !b.disabled && b.offsetParent && (b.getBoundingClientRect().height < minTap || b.getBoundingClientRect().width < minTap)).length;
            return { has: !!document.getElementById('round'), docH: document.documentElement.scrollHeight, viewH: innerHeight, docW: document.documentElement.scrollWidth, viewW: innerWidth,
              stageScroll: st?.scrollHeight ?? 0, stageClient: st?.clientHeight ?? 0, skipBottom: sk ? sk.getBoundingClientRect().bottom : 0, small };
          }, MIN_TAP);
          const row = { archetype: a, difficulty, viewport: vp.name, seed: s, rendered: m.has, overflow: m.has ? overflowOf(m) : null, small: m.small };
          if (m.has && (!worst || row.overflow > worst.overflow)) { worst = row; if (shots) await page.screenshot({ path: path.join(shots, `${tag}-${vp.name}-${a}-d${difficulty}.png`) }); }
          if (!m.has && !worst) worst = row;
        }
        results.push(worst);
      }
    }
    if (errors.length) console.error(`page errors at ${vp.name}:`, [...new Set(errors)].slice(0, 5));
    await page.context().close();
  }
  await browser.close();
  const rows = worstCase(results);
  const out = arg('json', null);
  if (out) writeFileSync(out, JSON.stringify(rows, null, 1));
  for (const vp of VIEWPORTS.filter((v) => !only || v.name === only)) {
    console.log(`\n${vp.name}`);
    for (const a of archetypes) {
      const r = DIFFICULTIES.map((d) => rows.find((x) => x.archetype === a && x.difficulty === d && x.viewport === vp.name));
      console.log(`${a.padEnd(20)} ${r.map((x) => (x.rendered ? `${x.overflow}px${x.small ? `(${x.small} small)` : ''}` : 'no-render').padStart(14)).join('')}`);
    }
  }
  process.exitCode = rows.some((r) => !r.rendered || r.overflow > 0) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
