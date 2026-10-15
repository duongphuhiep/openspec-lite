// Usage: node scripts/check-version.mjs [root]
// Checks that each workflow skill holds "Shipped schema version: <n>" and that each <n> equals the schema version.
// Prints "ok <skill> <n>" or "FAIL <skill>: <reason>" per skill. If schema.yaml has no readable version, it prints
// "FAIL schema.yaml: missing file or version line" only. Exits with code 1 on any failure.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SKILLS = [
  "openspec-lite-propose",
  "openspec-lite-tasks-preview",
  "openspec-lite-apply",
  "openspec-lite-upgrade",
  "openspec-lite-archive",
];
const skillsDir = join(process.argv[2] ?? ".", "package", "skills");

function read(path) {
  try {
    return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  } catch {
    return null;
  }
}

// Same version rule as install.mjs: optional quotes and an optional trailing comment.
const schema = read(join(skillsDir, "openspec-lite-schema", "assets", "plan-lite", "schema.yaml"));
const schemaVersion = schema?.match(/^version:\s*["']?(\d+)["']?\s*(?:#.*)?$/m)?.[1];
if (!schemaVersion) {
  console.log("FAIL schema.yaml: missing file or version line");
  process.exit(1);
}
const expected = Number(schemaVersion);

let failed = false;
for (const skill of SKILLS) {
  const text = read(join(skillsDir, skill, "SKILL.md"));
  // The marker can be indented, so that it stays inside a Markdown list.
  const found = text === null ? [] : [...text.matchAll(/^\s*Shipped schema version: (\d+)\s*$/gm)].map((m) => Number(m[1]));
  const wrong = found.filter((n) => n !== expected);
  if (text === null) console.log(`FAIL ${skill}: SKILL.md not found`);
  else if (found.length === 0) console.log(`FAIL ${skill}: no "Shipped schema version" line`);
  else if (wrong.length > 0) console.log(`FAIL ${skill}: has ${wrong[0]}, schema.yaml has ${expected}`);
  else {
    console.log(`ok ${skill} ${expected}`);
    continue;
  }
  failed = true;
}
process.exit(failed ? 1 : 0);
