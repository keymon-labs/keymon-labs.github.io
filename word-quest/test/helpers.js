// Test helpers: load episodes, art and the library from disk the way episodes/index.js does in the browser.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { SOUNDS } from "../sounds.js";

const here = (p) => new URL(`../${p}`, import.meta.url);
export const readJson = (p) => JSON.parse(readFileSync(here(p)));
export const library = readJson("library.json");

const svgDir = (dir) => (existsSync(here(dir)) ? readdirSync(here(dir)).filter((f) => f.endsWith(".svg")).map((f) => [f.slice(0, -4), readFileSync(here(`${dir}/${f}`), "utf8")]) : []);
export const episodeIds = readdirSync(here("episodes")).filter((d) => existsSync(here(`episodes/${d}/episode.json`)));
export const art = Object.fromEntries([...svgDir("art"), ...episodeIds.flatMap((id) => svgDir(`episodes/${id}/art`))]);
export const CHECK = { art, library, sounds: SOUNDS };
