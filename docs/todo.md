# Open Items

These items come from the scenario run on 627b8fb, 2026-11-05. All 33 runs passed. No item caused a failure. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Done: item 1 (upgrade asks before a requirement that is not in `plan.md`, and marks inferred items with 🤖, D152), item 2 (upgrade reports the `skip_specs` state at the end, D153), item 3 (archive can offer to copy the decisions to ADRs after its guard, D154), item 4 (archive asks only "Archive anyway?", D155), item 5 (scenario 4 gives a fixed answer to the questions of apply, D156), item 6 (scenario 7 has a fixed prompt and a fixed answer, D157), and item 7 (upgrade keeps the ID comment while a section is left, and scenario 20a accepts a short form, D158), item 8 (scenario 20b picks the item after the skipped list, D159), item 9 (scenario 20c checks only the end state of `skip_specs`, D160), and item 10 (scenario 22a states the name check, D161).

---

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

## Found after the run

### 12. Upgrade puts 🤖 on items that come from `plan.md`

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, section "2. Upgrade", step 2, the 🤖 rule (D152).
- **Problem**: the rule says to mark an item that "comes from no section of `plan.md` and from no answer of the user". In a rerun of scenario 20c on f15aba0, 2 of 2 runs also marked items that come from `plan.md`. Run 1 marked "The main database holds the audit log." in `proposal.md`, which comes from the decision. Run 2 marked the goal "Record admin actions in an audit log." in `design.md`, which comes from the Goal. Each run marked the inferred Why line of `proposal.md` correctly.
- **Why it matters**: a mark on a `plan.md` item makes the user review it again, and it teaches the user to ignore the mark. A wrong mark is safer than a missing mark, but too many marks hide the real inferred items.
- **Evidence**: `.scenario-runs/20261105-f15aba0-20c/report.md`, sessions `6f9d0b69` and `86c4ac0f`.
- **Recommendation**: not decided. Options: name the common cases in the rule ("A restated Goal, constraint, decision, or fact is not inferred, also in other words or in another section"), or mark only in `specs/` and `design.md` → `## Decisions`, where an inferred item becomes a contract or a decision.

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
