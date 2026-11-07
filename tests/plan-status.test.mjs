import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const tmpRoot = mkdtempSync(join(tmpdir(), "openspec-lite-test-"));
after(() => rmSync(tmpRoot, { recursive: true, force: true }));

const script = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/plan-status.mjs", import.meta.url));
let n = 0;
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, encoding: "utf8" });
const run = (cwd) => spawnSync(process.execPath, [script, "plan.md"], { cwd, encoding: "utf8" });

function repo() {
  const dir = join(tmpRoot, `r${n++}`);
  spawnSync("mkdir", ["-p", dir]);
  git(dir, "init", "-q");
  return dir;
}

test("a committed plan.md prints nothing", () => {
  const dir = repo();
  writeFileSync(join(dir, "plan.md"), "## Goal\n");
  git(dir, "add", "plan.md");
  git(dir, "commit", "-qm", "plan");
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
});

test("a changed or an untracked plan.md prints the note", () => {
  const dir = repo();
  writeFileSync(join(dir, "plan.md"), "## Goal\n");
  assert.match(run(dir).stdout, /^plan\.md is not committed/);
  git(dir, "add", "plan.md");
  git(dir, "commit", "-qm", "plan");
  writeFileSync(join(dir, "plan.md"), "## Goal\nShip X\n");
  assert.match(run(dir).stdout, /^plan\.md is not committed/);
});

test("no git repo prints nothing and exits with code 0", () => {
  const dir = mkdtempSync(join(tmpdir(), "openspec-lite-nogit-"));
  try {
    writeFileSync(join(dir, "plan.md"), "## Goal\n");
    const r = run(dir);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
