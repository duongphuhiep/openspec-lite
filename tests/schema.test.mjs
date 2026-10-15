// Runs the real openspec CLI on the shipped plan-lite schema in a temp repo.
// The CLI test skips when openspec is not installed, but fails when the CI environment variable is set.
// ponytail: no shell, so on Windows the openspec .cmd shim is not found. CI runs on Linux.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const tmpRoot = mkdtempSync(join(tmpdir(), "openspec-lite-test-"));
after(() => rmSync(tmpRoot, { recursive: true, force: true }));

const assets = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/", import.meta.url));
const hasOpenspec = spawnSync("openspec", ["--version"]).status === 0;
const skip = !hasOpenspec && !process.env.CI ? "openspec CLI not installed" : false;

function repo() {
  const dir = mkdtempSync(join(tmpRoot, "schema-test-"));
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

test("design.md holds the exact shipped apply.instruction text", () => {
  const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8").replace(/\r\n/g, "\n");
  const shipped = read("../package/skills/openspec-lite-schema/assets/plan-lite/schema.yaml")
    .split("  instruction: |\n")[1]
    .replace(/^    /gm, "")
    .trimEnd();
  const design = read("../docs/design.md").split("This is the exact text in `schema.yaml`:\n\n```text\n")[1]?.split("\n```")[0];
  assert.equal(design, shipped);
});

test("upgrade path: spec-driven instructions on a plan-lite change", { skip }, () => {
  const dir = repo();
  assert.equal(os(dir, ["new", "change", "up", "--schema", "plan-lite"]).status, 0);
  for (const [artifact, outputPath] of [
    ["proposal", "proposal.md"],
    ["specs", "specs/**/*.md"],
    ["design", "design.md"],
    ["tasks", "tasks.md"],
  ]) {
    const r = json(dir, ["instructions", artifact, "--change", "up", "--schema", "spec-driven"]);
    assert.equal(r.outputPath, outputPath, artifact);
  }
  assert.match(readFileSync(join(dir, "openspec", "changes", "up", ".openspec.yaml"), "utf8"), /^schema: plan-lite$/m);
});

test("archive path: a plan-lite change with a delta validates and merges", { skip }, () => {
  const dir = repo();
  assert.equal(os(dir, ["new", "change", "promo", "--schema", "plan-lite"]).status, 0);
  const change = join(dir, "openspec", "changes", "promo");
  writeFileSync(join(change, "plan.md"), "## Goal\nX\n## Non-Goals\n## Constraints\n## Open Questions\n## Decisions\n");
  mkdirSync(join(change, "specs", "auth"), { recursive: true });
  writeFileSync(
    join(change, "specs", "auth", "spec.md"),
    "## ADDED Requirements\n\n### Requirement: Login\nThe system SHALL log in users.\n\n#### Scenario: valid login\n- **WHEN** the password is valid\n- **THEN** the user is logged in\n",
  );
  const v = os(dir, ["validate", "promo"]);
  assert.equal(v.status, 0, v.out);
  const a = os(dir, ["archive", "promo", "--yes"]);
  assert.equal(a.status, 0, a.out);
  assert.match(readFileSync(join(dir, "openspec", "specs", "auth", "spec.md"), "utf8"), /Requirement: Login/);
});

test("validate fails on a plan-lite change with no deltas and no skip_specs", { skip }, () => {
  const dir = repo();
  assert.equal(os(dir, ["new", "change", "bare", "--schema", "plan-lite"]).status, 0);
  writeFileSync(join(dir, "openspec", "changes", "bare", "plan.md"), "## Goal\nX\n");
  assert.notEqual(os(dir, ["validate", "bare"]).status, 0);
});
