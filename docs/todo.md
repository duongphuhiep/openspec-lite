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

The reports are in `.scenario-runs/20261108-5aa0025/` (`summary.md` and `group-A.md` to `group-I.md`). 30 of 41 runs pass. Scenarios 4, 18b, 20a, 4c, and 4d fail in each run. D194 to D198 close items 48, 49, 52, 53, and 54. The rerun on 743a6f3 is in `.scenario-runs/20261108-743a6f3/`: 18b, 20a, and 4c pass 2 of 2. 4 and 4d fail 2 of 2. Item 50 has new evidence: 4d wrote no test in 2 of 2 runs.

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

### 57. An agent choice inside a user decision

- **Where**: `apply.instruction` and the tasks preview, the 🤖 rule (D181).
- **Problem**: a decision with no 🤖 records an answer of the user, but the agent adds its own choice to it. Scenario 4 on 5aa0025: "plain HTML and JavaScript (ES modules) ... as the user instructed". On 743a6f3: "download it through a Blob". The 🤖 check cannot see it.
- **Evidence**: `.scenario-runs/20261108-5aa0025/group-A.md` (rerun), `.scenario-runs/20261108-743a6f3/group-A.md` (run 1).
- **Recommendation**: not decided. One option: a decision with no 🤖 holds only what the user said. Each added choice is a separate 🤖 decision.
- **Related check**: the 4b check "It gives no "because" reason that the user did not give and that the run does not show" assumes this option. It is stricter than D194, which also accepts `plan.md`, the code, or a well-known fact. Review round 17 found this. Decide the item, then align the check.

### 58. Apply loses an answer of the user when a write is denied

- **Where**: `apply.instruction`, the rule that records an answer and removes the question.
- **Problem**: in 4d-1 on 743a6f3, the allowlist denied the write of D3, but OQ1 was removed, and the reply said "D3 (added)".
- **Evidence**: `.scenario-runs/20261108-743a6f3/group-I.md` (session `d54190d3`).
- **Recommendation**: not decided. One option: write the decision first, read `plan.md` again, then remove the question. Use the Edit tool, not a heredoc.

### 59. Smaller gaps from the rerun on 743a6f3

- Archive still uses `echo $?`, because D197 covers only apply and the preview (group I).
- The done check of scenario 4 run 2 named only the open questions (group A).
- 2 of 2 runs of scenario 3 wrote the `plan-status.mjs` line in their own words (group A).
- D196: no run tested the re-read, because each first write was already clean. No scenario starts with a pointer in `design.md` (group F).
- 18b step 1 adds the 🤖 after the scenario 18 turn, so the agent "corrects" a true earlier line. Add the mark before scenario 18 (group C).

## Found in the run on f5422dd

The reports are in `.scenario-runs/20261108-f5422dd/` (`summary.md` and `group-A.md` to `group-I.md`). 31 of 40 runs pass. Scenario 7 fails in each run. 3, 4, 18, 18b, 20c, 4c, and 4d fail once and pass once. D208, D209, and D210 close items 60, 61, and 62. The rerun on 765cdec (`.scenario-runs/20261108-765cdec/`) confirms both: 7 and 21b pass 2 of 2. 20c and 4c pass 1 of 2. Items 50 and 57 have new evidence: 4d wrote no test in 3 of 4 runs over two commits, and in scenario 4 an agent choice went into no decision at all.

### 63. Archive talks about marks when there is none

- **Where**: archive step 6 (D192).
- **Problem**: "say nothing about marks" has no effect: 3 of 3 runs of group E said "No decision heading ends with 🤖", and scenario 6 made a false 🤖 claim.
- **Evidence**: `group-E.md`, `group-B.md` (`930f60b4`).
- **Recommendation**: not decided. Options: allow the true line, or remove the sentence, and add a scenario 6 check for a false claim.

### 64. Apply makes a choice with no decision, or changes the code against a user decision

- **Where**: `apply.instruction`, the decision rules.
- **Problem**: scenario 4 run 1 chose `"type": "module"` and CRLF with no decision. In 4d-2, apply changed the code against the user decision D3 and did not ask.
- **Evidence**: `group-A.md` (4 run 1), `group-I.md` (4d-2).
- **Recommendation**: not decided. Related to item 57.

### 65. The obvious error body still goes into `## Facts`

- **Where**: the tasks preview fact rules (D198, D200). Scenario 4c.
- **Problem**: after an `exit-code.mjs` run, the preview put the error body and exit 0 of `geo.mjs` in `## Facts`. 3 of 4 runs of 4c over two commits. The `plan-hash.mjs` step also does not name `exit-code.mjs`, so 3 of 4 applies added `echo`.
- **Evidence**: `group-I.md` (4c-2, `3548fe18`). Rerun on 765cdec: each preview that ran `geo.mjs` wrote the fact (2 of 2 over two commits), and each preview that only read it wrote none.
- **Recommendation**: not decided. The run result seems to make the agent see the fact as non-obvious. One option: an example in the rule, "the output of a script whose code shows it, also after a run".

### 66. Smaller gaps from the run on f5422dd

- Stock `/opsx:apply` loaded no skill and ran no `openspec instructions apply` in 1 of 5 sessions, so no plan-lite rule applied (scenario 3 run 1). This adds evidence to item 31.
- Archive guard: no rule for "no" to the ADR offer. In 18 run 1, it offered its own `openspec archive --yes`, not stock `/opsx:archive` (group C).
- Archive: in 16a, the "Archive anyway?" reply did not say that the archive promotes C1 and D1 (group F). In 22c, it gave the "no" paths before the answer (group H).
- Propose: in scenario 11, the open questions stayed only in the reply (group D).
- Scenario texts: 7 step 3 gives no answer for the fixture question OQ2. 8 and 9 name no start state under D199. 14 and 15 do not say if `plan.md` keeps the template comments. 16a has no answer for the draft approval. 18 and 18b do not say if an offer or a conditional question passes. 21a and 21b still need old run output. 20a has no "summary does not say deleted or kept" check (groups C, D, E, F, G).
- `scripts/break-delta.sh` was committed with mode `100644`. Fixed in the same commit as this item.

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
