import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const tmpRoot = mkdtempSync(join(tmpdir(), "openspec-lite-test-"));
after(() => rmSync(tmpRoot, { recursive: true, force: true }));

const script = fileURLToPath(
  new URL("../package/skills/openspec-lite-schema/assets/plan-lite/plan-hash.mjs", import.meta.url),
);
const dir = mkdtempSync(join(tmpRoot, "plan-hash-"));
let n = 0;

function hash(content) {
  const file = join(dir, `plan-${n++}.md`);
  writeFileSync(file, content);
  return spawnSync(process.execPath, [script, file], { encoding: "utf8" });
}

const base = "## Goal\nShip X\n\n## Non-Goals\nNo Y\n\n## Constraints\nKeep Z\n\n## Open Questions\nQ1?\n\n## Decisions\n";
const baseWithBackground = "## Goal\nShip X\n\n## Background\nScope: A, B\n\n## Non-Goals\nNo Y\n\n## Constraints\nKeep Z\n\n## Open Questions\nQ1?\n\n## Decisions\n";

test("same plan gives a 64-char hex hash", () => {
  const r = hash(base);
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), /^[0-9a-f]{64}$/);
});

test("a plan with no comments and no Background keeps its schema v1 hash", () => {
  assert.equal(hash(base).stdout.trim(), "15893b4d8739ddf6a4f728903e8ae5335a5c518453b727c3d4345cba128c6b8a");
});

test("CRLF, BOM, section order, Open Questions, and Decisions do not change the hash", () => {
  const ref = hash(base).stdout;
  assert.equal(hash(base.replace(/\n/g, "\r\n")).stdout, ref, "CRLF");
  assert.equal(hash("\uFEFF" + base).stdout, ref, "BOM");
  assert.equal(
    hash("## Constraints\nKeep Z\n\n## Goal\nShip X\n\n## Non-Goals\nNo Y\n").stdout,
    ref,
    "order and removed sections",
  );
  assert.equal(hash(base.replace("Q1?", "")).stdout, ref, "Open Questions");
  assert.equal(hash(base + "### Decision: A\nChose A because B.\n").stdout, ref, "Decisions");
  assert.equal(hash(base.replace("Keep Z", "Keep   Z\n")).stdout, ref, "whitespace");
});

test("a changed Constraint changes the hash", () => {
  assert.notEqual(hash(base.replace("Keep Z", "Keep W")).stdout, hash(base).stdout);
});

test("HTML comments do not change the hash", () => {
  const ref = hash(base).stdout;
  assert.equal(hash(base.replace("Ship X", "<!-- intent --> Ship X")).stdout, ref, "inline comment");
  assert.equal(hash(base.replace("## Goal\nShip X", "## Goal\n<!-- one-line comment -->\nShip X")).stdout, ref, "comment line");
  assert.equal(hash(base.replace("Keep Z", "Keep Z\n<!-- two\nlines -->")).stdout, ref, "multi-line comment");
});

test("a comment inside a fence is content", () => {
  const fenced = (c) => hash(base.replace("Keep Z", "Keep Z\n```html\n<!-- " + c + " -->\n```")).stdout;
  assert.notEqual(fenced("a"), fenced("b"));
});

test("a stray <!-- cannot hide a heading", () => {
  const r = hash(base.replace("Ship X", "Ship <!-- X").replace("Keep Z", "Keep Z -->"));
  assert.equal(r.status, 0, r.stderr);
});

test("Background: absent and empty give the same hash, content changes it", () => {
  const ref = hash(base);
  assert.equal(ref.status, 0, "absent is not an error");
  assert.equal(hash(base.replace("## Non-Goals", "## Background\n<!-- hint -->\n\n## Non-Goals")).stdout, ref.stdout, "empty");
  assert.notEqual(hash(baseWithBackground).stdout, ref.stdout, "added");
  assert.notEqual(hash(baseWithBackground.replace("Scope: A, B", "Scope: A, C")).stdout, hash(baseWithBackground).stdout, "changed");
});

test("the shipped template hashes with no error", () => {
  const template = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/templates/plan.md", import.meta.url));
  const r = spawnSync(process.execPath, [script, template], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test("a missing heading exits with code 1 and names it", () => {
  const r = hash(base.replace("## Non-Goals", "## Non-goals"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing heading: ## Non-Goals/);
});

test("a hashed heading with the wrong letter case exits with code 1", () => {
  const r = hash(baseWithBackground.replace("## Background", "## background"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /wrong letter case in heading: ## background/);
});

test("a missing file exits with code 1", () => {
  const r = spawnSync(process.execPath, [script, join(dir, "nope.md")], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /cannot read/);
});

test("a heading inside a fenced code block is content, not a heading", () => {
  const fenced = "## Goal\nX\n## Non-Goals\n```md\n## Constraints\n```\n";
  const r = hash(fenced);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing heading: ## Constraints/);
  const withBlock = (inner) => hash(base.replace("Keep Z", "Keep Z\n~~~\n## " + inner + "\n~~~")).stdout;
  assert.notEqual(withBlock("A"), withBlock("B"), "fenced content in Constraints is hashed");
});

test("a fence closes only with the same character, at least the same length, and no info string", () => {
  const nested = "## Goal\nX\n## Non-Goals\n````md\n```\n## Constraints\n```\n````\n";
  const infoString = "## Goal\nX\n## Non-Goals\n```\n```js\n## Constraints\n```\n";
  for (const plan of [nested, infoString]) {
    const r = hash(plan);
    assert.equal(r.status, 1, plan);
    assert.match(r.stderr, /missing heading: ## Constraints/);
  }
});
