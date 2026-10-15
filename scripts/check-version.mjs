// Usage: node scripts/check-version.mjs [root]
// Checks that each workflow skill holds "Shipped schema version: <n>" and that <n> equals the schema version.
// Prints "ok <skill> <n>" or "FAIL <skill>: <reason>" per skill. Exits with code 1 on any failure.
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

const schema = read(join(skillsDir, "openspec-lite-schema", "assets", "plan-lite", "schema.yaml"));
const schemaVersion = schema?.match(/^version:\s*(\d+)\s*$/m)?.[1];
if (!schemaVersion) {
  console.log("FAIL schema.yaml: missing file or version line");
  process.exit(1);
}

let failed = false;
for (const skill of SKILLS) {
  const text = read(join(skillsDir, skill, "SKILL.md"));
  const n = text?.match(/^Shipped schema version: (\d+)$/m)?.[1];
  if (text === null) console.log(`FAIL ${skill}: SKILL.md not found`);
  else if (!n) console.log(`FAIL ${skill}: no "Shipped schema version" line`);
  else if (n !== schemaVersion) console.log(`FAIL ${skill}: has ${n}, schema.yaml has ${schemaVersion}`);
  else {
    console.log(`ok ${skill} ${n}`);
    continue;
  }
  failed = true;
}
process.exit(failed ? 1 : 0);
