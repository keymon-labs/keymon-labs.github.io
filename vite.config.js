import { defineConfig } from 'vite';
import { globSync, cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';

const root = import.meta.dirname;
const IGNORE = /^(node_modules|dist|scripts|claude|\.git|\.github|\.claude)(\/|$)|^[^/]+\.(json|js|md)$|(^|\/)README\.md$|(^|\/)test\/|(^|\/)claude\.js$|\.html$|(^|\/)\./;

// Every index.html in the repo is a page: the landing page, each app,
// and each frozen version (app/v1/, app/v2/...). No manual registration.
const pages = Object.fromEntries(
  globSync('**/index.html', { exclude: (p) => /^(node_modules|dist|\.git)/.test(p) })
    .map((p) => [p.replace(/\/?index\.html$/, '') || 'main', resolve(p)])
);

// Web manifests must keep a stable, un-hashed URL next to their page:
// their start_url, scope and icons are relative to the manifest itself,
// and the install identity depends on it.
const keepManifests = {
  name: 'keep-manifests',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace(/<link([^>]*rel=["']manifest["'][^>]*)>/g, (m, a) =>
      a.includes('vite-ignore') ? m : `<link${a} vite-ignore>`),
  },
};

// Copy everything Vite didn't bundle (sw.js, manifests, manifest icons,
// runtime-fetched data) to dist/ at the same path. Bundled modules are skipped.
const copyUnbundled = () => {
  let bundled = new Set();
  return {
    name: 'copy-unbundled',
    apply: 'build',
    generateBundle() { bundled = new Set([...this.getModuleIds()].map((id) => relative(root, id))); },
    closeBundle() {
      let n = 0;
      for (const f of globSync('**/*', { cwd: root })) {
        const src = join(root, f), out = join(root, 'dist', f);
        if (IGNORE.test(f) || bundled.has(f) || existsSync(out)) continue;
        try { mkdirSync(dirname(out), { recursive: true }); cpSync(src, out); n++; } catch {} // directories throw; skip
      }
      console.log(`copy-unbundled: ${n} file(s)`);
    },
  };
};

export default defineConfig({
  // '/' for <owner>.github.io; '/<repo>/' when served as a project site (forks). Set by the deploy workflow.
  base: (process.env.BASE_PATH || '').replace(/\/?$/, '/'),
  plugins: [keepManifests, copyUnbundled()],
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: pages } },
});
