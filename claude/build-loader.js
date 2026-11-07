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

// Home view = the website's landing page: Claude apps open here (trust check), every other link goes to the website.
const landing = readFileSync(here("../index.html"), "utf8");
const landingStyle = landing.match(/<style>([\s\S]*?)<\/style>/)[1];
let landingMain = landing.match(/<main>[\s\S]*?<\/main>/)[0]
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<footer>[\s\S]*?<\/footer>/, "")
  .replace(/\s*<button[^>]*data-open-in-claude[^>]*>[\s\S]*?<\/button>/g, "");
for (const { id } of apps) {
  landingMain = landingMain.replace(new RegExp(`(<li class="card" id="${id}">[\\s\\S]*?)<a class="app" href="[^"]*">([\\s\\S]*?)<span class="tag need">[^<]*</span>([\\s\\S]*?</a>)\\s*<div class="versions">[\\s\\S]*?</div>`),
    `$1<a class="app" href="#${id}" data-claude-app="${id}">$2<span class="tag need">Runs here, on your Claude account</span>$3`);
}
for (const { id } of apps) if (!landingMain.includes(`data-claude-app="${id}"`)) { console.error(`Landing card for ${id} needs an <a class="app"> link, a "tag need" span and a versions row`); process.exit(1); }
landingMain = landingMain.replace(/href="\.\/([^"]*)"/g, `href="${SITE}$1" target="_blank" rel="noopener"`);

// </script> inside the embedded JSON would end the script tag early.
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const html = readFileSync(here("loader.html"), "utf8")
  .replace("__CATALOG__", json(apps))
  .replace("__BUILD__", json(build))
  .replace("__LANDING_STYLE__", () => landingStyle)
  .replace("__LANDING_MAIN__", () => landingMain)
  .replaceAll("__BUILD_ID__", build.commit)
  .replaceAll("__BUILD_TIME__", new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC")
  .replaceAll("__REPO__", REPO)
  .replaceAll("__SITE__", SITE);
writeFileSync(here("out/loader.html"), html);
console.log(`claude/out/: loader.html + ${apps.length} app file(s), build ${build.commit}`);
