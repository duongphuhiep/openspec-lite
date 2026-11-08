# Test Scenarios

Run scenarios 1–9 and 11–22 by hand before each release tag (D69). Number 10 is not used. The `apm-install` CI workflow does the real APM install from the tag (D130). The automated tests (`node --test`) cover the scripts and the schema. These scenarios cover the skills, which only an agent can run.

Setup for each scenario, unless it says otherwise:

1. Create an empty folder and run `git init`.
2. Run `openspec init --tools claude` (or your harness).
3. Install the release candidate: `apm install <path-to-this-repo>/package --target claude` (or your harness). Use the same harness as in step 2.
4. Start a new agent session in the folder.

`scripts/scenario-setup.sh <label> [fixture]` does steps 1 to 3, commits with the message "setup", and prints the folder. With a fixture, it also installs the schema and copies the `openspec/` folder of `tests/fixtures/scenarios/<fixture>/` (D199):

- `after-propose`: the change `add-csv-export-to-report-page` after scenario 1. `plan.md` has only the Goal.
- `after-preview`: the same change after a tasks preview, with three open questions and a current `tasks-preview.md`.
- `after-upgrade`: the same change after an upgrade (scenario 7), with no `plan.md`. Its delta holds the 🤖 scenario "Table is empty". `tests/fixtures/scenarios/kept-plan.md` is the `plan.md` that an upgrade keeps when an open question has no slot.

Isolation rules (D199):

- Each scenario run starts in a new temp folder, from the setup above or from a fixture. Do not start from the output of another scenario, and do not copy or clone the folder of an earlier run.
- Each scenario run starts a new agent session. Use `--resume` only for the answers inside one scenario.
- A setup commit message is neutral, for example "setup". The agent sees the recent commit messages (`docs/facts.md`).
- A run never writes to `tests/fixtures/`. To change a fixture, edit it in a commit, and run `node --test`.

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
- Before coding, the agent says that the preview is stale and offers to regenerate it. If `plan.md` has open questions, it asks each one in the same reply, with its recommended answer (D172).
- In step 5, the agent says that the preview is current, and gives no stale warning.
- In step 4, the agent copies the line of `plan-status.mjs`: "plan.md is not committed, …" (D171, D193). The note alone does not cause a stop. A stop for the stale warning or for the open questions is correct.

## 4. Stock apply follows the plan-lite rules

**Steps**:

1. Start from the fixture `after-preview`. Run stock `/opsx:apply`.
2. Answer the questions of apply in one reply: "Continue from `plan.md`. OQ1: the report page does not exist yet; create it in this repo. OQ2: export only the rows that the table shows, after the filters, in the current sort order, with all columns in the column order of the table. OQ3: build the CSV in the browser. Stack: plain HTML and JavaScript under `src/`, tests with `node:test`, run with `node --test`, no npm dependency. Scaffold a minimal report page." Do not write "use the defaults", because apply gives no defaults (D156).

**Expected**:

- The agent implements from `plan.md`, and records deviations as `### Decision D<n>:` entries.
- It does not edit `tasks-preview.md`.
- No code, test name, test string, code comment, commit message, or file other than `plan.md` and `tasks-preview.md` holds a `plan.md` ID such as `C1` or `D1` (D142).
- If `plan.md` has open questions, the agent asks each one with its recommended answer before coding, and ends the turn. For a question that only the user can answer, for example where some code is, it gives no recommendation and says why (D193). Each other question still gets a recommendation (D195). It closes only the questions that the user answered (D172).
- If a command failed and the agent changed the work for it, `## Facts` has a fact with the command and the error text (D172).
- Each choice between real alternatives that the agent made is a `### Decision D<n>:` entry. Each decision that records an answer or an instruction of the user has no 🤖. Each other decision that the agent wrote ends its heading with 🤖, also when its reason comes from `plan.md` (D181, D182). The end summary lists each fact, decision, and open question that the run added, changed, or removed in `plan.md` (D171).
- Before the done check, the agent runs the tests with `node --test`, and they pass. The summary gives the result (D176).
- A test covers the export: the CSV holds the rows that the table shows, in the column order of the table. The test fails if the export writes the wrong rows or the wrong order.
- At the end, each decision in `## Decisions` matches the code, and each fact in `## Facts` is still true (D192). Each "because" reason comes from the run, the user, `plan.md`, the code, or a well-known fact, not from a guess (D177, D192). A 🤖 mark does not excuse a guess or a false reason. A claim about how a tool, a runtime, or a platform behaves has a run or a doc as its source. If no source supports a reason, the decision says "Reason not checked." (D194).
- It ends with the done check (Goal, Constraints, Open Questions). If the run added an open question, the done check says that `## Open Questions` is not empty.
- It tells the user to archive with `openspec-lite-archive`, not `/opsx:archive`.

