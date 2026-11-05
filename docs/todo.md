# Open Items

These items come from the scenario run on 627b8fb, 2026-11-05. All 33 runs passed. No item caused a failure. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Done: item 1 (upgrade asks before a requirement that is not in `plan.md`, and marks inferred items with 🤖, D152), item 2 (upgrade reports the `skip_specs` state at the end, D153), item 3 (archive can offer to copy the decisions to ADRs after its guard, D154), item 4 (archive asks only "Archive anyway?", D155), item 5 (scenario 4 gives a fixed answer to the questions of apply, D156), item 6 (scenario 7 has a fixed prompt and a fixed answer, D157), and item 7 (upgrade keeps the ID comment while a section is left, and scenario 20a accepts a short form, D158).

---

## Scenario text in `docs/test-scenarios.md`

### 8. Scenario 20b: the user picks the item before the full drafts

- **Problem**: 20b says "In the reply to the drafts, pick the toolbar item". But archive first stops at the done check with a short plan of the drafts. So the user picks the item in turn 2, before the full drafts.
- **Evidence**: group E, scenario 20b, turns 1–2. The last run was the same.
- **Recommendation**: change the step to "In the reply to the draft plan or the drafts, pick the toolbar item."

### 9. Scenario 20c checks only the end state of `skip_specs`

- **Problem**: upgrade step 1 removes `skip_specs: true`, and step 2.2 puts it back if the user has no requirement. In 20c, the agent never removed the line, and no tool call touched it. The end state is correct, so the scenario passes. It does not check the order of the steps.
- **Evidence**: group F, scenario 20c.
- **Recommendation**: keep the check on the end state only. The order has no effect that a user can see, and D153 changes the report to the end state too. Add one sentence to 20c that says so, so that a tester does not report it again.

### 10. Scenario 22a: the example change name

- **Problem**: 22a says "Its name comes from the first outcome, for example `add-csv-export`". Each run chose `report-csv-export`: the 627b8fb run and the three D149 reruns. The rule holds, but a tester can read the example as the expected name.
- **Evidence**: group H, scenario 22a, and `.scenario-runs/20261104-f0a5cad-D148/report.md`.
- **Recommendation**: write "for example `add-csv-export` or `report-csv-export`", or "a name from the CSV export only, with no word from the time zone fix".

## Metrics

### 11. The metrics rules for shared sessions, backups, and subfolder roots

- **Problem 1**: "Metrics" asks for one row for each scenario run. It does not say what to do when more than one scenario shares a session, as scenarios 1, 3, and 4 do. Group A made one row for each session.
- **Problem 2**: `run-metrics.mjs --dir` skips only `openspec/schemas/`. In scenario 9, it counted `openspec/schemas-backup/.../templates/plan.md` as an artifact.
- **Problem 3**: in scenario 11, the OpenSpec root is `svc/`. `--dir <temp folder>` finds no `openspec/` folder. The tester must give `--dir <temp>/svc`, and the text does not say this.
- **Problem 4**: the script has no `--help`. `--help` fails with `ENOENT: open '--help'`. It makes one row for each call, so the tester adds the total row by hand.
- **Evidence**: groups A, D, and H.
- **Recommendation**:
  - Problem 1: say "one row for each session. If scenarios share a session, name all of them in the label, for example `1+3`".
  - Problem 2: skip `openspec/schemas-backup/` too. This is a one-line change in `scripts/run-metrics.mjs`, with a test.
  - Problem 3: say "use the OpenSpec root of the scenario for `--dir`".
  - Problem 4: skip `--help` and the total row until a run needs them.

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
