// Fills loader.html with the app catalog (SRI hashes of claude/dist/*.js) → claude/out/: loader.html + apps/<id>.js,
// published together as one multi-file artifact. Run `npm run build:claude` first. No npm/CDN: the code ships inside the artifact.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const here = (f) => new URL(f, import.meta.url);
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const commit = git("rev-parse", "--short=7", "HEAD");
// A build from uncommitted code couldn't be traced back to its source.
const dirty = git("status", "--porcelain", "--", "claude", "shared", ...JSON.parse(readFileSync(here("apps.json"))).map((a) => a.source));
if (dirty && !process.argv.includes("--allow-dirty")) { console.error(`Uncommitted changes; commit first (or --allow-dirty for local tests):\n${dirty}`); process.exit(1); }

rmSync(here("out"), { recursive: true, force: true });
mkdirSync(here("out/apps"), { recursive: true });
const apps = JSON.parse(readFileSync(here("apps.json"))).map(({ entry, ...app }) => {
  const file = here(`dist/${app.id}.js`);
  copyFileSync(file, here(`out/apps/${app.id}.js`));
  return { ...app, src: `apps/${app.id}.js`, integrity: "sha384-" + createHash("sha384").update(readFileSync(file)).digest("base64") };
});
const build = { commit: dirty ? `${commit}-dirty` : commit };
// Links point at whichever GitHub repo this is built from, so a fork's loader links to the fork.
const [, owner, repo] = git("remote", "get-url", "origin").match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/) || [];
if (!owner) { console.error("origin isn't a GitHub repo"); process.exit(1); }
const REPO = `https://github.com/${owner}/${repo}`;
const SITE = repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${repo.toLowerCase()}/` : `https://${owner.toLowerCase()}.github.io/${repo}/`;

// </script> inside the embedded JSON would end the script tag early.
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const html = readFileSync(here("loader.html"), "utf8")
  .replace("__CATALOG__", json(apps))
  .replace("__BUILD__", json(build))
  .replaceAll("__BUILD_ID__", build.commit)
  .replaceAll("__REPO__", REPO)
  .replaceAll("__SITE__", SITE);
writeFileSync(here("out/loader.html"), html);
console.log(`claude/out/: loader.html + ${apps.length} app file(s), build ${build.commit}`);
