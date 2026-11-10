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

### 51. Archive after an upgrade does not name the open question of a kept `plan.md`

- **Where**: `package/skills/openspec-lite-archive/SKILL.md`, step 3 (D193 item 4). Scenario 18b.
- **Problem**: after the ADRs, the agent did not name the open question. The rule is one sentence in a long paragraph, with no fixed place in the reply. One draft also asked to remove a 🤖 from `design.md`, against the guard.
- **Evidence**: `group-C.md` (18b, 2 of 2 runs). The 18b step 4 also needs one more user turn ("I removed both marks.").
- **Recommendation**: not decided. One option: a fixed line in the reply before the archive question, for example "Open in `plan.md`: …".

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

The reports are in `.scenario-runs/20261108-f5422dd/` (`summary.md` and `group-A.md` to `group-I.md`). 31 of 40 runs pass. Scenario 7 fails in each run. 3, 4, 18, 18b, 20c, 4c, and 4d fail once and pass once. D208 to D214 close items 50, 57, 60, 61, 62, 64, and 65. The rerun on 765cdec (`.scenario-runs/20261108-765cdec/`) confirms both: 7 and 21b pass 2 of 2. 20c and 4c pass 1 of 2. Items 50 and 57 have new evidence: 4d wrote no test in 3 of 4 runs over two commits, and in scenario 4 an agent choice went into no decision at all.

### 63. Archive talks about marks when there is none

- **Where**: archive step 6 (D192).
- **Problem**: "say nothing about marks" has no effect: 3 of 3 runs of group E said "No decision heading ends with 🤖", and scenario 6 made a false 🤖 claim.
- **Evidence**: `group-E.md`, `group-B.md` (`930f60b4`).
- **Recommendation**: not decided. Options: allow the true line, or remove the sentence, and add a scenario 6 check for a false claim.

### 66. Smaller gaps from the run on f5422dd

- Stock `/opsx:apply` loaded no skill and ran no `openspec instructions apply` in 1 of 5 sessions, so no plan-lite rule applied (scenario 3 run 1). This adds evidence to item 31.
- Archive: in 16a, the "Archive anyway?" reply did not say that the archive promotes C1 and D1 (group F). In 22c, it gave the "no" paths before the answer (group H).
- Propose: in scenario 11, the open questions stayed only in the reply (group D).
- Apply: in 4d-2, it changed the code against the user decision D3, and did not update the decision or ask. The rule "ask the user, and end your turn" exists (group I).
- Scenario texts: 7 step 3 gives no answer for the fixture question OQ2. 8 and 9 name no start state under D199. 14 and 15 do not say if `plan.md` keeps the template comments. 16a has no answer for the draft approval. 18 and 18b do not say if an offer or a conditional question passes. 21a and 21b still need old run output. 20a has no "summary does not say deleted or kept" check (groups C, D, E, F, G).
- `scripts/break-delta.sh` was committed with mode `100644`. Fixed in the same commit as this item.

## Found in the rerun on 26c58ea

The reports are in `.scenario-runs/20261108-26c58ea/`. 20c (3 of 3), 18, 18b, and 3 pass 2 of 2. 4c and 4d pass 3 of 4. Scenario 4 fails 2 of 2. D216 closes item 67. Release 1.7.0 ships with scenarios 4 and 4d as known unstable cases: each passed 1 of 2 in its last rerun (`.scenario-runs/20261108-193cd75/`, `.scenario-runs/20261108-26c58ea/`).

### 68. Smaller gaps from the rerun on 26c58ea

- 4d check 3 says "in this repo". In 4d-1, apply did not run the script, because `echo "rc=$?"` was denied, and it did not try `exit-code.mjs`. Its tests ran the real script on temp repos (group I).
- 4c: 0 of 2 previews wrote a decision on how `lookup` finds an unknown city, so the obvious-reason check did not apply (group I).
- 18b check 8 does not say which reply must name the open question of `plan.md` (group C).
- Archive spec reasons with no source, in 3 runs of 4c over three commits (group I).
- Upgrade: a Why line with a new claim and no 🤖, in 1 of 3 runs of 20c (group F).
- Scenario 4: a decision says that `package.json` holds only `"type": "module"`, which is false, in 1 of 2 runs on 26c58ea and on 193cd75. On 193cd75, 1 of 2 runs also missed the file layout decision, and gave a done check with no Goal and no Constraints (`.scenario-runs/20261108-193cd75/group-A.md`).

