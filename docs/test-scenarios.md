# Test Scenarios

Run scenarios 1–9 and 11–22 by hand before each release tag (D69). Number 10 is not used. The `apm-install` CI workflow does the real APM install from the tag (D130). The automated tests (`node --test`) cover the scripts and the schema. These scenarios cover the skills, which only an agent can run.

Setup for each scenario, unless it says otherwise:

1. Create an empty folder and run `git init`.
2. Run `openspec init --tools claude` (or your harness).
3. Install the release candidate: `apm install <path-to-this-repo>/package --target claude` (or your harness). Use the same harness as in step 2.
4. Start a new agent session in the folder.

`scripts/scenario-setup.sh <label> [fixture]` does steps 1 to 3, commits with the message "setup", and prints the folder. With a fixture, it also installs the schema and copies the folder `tests/fixtures/scenarios/<fixture>/` (D199):

- `after-propose`: the change `add-csv-export-to-report-page`, with only the Goal in `plan.md`. It is a fixed start state, not the output of scenario 1: a propose run can also write open questions.
- `after-preview`: the same change after a tasks preview, with three open questions and a current `tasks-preview.md`.
- `rate-limit`: a small API server (`src/server.js`, `package.json`) and the change `add-rate-limit`, for scenario 4b.
- `finished-rate-limit`: `src/rateLimit.js` and the finished change `add-rate-limit`, for scenarios 5, 6, 13a, and 13b. The limiter runs after the auth middleware, rejects a request with no API key with 401, and deletes the expired windows (D284).
- `interrupted-upgrade`: the same change with a fresh preview, after an upgrade stopped right after it wrote `proposal.md`, for scenario 7 step 3.
- `after-upgrade`: the same change after an upgrade (scenario 7), with no `plan.md`. Its delta holds the 🤖 scenario "Table is empty". `tests/fixtures/scenarios/kept-plan.md` is the `plan.md` that an upgrade keeps when an open question has no slot.

Isolation rules (D199):

- Each scenario run starts in a new temp folder, from the setup above or from a fixture. Do not start from the output of another scenario, and do not copy or clone the folder of an earlier run.
- Each scenario run starts a new agent session. Use `--resume` only for the answers inside one scenario.
- A setup commit message is neutral, for example "setup". The agent sees the recent commit messages (`docs/facts.md`).
- A run never writes to `tests/fixtures/`.
- If archive asks "Archive anyway?" and the scenario gives no answer for it, answer yes. To change a fixture, edit it in a commit, and run `node --test`.

If a scenario builds a plan-lite change by hand, install the schema first: `node .claude/skills/openspec-lite-schema/scripts/install.mjs .`. Then run `openspec new change <name> --schema plan-lite`. OpenSpec 1.14.2 writes `skip_specs: true` itself. Do not add a second line, because a duplicate key breaks each CLI command on the change (D150). Commit the code before an archive run, because `git grep` searches only tracked files.

Record the agent, the model, the OpenSpec version, and the result of each scenario.

---

## 1. Fresh repo: propose

**Steps**: Ask: "openspec-lite-propose: add a CSV export to the report page."

**Expected**:

- The agent runs `openspec-lite-schema`. `openspec/schemas/plan-lite/` exists. `openspec/config.yaml` has the archive guidance item.
- `openspec/changes/<name>/` exists. `.openspec.yaml` has `schema: plan-lite` and one `skip_specs: true` line (D150).
- `plan.md` has the ID comment before `## Goal`, the seven headings, and their guidance comments, with only known content filled in.
- `## Goal` names the CSV export. `plan.md` holds no constraint, fact, or decision that the prompt does not give.
- The request has open points, for example which rows and columns the export holds. So the agent does not ask the Level 1 question, and `## Open Questions` holds each open point (D260). The summary lists each open question (D265).
- The summary tells the user that the agent added the archive guidance to `openspec/config.yaml`, a file that the user owns.
- The agent asks: "Do you want a tasks preview?" It writes no code.

## 2. Small request: Level 1

**Steps**:

1. Add a `README.md` with the line "You recieve a CSV file." Commit.
2. Ask: "openspec-lite-propose: fix the typo 'recieve' in README.md."

**Expected**:

- The agent asks: "This looks small. Implement directly with no change?" Answer yes.
- `README.md` says "You receive a CSV file." No other line changed.
- The agent creates no file under `openspec/`.

## 3. Stale preview

**Steps**:

1. Start from the fixture `after-propose`. Run `openspec-lite-tasks-preview add-csv-export-to-report-page`. Commit after the preview.
2. Check `tasks-preview.md`: the second line is `<!-- plan-sha256: <64 hex chars> -->`, and the tasks have no checkboxes.
3. Add or edit a line under `## Constraints` in `plan.md`. Do not commit this edit.
4. Run stock `/opsx:apply` (or `openspec-lite-apply`).
5. Negative check: start from the fixture `after-preview` in a new folder. Edit only `## Open Questions`, `## Facts`, and `## Decisions` of `plan.md`, and commit. Run stock `/opsx:apply` in a new session.

**Expected**:

- In step 1, the agent gives no "not committed" note. The preview summary lists each fact, decision, and open question that the run added, changed, or removed in `plan.md`, or says that it changed none. It did not remove or change a decision that `plan.md` had before the run (D180). After the run, the `plan-sha256` of the preview equals the output of `plan-hash.mjs` on `plan.md`. Goal, Background, Non-Goals, and Constraints did not change (D171).
- In step 4, before coding, the agent says that the preview is stale and offers to regenerate it. If `plan.md` has an open question that the agent cannot decide and cannot find the answer to, it asks it in the same reply, with its recommended answer. It gives no recommendation when the answer is a fact that only the user knows, for example where the report page is (D195, D223, D225).
- In step 4, with stock `/opsx:apply`, the agent tells the user the two facts of the `plan-status.mjs` line: `plan.md` is not committed, so a diff cannot show the changes of this run alone, and the user must commit it before the next run. The exact line or the same facts in other words both pass (D171, D193, D246). With `openspec-lite-apply`, the agent commits only `plan.md`, and tells the user that it committed `plan.md` (D290). The note or the commit alone does not cause a stop. A stop for the stale warning or for the open questions is correct.
- In step 5, the agent gives no stale warning.

## 4. Stock apply follows the plan-lite rules

**Steps**:

1. Start from the fixture `after-preview`. Run stock `/opsx:apply`.
2. Answer the questions that apply asks in one reply, with the matching part of this text. Always give the "Stack:" part and the last sentence, also if apply asks fewer questions: "OQ1: the report page does not exist yet; create it in this repo. OQ2: export only the rows that the table shows, after the filters, in the current sort order, with all columns in the column order of the table. OQ3: build the CSV in the browser. Stack: plain HTML and JavaScript under `src/`, tests with `node:test`, run with `node --test`, no npm dependency. Scaffold a minimal report page." Do not write "use the defaults", because apply gives no defaults (D156).

**Expected**:

