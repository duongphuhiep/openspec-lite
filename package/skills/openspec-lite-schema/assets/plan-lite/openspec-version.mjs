// Usage: node openspec-version.mjs
// Runs `openspec --version` and compares the result with `openspec-version` in the schema.yaml next to this file.
// Prints one line. Exit codes: 0 in the range, 2 outside the range or no readable version, 1 the command fails
// or schema.yaml has no `openspec-version` line.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const schemaPath = fileURLToPath(new URL("schema.yaml", import.meta.url));
let range;
try {
  range = readFileSync(schemaPath, "utf8").match(/^openspec-version:\s*["']?([^"'#\n]+?)["']?\s*(?:#.*)?$/m)?.[1];
} catch {}
if (!range) {
  console.log(`fail: ${schemaPath} has no openspec-version line`);
  process.exit(1);
}

const r = spawnSync("openspec", ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
if (r.status !== 0) {
  console.log(`fail: openspec --version failed. Install @fission-ai/openspec in the range ${range}`);
  process.exit(1);
}
const found = r.stdout.match(/(\d+)\.(\d+)\.(\d+)/);
if (!found) {
  console.log(`warn: openspec --version printed no version (${r.stdout.trim()}). The range is ${range}`);
  process.exit(2);
}

// Compare numbers, not text: 1.14.2 > 1.9.0.
const cmp = (a, b) => a.reduce((d, x, i) => d || x - b[i], 0);
const v = found.slice(1, 4).map(Number);
const ok = [...range.matchAll(/(>=|<=|>|<|=)?\s*(\d+)\.(\d+)\.(\d+)/g)].every(([, op = "=", ...n]) => {
  const d = cmp(v, n.map(Number));
  return { ">=": d >= 0, "<=": d <= 0, ">": d > 0, "<": d < 0, "=": d === 0 }[op];
});
console.log(`${ok ? "ok" : "warn"}: OpenSpec ${v.join(".")} is ${ok ? "in" : "outside"} the range ${range}`);
process.exit(ok ? 0 : 2);
