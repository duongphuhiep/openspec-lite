# Open Items

These items come from the scenario run on 627b8fb, 2026-11-05. All 33 runs passed. No item caused a failure. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Done:

- Item 1: upgrade asks before a requirement that is not in `plan.md`, and marks inferred items with 🤖 (D152).
- Item 2: upgrade reports the `skip_specs` state at the end (D153).
- Item 3: archive can offer to copy the decisions to ADRs after its guard (D154).
- Item 4: archive asks only "Archive anyway?" (D155).
- Item 5: scenario 4 gives a fixed answer to the questions of apply (D156).
- Item 6: scenario 7 has a fixed prompt and a fixed answer (D157).
- Item 7: upgrade keeps the ID comment while a section is left, and scenario 20a accepts a short form (D158).
- Item 8: scenario 20b picks the item after the skipped list (D159).
- Item 9: scenario 20c checks only the end state of `skip_specs` (D160).
- Item 10: scenario 22a states the name check (D161).
- Item 11: the metrics rules (D162).
- Item 12: a restated `plan.md` item gets no 🤖 (D163).
- Item 13: one question turn before any write, and a decision becomes a requirement only if it is a contract (D164).

---

## Found after the run

### 14. Upgrade marks a scenario that restates its requirement

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, section "2. Upgrade", the 🤖 rule (D152, D163).
- **Problem**: in the D164 verification, scenario 7 put 🤖 on the scenario "Columns follow the on-screen order". It only restates the column-order constraint. The agent said "It adds a scenario to the column-order requirement, which you gave me". Each requirement needs at least one scenario, so the agent may read each scenario as an addition. In 20c-2, "The main database gains storage for the audit log." also had a 🤖, close to a restatement of the decision, and one mark was after the first sentence of a line, not at its end.
- **Evidence**: `.scenario-runs/20261105-D164/report.md`, session `1f497e67` (7) and `34368e46` (20c-2).
- **Recommendation**: not decided. One option: "A scenario that only restates its requirement is not inferred. Mark a scenario only if it adds a case, for example an empty table."

### 15. Upgrade writes the summary in the prune reply

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, step 4 (prune), and D132: "Show the list, and ask before the delete in the same reply. End the turn ... Do not validate or write the summary before it."
- **Problem**: in the D164 verification, 20c-2 asked the prune question, and in the same reply wrote most of the summary: the written files, the review requests, the 🤖 list, the `skip_specs` state, and the ADR warning. It did not validate. 20c-1 and 7 asked the prune question alone.
- **Evidence**: `.scenario-runs/20261105-D164/report.md`, session `34368e46`, turn 2.
- **Recommendation**: not decided. Run 20c a few more times to see how often it happens before a change.

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
