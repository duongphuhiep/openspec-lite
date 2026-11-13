import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/exit-code.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
const last = (r) => r.stdout.trim().split("\n").at(-1);

test("prints the output, then the exit code, and exits with code 0", () => {
  const r = run(process.execPath, "-e", "console.log('{\"error\":\"x\"}'); process.exit(3)");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^\{"error":"x"\}\n/);
  assert.equal(last(r), "exit: 3");
  assert.equal(last(run(process.execPath, "-e", "")), "exit: 0");
});

test("a command that cannot start, or no command, prints not run", () => {
  // On Windows, the shell starts and reports the missing command itself.
  if (process.platform !== "win32") assert.equal(last(run("no-such-command-osl")), "exit: not run (ENOENT)");
  assert.equal(last(run()), "exit: not run (no command)");
});

test("on Windows, an argument with a shell operator is refused", async () => {
  const { unsafeOnWindows } = await import(script);
  for (const s of ["a&b", "a|b", "a>b", "a<b", "a^b", "%PATH%", 'a"b', "a!b", "a\nb"]) assert.ok(unsafeOnWindows(s), s);
  for (const s of ["validate", "--specs", "openspec/changes/x", "a b", "C:\\x\\y"]) assert.ok(!unsafeOnWindows(s), s);
});
