# Open Items

These items come from the scenario run on 627b8fb, 2026-11-05. All 33 runs passed. No item caused a failure. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Done: item 1 (upgrade asks before a requirement that is not in `plan.md`, and marks inferred items with 🤖, D152), item 2 (upgrade reports the `skip_specs` state at the end, D153), item 3 (archive can offer to copy the decisions to ADRs after its guard, D154), and item 4 (archive asks only "Archive anyway?", D155).

---

## Scenario text in `docs/test-scenarios.md`

### 5. Scenario 4 does not say how to answer the stale preview and the open questions

- **Problem**: scenario 4 says "On the change from scenario 1, run stock `/opsx:apply`." If it runs after scenario 3, the preview is stale, so apply stops first and offers to regenerate or continue. Also, the done check passes only if the user answers the open questions of scenario 1. The scenario does not say how to answer either one. In the 627b8fb run, the tester answered "I accept your defaults", but the agent had given no defaults. The agent said so, chose answers, and recorded them as decisions.
- **Evidence**: group A, scenario 4 (session `b4dcfba8-4296-49b3-b73d-4800e4a98c04`).
- **Recommendation**: add to the steps: "If apply says that the preview is stale, answer: continue from `plan.md`. Give an answer for each open question."

### 6. Scenario 7 needs an open question, but its prompt has none

- **Problem**: scenario 7 step 1 says "Create a change with a tasks preview (scenario 3, steps 1–2)". Those steps use the scenario 1 prompt "add a CSV export to the report page.", which gives no open question. Step 3 says "Answer each open question". The runs use a longer prompt, with an open question that changes the tasks.
- **Evidence**: group C, `7-setup`, turn 1 (session `62d3ec69-e111-4864-96b8-3c8d3d61d07b`). The prompt was: "openspec-lite-propose: add a CSV export to the report page. Scope: one Export CSV button ... Source: docs/report-page.md and issue #42. Requirement: the export uses the same column order as the table on screen. Decision: generate the CSV in the browser, because the data is already loaded there. Constraint: no new server endpoint. Open question: should the export include hidden columns? (This changes the tasks.)"
- **Recommendation**: put this prompt in scenario 7 step 1. It also gives the D152 check of item 1 a known start state: two constraints, one decision, one fact, and one open question.

### 7. Scenario 20a: the ID comment after the prune, and "by its title"

- **Problem 1**: the last expected bullet of 20a does not say if the ID comment at the top of `plan.md` must stay after the prune. On 92c77ff, the agent deleted it. On 627b8fb, it kept it.
- **Problem 2**: the D142 bullet says each task "names the item by its title". Upgrade step 2.4 allows "the item title, or a short form of its text". On 627b8fb, the agent used short forms, for example "no burst of 200 across a window edge". On 92c77ff, it wrote titles in parentheses.
- **Evidence**: group F, scenario 20a.
- **Recommendation**:
  - Problem 1: say that the ID comment is kept, because the prune deletes only sections whose content moved, and the ID comment is not a section. If no section is left, upgrade deletes `plan.md`, and the comment goes with it.
  - Problem 2: change the bullet to "by its title, or a short form of its text", the same as the skill.

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