## Found in the run on bdd9b0e

The reports are in `.scenario-runs/20261109-bdd9b0e/` (`summary.md` and `group-A.md` to `group-I.md`). 35 of 41 runs pass. 3, 4, 7, 4c, and 4d fail once and pass once. 20a fails. 18, 18b, and 20c pass in each run.

### 70. Apply records a plan of the agent as a user answer

- **Where**: the 🤖 rule of `apply.instruction` (D181, D217).
- **Problem**: in 4d-2, apply stated "exit 2 when openspec cannot be run" as its plan in the question turn. After "Use your recommended answer for each question.", it wrote this as a decision with no 🤖. The user never chose it.
- **Evidence**: `group-I.md` (session `5931bbee`).
- **Recommendation**: not decided. Say that only an answer to a question that the agent asked removes the 🤖. A plan in the same reply keeps it.

### 71. Smaller gaps from the run on bdd9b0e

- 20a: the step 2 section list gives no heading for Background, Non-Goals, and Constraints (group F). Upgrade missed a 🤖 in 2 of 3 runs (20a docs line, 20c run 2 claim), and its summary said that no item has a mark (group F).
- 7 step 3 run 2: a `design.md` reason from `tasks-preview.md` with no 🤖 (D152, group C).
- 4c-2: D1 maps the `error` key to `null` with no reason in `plan.md` (group I). Archive spec reasons with no source, now 4 runs over four commits (group I, item 68).
- 4b: apply ran no test after the `npm test` denial, in 2 of 2 runs, and its `node --test test/` script fails on Node 24 (group A).
- 3 run 1: the tasks preview wrote no file, because the repo has no code (group A).
- 20b: the written ADR differs from the approved draft (group E). 21a: the new ADR `## Consequences` holds a process line in the future tense (group G). 21b: archive asked "Yes or no?" before the `Status:` edit, against step 10 (group G).
- 13a run 2: the summary says "I also removed `skip_specs`", but run 1 removed it (group B). 13a run 1: the agent did not quote the `validate` error (group B).
- 11: propose asked the Level 1 question and also wrote two open questions (group D).
- Scenario texts: 4c "Leave the other questions open" holds back the done check (group I). 21b gives no answer for two archive questions (group G). 20b has no check that the written ADR equals the approved draft (group E).
- Item 55 again in groups D and H. Item 63 again in group E (3 of 3). The ID rule: "OQ2" in a reply in 17b and 18b run 1 (group C).

## Found in the rerun on a71a5eb

The reports are in `.scenario-runs/20261110-a71a5eb/`. 3 of 8 runs pass: 4 fails 2 of 2, 4b and 4c fail 1 and 2 of 2, 4d passes 2 of 2. D218 removed the plumbing parts in 4 and 4b and caught the JSON field in 4d, but apply now misses more visible choices.

### 73. Smaller gaps from the rerun on a71a5eb

- 4c: 2 of 2 previews wrote the obvious `geo.mjs` result as a fact (0 of 2 on bdd9b0e, item 65, D211) (group I).
- 4c-2: apply skipped the done check and told the user to archive (group I).
- 4b run 1: apply removed the non-obvious fact F2 with F1, against D184 (group A).
- 4b run 2: D4 "Run tests with `node --test`" holds only a plumbing detail (group A).
- 4 run 2: D6 holds both the file name and the CSV format (group A).
- Scenario texts: 4c expects no decision for the `error` key, and 4d expects one for the JSON field. The difference is that 4d has real options (text or JSON). 4c could say so (group I).
- Item 70 did not occur: the plan of 4d-2 got a 🤖 (group I).

## Found in the rerun on 5eaf25d

The reports are in `.scenario-runs/20261110-5eaf25d/`. 9 of 16 runs pass: 4 (2 of 4), 4b (2 of 4), 4c (1 of 4), 4d (4 of 4). On a71a5eb: 3 of 8.

### 75. Smaller gaps from the rerun on 5eaf25d

- 4b: F2 removed with F1 in 2 of 4 runs (D184, also on a71a5eb) (group A4b).
- 4c-3: apply skipped the done check. 4d-4: the done check said "The goal is met", but the code breaks the Goal (groups I4c, I4d).
- 4c-2: D2 "Use node:test" matches neither criterion, because C1 gives it (group I4c).
- 4c-3: D1 does not match the code (group I4c).
- 4 run 4: OQ5 asks the user to click the button to test it, and it blocks the done check (group A4).
- Scenario texts: "its own 🤖 decision" in scenario 4 can mean "not in a user decision" or "one choice per decision" (group A4). D219 lists "an error message", but no scenario says if a diagnostic text on stderr counts (group I4d).

