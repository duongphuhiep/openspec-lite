// Usage: node exit-code.mjs <command> [args...]
// Runs the command with no shell, shows its output, then prints "exit: <code>" as the last line.
// If the command cannot start, the last line is "exit: not run (<error code>)".
// It always exits with code 0, so the agent reads the code from the last line, not from the shell.
import { spawnSync } from "node:child_process";

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.log("exit: not run (no command)");
} else {
  // ponytail: no shell, so a Windows .cmd shim (for example openspec.cmd) does not start; add `shell` on win32 if needed.
  const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
  console.log(r.error ? `exit: not run (${r.error.code})` : `exit: ${r.status ?? `signal ${r.signal}`}`);
}