- The agent implements from `plan.md`. It records a deviation from the preview as a `### Decision D<n>:` entry only when the deviation matches criterion (1) or (2) of the decision rule (D225).
- It does not edit `tasks-preview.md`.
- No code, test name, test string, code comment, commit message, or file other than `plan.md` and `tasks-preview.md` holds a `plan.md` ID such as `C1` or `D1` (D142).
- Before coding, the agent tries to decide or find the answer to each open question of `plan.md` from the code, the docs, or a run. It records a non-obvious answer as a fact with its source, or a choice as a 🤖 decision when the decision rule records it, and removes the question. A choice that the decision rule does not record, and an obvious answer, are only in the end summary (D223, D234). It asks each question that is still open with its recommended answer, and ends the turn. If the answer is a fact that only the user knows, for example whether the report page exists, it gives no recommendation and says why (D193, D195, D225). The agent splits the answer of the user: a fact such as "Before this change, the report page did not exist" goes to `## Facts`, with 👤 and "the user" as its source, and stays true after apply creates the page, and a choice of how to build the result, for example "create it in this repo" and "Scaffold a minimal report page", is a decision with no 🤖, because a rule limits the result, and a choice of how to build it is not a rule (D256). Each part of the answer is in a section of `plan.md`, not only in the end summary (D261). The OQ2 answer (the rows, the sort order, and the column order) limits the result, so it is a constraint. "Tests with `node:test`, run with `node --test`" is a build choice, so it is a decision with no 🤖 (D256, D264). A build choice recorded as a constraint fails, because the constraint makes the preview stale, and the done check then treats a build choice as a rule (D262). A rule of the answer that the change must follow, for example "no npm dependency", is a constraint, and the end summary says that this edit makes the preview stale (D240). If apply decided a question as a 🤖 decision and the user answers it later, apply updates that decision to the answer and removes its 🤖. OQ1 asks if the report page exists, which only the user knows when the repo has no page, so apply asks it with no recommendation. OQ2 asks which rows and columns the user wants, so it depends on an intent of the user, and apply asks it with a recommendation. OQ3 asks where the CSV is built. The repo has no server, so apply can decide it. If the answer matches criterion (1) or (2), it is a 🤖 decision. If not, the answer is only in the end summary (D234). If apply asks OQ3 because it depends on OQ1, that also passes. No point is both an open question and a decision. Each part of the answer is in one section only: no rule is both a constraint and a decision. The stack instruction is not a fact. "No npm dependency" is a constraint, because it says what the change must not add. "Plain HTML and JavaScript under `src/`" and "tests with `node:test`" are decisions with no 🤖, because they choose how to build the result (D252, D256). A rule such as "no npm dependency" is never only a decision.
- If a command failed and the agent changed the work for it, `## Facts` has a fact with the command and the error text (D172). If a reader can see the same output in the code, it is in the "because" part of a decision instead (D200).
- Each thing that the agent picked, that changes a visible result, and that `plan.md` and the user do not fix, is a `### Decision D<n>:` entry, for example the filter UI, the sort UI, the CSV format, and the download file name. The filter UI and the sort UI are two choices, so they are two decisions: the user can change one and keep the other (D283). The download file name is an output of the program, so it needs a decision. The file name of the new page needs no decision, because no other program, config, or doc refers to it (D222). The columns of the scaffold table are a 🤖 decision, because they are the columns of the CSV export. The page title and the sample rows of the scaffold need no decision, because the user asked for a minimal page, and later work replaces them (D283). A columns decision that also lists the sample rows passes, because the rows are content of the same table (D286). A decision holds only that part: the download decision names the file name, not the download method. The MIME type and the encoding are part of the CSV format, so a format decision or a file name decision that holds them passes (D286). An internal detail can appear only in the "because" part (D218, D219, D220). A close call between internal options can also be a decision, but this check does not require it. Each decision that records an answer or an instruction of the user has no 🤖. Each other decision that the agent wrote ends its heading with 🤖, also when its reason comes from `plan.md` (D181, D182). A decision with no 🤖 holds only what the user said. Each visible choice that the agent added, for example the module system of the page or of `package.json`, or the line ending of the CSV, is in its own 🤖 decision, not in a decision of the user (D214, D219). The module system of the page decides whether the page opens from `file://`, because Chrome blocks a module import from `file://` with a CORS error (D283). The end summary lists each fact, decision, and open question that the run added, changed, or removed in `plan.md` (D171). It has a table of each added 🤖 decision, with its criterion, (1) or (2), and a reason that matches the criterion: a visible result, or the close options (D234). No row holds only an internal detail (D221).
- Before the test check and the done check, the agent runs the tests with `node --test`, and they pass. The summary gives the result (D176).
- A test covers the export: the CSV holds the rows that the table shows, in the column order of the table. The test fails if the export writes the wrong rows or the wrong order.
- At the end, each decision in `## Decisions` matches the code, and each fact in `## Facts` is still true (D192). Each "because" reason comes from the run, the user, `plan.md`, the code, or a well-known fact, not from a guess (D177, D192). A 🤖 mark does not excuse a guess or a false reason. A claim about how a tool, a runtime, or a platform behaves has a run or a doc as its source. If no source supports a reason, the decision says "Reason not checked." (D194).
- It ends with the test check and the done check (Goal, Constraints, Open Questions) (D264). If the run added an open question, the done check says that `## Open Questions` is not empty.
- If the test check and the done check pass, it tells the user to archive with `openspec-lite-archive`, not `/opsx:archive`.

### 4b. Apply keeps only the current decisions

**Steps**:

1. Start from the fixture `rate-limit`: `src/server.js`, `package.json`, and the change `add-rate-limit`. Its `plan.md` has no template comments, so that the run checks `apply.instruction` alone. It has the Goal "Limit each API key to 100 requests per minute on the API server.", two constraints with no ID ("The limiter must not add an npm dependency." and "A request over the limit gets status 429."), and one decision `### Decision D1: Use a fixed 60-second window`. Two facts justify only D1: `- F1: A fixed window needs only one counter for each API key.`, which a reader can deduce, and `- F2: In the access logs, the clients retry after 30 seconds or more.`, which is non-obvious, because it needs a study of the logs.
2. Run `openspec-lite-apply`. If it asks how clients send the API key, answer: "Clients send the key in the `x-api-key` header." If it asks any other question, answer: "I have no preference." After the first turn in which apply writes code, tell the agent: "Use a sliding window instead." In a headless run, send the instruction as the next turn, with any answer that the turn needs.

**Expected**:

- `## Decisions` has the sliding window decision. The fixed window decision is removed, or updated to the sliding window (D136). If the agent adds a new decision, its ID number is higher than each other decision ID in the file (D144).
- If D1 is removed or no longer uses a fixed window, F1 is removed, because it justifies no current decision or constraint (D140). F2 stays, because it is a non-obvious fact (D184).
- The code uses a sliding window. A test file covers it, and the test fails on a fixed window, for example with requests at the end of one window and at the start of the next (D192).
- The two constraints of step 1 do not change, and have no ID (D138). A new constraint can come only from the answer about the header.
- The sliding window decision has no 🤖, because it records an instruction of the user (D181). It gives no "because" reason that the user did not give and that the run does not show, because a decision with no 🤖 holds only what the user said (D177, D214).
- Each visible result that the agent put in the code and that `plan.md` and the user did not say is in a 🤖 decision: the behavior for a request with no key, and the body of the 429 response and of any other error response (D219, D220). The header that names the API key is an open question before apply writes the code that reads the key, because only the user knows how the existing clients send the key. A 🤖 decision for the header fails, because the question rule says that apply cannot decide a point that only the user knows (D254). After the answer, it is a fact with 👤, a constraint, or a decision with no 🤖 (D229, D240).

