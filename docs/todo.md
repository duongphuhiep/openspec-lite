# Open Items

These items come from the scenario run on 627b8fb and from the verification runs after it, 2026-11-05. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Items 1 to 13 are closed. Their decisions are D152 to D164 in `docs/decisions.md`. Item 14 is closed by D167. Item 20 is closed by D169.

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

## Found in the run on 62c6fa7

The reports are in `.scenario-runs/20261105-62c6fa7/`.

### 21. Propose can remove the Goal template comment

- **Where**: `package/skills/openspec-lite-propose/SKILL.md`, step 5 ("Keep each `<!-- ... -->` guidance comment").
- **Problem**: in 22a run 1 and in 11, `plan.md` lost the `## Goal` comment. All other comments stayed. The Goal comment is the longest one (D148). The 22a rerun and scenario 9 kept it.
- **Evidence**: `group-H.md` (22a, `/tmp/osl-H22a.g2Jm`), `group-D.md` (11, `/tmp/osl-D11.2MAj`). Now 2 of 6 propose runs in this run.
- **Recommendation**: not decided. Run propose a few more times. One option: write the Goal on the line under the comment with an Edit that keeps the comment, not a full rewrite of the section.

### 22. Upgrade 20a: two possible missed marks, and a new constraint question

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, steps 2 and 3 (D164, D167).
- **Problem**: in 20a, the admin scenario says the system "does not count it", but the requirement says only that the limit does not apply to `/admin/`. The `design.md` Goal "in any 60-second span" comes only from the tasks preview. Neither has a 🤖. The agent also asked "Is C2 a requirement, or only a design constraint?", which the skill does not ask. On 38d9a54, the same constraint became a requirement with no question. No 20a check covers these items.
- **Evidence**: `group-F.md` (20a, session `2d03bd4d`).
- **Recommendation**: not decided. Check the 20a marks in the next run. Decide if each constraint of a planned requirement needs a question.

### 23. Archive after upgrade writes consequences that the user does not see

- **Where**: `package/skills/openspec-lite-archive/SKILL.md`, the ADR copy after the guard (D154). Scenario 18b.
- **Problem**: `design.md` has no consequences, so the agent wrote its own `## Consequences` lines. On 38d9a54, it asked the user to check them. On 62c6fa7, it did not tell the user. One line is a new claim: "The export contains only the data the page has already loaded." This adds to item 17.
- **Evidence**: `group-C.md` (18b).
- **Recommendation**: not decided. One option: the agent names each consequence that `design.md` does not state, and asks the user to check it.

### 24. Upgrade can write a requirement that is stronger than its constraint

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, D166.
- **Problem**: in scenario 7, the requirement "Export makes no server request" is stronger than its constraint, "no new server endpoint". The extra text comes from the tasks preview. The question turn showed it, and the user did not object.
- **Evidence**: `group-C.md` (7).
- **Recommendation**: not decided. Decide if the question turn makes a preview-only text an answer (as the D167 verification found), or if a requirement must keep the words of its constraint.

## Other notes from the run

These need no change now. They are here so that a later run does not report them as new.

- 16b says that stock `/opsx:archive` "can archive with no warning". In practice, the description of `openspec-lite-archive` catches the command, and the agent switches to it. The gap stays only for an agent that does not see the description (group F).
- The scenario allowlist has no `echo`, so a chain that ends in `echo "exit $?"` is denied. This adds noise to the Denials metric. It is not a skill issue (groups A, B, E).
- In scenario 14, the agent skipped the `openspec instructions specs ... --json` call before the first delta. The delta was valid anyway (group E).
- In scenario 15, the "Not drafted" list called a decision a "Fact". No item was lost (group E).
- In scenarios 14 and 15 on 38d9a54, the ADR `## Consequences` held inferences with no mark. D152 applies only to upgrade, and the user approves each archive draft (group E).
- In scenarios 13b and 15 on 38d9a54, the chat replies named `plan.md` IDs such as "C1". D142 covers files only, and no file outside `plan.md` held an ID (groups B, E).
- In scenario 20a, the agent added a Redis outage risk to `design.md` that is not in `plan.md`. It said so in the summary. With D152, this item now gets a 🤖 mark (group F).
- In scenario 9 on 62c6fa7, the schema-replace question did not name the `config.yaml` archive hint. On 38d9a54, it did (group D).
- In scenario 20b on 62c6fa7, turn 3 said "I wrote it as a requirement", then "Nothing is written yet". The disk showed no write (group E).
- In scenario 14 on 62c6fa7, the agent called a permission denial a "parser error" (group E).
