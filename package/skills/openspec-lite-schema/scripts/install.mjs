// Usage: node install.mjs <repoRoot>
// Installs or replaces openspec/schemas/plan-lite/ in <repoRoot> from this skill's assets/plan-lite/.
// Output: "status: installed|replaced|current|newer", then "backup: <path>" and "copied: <path>" lines.
// Exit codes: 0 installed, replaced, or current. 2 the repo version is higher. 3 the shipped assets are bad.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const shipped = fileURLToPath(new URL("../assets/plan-lite/", import.meta.url));
const repoRoot = process.argv[2] ?? ".";
const target = join(repoRoot, "openspec", "schemas", "plan-lite");

function readVersion(dir) {
  try {
    const m = readFileSync(join(dir, "schema.yaml"), "utf8").match(/^version:\s*(\d+)\s*$/m);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

// ponytail: local time is enough for a human-readable backup name. OPENSPEC_LITE_TIMESTAMP is a test hook.
function timestamp() {
  if (process.env.OPENSPEC_LITE_TIMESTAMP) return process.env.OPENSPEC_LITE_TIMESTAMP;
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(repoRoot, join(e.parentPath, e.name)))
    .sort();
}

const newVersion = readVersion(shipped);
if (newVersion === null) {
  console.error(`install: shipped schema.yaml is missing or has no version: ${shipped}`);
  process.exit(3);
}

const exists = existsSync(target);
const oldVersion = exists ? readVersion(target) : null;

if (exists && oldVersion !== null && oldVersion > newVersion) {
  console.log("status: newer");
  console.error(`install: repo schema v${oldVersion} is newer than shipped v${newVersion}`);
  process.exit(2);
}
if (exists && oldVersion === newVersion) {
  console.log("status: current");
  process.exit(0);
}

let backup = null;
if (exists) {
  const base = join(repoRoot, "openspec", "schemas-backup", `plan-lite-v${oldVersion ?? "unknown"}-${timestamp()}`);
  backup = base;
  for (let i = 2; existsSync(backup); i++) backup = `${base}-${i}`;
  mkdirSync(join(repoRoot, "openspec", "schemas-backup"), { recursive: true });
  renameSync(target, backup);
}
cpSync(shipped, target, { recursive: true });

console.log(`status: ${exists ? "replaced" : "installed"}`);
if (backup) console.log(`backup: ${relative(repoRoot, backup)}`);
for (const f of listFiles(target)) console.log(`copied: ${f}`);