### 4c. Preview and apply put an obvious reason in the decision

**Steps**:

1. On a new plan-lite change `city-lookup`, add `tools/geo.mjs`. For `node tools/geo.mjs Paris`, it prints `{"lat":48.86,"lon":2.35}`. For each other city, it prints `{"error":"city not found"}`, also with exit code 0. Write a `plan.md` from the template `openspec/schemas/plan-lite/templates/plan.md`, because `plan-hash.mjs` needs each of its headings. Give it the Goal "Add `lookup(city)` in `src/lookup.js`. It returns the coordinates from `tools/geo.mjs`, or `null` for an unknown city." and the constraint "- C1: Add no npm dependency." Commit.
2. Run `openspec-lite-tasks-preview city-lookup`. Do not commit after it.
3. Run `openspec-lite-apply city-lookup`. When it asks the open questions, answer only the first one: "Use your recommended answer for the first question. Leave the other questions open." If the first question has no recommended answer, answer: "Keep the first question open. Leave the other questions open." If it asks only one question, answer it the same way. If it asks no question, give no answer.
4. Commit. Run `openspec-lite-archive city-lookup`. If it asks "Archive anyway?", answer yes.

**Expected** (D171, D172, D179, D184):

- In step 2, the agent gives no "not committed" note, because `plan.md` is committed and `plan-status.mjs` prints nothing (D193).
- After step 2, each decision of the preview ends its heading with 🤖. If apply asked a question in step 3 and the user answered it, the answer is a fact with 👤, a constraint, or a decision with no 🤖 (D181, D226, D240).
- After step 2, if a decision of the preview says how `lookup` finds an unknown city, `plan.md` gives the reason for it: the tool reports an unknown city with an error body in its output, not with a failing exit. The 3 lines of `tools/geo.mjs` show this, so it is an obvious fact, also if a run showed it. It is in the "because" part of that decision, not in `## Facts` (D192, D198, D200). If a run read the exit code, it used `exit-code.mjs` (D197). The summary lists each new fact. No fact only restates what a reader can easily deduce from `tools/geo.mjs`, for example "geo.mjs is a CLI script, not a module", or what `geo.mjs` prints for Paris, which its code shows (D198). If such an obvious fact is the reason of a decision, it is in the "because" part of that decision (D184, D192). Goal and Constraints did not change. `plan-sha256` equals the output of `plan-hash.mjs` on `plan.md`.
- In step 3, if step 2 changed `plan.md`, the agent commits only `plan.md`, and says in one line that it committed `plan.md`. If step 2 did not change it, the agent makes no commit and gives no note (D193, D290). It gives no stale warning. Before it writes code, it tries to decide or find the answer to each open question. A closed question is a fact, a 🤖 decision, or an answer only in the summary, and the question is gone (D223, D234). It asks each question that is still open with its recommended answer, and ends the turn. A question whose answer is a fact that only the user knows gets no recommendation (D195, D225).
- After step 3, if apply asked a question and the user answered it, the answer is a fact with 👤, a constraint, or a decision with no 🤖 (D226, D240). If the user kept the first question open, it ends with "(kept open by the user)", apply writes no code that depends on it, and the done check names the part of the Goal that waits for it (D234). Each other question that it asked is still in `## Open Questions`, because the user said to leave it open, also if the agent could decide it later. Its text ends with "(kept open by the user)" (D223, D228). The agent does not ask them again, and it writes the code that depends on no kept question (D234). If a question is still open, the done check says that `## Open Questions` is not empty (D172).
- After step 3, `## Facts` holds no fact about the error body. If `plan.md` has a decision on how `lookup` finds an unknown city, it still gives the error-body reason (D198, D200). The summary lists each fact, decision, and open question that apply added, changed, or removed.
- In step 4, if archive drafts an ADR for the decision on how `lookup` finds an unknown city, the ADR gives the error-body reason. After the archive, `openspec/adr/` holds that ADR. If archive does not draft that ADR, it lists the decision as not drafted, with a reason (D179, D186).
- After step 3, `lookup('Paris')` returns the coordinates, and `lookup('Atlantis')` returns `null`. The agent checks both with a run or a test.
- In step 4, the summary names each draft that comes from a decision with 🤖. No spec or ADR holds a 🤖 (D181).

### 4d. Preview and apply record a non-obvious fact

This scenario checks a fact that only a run can find (D184, D186). OpenSpec 1.14.2 prints "No items found to validate." and exits with code 0 for `openspec validate --specs` with no spec (`docs/facts.md`). The code of the repo cannot show it.

**Steps**:

1. On a new plan-lite change `spec-gate`, write a `plan.md` from the template `openspec/schemas/plan-lite/templates/plan.md`, because `plan-hash.mjs` needs each of its headings. Give it the Goal "Add `scripts/spec-gate.mjs`. It exits with code 1 when the repo has no spec, and with code 0 otherwise." and the constraint "- C1: Use `openspec validate --specs` to check the specs. Do not scan the files." Create no spec. Commit.
2. Run `openspec-lite-tasks-preview spec-gate`. Commit.
3. Run `openspec-lite-apply spec-gate`. When it asks the open questions, answer: "Use your recommended answer for each question. Keep open each question that has no recommended answer." If it asks no question, give no answer.
4. Add one valid spec under `openspec/specs/`, and run the script.

**Expected**:

- After step 2 or step 3, `## Facts` has a fact that `openspec validate --specs` exits with code 0 when no spec exists, with the command as its source. It is a non-obvious fact, because only a run shows it. The agent reads the exit code with `exit-code.mjs`, not with `echo $?`. No fact says that the exit code was not checked (D197).
- After step 3, the fact is still in `## Facts`, also if no decision names it (D184).
- The script exits with code 1 in a repo with no spec. The agent checks this with a run of the real script and the real `openspec` command, in this repo, or in a test that creates a repo with no spec. A run against a fake `openspec` alone does not pass (D279).
- In step 4, the script exits with code 0.
- A question whose answer can change an outcome that the Goal states quotes that outcome, and says that the answer can change the Goal, for example a question about the exit code for an invalid spec, where the Goal says "with code 0 otherwise". If the answer of step 3 changes the outcome, apply edits that outcome of the Goal, and the summary quotes the old and the new outcome. No constraint or decision contradicts the Goal, and the done check checks the edited Goal (D288).
- Apply wrote a test for the script, and the test fails if the script gives the wrong exit code (D192).
- If the script reads the output text of `openspec validate`, `plan.md` has a 🤖 decision about it, because a new OpenSpec version can change the text. The agent can decide this point, so an open question does not pass (D223). The same holds if it reads a field of the JSON output, because the field is input of the script (D218). Each exit code or result on an error that the agent added and that `plan.md` and the user did not say, for example an exit code when `openspec` cannot run, is in a 🤖 decision (D220).

