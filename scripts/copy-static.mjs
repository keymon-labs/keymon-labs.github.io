// Copy files Vite doesn't reach (service workers, manifests, icons, data)
// into dist/ at the same paths. Files Vite already emitted are left alone.
import { globSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const skip = /^(node_modules|dist|scripts|\.git|\.github)(\/|$)|^[^/]+\.(json|js|md|lock)$|\.html$/;
let n = 0;
for (const f of globSync('**/*', { withFileTypes: false })) {
  if (skip.test(f) || f.startsWith('.')) continue;
  const out = join('dist', f);
  try { if (existsSync(out)) continue; mkdirSync(dirname(out), { recursive: true }); cpSync(f, out); n++; } catch {}
}
console.log(`copy-static: ${n} file(s) copied`);
