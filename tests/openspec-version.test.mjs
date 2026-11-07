import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

const tmpRoot = mkdtempSync(join(tmpdir(), "openspec-lite-test-"));
after(() => rmSync(tmpRoot, { recursive: true, force: true }));

const assets = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/", import.meta.url));
let n = 0;

// A schema folder with the script, a schema.yaml, and a fake `openspec` on PATH that prints `out` and exits with `code`.
function run({ schema = 'openspec-version: ">=1.9.0 <2.0.0"\n', out = "1.14.2", code = 0 } = {}) {
  const dir = join(tmpRoot, `case-${n++}`);
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  copyFileSync(join(assets, "openspec-version.mjs"), join(dir, "openspec-version.mjs"));
  writeFileSync(join(dir, "schema.yaml"), schema);
  writeFileSync(join(bin, "openspec"), `#!/bin/sh\necho "${out}"\nexit ${code}\n`);
  chmodSync(join(bin, "openspec"), 0o755);
  const env = { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` };
  return spawnSync(process.execPath, [join(dir, "openspec-version.mjs")], { encoding: "utf8", env });
}

const skip = process.platform === "win32" && "the fake openspec is a sh script";

test("1.14.2 is in >=1.9.0 <2.0.0 (numbers, not text)", { skip }, () => {
  const r = run();
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "ok: OpenSpec 1.14.2 is in the range >=1.9.0 <2.0.0");
});

test("a version above or below the range exits with code 2", { skip }, () => {
  assert.equal(run({ out: "2.0.0" }).status, 2);
  assert.match(run({ out: "1.8.9" }).stdout, /^warn: OpenSpec 1\.8\.9 is outside the range/);
});

test("the bounds and a prefix in the output", { skip }, () => {
  assert.equal(run({ out: "1.9.0" }).status, 0);
  assert.equal(run({ out: "openspec version 1.10.0" }).status, 0);
});

test("a failed command exits with code 1 and names the range", { skip }, () => {
  const r = run({ code: 127 });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^fail: openspec --version failed\. Install @fission-ai\/openspec in the range >=1\.9\.0 <2\.0\.0/);
});

test("output with no version exits with code 2", { skip }, () => {
  assert.equal(run({ out: "unknown" }).status, 2);
});

test("schema.yaml with no openspec-version line exits with code 1", { skip }, () => {
  assert.equal(run({ schema: "name: plan-lite\n" }).status, 1);
});

test("a range that the script cannot read exits with code 1", { skip }, () => {
  assert.equal(run({ schema: 'openspec-version: "^1.9.0"\n' }).status, 1);
  assert.equal(run({ schema: 'openspec-version: "1.x"\n' }).status, 1);
});

test("the shipped schema.yaml has a readable range", { skip }, () => {
  const r = run({ schema: readFileSync(join(assets, "schema.yaml"), "utf8") });
  assert.equal(r.status, 0, r.stdout);
});
