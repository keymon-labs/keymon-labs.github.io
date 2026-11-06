import { defineConfig } from 'vite';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

// Every index.html in the repo is a page: the landing page, each app,
// and each frozen version (app/v1/, app/v2/...). No manual registration.
const pages = Object.fromEntries(
  globSync('**/index.html', { exclude: (p) => /^(node_modules|dist|\.git)/.test(p) })
    .map((p) => [p.replace(/\/?index\.html$/, '') || 'main', resolve(p)])
);

// Web manifests must keep a stable, un-hashed URL next to their page:
// their start_url, scope and icons are relative to the manifest itself,
// and the install identity depends on it. Mark them for Vite to leave alone;
// copy-static.mjs then ships them as-is.
const keepManifests = {
  name: 'keep-manifests',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replace(/<link([^>]*rel=["']manifest["'][^>]*)>/g, (m, a) =>
      a.includes('vite-ignore') ? m : `<link${a} vite-ignore>`),
  },
};

export default defineConfig({
  base: '/',
  plugins: [keepManifests],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: pages },
  },
});
