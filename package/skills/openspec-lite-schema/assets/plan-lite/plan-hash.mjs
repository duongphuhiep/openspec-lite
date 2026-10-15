// Usage: node plan-hash.mjs <plan.md>
// Hashes only Goal, Non-Goals, and Constraints. Ignores line endings, whitespace, and section order.
// Exits with code 1 if the file cannot be read or one of these headings is missing.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const KEEP = ["Goal", "Non-Goals", "Constraints"];
let text;
try {
  text = readFileSync(process.argv[2], "utf8");
} catch {
  console.error(`plan-hash: cannot read ${process.argv[2]}`);
  process.exit(1);
}
text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const sections = text.split(/^## /m).slice(1);
const titles = sections.map((s) => s.split("\n")[0].trim());
const missing = KEEP.filter((k) => !titles.includes(k));
if (missing.length > 0) {
  console.error(`plan-hash: missing heading: ${missing.map((k) => `## ${k}`).join(", ")}`);
  process.exit(1);
}
const kept = sections
  .filter((s) => KEEP.includes(s.split("\n")[0].trim()))
  .map((s) => s.replace(/\s+/g, " ").trim())
  .sort();
console.log(createHash("sha256").update(kept.join("\n")).digest("hex"));
