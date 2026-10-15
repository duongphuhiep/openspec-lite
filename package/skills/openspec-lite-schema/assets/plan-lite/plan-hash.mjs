// Usage: node plan-hash.mjs <plan.md>
// Hashes only Goal, Non-Goals, and Constraints. Ignores line endings, whitespace, and section order.
// A "## " line inside a fenced code block is content, not a heading.
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

// Split into { title, body } sections at "## " lines outside ``` or ~~~ fences.
const sections = [];
let fence = null;
for (const line of text.split("\n")) {
  const f = line.match(/^\s*(`{3,}|~{3,})/);
  if (f && (fence === null || f[1][0] === fence[0])) fence = fence === null ? f[1] : null;
  if (fence === null && !f && line.startsWith("## ")) sections.push({ title: line.slice(3).trim(), body: [] });
  else sections.at(-1)?.body.push(line);
}

const titles = sections.map((s) => s.title);
const missing = KEEP.filter((k) => !titles.includes(k));
if (missing.length > 0) {
  console.error(`plan-hash: missing heading: ${missing.map((k) => `## ${k}`).join(", ")}`);
  process.exit(1);
}
const kept = sections
  .filter((s) => KEEP.includes(s.title))
  .map((s) => `${s.title}\n${s.body.join("\n")}`.replace(/\s+/g, " ").trim())
  .sort();
console.log(createHash("sha256").update(kept.join("\n")).digest("hex"));
