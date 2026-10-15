import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const realScript = fileURLToPath(
  new URL("../package/skills/openspec-lite-schema/scripts/install.mjs", import.meta.url),
);

// A fake skill folder with scripts/install.mjs and assets/plan-lite/ at the given version.
function makeSkill(version) {
  const skill = mkdtempSync(join(tmpdir(), "skill-"));
  mkdirSync(join(skill, "scripts"));
  copyFileSync(realScript, join(skill, "scripts", "install.mjs"));
  if (version !== undefined) {
    mkdirSync(join(skill, "assets", "plan-lite", "templates"), { recursive: true });
    writeFileSync(join(skill, "assets", "plan-lite", "schema.yaml"), `name: plan-lite\nversion: ${version}\n`);
    writeFileSync(join(skill, "assets", "plan-lite", "templates", "plan.md"), "## Goal\n");
  }
  return skill;
}

function makeRepo(version) {
  const repo = mkdtempSync(join(tmpdir(), "repo-"));
  if (version !== undefined) {
    const dir = join(repo, "openspec", "schemas", "plan-lite");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "schema.yaml"), `name: plan-lite\nversion: ${version}\n`);
    writeFileSync(join(dir, "stale.txt"), "old");
  }
  return repo;
}

function install(skill, repo, env = {}) {
  return spawnSync(process.execPath, [join(skill, "scripts", "install.mjs"), repo], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

const schemaOf = (repo) => readFileSync(join(repo, "openspec", "schemas", "plan-lite", "schema.yaml"), "utf8");

test("a first install copies the assets", () => {
  const repo = makeRepo();
  const r = install(makeSkill(1), repo);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^status: installed$/m);
  assert.match(r.stdout, /^copied: openspec[\\/]schemas[\\/]plan-lite[\\/]schema\.yaml$/m);
  assert.match(r.stdout, /^copied: openspec[\\/]schemas[\\/]plan-lite[\\/]templates[\\/]plan\.md$/m);
  assert.doesNotMatch(r.stdout, /^backup:/m);
  assert.match(schemaOf(repo), /version: 1/);
});

test("a lower repo version moves to a timestamped backup, then copies", () => {
  const repo = makeRepo(1);
  const r = install(makeSkill(2), repo, { OPENSPEC_LITE_TIMESTAMP: "20261015-074500" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^status: replaced$/m);
  assert.match(r.stdout, /^backup: openspec[\\/]schemas-backup[\\/]plan-lite-v1-20261015-074500$/m);
  const backup = join(repo, "openspec", "schemas-backup", "plan-lite-v1-20261015-074500");
  assert.ok(existsSync(join(backup, "stale.txt")), "old files are in the backup");
  assert.ok(!existsSync(join(repo, "openspec", "schemas", "plan-lite", "stale.txt")), "no stale files remain");
  assert.match(schemaOf(repo), /version: 2/);
});

test("a repo copy with no readable version counts as lower", () => {
  const repo = makeRepo("x");
  const r = install(makeSkill(1), repo, { OPENSPEC_LITE_TIMESTAMP: "20261015-074500" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^backup: .*plan-lite-vunknown-20261015-074500$/m);
});

test("a second backup with the same timestamp gets a -2 suffix", () => {
  const repo = makeRepo(1);
  const env = { OPENSPEC_LITE_TIMESTAMP: "20261015-074500" };
  install(makeSkill(2), repo, env);
  writeFileSync(join(repo, "openspec", "schemas", "plan-lite", "schema.yaml"), "version: 1\n");
  const r = install(makeSkill(2), repo, env);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^backup: .*plan-lite-v1-20261015-074500-2$/m);
  assert.deepEqual(readdirSync(join(repo, "openspec", "schemas-backup")).sort(), [
    "plan-lite-v1-20261015-074500",
    "plan-lite-v1-20261015-074500-2",
  ]);
});

test("an equal version prints status: current and copies nothing", () => {
  const repo = makeRepo(1);
  const r = install(makeSkill(1), repo);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "status: current");
  assert.ok(existsSync(join(repo, "openspec", "schemas", "plan-lite", "stale.txt")));
});

test("a higher repo version exits with code 2 and copies nothing", () => {
  const repo = makeRepo(3);
  const r = install(makeSkill(2), repo);
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^status: newer$/m);
  assert.match(schemaOf(repo), /version: 3/);
});

test("missing shipped assets exit with code 3", () => {
  const r = install(makeSkill(), makeRepo());
  assert.equal(r.status, 3);
});

test("a quoted higher repo version still exits with code 2", () => {
  const repo = makeRepo('"3" # pinned');
  const r = install(makeSkill(2), repo);
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^status: newer$/m);
});

test("a file system error exits with code 1 and an install: message", () => {
  const file = join(mkdtempSync(join(tmpdir(), "notdir-")), "repo");
  writeFileSync(file, "I am a file");
  const r = install(makeSkill(1), file);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^install: /m);
  assert.doesNotMatch(r.stderr, /at .*install\.mjs/, "no stack trace");
});
