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

## Found in the scenario audit of 2026-11-07

### 31. Stock `/opsx:archive` with no archive guidance, and the `openspec archive` CLI

- **Where**: `openspec/config.yaml` archive guidance (D95), and the old scenarios 16b and 16c, which D190 removed.
- **Problem**: if the user deletes the openspec-lite guidance item, or runs `openspec archive <name> --yes` in a terminal, no openspec-lite rule reaches the archive. The knowledge of `plan.md` then stays only in `openspec/changes/archive/`. In the runs on 62c6fa7 and 3c93237, stock `/opsx:archive` still switched to `openspec-lite-archive` because of the skill description. The CLI archives with no warning (`docs/facts.md`).
- **Target**: each archive path of a plan-lite change promotes `plan.md`, or warns before the archive.
- **Recommendation**: not decided. Options: a stronger guard in `apply.instruction` or in the done check, or a README warning only.

## Found in the run on 80d076b

The reports are in `.scenario-runs/20261107-80d076b/` (`summary.md` and `group-A.md` to `group-I.md`). Item 28 has new evidence: scenario 9 failed in 2 of 2 runs (`group-D.md`).

### 32. A 🤖 gets into a main spec through the archive offer after an upgrade

- **Where**: `package/skills/openspec-lite-archive/SKILL.md`, the guard (D191 item 5).
- **Problem**: after the ADR copy, archive ran `openspec archive --yes`. The upgrade delta held `#### Scenario: Table is empty 🤖`, and the CLI copied it into `openspec/specs/report-export/spec.md`. An unconfirmed claim became part of the main spec. D181 says that no spec holds a 🤖.
- **Evidence**: `group-C.md` (18b, session `467cad8c`).
- **Recommendation**: not decided. Before the offer, archive lists each 🤖 item in `specs/` and `design.md`, and does not offer the archive while a delta holds a 🤖.

### 33. Archive says "marked 🤖" for a decision with no mark

- **Where**: archive step 6 (D181): "Name each draft that comes from a decision with 🤖".
- **Problem**: in 3 of 7 sessions, the agent said that a decision of the user was "marked 🤖 in `plan.md`, so you haven't confirmed it yet".
- **Evidence**: `group-B.md` (sessions `e8b7fcfd`, `c4bd46e5`, `e0b913a6`).
- **Recommendation**: not decided. Say "If no decision has 🤖, say nothing about marks." Add a check to scenario 5.

### 34. The version step adds `echo $?`

- **Where**: the version step of each workflow skill (D175).
- **Problem**: the skill acts on the exit code, so the agent adds `; echo rc=$?` in 9 of 10 sessions. The allowlist denies it, and in one session the check did not run.
- **Evidence**: `group-B.md`, `group-E.md` (session `5fd87fe1`).
- **Recommendation**: not decided. The skill reads the first word of the printed line (`ok:`, `warn:`, `fail:`), and runs the command alone.

### 35. Upgrade writes the summary in the prune reply

- **Where**: upgrade step 5.3 (D132, D191).
- **Problem**: 2 of about 6 prune turns wrote the summary before the answer. This adds to item 15.
- **Evidence**: `group-F.md` (20c run 1, `3d872e81`), `group-C.md` (7 run 1, `2e2fc0f4`).
- **Recommendation**: not decided. Make the question the last line of the reply, as a rule: "Write nothing after the question."

### 36. An obvious fact that backs a decision

- **Where**: the fact rule (D184, D186, D188).
- **Problem**: the rules "record a fact that backs a decision" and "do not record a fact that a reader can easily deduce from the code" conflict. In 2 of 2 runs of 4c, the preview recorded "geo.mjs is a CLI script, not a module" as the reason of its 🤖 decision.
- **Evidence**: `group-I.md` (sessions `9b6906e4`, `67e5b160`).
- **Recommendation**: not decided. The user must choose which rule wins.

### 37. A choice hidden in a fact

- **Where**: the fact and decision rules of apply.
- **Problem**: in 4d-1, the agent wrote the JSON parse choice as a fact ("the script must read the item count"), with no 🤖 decision.
- **Evidence**: `group-I.md` (session `4672e247`).
- **Recommendation**: not decided. A fact states what is true. A sentence with "must", "so we", or a choice goes to `## Decisions`.

### 38. Facts go stale after apply

- **Where**: `apply.instruction`, the end check (D177).
- **Problem**: "the repo has no `src/` folder" stayed after apply created `src/`, in 3 of 4 runs of group I and in scenario 4.
- **Evidence**: `group-I.md`, `group-A.md` (session `e710314b`).
- **Recommendation**: not decided. The end check compares each fact with the code too, and updates or removes each fact that is no longer true.

### 39. A reason from model knowledge

- **Where**: D177, "each reason must come from this run, the user, or plan.md".
- **Problem**: in 2 of 2 runs of scenario 4, a "Rejected … because" reason came from model knowledge. One was a guess, and one was a correct platform fact ("browsers block module scripts on `file://`").
- **Evidence**: `group-A.md` (sessions `952ed726`, `e710314b`).
- **Recommendation**: not decided. The user must choose if a well-known fact of a platform is an allowed source.

### 40. Apply writes no test for the changed behavior

- **Where**: `apply.instruction`.
- **Problem**: in 2 of 2 runs of 4b, apply wrote no test for the sliding window. Its check could not tell a sliding window from a fixed window.
- **Evidence**: `group-A.md` (sessions `aba79d03`, `4d192db7`).
- **Recommendation**: not decided. Add a rule: write or update a test that fails if the changed behavior breaks, and run it before the done check.

### 41. The apply guard does not read `plan.md`

- **Where**: the change schema guard of `openspec-lite-apply` (scenario 17b, D190).
- **Problem**: on a spec-driven change that still has `plan.md` with an open question, apply refuses, but it does not say that stock `/opsx:apply` does not read that question.
- **Evidence**: `group-C.md` (17b, 2 of 2 runs).
- **Recommendation**: not decided. If `plan.md` exists, the guard names its open questions, and tells the user to answer them first.

### 42. Smaller gaps

- Upgrade missed a 🤖 on a new claim: "A per-instance counter would let a client send up to 4 times the limit" (`group-F.md`, `a9c7d046`).
- The D182 contract question gave two results for the same start state in scenario 7 (`group-C.md`).
- Apply read the `ls` output of a chained `git status` as a porcelain line. Tell the agent to run `git status --porcelain` alone (`group-A.md`, `aba79d03`).
- The schema version 5 template is about 144 words longer than version 4 (`group-H.md`).
- Scenario text: 20a says "the open question" and "one task", but the preview can add more. The 15 check uses the example of the archive skill. "Running the Scenarios Headless" says that 13 needs a hand-built state, but 13a now runs with `setup/break-delta.sh`.

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
