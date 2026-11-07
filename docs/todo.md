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

## Found in the scenario audit of 2026-11-07

### 31. Stock `/opsx:archive` with no archive guidance, and the `openspec archive` CLI

- **Where**: `openspec/config.yaml` archive guidance (D95), and the old scenarios 16b and 16c, which D190 removed.
- **Problem**: if the user deletes the openspec-lite guidance item, or runs `openspec archive <name> --yes` in a terminal, no openspec-lite rule reaches the archive. The knowledge of `plan.md` then stays only in `openspec/changes/archive/`. In the runs on 62c6fa7 and 3c93237, stock `/opsx:archive` still switched to `openspec-lite-archive` because of the skill description. The CLI archives with no warning (`docs/facts.md`).
- **Target**: each archive path of a plan-lite change promotes `plan.md`, or warns before the archive.
- **Recommendation**: not decided. Options: a stronger guard in `apply.instruction` or in the done check, or a README warning only.

## Found in the run on 80d076b

The reports are in `.scenario-runs/20261107-80d076b/` (`summary.md` and `group-A.md` to `group-I.md`). D192 closes items 28 and 32 to 42.

## Found in the rerun on dd7ad75

The reports are in `.scenario-runs/20261108-dd7ad75/`. D193 closes items 43 to 47.

## Found in the run on 5aa0025

The reports are in `.scenario-runs/20261108-5aa0025/` (`summary.md` and `group-A.md` to `group-I.md`). 30 of 41 runs pass. Scenarios 4, 18b, 20a, 4c, and 4d fail in each run.

### 48. Apply gives 🤖 decisions a reason with no source, or a false reason

- **Where**: `apply.instruction` of `schema.yaml`, D177. Scenario 4.
- **Problem**: run 1: "a `package.json` is not wanted", which the user did not say. Rerun: "`"type": "module"` makes files load as ES modules in both Node and the browser". This is false. D192 did not fix this.
- **Evidence**: `group-A.md` (4, 2 of 2 runs).
- **Recommendation**: not decided. One option: a 🤖 decision with no source for its reason writes "Reason not checked", not a guess. The scenario text must also say if a 🤖 mark excuses a weak reason.

### 49. D193 item 3 is over-applied

- **Where**: `apply.instruction`, the rule for an open question that only the user can answer.
- **Problem**: in the scenario 4 rerun, apply gave no recommendation for any open question. Only OQ1 (where the page is) needs the user. Run 1 gave a recommendation for OQ2 and OQ3.
- **Evidence**: `group-A.md` (4 rerun, 1 of 3 sessions).
- **Recommendation**: not decided. Say in the rule that each other question still gets a recommendation.

### 50. Apply writes a test that does not fail on the old behavior

- **Where**: `apply.instruction`, the test rule (D192). Scenarios 4b and 4d.
- **Problem**: in 4b run 1, the sliding-window test also passes on the fixed window of turn 1. In 4d-2, apply wrote no test, with "the repo has no test setup". `node:test` needs no setup.
- **Evidence**: `group-A.md` (4b), `group-I.md` (4d-2).
- **Recommendation**: not decided. Options: the agent runs the new test against the old code once, and says that `node:test` needs no setup.

### 51. Archive after an upgrade does not name the open question of a kept `plan.md`

- **Where**: `package/skills/openspec-lite-archive/SKILL.md`, step 3 (D193 item 4). Scenario 18b.
- **Problem**: after the ADRs, the agent did not name the open question. The rule is one sentence in a long paragraph, with no fixed place in the reply. One draft also asked to remove a 🤖 from `design.md`, against the guard.
- **Evidence**: `group-C.md` (18b, 2 of 2 runs). The 18b step 4 also needs one more user turn ("I removed both marks.").
- **Recommendation**: not decided. One option: a fixed line in the reply before the archive question, for example "Open in `plan.md`: …".

### 52. Upgrade writes a pointer to a kept open question in `design.md`

- **Where**: `package/skills/openspec-lite-upgrade/SKILL.md`, step 2.3 (D133). Scenarios 20a and 19.
- **Problem**: `design.md` → Risks says "See the open questions in tasks.md" or "See task 0.3". A later session saw this, and did not remove it. In 1 of 2 runs of 20a, upgrade also skipped the resume question of step 1.3. In 19-3, after "no", it did not name the open question that stays in `plan.md`.
- **Evidence**: `group-F.md` (20a, 2 of 2), `group-C.md` (3 runs, 19-3).
- **Recommendation**: not decided. One option: a check before `validate` that `design.md` names no task ID and no "open question".

### 53. The preview cannot read an exit code when `echo $?` is denied

- **Where**: `package/skills/openspec-lite-tasks-preview/SKILL.md`, the fact rules (D184). Scenarios 4c and 4d.
- **Problem**: the allowlist denied each `echo $?` form. In 4d-1, the fact says "The exit code was not checked". In 4c-2, the decision relies on an error body with no exit code fact.
- **Evidence**: `group-I.md` (4c-2, 4d-1).
- **Recommendation**: not decided. One option: a small script that runs a command and prints its exit code, as D193 added for the git note.

### 54. A fact that only repeats the code or an `ls` result

- **Where**: the `## Facts` template comment, "A non-obvious fact needs a run".
- **Problem**: the agent reads this as "each run result is a non-obvious fact". 4c-1 F1 repeats `tools/geo.mjs`. 4d-2 F3 repeats an `ls`.
- **Evidence**: `group-I.md` (2 of 4 runs).
- **Recommendation**: not decided. Say that a run is necessary, but not enough: the result must be one that a reader cannot see in the code.

### 55. The scripts do not run alone

- **Where**: the version step of each skill, and `plan-status.mjs` (D175, D192, D193).
- **Problem**: `openspec-version.mjs` and `plan-status.mjs` ran in a chain in most sessions, against "Run it alone". No session misread the output.
- **Evidence**: groups D, E, F, H, I.
- **Recommendation**: not decided. The rule has no effect. Either remove it, or accept the chain.

### 56. Scenario text issues

- 13a and 13b: "shows" the earlier file. The agent gave the path and a summary, not the full text. Say which one passes (group B).
- 20a: say that a note that points to an open question fails (group F).
- 20c: "in one line" is strict. "A short reply, with no summary" can be the better text (group F).
- 4b: say which fixed window the test must catch (group A).
- 18b step 4: add the user turn "I removed both marks." (group C).

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
