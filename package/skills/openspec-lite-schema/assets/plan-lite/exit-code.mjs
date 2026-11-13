// Usage: node exit-code.mjs <command> [args...]
// Runs the command (through a shell on Windows only, as openspec-version.mjs does), shows its output, then prints "exit: <code>" as the last line.
// If the command cannot start, the last line is "exit: not run (<error code>)".
// It always exits with code 0, so the agent reads the code from the last line, not from the shell.
// Security: this script runs any command that it gets. A permission rule that allows this script allows each command.
// Give the agent a narrow allow rule for the real commands, not a rule for this script.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

// The Windows shell reads these characters as operators, so an argument with one of them could start a second command.
export const unsafeOnWindows = (s) => /[&|<>^%"!\r\n]/.test(s);

// Run only as a script, not on import. realpathSync resolves a symlink, for example /tmp on macOS.
if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [cmd, ...args] = process.argv.slice(2);
  const win = process.platform === "win32";
  if (!cmd) {
    console.log("exit: not run (no command)");
  } else if (win && [cmd, ...args].some(unsafeOnWindows)) {
    console.log("exit: not run (unsafe argument)");
  } else {
    // ponytail: the Windows shell starts .cmd shims such as openspec.cmd, which Node does not start with no shell. An argument with a space needs quotes there.
    const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], shell: win });
    console.log(r.error ? `exit: not run (${r.error.code})` : `exit: ${r.status ?? `signal ${r.signal}`}`);
  }
}