## Found in the rerun on b299124

The reports are in `.scenario-runs/20261110-b299124/`. 6 of 16 runs pass: 4 (1 of 4), 4b (1 of 4), 4c (1 of 4), 4d (3 of 4). On 5eaf25d: 9 of 16. With 4 runs per scenario, the difference is within noise.

### 77. Smaller gaps from the rerun on b299124

- 4b: F2 removed with F1 in 1 of 4 runs (D184). 2 of 4 runs ran no test. The 4b Expected list has no check that the agent runs the tests (group A4b).
- 4d-3: the test covers only `decide()`, so it does not fail when the script exit code breaks (D213, group I4d).
- 4c: 3 of 4 previews wrote the obvious error body as a fact (D211, group I4c). Three reasons about the module format of Node have no source, and one is false on Node 24.13.0 (D194, group I4c).
- 4 runs 2 and 4: an open question asks for a manual test, and it blocks the done check (also on 5eaf25d, group A4).
- 4c-1: the ADR holds the `plan.md` ID "OQ2" (D142, group I4c).

## Found in the rerun on 98e421c

The reports are in `.scenario-runs/20261110-98e421c/`. 6 of 16 runs pass: 4 (0 of 4), 4b (3 of 4), 4c (0 of 4), 4d (3 of 4). The same count as on b299124.

### 80. Smaller gaps from the rerun on 98e421c

- 4c: 4 of 4 runs name the call method in a title or "Chose X", and 3 ADRs copy it (D220 item 3). 2 of 4 previews wrote obvious facts, and apply kept them (D211). 4c-4 spec says "SHALL be synchronous" while the open question is not answered (group I4c).
- 4b run 4: F2 renumbered to F1 (D184). 4b run 3: no test run (group A4b).
- 4d-3: the script exits 0 with no output when it runs from another path, and the tests do not find it (D213, group I4d).
- Unsourced claims about Node in 4 decisions, one of them false (D194, groups A4, I4c).

## Found in the rerun on f31dfd1

The reports are in `.scenario-runs/20261110-f31dfd1/`. 10 of 16 runs pass: 4 (1 of 4), 4b (4 of 4), 4c (1 of 4), 4d (4 of 4). On 98e421c: 6 of 16.

### 81. A decision goes stale after the user changes the approach

- **Where**: the "Keep current" rule of `apply.instruction` (D136).
- **Problem**: in 4b, after "Use a sliding window instead.", a decision still said that `Retry-After` is "seconds until the window ends" in 3 of 4 runs. The same in the runs on b299124 and 98e421c.
- **Evidence**: `group-A4b.md` of f31dfd1, b299124, and 98e421c.
- **Recommendation**: not decided. The end check compares each decision with the code, but the agent does not see the stale part. A 4b check can catch it.

### 82. Archive puts 🤖 content into a spec draft with no 🤖 note

- **Where**: `openspec-lite-archive`, the promotion of decisions to a spec (D152, D179).
- **Problem**: 3 of 4 spec drafts of 4c hold content from a 🤖 decision, and the archive names only the ADR drafts as 🤖. 4 of 4 ADRs copy `execFileSync` from D1.
- **Evidence**: `group-I4c.md` of f31dfd1, check 9.
- **Recommendation**: not decided.

### 83. Smaller gaps from the rerun on f31dfd1

- 4c: 4 of 4 runs still put the call method in the D1 title (D220 item 3). 3 of 4 have no decision for the throw (group I4c).
- 4c-4: OQ1 and D3 on the same point after a denied command. Apply resolved OQ1 only after coding, and removed its user-only part with no answer (D223, group I4c).
- 4d: the table criterion does not match the decision text in 2 runs. No decision names exit 2 for JSON with no `summary.totals.items` (4 of 4). No run records an error message text (group I4d).
- 4b: 2 of 4 runs show no table in turn 2 (D221, group A4b).
- 4 run 2: OQ2 and OQ3 have no recommendation (D195, group A4).
- Unsourced or false claims about Node: 4 run 3 D6, 4c-1 D2 (D194).
- Scenario 4 cannot test the resolve path of D223, because each question depends on the user. 4c and 4d asked no question, so the "leave open" case did not run.

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