### 4b. Apply keeps only the current decisions

**Steps**:

1. On a new plan-lite change, write a `plan.md` with no template comments, so that the run checks `apply.instruction` alone. Give it two constraints with no ID, and one decision `### Decision D1: Use a fixed 60-second window`. Add two facts that justify only D1: `- F1: A fixed window needs only one counter for each API key.`, which a reader can deduce, and `- F2: In the access logs, the clients retry after 30 seconds or more.`, which is non-obvious, because it needs a study of the logs.
2. Run `openspec-lite-apply`. During the work, tell the agent: "Use a sliding window instead."

**Expected**:

- `## Decisions` has the sliding window decision. The fixed window decision is removed, or updated to the sliding window (D136). If the agent adds a new decision, its ID number is higher than each other decision ID in the file (D144).
- If D1 is removed or no longer uses a fixed window, F1 is removed, because it justifies no current decision or constraint (D140). F2 stays, because it is a non-obvious fact (D184).
- The code uses a sliding window. A test file covers it, and the test fails on a fixed window, for example with requests at the end of one window and at the start of the next (D192).
- The two constraints are the same as in step 1, with no ID (D138).
- The sliding window decision has no 🤖, because it records an instruction of the user (D181). It gives no "because" reason that the user did not give and that the run does not show (D177).

### 4c. Preview and apply put an obvious reason in the decision

**Steps**:

1. On a new plan-lite change `city-lookup`, add `tools/geo.mjs`. For `node tools/geo.mjs Paris`, it prints `{"lat":48.86,"lon":2.35}`. For each other city, it prints `{"error":"city not found"}`, also with exit code 0. Write a `plan.md` with the Goal "Add `lookup(city)` in `src/lookup.js`. It returns the coordinates from `tools/geo.mjs`, or `null` for an unknown city." and the constraint "- C1: Add no npm dependency." Commit.
2. Run `openspec-lite-tasks-preview city-lookup`. Do not commit after it.
3. Run `openspec-lite-apply city-lookup`. When it asks the open questions, answer only the first one: "Continue from plan.md. Use your recommended answer for the first question. Leave the other questions open." If it asks only one question, answer it the same way.

4. Commit. Run `openspec-lite-archive city-lookup`. If it asks "Archive anyway?", answer yes. Approve each draft.

**Expected** (D171, D172, D179, D184):

- In step 2, the agent gives no "not committed" note, because `plan.md` is committed and `plan-status.mjs` prints nothing (D193).
- After step 2, each decision of the preview ends its heading with 🤖. After step 3, the decision of the answered question has no 🤖 (D181).
- After step 2, if a decision of the preview says how `lookup` finds an unknown city, `plan.md` gives the reason for it: the tool reports an unknown city with an error body in its output, not with a failing exit. The 3 lines of `tools/geo.mjs` show this, so it is an obvious fact, also if a run showed it. It is in the "because" part of that decision, not in `## Facts` (D192, D198, D200). If a run read the exit code, it used `exit-code.mjs` (D197). The summary lists each new fact. No fact only restates what a reader can easily deduce from `tools/geo.mjs`, for example "geo.mjs is a CLI script, not a module", or what `geo.mjs` prints for Paris, which its code shows (D198). If such an obvious fact is the reason of a decision, it is in the "because" part of that decision (D184, D192). Goal and Constraints did not change. `plan-sha256` equals the output of `plan-hash.mjs` on `plan.md`.
- In step 3, if step 2 changed `plan.md`, the agent says in one line that `plan.md` is not committed. If step 2 did not change it, the agent gives no such note (D193). It gives no stale warning. If `plan.md` has open questions, it asks each one with its recommended answer before it writes code, and ends the turn. It does not answer a question itself (D172).
- After step 3, the answered question is a decision, and each other question is still in `## Open Questions`. The agent does not ask them again, and it writes the code. If a question is still open, the done check says that `## Open Questions` is not empty (D172).
- After step 3, `## Facts` holds no fact about the error body. The decision on how `lookup` finds an unknown city still gives the error-body reason (D198, D200). The summary lists each fact, decision, and open question that apply added, changed, or removed.
- In step 4, if archive drafts an ADR for the decision on how `lookup` finds an unknown city, the ADR gives the error-body reason. After the archive, `openspec/adr/` holds that ADR. If archive does not draft that ADR, it lists the decision as not drafted, with a reason (D179, D186).
- After step 3, `lookup('Paris')` returns the coordinates, and `lookup('Atlantis')` returns `null`. The agent checks both with a run or a test.
- In step 4, the agent names each draft that comes from a decision with 🤖. No spec or ADR holds a 🤖 (D181).