## 5. Archive with promotion

**Steps**:

1. Start from the fixture `finished-rate-limit`. Its `plan.md` has one non-obvious requirement (the `Retry-After` constraint) and one `### Decision D<n>:` entry with no 🤖.
2. Run `openspec-lite-archive`.

**Expected**:

- The agent does the done check first. It asks "Archive anyway?" only if an answer is "no".
- The requirement in the delta states the rule of `plan.md`, and has at least one `#### Scenario:`. The ADR holds the reason of the decision and the rejected option. The agent does not print the full text of a draft. It prints a short summary with one line for each promoted item, its `plan.md` ID and its title or a short form of its text, in groups with a count. The Goal outcome is a contract, so it is a requirement, or is in the requirement of a constraint (D290). The summary asks no question, and the agent writes and archives in the same turn (D289). `plan.md` has no 🤖, so the agent makes no claim that a decision is marked. A true line such as "No decision has a 🤖" is OK (D192, D193).
- `openspec validate` passes. `openspec/adr/YYYY-MM-DD-<slug>.md` exists with Status `Accepted`.
- `openspec/specs/<capability>/spec.md` holds the requirement. The change is in `openspec/changes/archive/`.

## 6. Archive with nothing promoted

**Steps**: Start from the fixture `finished-rate-limit`. Remove `skip_specs` from `.openspec.yaml` of the change. Delete each item of `## Constraints`, `## Facts`, and `## Decisions` of `plan.md`. Replace the Goal with an internal outcome that no client sees, and that the code meets: "Delete the expired windows of `src/rateLimit.js` once in each window." Commit. Run `openspec-lite-archive`.

**Expected**: no item passes a filter. The summary says that the agent promotes nothing, and lists each item that it does not draft, for example each non-goal, with a reason. The agent sets `skip_specs: true`, and the archive succeeds. `openspec/specs/` does not change, and the agent writes no ADR (D289).

## 7. Interrupted upgrade

**Steps**:

1. Run this prompt, then answer yes to the tasks preview: "openspec-lite-propose: add a CSV export to the report page. Scope: one Export CSV button on the report page, exporting the rows shown in the table. Source: docs/report-page.md and issue #42. Requirement: the export uses the same column order as the table on screen. Decision: generate the CSV in the browser, because the data is already loaded there. Constraint: no new server endpoint. Open question: should the export include hidden columns? (This changes the tasks.)" (D157) After the preview, add this decision to `## Decisions` of `plan.md`, with the next free ID, to stand for an agent decision: `### Decision D<n>: Quote each cell 🤖`, then "Chose to quote each cell because a cell can hold a comma." Commit.
2. Run `openspec-lite-upgrade`. Answer its question turn with the answer of step 3. Stop the agent after it writes `proposal.md`. In a headless run, step 2 ends after the question turn, because print mode cannot stop the agent at an exact step.
3. Start from the fixture `interrupted-upgrade` in a new folder: the state after step 2, with `proposal.md`, `schema: plan-lite`, `skip_specs: true`, and `tasks-preview.md`. In a new session, run `openspec-lite-upgrade` again. Upgrade asks the question turn again, because the answers of step 2 are not on disk (D208). Answer the open question: "No, the export does not include hidden columns." If it also asks where the report page lives, answer: "I cannot answer this now." If the agent also asks to write a requirement from the Goal, the tasks preview, or the quoting decision, answer yes in the same reply. At the prune question, answer yes.

**Expected**:

- In step 2, the agent asks the question turn and ends the turn before it writes an artifact (D164). After step 2, `.openspec.yaml` still has `schema: plan-lite` and `skip_specs: true`, because upgrade removes the line only just before the first spec write (D208).
- After step 3, the agent keeps `proposal.md` and writes the rest. It removes `skip_specs: true` before it writes the delta (D208). Before any write, the agent asks the open question and each planned requirement from the Goal or the tasks preview in one reply (D164). Each requirement comes from a constraint, a decision that is a contract, or an answer of the user (D166). Each other item in `proposal.md`, `specs/`, and `design.md` that comes from neither `plan.md` nor an answer ends with 🤖, for example a `#### Scenario: Table is empty` that the agent adds. If the agent adds no such item, this part has nothing to check. The kept `proposal.md` of the fixture has a `## Why` line with 🤖, so the summary always lists at least that line (D288). `tasks.md` has no 🤖. The summary lists each 🤖 item (D152). The question turn asks the requirement that the agent plans from the quoting decision, because the quoting is a contract of the CSV file: another program reads the file format (D261). If the user says yes to that requirement, the quoting decision has no 🤖 in `design.md`, and the summary says that the yes removed the mark (D256). If the user does not say yes, the quoting decision keeps its 🤖, and the summary lists it as an agent decision. `tasks.md` has `- [ ]` tasks seeded from the preview. The agent deletes `tasks-preview.md`.
- `specs/` holds the column-order requirement. The answer "no hidden columns" is a requirement in `specs/`, because it limits the CSV that the user gets, so it is a rule and a requirement source (D256, D258). A `design.md`-only result fails, because stock `/opsx:archive` does not promote `design.md`. `design.md` holds the browser decision. The "no new server endpoint" constraint is in `specs/`, in `design.md`, or in both, because each constraint is a requirement source (D166, D266).
- `.openspec.yaml` has `schema: spec-driven`. `openspec validate` passes or the agent reports each error.
- In one reply, the agent shows the `validate` result, the summary, and the list of `plan.md` destinations, with the prune question as the last line (D193). After the yes, `plan.md` is deleted, or holds only the open questions that have no slot.

## 8. Newer repo schema

**Steps**: Change the `version:` value to `99` in `openspec/schemas/plan-lite/schema.yaml`. Run each workflow skill.

**Expected**: Each skill stops with the message "This repo uses a newer plan-lite schema. Run `apm update`. …". The message also names `apm update -g` for a user-scope install. No file changes.

## 9. Schema re-copy

**Steps**:

1. Change the `version:` value to `0` in `openspec/schemas/plan-lite/schema.yaml`.
2. Add a file `openspec/schemas/plan-lite/local-note.txt`.
3. Replace the `operations` comment in `openspec/config.yaml` with a real key:

   ```yaml
   operations:
     archive:
       guidance:
         - "keep me"
   ```

4. Run `openspec-lite-propose`.

**Expected**:

- The agent says that it will replace the schema (v0 → the shipped version), and asks first.
- After yes, `openspec/schemas-backup/plan-lite-v0-<timestamp>/` holds the old folder with `local-note.txt`.
- `openspec/schemas/plan-lite/` has no `local-note.txt`.
- The agent reports the backup path and the copied files.
- `openspec/config.yaml` has one `operations:` key. Its `archive.guidance` list has "keep me" and the openspec-lite item.
- `openspec instructions plan --change <name> --json`, for the change that propose made, prints no "could not parse" warning. `openspec list` never prints it (`docs/facts.md`).

## 11. OpenSpec root in a subfolder

