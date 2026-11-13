// The skills hold the same text for the shared common checks. This test fails if one copy drifts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (skill) =>
  readFileSync(fileURLToPath(new URL(`../package/skills/openspec-lite-${skill}/SKILL.md`, import.meta.url)), "utf8").replace(/\r\n/g, "\n");

// The text of a "### <title>" block, up to the next "### " or "## " heading.
const block = (text, title) => {
  const start = text.indexOf(`\n### ${title}\n`);
  if (start < 0) return undefined;
  const rest = text.slice(start + 1);
  const end = rest.slice(4).search(/\n#{2,3} /);
  return (end < 0 ? rest : rest.slice(0, end + 4)).trimEnd();
};

const shared = {
  "OpenSpec root": ["apply", "archive", "tasks-preview", "upgrade", "propose", "schema"],
  "Change selection": ["apply", "archive", "tasks-preview", "upgrade"],
  "Schema check": ["apply", "archive", "tasks-preview", "upgrade", "propose"],
  "Failure rule": ["apply", "archive", "tasks-preview", "upgrade", "propose", "schema"],
};

for (const [title, skills] of Object.entries(shared)) {
  test(`the "${title}" block is the same in ${skills.join(", ")}`, () => {
    const [first, ...others] = skills;
    const expected = block(read(first), title);
    assert.ok(expected, `${first} has no "### ${title}" block`);
    for (const skill of others) assert.equal(block(read(skill), title), expected, `${skill} differs from ${first}`);
  });
}

test("apply.instruction holds the same failure rule as the skills", () => {
  const yaml = readFileSync(fileURLToPath(new URL("../package/skills/openspec-lite-schema/assets/plan-lite/schema.yaml", import.meta.url)), "utf8").replace(/\r\n/g, "\n");
  const instr = yaml.split("  instruction: |\n")[1].replace(/^    /gm, "");
  const rule = block(instr.replace(/^## /gm, "### "), "Failure rule");
  assert.ok(rule, "apply.instruction has no failure rule");
  assert.equal(rule, block(read("apply"), "Failure rule"));
});
