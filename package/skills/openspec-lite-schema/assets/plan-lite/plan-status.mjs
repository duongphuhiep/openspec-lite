// Usage: node plan-status.mjs <plan.md>
// Runs `git status --porcelain -- <plan.md>`. If plan.md has changes that are not committed, or is not tracked,
// it prints the note for the user. Otherwise, and if git fails (for example with no git repo), it prints nothing.
// It always exits with code 0.
import { spawnSync } from "node:child_process";

const r = spawnSync("git", ["status", "--porcelain", "--", process.argv[2] ?? "plan.md"], { encoding: "utf8" });
if (r.status === 0 && r.stdout.trim()) {
  console.log("plan.md is not committed. Git diff cannot show only this run's changes.");
}