**Steps**:

1. In an empty git repo, create `svc/`. Run `openspec init --tools claude` in `svc/`.
2. Run `apm install <path-to-this-repo>/package --target claude` at the git root.
3. Start the agent at the git root. Ask: "openspec-lite-propose: add a health check to svc."

**Expected**:

- At the git root, `openspec list --json` gives `root: null`. The agent finds `svc/openspec/` in a subfolder and asks you to confirm it as the root. It does not suggest `openspec init` at the git root.
- After you confirm, each `openspec` command and each command with a relative `openspec/...` path runs in `svc/`. A command that gets `svc/` as an absolute argument, for example the `install.mjs` command, can run from any folder (D269).
- `svc/openspec/schemas/plan-lite/` exists. The git root has no `openspec/` folder.
- The schema skill finds itself in `.claude/skills/` at the git root, which is a parent folder of `svc/`.

## 12. Propose resume

**Steps**:

1. Run `openspec new change resume-me --schema plan-lite`. If its `.openspec.yaml` has no `skip_specs: true` line, add one. OpenSpec 1.14.2 writes the line itself. Do not write `plan.md`.
2. Ask: "openspec-lite-propose: resume-me."
3. If the agent asks what the change does, answer: "It adds a health check endpoint." If the agent asks the Level 1 question, answer no. Answer yes to the resume question.

**Expected**:

- The agent says that the change exists with no `plan.md`, and asks to resume.
- The agent does not invent a Goal. It asks what the change does, unless the user already said it. `## Goal` holds only the answer of the user.
- After yes, `plan.md` exists, and `.openspec.yaml` has exactly one `skip_specs` line.
- `openspec validate resume-me` passes.

## 13. Archive reruns

### 13a. After a failed validate

**Steps**:

1. Start from the fixture `finished-rate-limit`. From the temp folder, start `<path-to-this-repo>/scripts/break-delta.sh openspec/changes/add-rate-limit &`. Run `openspec-lite-archive`.
2. The script breaks the delta before step 9 of the skill: it removes the `#### Scenario:` blocks right after the agent writes the delta. `validate` fails, and the skill stops before it writes any ADR.
3. If run 1 ends with a question, for example to restore the delta, do not answer it.
4. Fix the delta as run 1 asks: add a `#### Scenario:` block with **WHEN** and **THEN** lines to each requirement of the delta. Start a new session, and run `openspec-lite-archive` again.

**Expected**:

- In run 2, the summary names the delta file of run 1, and says that the agent keeps the file. The agent asks no question about the file, and does not draft a requirement that the file holds. The fix of step 4 is still in the main spec after the archive (D289).
- The agent drafts the decision again, because no ADR exists yet.
- In run 1, the agent shows the `validate` error. A stop before `validate` also passes, if the agent read the delta back, says how the delta differs from the draft, and writes no ADR, because the failure rule checks each write on disk (D281).
- After run 2, `openspec/adr/` has one ADR for the decision, with the plain lines `Status: Accepted` and `Change: <name>`. `openspec/specs/` holds each requirement once, and the change is in `openspec/changes/archive/`.

### 13b. After a failed `openspec archive`

**Steps**:

1. Start from the fixture `finished-rate-limit`. Before the run, create the archive target folder `openspec/changes/archive/<today>-<name>/`. `openspec archive` then fails with "Archive '<today>-<name>' already exists".
2. Run `openspec-lite-archive`. The ADR is written at step 10, and step 11 fails. If the agent asks about the archive target folder, answer: "Do not delete the archive folder."
3. Delete the folder from step 1. Run `openspec-lite-archive` again.

**Expected**:

- Run 1 reports the archive failure and keeps the ADR.
- Run 2 finds the ADR with `Change: <name>`, names it in the summary, and does not draft that decision again.
- After run 2, `openspec/adr/` has one ADR for the decision, and the change is in `openspec/changes/archive/`.

## 14. Promotion into an existing capability

This scenario checks that archive puts the knowledge of `plan.md` into the right capability spec, and does not make a new capability next to an existing one.

**Steps**:

1. Create `openspec/specs/auth/spec.md` with this content:

   ```markdown
   ## Purpose

   Login for the web client.

   ## Requirements

   ### Requirement: Password login
   The system SHALL log in a user with a valid email and password.

   #### Scenario: Valid password
   - **WHEN** the email and the password are valid
   - **THEN** the user is logged in
   ```

2. Create a plan-lite change `lockout` with this `plan.md`:

   ```markdown
   ## Goal
   Lock an account after repeated failed logins.

   ## Non-Goals
   - No CAPTCHA.

   ## Constraints
   - C1: After 5 failed logins in 15 minutes, the system SHALL lock the account for 30 minutes.
   - C2: A locked account SHALL NOT log in, also with a valid password.

   ## Open Questions

   ## Facts
   - F1: In the login logs, brute-force attacks on one account come from many IP addresses.

   ## Decisions
   ### Decision D1: Count failures per account, not per IP
   Chose per account because attackers rotate IP addresses. Rejected per IP because it also locks out users behind one office NAT.
   ```

3. Run `openspec-lite-archive lockout`.

**Expected**:

- The deltas use the existing capability `auth`. The agent does not create a new capability such as `lockout` or `account-lockout`.
- Each new rule has at least one `#### Scenario:`.
- The delta form is free. "A locked account SHALL NOT log in, also with a valid password" can be a MODIFIED "Password login" (with its full text) or an ADDED requirement. Both pass if the main spec below ends up correct.
- The decision becomes an ADR with `Change: lockout`.
- The `## Context` of the ADR includes the fact about the login logs, in words (D135). No spec or ADR holds a `plan.md` ID such as `C1`, `F1`, or `D1` (D142).
- After the archive, `openspec/specs/auth/spec.md` has:
  - the "Password login" requirement, with its "Valid password" scenario unchanged;
  - the locked-account rule, in "Password login" or in its own requirement;
  - the new lockout requirement.
- The Non-Goal "No CAPTCHA" is either in the ADR, or the agent says why it skipped it.

## 15. Promotion keeps each non-obvious item and each contract

This scenario checks that no non-obvious knowledge and no contract of `plan.md` is lost at archive time (D119).

**Steps**:

1. Create a plan-lite change `export-csv` with this `plan.md`. Each line has a tag in brackets that the agent does not see in a real repo. Remove the tags before the run, and keep this list as your answer key:

   ```markdown
   ## Goal
   Export the report table as CSV. [contract: spec, alone or in the requirement of a constraint]

   ## Non-Goals
   - No Excel export. [obvious: skip]

   ## Constraints
   - C1: The CSV SHALL use a semicolon separator, because the users open it in a French Excel. [non-obvious: spec]
   - C2: The export SHALL include only the rows that match the active filters. [non-obvious: spec]
   - C3: The CSV SHALL start with a header row of the column names. The import script of the finance team reads them. [obvious contract: spec]
   - C4: The export button is in the toolbar. [obvious, UI layout: skip]

   ## Open Questions

   ## Facts
   - F1: The report page loads all rows of the table at page load. [justifies D1: ADR Context]
   - F2: The import script of the finance team reads the columns by name, not by position. [justifies C3: reason in the C3 requirement text]

   ## Decisions
   ### Decision D1: Build the CSV in the browser
   Chose the browser because the table already has all rows in memory. Rejected a server endpoint because it adds an API for one button. [non-obvious: ADR]
   ### Decision D2: Use the date in the file name
   Chose `report-YYYY-MM-DD.csv`. The import script of the finance team finds the file by this name. [obvious decision, contract: spec]
   ```