### 4d. Preview and apply record a non-obvious fact

This scenario checks a fact that only a run can find (D184, D186). OpenSpec 1.14.2 prints "No items found to validate." and exits with code 0 for `openspec validate --specs` with no spec (`docs/facts.md`). The code of the repo cannot show it.

**Steps**:

1. On a new plan-lite change `spec-gate`, write a `plan.md` with the Goal "Add `scripts/spec-gate.mjs`. It exits with code 1 when the repo has no spec, and with code 0 otherwise." and the constraint "- C1: Use `openspec validate --specs` to check the specs. Do not scan the files." Create no spec. Commit.
2. Run `openspec-lite-tasks-preview spec-gate`. Commit.
3. Run `openspec-lite-apply spec-gate`. When it asks the open questions, answer: "Use your recommended answer for each question."
4. Add one valid spec under `openspec/specs/`, and run the script.

**Expected**:

- After step 2 or step 3, `## Facts` has a fact that `openspec validate --specs` exits with code 0 when no spec exists, with the command as its source. It is a non-obvious fact, because only a run shows it. The agent reads the exit code with `exit-code.mjs`, not with `echo $?`. No fact says that the exit code was not checked (D197).
- After step 3, the fact is still in `## Facts`, also if no decision names it (D184).
- The script exits with code 1 in this repo, which has no spec. The agent checks it with a run.
- In step 4, the script exits with code 0.
- Apply wrote a test for the script, and the test fails if the script gives the wrong exit code (D192).
- If the script reads the output text of `openspec validate`, `plan.md` has a 🤖 decision or an open question about it, because a new OpenSpec version can change the text.

## 5. Archive with promotion

**Steps**:

1. On a finished change, make sure `plan.md` has one non-obvious requirement and one `### Decision D<n>:` entry.
2. Run `openspec-lite-archive`. Approve both drafts.

**Expected**:

- The agent does the done check first. It asks "Archive anyway?" only if an answer is "no".
- The requirement draft states the rule of `plan.md`, and has at least one `#### Scenario:`. The ADR draft holds the reason of the decision and the rejected option. The agent writes nothing before the approval. `plan.md` has no 🤖, so the agent makes no claim that a decision is marked. A true line such as "No decision has a 🤖" is OK (D192, D193).
- `openspec validate` passes. `openspec/adr/YYYY-MM-DD-<slug>.md` exists with Status `Accepted`.
- `openspec/specs/<capability>/spec.md` holds the requirement. The change is in `openspec/changes/archive/`.

## 6. Archive with nothing promoted

**Steps**: Remove `skip_specs` from `.openspec.yaml` of a finished change. Run `openspec-lite-archive`, and reject each draft.

**Expected**: The archive succeeds, and `openspec/specs/` does not change. The agent writes no ADR. It tells the user that the decisions of `plan.md` now exist only in `openspec/changes/archive/`.

## 7. Interrupted upgrade

**Steps**:

