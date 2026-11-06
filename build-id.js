// Build stamp shown in every footer: "<short git commit> · <UTC time>". Used by vite.config.js and claude/build.js as __BUILD__.
import { execFileSync } from "node:child_process";

let commit = "dev";
try { commit = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
export const BUILD = `${commit} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;
