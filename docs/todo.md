# Open Items

These items come from the scenario run on 627b8fb, 2026-11-05. All 33 runs passed. No item caused a failure. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Done: item 1 (upgrade asks before a requirement that is not in `plan.md`, and marks inferred items with 🤖, D152), item 2 (upgrade reports the `skip_specs` state at the end, D153), item 3 (archive can offer to copy the decisions to ADRs after its guard, D154), item 4 (archive asks only "Archive anyway?", D155), item 5 (scenario 4 gives a fixed answer to the questions of apply, D156), item 6 (scenario 7 has a fixed prompt and a fixed answer, D157), and item 7 (upgrade keeps the ID comment while a section is left, and scenario 20a accepts a short form, D158), item 8 (scenario 20b picks the item after the skipped list, D159), item 9 (scenario 20c checks only the end state of `skip_specs`, D160), item 10 (scenario 22a states the name check, D161), item 11 (the metrics rules, D162), and item 12 (a restated `plan.md` item gets no 🤖, D163).

---

## Found after the run

### 13. Upgrade writes a requirement from the Goal with no question

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, section "2. Upgrade", step 2.2, the sub-bullet "Write a requirement only from a constraint, a decision, or a fact of `plan.md`, or from an answer of the user. The Goal and `tasks-preview.md` alone are not requirements. ... ask before you write it." (D152).
- **Problem 1**: in the D163 verification, 2 of 3 runs wrote a requirement from the Goal with no question. In 20c-2, the agent wrote "Admin actions are recorded in an audit log". In scenario 7, it wrote "Export the shown rows as CSV". In the f15aba0 runs of 20c, 2 of 2 asked first, so the rule works in some runs only. The step 2.2 header still says "one delta per capability, for the requirements in `plan.md`", but `plan.md` has no section with this name.
- **Problem 2**: D152 counts a decision as a source of a requirement. In 20c-2, the agent wrote "Audit log is stored in the main database" from the decision. This is an internal choice, not a contract. Archive drafts a decision as a requirement only if it is also a contract (D119). Upgrade has no such filter.
- **Evidence**: `.scenario-runs/20261105-D163/report.md`, sessions `1827eeca` (20c-2) and `dba42387` (7).
- **Recommendation**: not decided yet.

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
