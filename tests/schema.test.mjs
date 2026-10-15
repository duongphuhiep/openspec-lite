// Runs the real openspec CLI on the shipped plan-lite schema in a temp repo.
// The CLI test skips when openspec is not installed, but fails when the CI environment variable is set.
// ponytail: no shell, so on Windows the openspec .cmd shim is not found. CI runs on Linux.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assets = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/", import.meta.url));
const hasOpenspec = spawnSync("openspec", ["--version"]).status === 0;
const skip = !hasOpenspec && !process.env.CI ? "openspec CLI not installed" : false;

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "schema-test-"));
  spawnSync("git", ["init", "-q"], { cwd: dir });
  cpSync(assets, join(dir, "openspec", "schemas", "plan-lite"), { recursive: true });
  return dir;
}

const os = (dir, args) => {
  const r = spawnSync("openspec", args, { cwd: dir, encoding: "utf8" });
  return { ...r, out: r.stdout + r.stderr };
};
const json = (dir, args) => JSON.parse(os(dir, [...args, "--json"]).stdout);

test("plan-lite flow: new change, plan template, validate, apply instructions, archive", { skip }, () => {
  const dir = repo();
  assert.equal(os(dir, ["new", "change", "demo", "--schema", "plan-lite"]).status, 0);
  const change = join(dir, "openspec", "changes", "demo");
  appendFileSync(join(change, ".openspec.yaml"), "skip_specs: true\n");

  const plan = json(dir, ["instructions", "plan", "--change", "demo"]);
  assert.equal(plan.outputPath, "plan.md");
  assert.match(plan.template, /## Goal/);
  assert.match(plan.template, /## Decisions/);
  writeFileSync(join(change, "plan.md"), plan.template.replace("## Goal", "## Goal\nShip the demo."));

  assert.equal(os(dir, ["validate", "demo"]).status, 0);

  const apply = json(dir, ["instructions", "apply", "--change", "demo"]);
  assert.equal(apply.state, "ready");
  assert.match(apply.instruction, /This is a plan-lite change/);
  assert.match(apply.instruction, /openspec-lite-archive/);

  const archived = os(dir, ["archive", "demo", "--yes"]);
  assert.equal(archived.status, 0, archived.out);
  const archiveDir = join(dir, "openspec", "changes", "archive");
  const [archivedName] = readdirSync(archiveDir);
  assert.match(archivedName, /^\d{4}-\d{2}-\d{2}-demo$/);
  assert.match(readFileSync(join(archiveDir, archivedName, "plan.md"), "utf8"), /Ship the demo/);
});

test("plan-hash.mjs runs from the installed schema folder", () => {
  const dir = repo();
  writeFileSync(join(dir, "plan.md"), "## Goal\nX\n## Non-Goals\n## Constraints\n");
  const r = spawnSync(process.execPath, ["openspec/schemas/plan-lite/plan-hash.mjs", "plan.md"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout.trim(), /^[0-9a-f]{64}$/);
});
