import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = (p) => fileURLToPath(new URL(p, import.meta.url));
const change = "fixtures/scenarios/after-preview/openspec/changes/add-csv-export-to-report-page";

test("the after-preview fixture has a current preview", () => {
  const r = spawnSync(process.execPath, [path("../package/skills/openspec-lite-schema/assets/plan-lite/plan-hash.mjs"), path(`${change}/plan.md`)], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(path(`${change}/tasks-preview.md`), "utf8"), new RegExp(`^<!-- plan-sha256: ${r.stdout.trim()} -->$`, "m"));
});