1. Run this prompt, then answer yes to the tasks preview: "openspec-lite-propose: add a CSV export to the report page. Scope: one Export CSV button on the report page, exporting the rows shown in the table. Source: docs/report-page.md and issue #42. Requirement: the export uses the same column order as the table on screen. Decision: generate the CSV in the browser, because the data is already loaded there. Constraint: no new server endpoint. Open question: should the export include hidden columns? (This changes the tasks.)" (D157) After the preview, add this decision to `## Decisions` of `plan.md`, with the next free ID, to stand for an agent decision: `### Decision D<n>: Quote each cell 🤖`, then "Chose to quote each cell because a cell can hold a comma." Commit.
2. Run `openspec-lite-upgrade`. Answer its question turn with the answer of step 3. Stop the agent after it writes `proposal.md`.
3. Run `openspec-lite-upgrade` again. If it asks the question turn again, answer the open question: "No, the export does not include hidden columns." If the agent also asks to write a requirement from the Goal, the tasks preview, or the quoting decision, answer yes in the same reply. At the prune question, answer yes.

**Expected**:

- In step 2, the agent asks the question turn and ends the turn before it writes an artifact (D164). After step 2, `.openspec.yaml` still has `schema: plan-lite`, and `skip_specs` is gone.
- After step 3, the agent keeps `proposal.md` and writes the rest. Before any write, the agent asks the open question and each planned requirement from the Goal or the tasks preview in one reply (D164). Each requirement comes from a constraint, a decision that is a contract, or an answer of the user (D166). Each other item in `proposal.md`, `specs/`, and `design.md` that comes from neither `plan.md` nor an answer ends with 🤖, for example a scenario "Table is empty" from the tasks preview. `tasks.md` has no 🤖. The summary lists each 🤖 item (D152). The quoting decision keeps its 🤖 in `design.md`, and the summary lists it as an agent decision. The question turn asks the requirement that the agent plans from it, because the quoting is a contract of the CSV file (D182). `tasks.md` has `- [ ]` tasks seeded from the preview. The agent deletes `tasks-preview.md`.
- `specs/` holds the column-order requirement. The answer "no hidden columns" is in `specs/` or in `design.md`. `design.md` holds the browser decision and the "no new server endpoint" constraint.
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
- After you confirm, the agent runs each command in `svc/`.
- `svc/openspec/schemas/plan-lite/` exists. The git root has no `openspec/` folder.
- The schema skill finds itself in `.claude/skills/` at the git root, which is a parent folder of `svc/`.

## 12. Propose resume

**Steps**:

1. Run `openspec new change resume-me --schema plan-lite`. If its `.openspec.yaml` has no `skip_specs: true` line, add one. OpenSpec 1.14.2 writes the line itself. Do not write `plan.md`.
2. Ask: "openspec-lite-propose: resume-me."
3. Answer yes to the resume question. If the agent asks what the change does, answer: "It adds a health check endpoint."

**Expected**:

- The agent says that the change exists with no `plan.md`, and asks to resume.
- The agent does not invent a Goal. It asks what the change does, unless the user already said it. `## Goal` holds only the answer of the user.
- After yes, `plan.md` exists, and `.openspec.yaml` has exactly one `skip_specs` line.
- `openspec validate resume-me` passes.

## 13. Archive reruns

### 13a. After a failed validate

**Steps**:

1. On a finished change, run `openspec-lite-archive`. Approve one requirement and one decision.
2. Before step 9, break the delta: remove its `#### Scenario:` block. `validate` fails, and the skill stops before it writes any ADR.
3. Run `openspec-lite-archive` again.

**Expected**:

- Before it writes, the agent shows the delta from run 1 and asks to keep or delete it.
- The agent drafts the decision again, because no ADR exists yet.
- In run 1, the agent shows the `validate` error.
- After run 2, `openspec/adr/` has one ADR for the decision, with the plain lines `Status: Accepted` and `Change: <name>`. `openspec/specs/` holds the requirement once, and the change is in `openspec/changes/archive/`.

### 13b. After a failed `openspec archive`

**Steps**:

1. Before the run, create the archive target folder `openspec/changes/archive/<today>-<name>/`. `openspec archive` then fails with "Archive '<today>-<name>' already exists".
2. Run `openspec-lite-archive`. Approve one decision. The ADR is written at step 10, and step 11 fails.
3. Delete the folder from step 1. Run `openspec-lite-archive` again.

