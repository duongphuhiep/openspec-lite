// Usage: node plan-hash.mjs <plan.md>
// Hashes Goal, Non-Goals, Constraints, and Background (optional). Ignores line endings, whitespace, section order, and HTML comments.
// A "## " line inside a fenced code block is content, not a heading.
// Exits with code 1 if the file cannot be read, a required heading is missing, or a hashed heading has the wrong letter case.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const KEEP = ["Goal", "Non-Goals", "Constraints", "Background"];
const REQUIRED = ["Goal", "Non-Goals", "Constraints"];
let text;
try {
  text = readFileSync(process.argv[2], "utf8");
} catch {
  console.error(`plan-hash: cannot read ${process.argv[2]}`);
  process.exit(1);
}
text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Split into { title, body } sections at "## " lines outside fenced code blocks.
// As in CommonMark, a fence closes only with the same character, at least the same length, and no info string.
const sections = [];
let fence = null;
for (const line of text.split("\n")) {
  const f = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  const wasFenced = fence !== null;
  if (fence === null && f) fence = f[1];
  else if (fence !== null && f && f[1][0] === fence[0] && f[1].length >= fence.length && f[2].trim() === "") fence = null;
  else if (fence === null && line.startsWith("## ")) {
    sections.push({ title: line.slice(3).trim(), body: [] });
    continue;
  }
  sections.at(-1)?.body.push({ line, fenced: wasFenced || fence !== null });
}

// Strip HTML comments only outside fences. A comment inside a fence is content.
// Each section is stripped on its own, so a stray "<!--" cannot hide a heading.
function stripComments(body) {
  const strip = (lines) => lines.join("\n").replace(/<!--[\s\S]*?-->/g, "");
  const out = [];
  let prose = [];
  for (const { line, fenced } of body) {
    if (!fenced) {
      prose.push(line);
      continue;
    }
    out.push(strip(prose), line);
    prose = [];
  }
  out.push(strip(prose));
  return out.join("\n");
}

const titles = sections.map((s) => s.title);
const missing = REQUIRED.filter((k) => !titles.includes(k));
if (missing.length > 0) {
  console.error(`plan-hash: missing heading: ${missing.map((k) => `## ${k}`).join(", ")}`);
  process.exit(1);
}
// A wrong letter case would drop an optional section from the hash with no error.
const wrongCase = titles.filter((t) => !KEEP.includes(t) && KEEP.some((k) => k.toLowerCase() === t.toLowerCase()));
if (wrongCase.length > 0) {
  console.error(`plan-hash: wrong letter case in heading: ${wrongCase.map((t) => `## ${t}`).join(", ")}`);
  process.exit(1);
}
// An empty optional section hashes the same as a missing one.
const kept = sections
  .filter((s) => KEEP.includes(s.title))
  .map((s) => ({ title: s.title, body: stripComments(s.body).replace(/\s+/g, " ").trim() }))
  .filter((s) => REQUIRED.includes(s.title) || s.body !== "")
  .map((s) => `${s.title} ${s.body}`.trim())
  .sort();
console.log(createHash("sha256").update(kept.join("\n")).digest("hex"));
