# Open Items

These items come from the scenario run on 627b8fb and from the verification runs after it, 2026-11-05. Each item has the problem, the evidence, and a recommendation. No item has a decision yet.

The run reports are in `.scenario-runs/20261105-627b8fb/` (`summary.md` and `group-A.md` to `group-H.md`). This folder is git-ignored, so it exists only on the machine that ran the scenarios. Each item below copies the key evidence.

When you close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from this file.

Items 1 to 13 are closed. Their decisions are D152 to D164 in `docs/decisions.md`. Item 14 is closed by D167. Item 20 is closed by D169.

---

## Found after the run

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

## Found in the run on 3c93237

The reports are in `.scenario-runs/20261105-3c93237/`. The run passed 38 of 39 runs. Items 21 and 22 have new evidence:

- Item 21: 22a kept the Goal comment in 3 of 3 runs. In 22b-3, the comment moved under the Goal line (`group-H.md`).
- Item 22: in 20a, the `proposal.md` Impact line "API docs: the 429 behavior and the `Retry-After` header" comes only from the tasks preview, and has no 🤖. The Redis constraint went to `design.md` with no question (`group-F.md`, session `6e42c353`).

### 26. Scenario 7 has no stable positive 🤖 check

- **Where**: `docs/test-scenarios.md`, scenario 7, the example "Table is empty" from the tasks preview.
- **Problem**: the tasks preview of step 1 did not have an empty-table case. Its other preview-only items went only to `tasks.md`. So the run had no item that needs a 🤖, and the check did not apply.
- **Evidence**: `group-C.md` (7, session `45e99dc1`).
- **Recommendation**: not decided. One option: scenario 7 writes a fixed `tasks-preview.md` with one preview-only scenario, as 20a does for its `plan.md`.

### 28. The schema skill reply skips the copied files

- **Where**: `package/skills/openspec-lite-schema/SKILL.md`, the report of the status, the copied files, and the backup path.
- **Problem**: the reply did not list the copied files in 2 of 3 sessions that ran the schema skill. Scenario 9 failed once for this reason, and passed on the rerun. `docs/facts.md` records the same miss on an earlier run.
- **Evidence**: `group-D.md` (9 run 1, session `18203724`; 11, session `2b7e81dd`).
- **Recommendation**: not decided. One option: `install.mjs` prints the full report, and the skill tells the agent to copy that output.

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
