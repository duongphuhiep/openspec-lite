// Usage: node exit-code.mjs <command> [args...]
// Runs the command (through a shell on Windows only, as openspec-version.mjs does), shows its output, then prints "exit: <code>" as the last line.
// If the command cannot start, the last line is "exit: not run (<error code>)".
// It always exits with code 0, so the agent reads the code from the last line, not from the shell.
import { spawnSync } from "node:child_process";

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.log("exit: not run (no command)");
} else {
  // ponytail: the Windows shell starts .cmd shims such as openspec.cmd, but an argument with a space needs quotes there.
  const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], shell: process.platform === "win32" });
  console.log(r.error ? `exit: not run (${r.error.code})` : `exit: ${r.status ?? `signal ${r.signal}`}`);
}
