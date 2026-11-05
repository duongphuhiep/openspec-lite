# Open Items

These items come from the scenario run on 627b8fb and from the verification runs after it, 2026-11-05. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Items 1 to 13 are closed. Their decisions are D152 to D164 in `docs/decisions.md`. Item 14 is closed by D167.

---

## Found after the run

### 15. Upgrade writes the summary in the prune reply

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, step 4 (prune), and D132: "Show the list, and ask before the delete in the same reply. End the turn ... Do not validate or write the summary before it."
- **Problem**: in the D164 verification, 20c-2 asked the prune question, and in the same reply wrote most of the summary: the written files, the review requests, the 🤖 list, the `skip_specs` state, and the ADR warning. It did not validate. 20c-1 and 7 asked the prune question alone.
- **Evidence**: `.scenario-runs/20261105-D164/report.md`, session `34368e46`, turn 2.
- **Recommendation**: not decided. Run 20c a few more times to see how often it happens before a change. The run on 38d9a54 did not show it again: 20a and 20c ended each prune turn with no summary (group F).

### 16. Stock apply can load `openspec-lite-apply`

- **Where**: `docs/test-scenarios.md`, scenario 4. It checks that stock `/opsx:apply` follows the plan-lite rules from `apply.instruction`.
- **Problem**: in the run on 38d9a54, stock `/opsx:apply` loaded `openspec-lite-apply` by itself in 1 of 2 sessions. The schema does not name that skill. So that run tested the skill, not `apply.instruction` alone. The scenario does not say if this result is a pass.
- **Evidence**: `.scenario-runs/20261105-38d9a54/group-A.md`, session `fc32a327`. The scenario 3 negative session `e51582e6` loaded no skill. No stock apply session on 627b8fb loaded it.
- **Recommendation**: not decided. One option: count it as a pass, as scenario 3 does. To test `apply.instruction` alone, also check the session log for a `Base directory for this skill:` line, and rerun if it names `openspec-lite-apply`.

### 17. Two scenario texts do not cover what the agent did

- **Where**: `docs/test-scenarios.md`, scenarios 18b and 11.
- **Problem**: in 18b, `design.md` has no consequences, so the agent wrote its own `## Consequences` lines and asked the user to check them. The scenario does not say what to expect. In 11, the agent asked the root question and the size question in one reply. The scenario does not say how to answer both.
- **Evidence**: `.scenario-runs/20261105-38d9a54/group-C.md` (18b, `/tmp/osl-C18.GStA/openspec/adr/2026-11-05-generate-csv-in-browser.md`) and `group-D.md` (11).
- **Recommendation**: not decided. For 18b, expect an ADR draft with inferred consequences that the agent names. For 11, answer both questions in one reply.

### 18. The upgrade question turn has no "no requirement" answer

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, step 2 question turn (D164).
- **Problem**: in the D167 verification, 20c-1 asked "Can I write this requirement, or would you give your own?", then listed optional details with "Tell me if any apply". The agent read the answer "none" as "no detail applies". It wrote `specs/audit-log/spec.md` and removed `skip_specs`, so 4 checks of 20c failed.
- **Evidence**: `.scenario-runs/20261105-D167/report-20c.md`, run 20c-1.
- **Recommendation**: not decided. One option: the question turn always offers three answers for a planned requirement: yes, an edit, or no requirement.

### 19. The schema skill does not check its config.yaml write

- **Where**: `package/skills/openspec-lite-schema/SKILL.md`, section 4 (the archive guidance item in `openspec/config.yaml`).
- **Problem**: in the D168 verification, 22a2 sent the `config.yaml` append as a heredoc in a compound command. Claude Code denied it. The agent retried only the other part, and then said in the summary that it added the guidance. `config.yaml` had no change. Without the guidance, the stock `/opsx:archive` hint of D95 is lost.
- **Evidence**: `.scenario-runs/20261105-D168/report.md`, run 22a2, session `4ad37761`.
- **Recommendation**: not decided. One option: after the edit, read `config.yaml` again and check that the item exists. Tell the agent to use the Edit tool, not a heredoc.

### 20. Propose can name a moved-out outcome in Non-Goals

- **Where**: `package/skills/openspec-lite-propose/SKILL.md`, the split check and step 5 ("Do not invent non-goals").
- **Problem**: in the D168 verification, 22b put "Upgrading the logging library in the billing service (a separate change)." in `## Non-Goals`, after the user moved that outcome out. Scenario 22b expects that `plan.md` does not mention it. The rerun passed, and 38d9a54 passed (2 of 3 runs pass).
- **Evidence**: `.scenario-runs/20261105-D168/report.md`, run 22b, `/tmp/osl-N22b.pNnD`.
- **Recommendation**: not decided. One option: "Do not write an outcome that the user moved to a separate change in `plan.md`. The summary names it."

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenarios 14 and 15 on 38d9a54, the ADR `## Consequences` held inferences with no mark. D152 applies only to upgrade, and the user approves each archive draft (group E).
- In scenarios 13b and 15 on 38d9a54, the chat replies named `plan.md` IDs such as "C1". D142 covers files only, and no file outside `plan.md` held an ID (groups B, E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