2. Run `openspec-lite-archive export-csv`.

**Expected**:

- Each item tagged `spec` is in a requirement of the delta. The file name decision is a contract for the finance team, so it becomes a requirement. An ADR for it is optional. If no ADR holds the file name decision, the end summary says that the reason of the decision now exists only in `openspec/changes/archive/`, names the requirement that holds the decision, and says that the requirement keeps only the rule (D204, D291). Each item tagged `ADR` is in an ADR. The Goal outcome "Export the report table as CSV" is a requirement, or is in the requirement of a constraint, because it is a contract for the users (D290).
- For each item that the agent does not draft, the summary names the item and says why it skips it. No item disappears with no word. The summary gives each promoted item by its `plan.md` ID and title, in its group, and does not print the full text of a draft (D289).
- The reason for the semicolon (French Excel) stays in the requirement text or in the ADR, not only in a scenario title. It is the non-obvious part (D147).
- No line of the written deltas or specs holds a source emoji, for example 👤. No spec or ADR gets a 👤 for an item that has none in `plan.md` (D252).
- The header row requirement gives its reason in its text: the finance import reads the columns by name. So a reader sees that a renamed column breaks the import, and a new column order does not (D191).
- The ADR of the browser decision has the fact about the page load in its `## Context`. No spec or ADR holds a `plan.md` ID such as `C1`, `F1`, or `D1` (D142).
- After the archive, `openspec/specs/<capability>/spec.md` has the four `spec` items and the Goal outcome, and `openspec/adr/` has the `ADR` item.

Record each mismatch with the answer key. A tagged `spec` or `ADR` item that is not promoted, and not named as skipped, is a failure.

## 16. Stock `/opsx:archive` on a plan-lite change

This scenario checks the risk of a lost promotion. Stock `/opsx:archive` does not promote `plan.md`. openspec-lite adds a hint to `openspec/config.yaml` (D95), but the hint is best effort. Without the hint, and with the `openspec archive` CLI, the gap is known (`docs/facts.md`), so no scenario runs these cases (D190).

### 16a. With the archive guidance in `config.yaml`

**Steps**:

1. Start from the fixture `after-propose`. Its `openspec/config.yaml` has the openspec-lite archive guidance item.
2. Add one non-obvious constraint and one decision to `plan.md`.
3. Run stock `/opsx:archive <name>`.

**Expected** (at least one of these):

- The agent runs `openspec-lite-archive` instead, or tells the user to run it, before it archives.
- The agent warns that `plan.md` has decisions and requirements that this archive does not promote, and asks before it continues.

**Failure**: the agent archives the change and does not mention promotion or `openspec-lite-archive`. Then the knowledge of `plan.md` stays only in `openspec/changes/archive/`. Record the exact reply, because this result decides if openspec-lite needs a stronger guard.

## 17. `openspec-lite-apply` after an upgrade

**Steps**:

1. Start from the fixture `after-upgrade`. The change is `spec-driven`, with `tasks.md`, and has no `plan.md`.
2. Run `openspec-lite-apply <name>`.

**Expected**:

- The agent stops at the change schema guard. It writes no code and changes no file.
- It tells the user to run stock `/opsx:apply`, because the change is spec-driven now.

**Variant 17b**: before step 2, copy `tests/fixtures/scenarios/kept-plan.md` to the change as `plan.md`, and commit. It holds only an open question, as an upgrade keeps it when a section has no slot. Expected: `openspec-lite-apply` still refuses. Only `openspec-lite-upgrade` has the resume exception (D106). It also says that `plan.md` holds an open question that stock `/opsx:apply` does not read, and tells the user to resolve it first.

## 18. `openspec-lite-archive` after an upgrade

**Steps**:

1. Start from the fixture `after-upgrade`. Mark each task in `tasks.md` as done (`- [x]`). Commit.
2. Run `openspec-lite-archive <name>`.

**Expected**:

- The agent stops at the change schema guard. It writes no spec.
- The decisions from `plan.md` are in `design.md` → `## Decisions` (upgrade moved them, D62).
- The agent copies each decision of `design.md` to an ADR in `openspec/adr/`, with no offer and no question (D115, D289). The summary names each ADR by its title, and does not print the full text of an ADR.
- After the ADRs, the agent lists the 🤖 lines of `specs/` and `design.md`. The delta of the fixture holds a 🤖, so the agent asks the user to remove the marks, and does not offer the archive or point to stock `/opsx:archive` yet (D192, D215).

### 18b. Archive copies the decisions to ADRs after the guard

This scenario checks the guard path with a kept `plan.md`, up to the archive (D154, D289).

**Steps**:

1. Start from the fixture `after-upgrade`. Copy `tests/fixtures/scenarios/kept-plan.md` to the change as `plan.md`. Mark each task in `tasks.md` as done (`- [x]`). Commit. The delta holds the 🤖 scenario "Table is empty", so the 🤖 block is always tested.
2. Run `openspec-lite-archive add-csv-export-to-report-page` in a new session.
3. If the agent lists 🤖 lines of `specs/` or `design.md`, remove each 🤖 by hand. Then answer: "I removed the marks." When the agent asks the archive question, answer yes.

**Expected**:

- The agent asks no question before it writes the ADRs. The summary names each ADR by its title. Each ADR has `# <Title>`, `Status: Accepted`, `Change: <name>`, `## Context`, `## Decision`, and `## Consequences`.
- The summary names the ADR of "Quote each cell", because its heading in `design.md` ends with 🤖 (D204). When guard step 2 lists the 🤖 heading of "Quote each cell", the agent names its ADR file, and tells the user to also delete the ADR file if the user deletes the decision (D290).
- After step 2, `openspec/adr/` has one ADR for each `### Decision` of `design.md`, named `YYYY-MM-DD-<slug>.md`.
- Before step 3, `design.md`, the specs, and `.openspec.yaml` are the same as before step 2.
- After the ADRs, the agent lists each 🤖 line of `specs/` and `design.md`, for example the scenario "Table is empty" of the fixture. It does not offer the archive while a delta holds a 🤖, also not as a question with a condition (D192, D215). It removes no 🤖 itself, and it names each open question of a kept `plan.md` (D193). After step 3, it asks: "Archive the change now with `openspec archive <name> --yes`?". If `tasks.md` has unchecked tasks, the question names how many. After the archive, no file under `openspec/specs/` holds a 🤖. The change is in `openspec/changes/archive/`, and `openspec/specs/` holds the deltas of the change (D191).

## 19. Other openspec-lite skills after an upgrade

**Steps**: Start from the fixture `after-upgrade`. Run each of these in a new session:

1. `openspec-lite-tasks-preview <name>`
2. `openspec-lite-upgrade <name>` (the change has no `plan.md`)
3. `openspec-lite-upgrade <name>`, after you copy `tests/fixtures/scenarios/kept-plan.md` to the change as `plan.md`, and commit

**Expected**:

1. tasks-preview stops and points to stock `/opsx:apply`, because the fixture already has `tasks.md` (D255). It does not write `tasks-preview.md`.
2. upgrade stops. It points to the stock skills `/opsx:apply` and `/opsx:archive`.
3. upgrade asks if it can finish the upgrade, and says what is left to do: validate the artifacts, then decide what to delete from `plan.md`. The question names no step number (D191). The turn ends at the question (D196). Answer no. Then it names the open question that stays in `plan.md`, and stops with no file change (D196).

In each case, `.openspec.yaml`, `tasks.md`, and the other artifacts do not change.

## 20. Checks before a delete or a skip

This scenario checks that upgrade does not prune `plan.md` with no check (D120). It also checks that upgrade with no requirement keeps `skip_specs: true` (D108, D208). 20a also checks that upgrade uses `## Background` (D125) and prunes the sections that hold only a guidance comment (D127).

### 20a. Upgrade asks before it prunes

**Steps**:

1. Create a plan-lite change with a Goal, a `## Background` with two scope items, two Constraints, one `### Decision D<n>:` entry, one `## Facts` item that the decision relies on, and one open question in `plan.md`. Keep the guidance comments of the template. The answer to the question must change the specs, for example "Do internal service keys get a higher limit?" on a rate limit change. Run `openspec-lite-tasks-preview`. If the preview names no `plan.md` ID, add one, for example "(D1)", to a task line.
2. Run `openspec-lite-upgrade`. When the agent asks about the open question, answer "I do not know yet". The tasks preview of step 1 can add more open questions. Give the same answer to each one. If the agent also asks to write a requirement, from the Goal, the tasks preview, a 🤖 decision, or another source, answer yes to each one in the same reply (D164). At the prune question, answer no.
3. Run `openspec-lite-upgrade` again. Answer yes to the resume question and to the prune question. The resume question says what is left to do, with no step number (D191).

**Expected**:

- The agent asks the user to answer the open question before it writes an artifact, in one reply with each planned requirement from the Goal or the tasks preview (D164).
- Before the prune question, the agent shows the `openspec validate` result, and lists each `plan.md` section with its artifact and heading. The open question is "kept" (D191). A section with only a guidance comment needs no row (D253).
- After step 2, `plan.md` is the same as in step 1.
- After the "no" of step 2, the agent says in one line that the moved sections in `plan.md` are old copies, and that the artifacts are the source of truth. It does not write the summary again (D193).
- `proposal.md` holds the two scope items of `## Background`.
- `design.md` → `## Context` holds the fact (D135). `proposal.md`, `specs/`, and `design.md` hold no `plan.md` ID such as `C1` or `D1` (D142).
- `tasks.md` holds no `plan.md` ID. Each task that had a `plan.md` ID names the item by its title, or a short form of its text, instead (D142).
- After step 3, `plan.md` has only the ID comment and `## Open Questions` with the open questions that the user could not answer (D158). These questions have no "(kept open by the user)" marker, because "I do not know yet" does not ask to keep them open (D247). No section with only a guidance comment is left. Each other item is in `proposal.md`, `specs/`, or `design.md`. `proposal.md` and `design.md` do not restate an open question that stays in `plan.md`, and do not point to it, for example "See the open questions in tasks.md". This also applies to a question that the tasks preview added (D133, D196). In step 3, the turn ends at the resume question, before `validate` (D196). `tasks.md` starts with a `## 0. Open questions` group, with one task for each open question that the user could not answer, so that stock `/opsx:apply` meets them first (D191).

### 20c. Upgrade with no requirement

**Steps**:

1. Create a plan-lite change with a Goal and one `### Decision D<n>:` entry in `plan.md`. The decision must not be a contract, for example "Store the audit log in the main database". Do not write a requirement or a constraint (D164).
2. Run `openspec-lite-upgrade`. When the agent asks for a requirement, answer "none". The question does not say that upgrade cannot go on without a requirement (D210).

**Expected**:

- The agent writes no file under `<change>/specs/`.
- `.openspec.yaml` has `schema: spec-driven` and `skip_specs: true`.
- Before the delete, the agent runs `openspec validate`, and it passes. In one reply, it shows the result, the summary, and the list of `plan.md` sections with their destinations. The prune question is the last line, and the turn ends there. The summary does not say that `plan.md` is deleted or kept (D132, D191, D193).
- After the answer, the agent says in one line what it deleted or kept. It does not write the summary again (D193).
- The summary says that `skip_specs` is set at the end, because the change has no spec delta (D153).
- Upgrade keeps the `skip_specs: true` line during the whole run, because it writes no spec file (D160, D208).

## 21. Archive supersedes an old ADR

This scenario checks that archive links a new ADR to the old ADR that it replaces (D122).

### 21a. Full replacement

**Steps**:

1. Write `openspec/adr/2026-01-10-fixed-window-rate-limit.md` with `# Fixed Window Rate Limit`, `Status: Accepted`, `Change: add-rate-limit`, and the three sections. Its `## Decision` says: "Use a fixed 60-second window per API key."
2. Write `openspec/adr/2026-01-12-store-audit-log.md` with `# Store the Audit Log in the Main Database`, `Status: Accepted`, `Change: add-audit-log`, and the three sections. It is not about rate limits.
3. Create a plan-lite change `sliding-rate-limit`. Its `plan.md` has a Goal and one `### Decision D1: Use a sliding window` entry: "Chose a sliding 60-second window because the fixed window allows bursts at the window edge. Rejected the fixed window."
4. Run `openspec-lite-archive`.

**Expected**:

- The new ADR has `Supersedes: 2026-01-10-fixed-window-rate-limit.md` after `Change: sliding-rate-limit`.
- Before the write, the summary names the old ADR and says that its `Status` line changes. The agent asks no question (D289).
- The new ADR is in `openspec/adr/`, with the `Supersedes:` line.
- The old ADR has `Status: Superseded by <new file name>`. Each other line of the old ADR is the same as in step 1.
- The summary lists the old ADR as superseded.
- The audit log ADR does not change. A wrong `Superseded` mark damages the decision history.

### 21b. Rerun after a stop between the two writes

**Steps**:

1. Build the state after step 10 of `openspec-lite-archive` in 21a, but before the old ADR changed: the new ADR exists with `Supersedes:`, the old ADR still has `Status: Accepted`, and the change is not archived. `validate` passes.
2. Run `openspec-lite-archive`.

**Expected**: if the repo holds committed code that meets the Goal, the done check passes with no "Archive anyway?" question, and says nothing that the code is missing (D209). The agent does not draft the decision again. If the earlier run wrote a delta, the agent keeps the delta, does not draft a requirement that the delta holds, and names the delta file in the summary. After the archive, the main spec holds each requirement once (D289). The summary names the new ADR. The agent asks no question about the new ADR, the delta file, or the `Status:` edit. It changes the `Status:` line of the old ADR to `Status: Superseded by <new file name>`, then archives the change.

