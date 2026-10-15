import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/check-version.mjs", import.meta.url));
const WORKFLOW = ["propose", "tasks-preview", "apply", "upgrade", "archive"].map((a) => `openspec-lite-${a}`);

// A fixture root with package/skills/. `skills` maps a skill name to its SKILL.md text.
function fixture(schemaVersion, skills) {
  const root = mkdtempSync(join(tmpdir(), "check-version-"));
  const assets = join(root, "package", "skills", "openspec-lite-schema", "assets", "plan-lite");
  mkdirSync(assets, { recursive: true });
  writeFileSync(join(assets, "schema.yaml"), `name: plan-lite\nversion: ${schemaVersion}\n`);
  for (const [name, text] of Object.entries(skills)) {
    mkdirSync(join(root, "package", "skills", name), { recursive: true });
    writeFileSync(join(root, "package", "skills", name, "SKILL.md"), text);
  }
  return root;
}

const marker = (n) => `---\nname: x\n---\n\n1. Check the schema.\n\nShipped schema version: ${n}\n`;
const all = (text) => Object.fromEntries(WORKFLOW.map((s) => [s, text]));
const run = (root) => spawnSync(process.execPath, [script, root], { encoding: "utf8" });

test("a match passes", () => {
  const r = run(fixture(1, all(marker(1))));
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.stdout.trim().split("\n").length, 5);
  assert.match(r.stdout, /^ok openspec-lite-propose 1$/m);
});

test("a mismatch fails", () => {
  const r = run(fixture(2, { ...all(marker(2)), "openspec-lite-apply": marker(1) }));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL openspec-lite-apply: has 1, schema\.yaml has 2$/m);
});

test("a missing marker line fails", () => {
  const r = run(fixture(1, { ...all(marker(1)), "openspec-lite-upgrade": "---\nname: x\n---\nNo marker.\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL openspec-lite-upgrade: no "Shipped schema version" line$/m);
});

test("a missing skill fails", () => {
  const skills = all(marker(1));
  delete skills["openspec-lite-archive"];
  const r = run(fixture(1, skills));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL openspec-lite-archive: SKILL\.md not found$/m);
});

test("a skill with CRLF line endings passes", () => {
  const r = run(fixture(1, { ...all(marker(1)), "openspec-lite-propose": marker(1).replace(/\n/g, "\r\n") }));
  assert.equal(r.status, 0, r.stdout);
});