**Expected**:

- Run 1 reports the archive failure and keeps the ADR.
- Run 2 finds the ADR with `Change: <name>`, shows it, and does not draft that decision again.
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

3. Run `openspec-lite-archive lockout`. Approve each draft.

**Expected**:

- The requirement drafts use the existing capability `auth`. The agent does not create a new capability such as `lockout` or `account-lockout`.
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
   Export the report table as CSV.

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

2. Run `openspec-lite-archive export-csv`. Approve each draft. Do not edit a draft.

**Expected**:

- Each item tagged `spec` is in a requirement draft. The file name decision is a contract for the finance team, so it becomes a requirement. An ADR for it is optional. Each item tagged `ADR` is in an ADR draft.
- For each item that the agent does not draft, it names the item and says why it skips it. No item disappears with no word.
- The reason for the semicolon (French Excel) stays in the requirement text or in the ADR, not only in a scenario title. It is the non-obvious part (D147).
- The header row requirement gives its reason in its text: the finance import reads the columns by name. So a reader sees that a renamed column breaks the import, and a new column order does not (D191).
- The ADR of the browser decision has the fact about the page load in its `## Context`. No spec or ADR holds a `plan.md` ID such as `C1`, `F1`, or `D1` (D142).
- After the archive, `openspec/specs/<capability>/spec.md` has the four `spec` items, and `openspec/adr/` has the `ADR` item.

Record each mismatch with the answer key. A tagged `spec` or `ADR` item that is not promoted, and not named as skipped, is a failure.

## 16. Stock `/opsx:archive` on a plan-lite change

This scenario checks the risk of a lost promotion. Stock `/opsx:archive` does not promote `plan.md`. openspec-lite adds a hint to `openspec/config.yaml` (D95), but the hint is best effort. Without the hint, and with the `openspec archive` CLI, the gap is known (`docs/todo.md`, `docs/facts.md`), so no scenario runs these cases (D190).

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

- The agent stops at the change schema guard. It drafts nothing and writes no spec and no ADR.
- The decisions from `plan.md` are in `design.md` → `## Decisions` (upgrade moved them, D62).
- The agent warns that stock `/opsx:archive` does not turn these decisions into ADRs, and says to copy them to `openspec/adr/` first to keep them (D115).
- The agent can offer to copy the decisions to ADRs. It writes nothing before a yes (D154). If the user declines, it tells the user to run stock `/opsx:archive`.

### 18b. Archive copies the decisions to ADRs after the guard

This scenario checks the yes path of the offer in scenario 18 (D154).

**Steps**:

1. Start from the fixture `after-upgrade`. Copy `tests/fixtures/scenarios/kept-plan.md` to the change as `plan.md`. Mark each task in `tasks.md` as done (`- [x]`). Commit. The delta holds the 🤖 scenario "Table is empty", so the 🤖 block is always tested.
2. Run `openspec-lite-archive add-csv-export-to-report-page` in a new session. Answer: "Yes, copy the decisions of `design.md` to ADRs." If the agent made no offer, ask for this copy in the same words.
3. Approve each draft: "Yes to each draft."
4. If the agent lists 🤖 lines of `specs/` or `design.md`, remove each 🤖 by hand. Then answer yes to the archive question.

**Expected**:

- The agent shows each ADR draft before it writes. Each draft has `# <Title>`, `Status: Accepted`, `Change: <name>`, `## Context`, `## Decision`, and `## Consequences`.
- After the approval, `openspec/adr/` has one ADR for each `### Decision` of `design.md`, named `YYYY-MM-DD-<slug>.md`.
- After step 3, `design.md`, the specs, and `.openspec.yaml` are the same as before step 2.
- After the ADRs, the agent lists each 🤖 line of `specs/` and `design.md`, for example the scenario "Table is empty" of the fixture. It does not offer the archive while a delta holds a 🤖 (D192). It removes no 🤖 itself, and it names each open question of a kept `plan.md` (D193). After step 4, it asks: "Archive the change now with `openspec archive <name> --yes`?". If `tasks.md` has unchecked tasks, the question names how many. After the archive, no file under `openspec/specs/` holds a 🤖. The change is in `openspec/changes/archive/`, and `openspec/specs/` holds the deltas of the change (D191).

