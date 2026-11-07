// Encrypt or decrypt a Piano Jump song library file (format: piano-jump/LIBRARY.md).
// Usage: PJ_PASSWORD='…' node scripts/pj-library.mjs encrypt|decrypt <in> <out>
import { readFileSync, writeFileSync } from "node:fs";
import { encryptLibrary, decryptLibrary, validateLibrary } from "../piano-jump/library.js";

const [, , cmd, input, output] = process.argv, password = process.env.PJ_PASSWORD;
if (!["encrypt", "decrypt"].includes(cmd) || !input || !output || !password) {
  console.error("Usage: PJ_PASSWORD='…' node scripts/pj-library.mjs encrypt|decrypt <in> <out>");
  process.exit(1);
}
try {
  const data = JSON.parse(readFileSync(input, "utf8"));
  if (cmd === "encrypt") { validateLibrary(data); writeFileSync(output, await encryptLibrary(data, password)); }
  else writeFileSync(output, JSON.stringify(await decryptLibrary(data, password), null, 1) + "\n");
  console.log(`${cmd}ed ${input} -> ${output}`);
} catch (e) { console.error("Error: " + e.message); process.exit(1); }