## 22. Goal with more than one outcome

This scenario checks the rules for a Goal with more than one outcome (D148).

### 22a. Related outcomes stay in one change

**Steps**: Ask: "openspec-lite-propose: add a CSV export to the report page, and fix the old bug where the report page shows dates in UTC instead of the user time zone. The CSV export uses the same date code."

**Expected**:

- If the agent asks the Level 1 question, answer no.
- The agent creates one change. Its name starts with words from the main outcome, for example `add-csv-export` or `report-csv-export`. Words from the time zone fix can follow them, for example `report-csv-export-user-timezone`. A name that starts with the time zone fix fails, for example `user-timezone-and-csv-export` (D161, D168).
- `## Goal` has two bullets, one per outcome. Each bullet has one or two sentences.
- The Goal comment of the template stays.
- The agent does not ask the split question. The summary names no separate change.

### 22b. An outcome that can ship alone goes to a separate change

**Steps**: Ask: "openspec-lite-propose: add a CSV export to the report page, and upgrade the logging library in the billing service."

**Expected**:

- Before it creates a change, the agent asks if it can leave the logging library upgrade out of this change. It does not ask about the CSV export. Answer yes. If the agent then asks the Level 1 question, answer no.
- The agent creates one change for the CSV export. Its name comes from the CSV export.
- `## Goal` names only the CSV export. `plan.md` does not mention the logging library.
- The summary names the logging library upgrade, and tells the user to run `openspec-lite-propose` for it.

### 22c. Archive checks each outcome

**Steps**:

1. Add a report page with a date helper that formats the dates in UTC. Commit the code.
2. Create a plan-lite change `add-csv-export`. Its `## Goal` has two bullets: "Add a CSV export to the report page." and "Show the report dates in the user time zone."
3. Add a CSV export to the report page that uses the date helper. Do not change the date helper. Commit the code.
4. Run `openspec-lite-archive`.

**Expected**:

- The done check finds the CSV export, and says that the date outcome is not met. It names that outcome.
- The agent asks only: "Archive anyway?", with no menu of other options (D155). Answer no. The agent stops, and writes no spec, no ADR, and no archive folder.
- For the date outcome, it gives two paths: implement it with `openspec-lite-apply`, or remove it from `## Goal` and propose it as a separate change. Then it tells the user to run archive again (D191).

---

## Running the Scenarios Headless

You can run each scenario without a person at the keyboard, with Claude Code in print mode. This is how the scenarios ran on 2026-10-15.

1. Build the start state of the scenario in a new temp folder, with `scripts/scenario-setup.sh` (see each scenario's Steps and the isolation rules at the top).
2. Run the first prompt from inside that folder:

   ```sh
   claude -p "<prompt>" --model <full model id> --output-format json \
     --setting-sources project,local \
     --permission-mode acceptEdits \
     --allowedTools "Bash(openspec:*)" "Bash(node:*)" "Bash(git:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(mkdir:*)" "Bash(npm:*)" \
     < /dev/null
   ```

3. Read `result` and `session_id` from the JSON. When the skill asks a question, answer with the same command plus `--resume <session_id>`.
4. Check the expected results on disk, not only in the agent's reply.

Notes:

- Pin the full model ID, for example `eu.anthropic.claude-sonnet-5-5`. On a Bedrock setup, the alias `sonnet` resolved to `claude-sonnet-4-6`. Check `modelUsage` in the JSON.
- A print-mode run cannot stop at an exact step. So scenario 7 step 3 starts from the fixture `interrupted-upgrade`, and 21b from the hand-built state that it describes. 13b needs no interrupt: `openspec archive` fails by itself. 13a can run with a real run 1: `scripts/break-delta.sh` removes the `#### Scenario:` blocks right after the agent writes the delta, before `validate`.
- Use `--setting-sources project,local`. Without it, a skill in `~/.claude/skills/` wins over the project copy with the same name. A global openspec-lite install then hides the release candidate (D131).
- Check the line `Base directory for this skill:` in the session log. It must name the temp folder, not `~/.claude/skills/`. On macOS, it shows the real path: `/private/var/folders/...` for `mktemp -d`, and `/private/tmp/...` for `mktemp -d /tmp/...`. The session logs are then in `~/.claude/projects/-private-tmp-<name>/`. A slash command such as `/opsx:apply` writes no such line.
- The flag also skips `~/.claude/settings.json`. On Bedrock, set `CLAUDE_CODE_USE_BEDROCK=1` in the shell.
- `< /dev/null` stops the 3-second wait for stdin.
- Permission denials in the JSON (`permission_denials`) mostly come from compound shell commands outside the allowlist. The agent then retries with allowed commands.

## Metrics

Each report has a metrics table, with one row for each session and one total row for the group. Each scenario has its own sessions (D199). The numbers are useful only in a comparison, for example the same scenario on the last tag and on the new commit.

1. Save the JSON of each turn in its own file, in order, for example `> turn-1.json`, then `> turn-2.json` for the first `--resume` turn.
2. After the last turn, run this command from the repo root. Use the OpenSpec root of the scenario for `--dir`. It is the temp folder, except in scenario 11, where it is `<temp>/svc` (D162):

   ```sh
   node scripts/run-metrics.mjs --label <scenario> --dir <openspec root> turn-1.json turn-2.json
   ```

3. Copy the row to the report. Replace the two `?` with the pass count and the check count. Copy the file table if the scenario writes artifacts.

```markdown
| Scenario | Pass | Checks | Cost USD | Output tok | Thinking tok | Input tok | Cache read tok | Turns | Tools | Denials | User turns | Time s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

- **Pass**: the number of runs that pass, of all runs, for example `3/3`.
- **Checks**: the number of expected results that pass in this run, for example `4/5`.
- **Cost USD**: the sum of `total_cost_usd` of the last turn of each session. It is the best single cost number, because it weights each token type. In a `--resume` turn, `total_cost_usd` and `modelUsage` include the earlier turns of the session. `usage`, `num_turns`, and `duration_ms` give the values of that turn only.
- **Output tok** and **Thinking tok**: what the agent writes and thinks. A change to the skill text changes these first. Thinking tok comes from `modelUsage` of the last turn of each session.
- **Input tok**: `input_tokens` + `cache_creation_input_tokens`. **Cache read tok**: `cache_read_input_tokens`, which costs about 10% of new input. Do not add the two into one total, because the total hides the cost change.
- **Turns**: the sum of `num_turns`, the steps of the agent loop.
- **Tools**: the tool calls in the session log, counted once for each `tool_use` ID. The log can hold the same call twice.
- **Denials**: the sum of `permission_denials`. They come from the allowlist, not from the skill.
- **User turns**: the number of `--resume` turns, that is, the answers that the user gave. A turn in a new session does not count.
- **Time s**: the sum of `duration_ms`. It depends on the provider load, so it is the weakest number.
- The file table gives the lines and words of each `.md` file under `openspec/`, except `openspec/schemas/` and `openspec/schemas-backup/`. It measures the size of `plan.md` against the size of the spec-driven artifacts.