## 19. Other openspec-lite skills after an upgrade

**Steps**: Start from the fixture `after-upgrade`. Run each of these in a new session:

1. `openspec-lite-tasks-preview <name>`
2. `openspec-lite-upgrade <name>` (the change has no `plan.md`)
3. `openspec-lite-upgrade <name>`, after you copy `tests/fixtures/scenarios/kept-plan.md` to the change as `plan.md`, and commit

**Expected**:

1. tasks-preview stops and points to stock `/opsx:continue`. It does not write `tasks-preview.md`.
2. upgrade stops. It points to the stock skills `/opsx:apply` and `/opsx:archive`.
3. upgrade asks if it can finish the upgrade, and says what is left to do: validate the artifacts, then decide what to delete from `plan.md`. The question names no step number (D191). The turn ends at the question (D196). Answer no. Then it names the open question that stays in `plan.md`, and stops with no file change (D196).

In each case, `.openspec.yaml`, `tasks.md`, and the other artifacts do not change.

## 20. Checks before a delete or a skip

This scenario checks that upgrade does not prune `plan.md` with no check, and that the user can promote a skipped item (D120). It also checks that upgrade with no requirement puts `skip_specs: true` back (D108). 20a also checks that upgrade uses `## Background` (D125) and prunes the sections that hold only a guidance comment (D127).

### 20a. Upgrade asks before it prunes

**Steps**:

1. Create a plan-lite change with a Goal, a `## Background` with two scope items, two Constraints, one `### Decision D<n>:` entry, one `## Facts` item that the decision relies on, and one open question in `plan.md`. Keep the guidance comments of the template. The answer to the question must change the specs, for example "Do internal service keys get a higher limit?" on a rate limit change. Run `openspec-lite-tasks-preview`. If the preview names no `plan.md` ID, add one, for example "(D1)", to a task line.
2. Run `openspec-lite-upgrade`. When the agent asks about the open question, answer "I do not know yet". If the agent also asks to write a requirement from the Goal or the tasks preview, answer yes in the same reply (D164). At the prune question, answer no.
3. Run `openspec-lite-upgrade` again. Answer yes to the resume question and to the prune question. The resume question says what is left to do, with no step number (D191).

**Expected**:

- The agent asks the user to answer the open question before it writes an artifact, in one reply with each planned requirement from the Goal or the tasks preview (D164).
- Before the prune question, the agent shows the `openspec validate` result, and lists each `plan.md` section with its artifact and heading. The open question is "kept" (D191).
- After step 2, `plan.md` is the same as in step 1.
- After the "no" of step 2, the agent says in one line that the moved sections in `plan.md` are old copies, and that the artifacts are the source of truth. It does not write the summary again (D193).
- `proposal.md` holds the two scope items of `## Background`.
- `design.md` → `## Context` holds the fact (D135). `proposal.md`, `specs/`, and `design.md` hold no `plan.md` ID such as `C1` or `D1` (D142).
- `tasks.md` holds no `plan.md` ID. Each task that had a `plan.md` ID names the item by its title, or a short form of its text, instead (D142).
- After step 3, `plan.md` has only the ID comment and `## Open Questions` with the open questions that the user could not answer (D158). The tasks preview of step 1 can add more open questions. Answer "I do not know yet" to each one. No section with only a guidance comment is left. Each other item is in `proposal.md`, `specs/`, or `design.md`. `proposal.md` and `design.md` do not restate an open question that stays in `plan.md`, and do not point to it, for example "See the open questions in tasks.md". This also applies to a question that the tasks preview added (D133, D196). In step 3, the turn ends at the resume question, before `validate` (D196). `tasks.md` starts with a `## 0. Open questions` group, with one task for each open question that the user could not answer, so that stock `/opsx:apply` meets them first (D191).

### 20b. Archive drafts an item that the user picks

**Steps**: Run scenario 15 again. In the first reply after the agent lists the skipped items, pick the toolbar item. If the agent asks "Archive anyway?", answer yes in the same reply. When the agent shows the toolbar draft, reject it. Approve the other drafts (D159).

