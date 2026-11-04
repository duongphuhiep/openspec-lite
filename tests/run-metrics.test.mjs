import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const tmpRoot = mkdtempSync(join(tmpdir(), "openspec-lite-test-"));
after(() => rmSync(tmpRoot, { recursive: true, force: true }));

const script = fileURLToPath(new URL("../scripts/run-metrics.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

function turn(over) {
  return {
    session_id: "s1",
    total_cost_usd: 0.5,
    num_turns: 10,
    duration_ms: 60000,
    permission_denials: [{}],
    usage: { input_tokens: 100, cache_creation_input_tokens: 900, cache_read_input_tokens: 50000, output_tokens: 2000 },
    modelUsage: { "m-1": { thinkingTokens: 300 } },
    ...over,
  };
}

test("sums the turns, counts each tool call once, and lists the artifacts", () => {
  const d = mkdtempSync(join(tmpRoot, "run-metrics-"));
  mkdirSync(join(d, "sessions", "proj"), { recursive: true });
  const call = (id) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id }] } });
  // The same call twice, as in a real log, then a second call.
  writeFileSync(join(d, "sessions", "proj", "s1.jsonl"), [call("t1"), call("t1"), call("t2")].join("\n"));
  writeFileSync(join(d, "t1.json"), JSON.stringify(turn()));
  writeFileSync(join(d, "t2.json"), JSON.stringify(turn({ permission_denials: [] })));
  mkdirSync(join(d, "repo", "openspec", "changes", "c"), { recursive: true });
  mkdirSync(join(d, "repo", "openspec", "schemas"), { recursive: true });
  writeFileSync(join(d, "repo", "openspec", "changes", "c", "plan.md"), "## Goal\nShip X\n");
  writeFileSync(join(d, "repo", "openspec", "schemas", "skip.md"), "x\n");

  const r = run("--label", "4b", "--sessions", join(d, "sessions"), "--dir", join(d, "repo"), join(d, "t1.json"), join(d, "t2.json"));
  assert.equal(r.status, 0, r.stderr);
  const [row, models] = r.stdout.split("\n");
  assert.equal(row, "| 4b | ? | ? | 1.000 | 4,000 | 600 | 2,000 | 100,000 | 20 | 2 | 1 | 1 | 120 |");
  assert.equal(models, "Models: m-1");
  assert.match(r.stdout, /\| openspec\/changes\/c\/plan\.md \| 2 \| 4 \|/);
  assert.doesNotMatch(r.stdout, /skip\.md/);
});

test("a turn in a new session is not a user turn", () => {
  const d = mkdtempSync(join(tmpRoot, "run-metrics-"));
  mkdirSync(join(d, "sessions", "proj"), { recursive: true });
  writeFileSync(join(d, "sessions", "proj", "s1.jsonl"), "");
  writeFileSync(join(d, "sessions", "proj", "s2.jsonl"), "");
  writeFileSync(join(d, "t1.json"), JSON.stringify(turn()));
  writeFileSync(join(d, "t2.json"), JSON.stringify(turn({ session_id: "s2" })));
  writeFileSync(join(d, "t3.json"), JSON.stringify(turn({ session_id: "s2" })));
  const r = run("--sessions", join(d, "sessions"), join(d, "t1.json"), join(d, "t2.json"), join(d, "t3.json"));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.split("\n")[0].split(" | ").at(-2), "1");
});

test("exits with code 1 if the session log is missing", () => {
  const d = mkdtempSync(join(tmpRoot, "run-metrics-"));
  mkdirSync(join(d, "sessions"));
  writeFileSync(join(d, "t1.json"), JSON.stringify(turn()));
  const r = run("--sessions", join(d, "sessions"), join(d, "t1.json"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no session log for s1/);
});
