// Builds each app's Claude entry (listed in apps.json) into one self-contained ES module: claude/dist/<id>.js, shipped inside the loader artifact.
import { build } from "vite";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const apps = JSON.parse(readFileSync(new URL("apps.json", import.meta.url)));

for (const [i, app] of apps.entries()) {
  await build({
    root, configFile: false, logLevel: "warn",
    build: {
      outDir: "claude/dist", emptyOutDir: i === 0, copyPublicDir: false, minify: true,
      lib: { entry: app.entry, formats: ["es"], fileName: () => `${app.id}.js` },
      // One file per app: the loader pins it with a single SRI hash, so it must not import other chunks.
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  console.log(`built claude/dist/${app.id}.js`);
}