**Expected**: the agent drafts the toolbar item and shows it for approval. It writes nothing before the approval. After the archive, the result is the same as in scenario 15.

### 20c. Upgrade with no requirement

**Steps**:

1. Create a plan-lite change with a Goal and one `### Decision D<n>:` entry in `plan.md`. The decision must not be a contract, for example "Store the audit log in the main database". Do not write a requirement or a constraint (D164).
2. Run `openspec-lite-upgrade`. When the agent asks for a requirement, answer "none".

**Expected**:

- The agent writes no file under `<change>/specs/`.
- `.openspec.yaml` has `schema: spec-driven` and `skip_specs: true`.
- Before the delete, the agent runs `openspec validate`, and it passes. In one reply, it shows the result, the summary, and the list of `plan.md` sections with their destinations. The prune question is the last line, and the turn ends there. The summary does not say that `plan.md` is deleted or kept (D132, D191, D193).
- After the answer, the agent says in one line what it deleted or kept. It does not write the summary again (D193).
- The summary says that `skip_specs` is set at the end, because the change has no spec delta (D153).
- Only the end state of `skip_specs` counts. The agent can skip the remove and the add-back of the line, because no spec file is written (D160).

## 21. Archive supersedes an old ADR

This scenario checks that archive links a new ADR to the old ADR that it replaces (D122).

### 21a. Full replacement

**Steps**:

1. Write `openspec/adr/2026-01-10-fixed-window-rate-limit.md` with `# Fixed Window Rate Limit`, `Status: Accepted`, `Change: add-rate-limit`, and the three sections. Its `## Decision` says: "Use a fixed 60-second window per API key."
2. Write `openspec/adr/2026-01-12-store-audit-log.md` with `# Store the Audit Log in the Main Database`, `Status: Accepted`, `Change: add-audit-log`, and the three sections. It is not about rate limits.
3. Create a plan-lite change `sliding-rate-limit`. Its `plan.md` has a Goal and one `### Decision D1: Use a sliding window` entry: "Chose a sliding 60-second window because the fixed window allows bursts at the window edge. Rejected the fixed window."
4. Run `openspec-lite-archive`. Approve each draft.

**Expected**:

- The ADR draft has `Supersedes: 2026-01-10-fixed-window-rate-limit.md` after `Change: sliding-rate-limit`.
- Before the approval, the agent names the old ADR and says that its `Status` line changes.
- The new ADR is in `openspec/adr/`, with the `Supersedes:` line.
- The old ADR has `Status: Superseded by <new file name>`. Each other line of the old ADR is the same as in step 1.
- The summary lists the old ADR as superseded.
- The audit log ADR does not change. A wrong `Superseded` mark damages the decision history.

### 21b. Rerun after a stop between the two writes

**Steps**:

1. Build the state after step 10 of `openspec-lite-archive` in 21a, but before the old ADR changed: the new ADR exists with `Supersedes:`, the old ADR still has `Status: Accepted`, and the change is not archived. `validate` passes.
2. Run `openspec-lite-archive`.

**Expected**: the agent does not draft the decision again. It changes the `Status:` line of the old ADR to `Status: Superseded by <new file name>`, then archives the change.

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
     --allowedTools "Bash(openspec:*)" "Bash(node:*)" "Bash(git:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(mkdir:*)" \
     < /dev/null
   ```

3. Read `result` and `session_id` from the JSON. When the skill asks a question, answer with the same command plus `--resume <session_id>`.
4. Check the expected results on disk, not only in the agent's reply.

Notes:

- Pin the full model ID, for example `eu.anthropic.claude-sonnet-5-5`. On a Bedrock setup, the alias `sonnet` resolved to `claude-sonnet-4-6`. Check `modelUsage` in the JSON.
- A scenario that needs an interrupt (7, 13b) starts from a hand-built state, because a print-mode run cannot stop at an exact step. 13a can run with a real run 1: a background loop removes the `#### Scenario:` blocks right after the agent writes the delta, before `validate` (`.scenario-runs/20261107-80d076b/setup/break-delta.sh`).
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
