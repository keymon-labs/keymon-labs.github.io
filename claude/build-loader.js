// Fills loader.html with the app catalog pinned to one npm version + SRI hashes → claude/out/loader.html (publish it as the artifact).
// Usage:  node claude/build-loader.js --version 0.1.7          hashes the files actually on npm (release)
//         node claude/build-loader.js --local http://host/dir/  hashes claude/dist (local testing only)
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PKG = "@keymon-labs/claude-apps";
const here = (f) => new URL(f, import.meta.url);
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const version = arg("--version"), local = arg("--local");
if (!version === !local) { console.error("Pass exactly one of --version <npm version> or --local <base url>"); process.exit(1); }

let dir, base, commit;
if (version) {
  // Hash what jsDelivr will serve, not a local rebuild: the bytes must match exactly.
  const tmp = mkdtempSync(join(tmpdir(), "claude-apps-"));
  const tgz = execFileSync("npm", ["pack", `${PKG}@${version}`, "--pack-destination", tmp, "--silent"], { encoding: "utf8" }).trim().split("\n").pop();
  execFileSync("tar", ["-xzf", join(tmp, tgz), "-C", tmp]);
  dir = join(tmp, "package", "dist");
  base = `https://cdn.jsdelivr.net/npm/${PKG}@${version}/dist/`;
  commit = JSON.parse(execFileSync("npm", ["view", `${PKG}@${version}`, "gitHead", "--json"], { encoding: "utf8" }) || "null");
} else {
  dir = here("dist").pathname;
  base = local.endsWith("/") ? local : local + "/";
}
commit ||= execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
commit = commit.slice(0, 7);

const apps = JSON.parse(readFileSync(here("apps.json"))).map(({ entry, ...app }) => ({
  ...app,
  src: base + app.id + ".js",
  integrity: "sha384-" + createHash("sha384").update(readFileSync(join(dir, app.id + ".js"))).digest("base64"),
}));
const build = { package: PKG, version: version || "local", commit };

// </script> inside the embedded JSON would end the script tag early.
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const html = readFileSync(here("loader.html"), "utf8")
  .replace("__CATALOG__", json(apps))
  .replace("__BUILD__", json(build))
  .replaceAll("__BUILD_ID__", `${build.version} ${commit}`);
mkdirSync(here("out"), { recursive: true });
writeFileSync(here("out/loader.html"), html);
console.log(`claude/out/loader.html: ${apps.length} app(s), build ${build.version} ${commit}`);
