// Usage: node scripts/run-metrics.mjs [--label <name>] [--dir <repo>] [--sessions <dir>] <turn.json>...
// Each <turn.json> is the output of one `claude -p --output-format json` turn of one scenario run, in order.
// Prints one Markdown table row: cost, tokens, turns, tool calls, denials, user turns, and time.
// --dir also prints the lines and words of each .md file under <repo>/openspec/, except openspec/schemas/ and openspec/schemas-backup/.
// --sessions is the folder of the session logs. The default is ~/.claude/projects.
// Pass and Checks need a judgment, so the row leaves them as "?".
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args.splice(i, 2)[1];
};
const label = opt("--label") ?? "?";
const dir = opt("--dir");
const sessions = opt("--sessions") ?? join(homedir(), ".claude", "projects");
if (args.length === 0) {
  console.error("run-metrics: give at least one turn JSON file");
  process.exit(1);
}

const turns = args.map((f) => JSON.parse(readFileSync(f, "utf8")));
const sum = (get) => turns.reduce((n, t) => n + (get(t) ?? 0), 0);
const models = new Set(turns.flatMap((t) => Object.keys(t.modelUsage ?? {})));

// Count tool calls by tool_use id, because a log can hold the same call twice.
// ponytail: scans each project folder for <session_id>.jsonl, fine for a few hundred folders.
const toolIds = new Set();
for (const id of new Set(turns.map((t) => t.session_id))) {
  const log = readdirSync(sessions)
    .map((p) => join(sessions, p, `${id}.jsonl`))
    .find((p) => existsSync(p));
  if (!log) {
    console.error(`run-metrics: no session log for ${id} in ${sessions}`);
    process.exit(1);
  }
  for (const line of readFileSync(log, "utf8").split("\n")) {
    if (!line.includes('"tool_use"')) continue;
    for (const c of JSON.parse(line).message?.content ?? []) if (c.type === "tool_use") toolIds.add(c.id);
  }
}

const k = (n) => n.toLocaleString("en-US");
const row = [
  label,
  "?",
  "?",
  sum((t) => t.total_cost_usd).toFixed(3),
  k(sum((t) => t.usage?.output_tokens)),
  k(sum((t) => Object.values(t.modelUsage ?? {}).reduce((n, m) => n + (m.thinkingTokens ?? 0), 0))),
  k(sum((t) => t.usage?.input_tokens) + sum((t) => t.usage?.cache_creation_input_tokens)),
  k(sum((t) => t.usage?.cache_read_input_tokens)),
  sum((t) => t.num_turns),
  toolIds.size,
  sum((t) => t.permission_denials?.length),
  // A --resume turn keeps the session_id. A new session is not a user answer.
  turns.filter((t, i) => i > 0 && t.session_id === turns[i - 1].session_id).length,
  Math.round(sum((t) => t.duration_ms) / 1000),
];
console.log(`| ${row.join(" | ")} |`);
console.log(`Models: ${[...models].join(", ")}`);

if (dir) {
  const root = join(dir, "openspec");
  const walk = (d) =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      if (statSync(p).isDirectory()) return [join(root, "schemas"), join(root, "schemas-backup")].includes(p) ? [] : walk(p);
      return n.endsWith(".md") ? [p] : [];
    });
  console.log("\n| File | Lines | Words |\n| --- | --- | --- |");
  for (const p of existsSync(root) ? walk(root) : []) {
    const text = readFileSync(p, "utf8");
    console.log(`| ${relative(dir, p)} | ${text.split("\n").length - 1} | ${text.split(/\s+/).filter(Boolean).length} |`);
  }
}
