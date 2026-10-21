# Test Scenarios

Run scenarios 1–9 and 11–20 by hand before each release tag (D69). Run scenario 10 right after the tag push, because it needs the published tag. The automated tests (`node --test`) cover the scripts and the schema. These scenarios cover the skills, which only an agent can run.

Setup for each scenario, unless it says otherwise:

1. Create an empty folder and run `git init`.
2. Run `openspec init --tools claude` (or your harness).
3. Install the release candidate: `apm install <path-to-this-repo>/package --target claude` (or your harness). Use the same harness as in step 2.
4. Start a new agent session in the folder.

Record the agent, the model, the OpenSpec version, and the result of each scenario.

---

## 1. Fresh repo: propose

**Steps**: Ask: "openspec-lite-propose: add a CSV export to the report page."

**Expected**:

- The agent runs `openspec-lite-schema`. `openspec/schemas/plan-lite/` exists. `openspec/config.yaml` has the archive guidance item.
- `openspec/changes/<name>/` exists. `.openspec.yaml` has `schema: plan-lite` and `skip_specs: true`.
- `plan.md` has the five headings, with only known content filled in.
- The agent asks: "Do you want a tasks preview?" It writes no code.

## 2. Small request: Level 1

**Steps**: Ask: "openspec-lite-propose: fix the typo 'recieve' in README.md."

**Expected**: The agent asks: "This looks small. Implement directly with no change?" Answer yes. The agent creates no file under `openspec/`.

## 3. Stale preview

**Steps**:

1. Run scenario 1, and answer yes to the tasks preview.
2. Check `tasks-preview.md`: the second line is `<!-- plan-sha256: <64 hex chars> -->`, and the tasks have no checkboxes.
3. Edit a line under `## Constraints` in `plan.md`.
4. Run stock `/opsx:apply` (or `openspec-lite-apply`).

**Expected**: Before coding, the agent says that the preview is stale and offers to regenerate it. An edit under `## Open Questions` or `## Decisions` alone does not cause this warning.

## 4. Stock apply follows the plan-lite rules

**Steps**: On the change from scenario 1, run stock `/opsx:apply`.

**Expected**:

- The agent implements from `plan.md`, and records deviations as `### Decision:` entries.
- It does not edit `tasks-preview.md`.
- It ends with the done check (Goal, Constraints, Open Questions).
- It tells the user to archive with `openspec-lite-archive`, not `/opsx:archive`.

## 5. Archive with promotion

**Steps**:

1. On a finished change, make sure `plan.md` has one non-obvious requirement and one `### Decision:` entry.
2. Run `openspec-lite-archive`. Approve both drafts.

**Expected**:

- The agent does the done check first. It asks "Archive anyway?" only if an answer is "no".
- The requirement draft has at least one `#### Scenario:`.
- `openspec validate` passes. `openspec/adr/YYYY-MM-DD-<slug>.md` exists with Status `Accepted`.
- `openspec/specs/<capability>/spec.md` holds the requirement. The change is in `openspec/changes/archive/`.

## 6. Archive with nothing promoted

**Steps**: Remove `skip_specs` from `.openspec.yaml` of a finished change. Run `openspec-lite-archive`, and reject each draft.

**Expected**: The agent sets `skip_specs: true`. `openspec validate` passes, and the archive succeeds. The agent writes no ADR and no spec.

## 7. Interrupted upgrade

**Steps**:

1. Create a change with a tasks preview (scenario 3, steps 1–2).
2. Run `openspec-lite-upgrade`. Stop the agent after it writes `proposal.md`.
3. Run `openspec-lite-upgrade` again. Answer each open question. At the prune question, answer yes.

**Expected**:

- After step 2, `.openspec.yaml` still has `schema: plan-lite`, and `skip_specs` is gone.
- After step 3, the agent keeps `proposal.md` and writes the rest. `tasks.md` has `- [ ]` tasks seeded from the preview. The agent deletes `tasks-preview.md`.
- `.openspec.yaml` has `schema: spec-driven`. `openspec validate` passes or the agent reports each error.
- The agent shows the list of `plan.md` destinations before the prune question. After the yes, `plan.md` is deleted. If a section is still kept, delete `plan.md` before scenarios 17 and 19.

## 8. Newer repo schema

**Steps**: Change `version: 1` to `version: 99` in `openspec/schemas/plan-lite/schema.yaml`. Run each workflow skill.

**Expected**: Each skill stops with the message "This repo uses a newer plan-lite schema. Run `apm update`. …". The message also names `apm update -g` for a user-scope install. No file changes.

## 9. Schema re-copy

**Steps**:

1. Change `version: 1` to `version: 0` in `openspec/schemas/plan-lite/schema.yaml`.
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

- The agent says that it will replace the schema (v0 → v1), and asks first.
- After yes, `openspec/schemas-backup/plan-lite-v0-<timestamp>/` holds the old folder with `local-note.txt`.
- `openspec/schemas/plan-lite/` has no `local-note.txt`.
- The agent reports the backup path and the copied files.
- `openspec/config.yaml` has one `operations:` key. Its `archive.guidance` list has "keep me" and the openspec-lite item.
- `openspec instructions plan --change <name> --json`, for the change that propose made, prints no "could not parse" warning. `openspec list` never prints it (`docs/facts.md`).

## 10. Real APM install from the tag

**Steps**:

1. Push the release tag `vX.Y.Z`.
2. In an empty folder: `git init`, then `apm install duongphuhiep/openspec-lite/package#^X.0.0 --target claude`.

**Expected**:

- `.claude/skills/` has the six `openspec-lite-*` skills. `openspec-lite-schema/` has `scripts/install.mjs` and `assets/plan-lite/`.
- `apm_modules/duongphuhiep/openspec-lite/` has only `package/` content: no `tests/`, `scripts/`, or `docs/`.
- `apm.lock.yaml` has `resolved_ref: vX.Y.Z`.

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

1. Run `openspec new change resume-me --schema plan-lite`. Add `skip_specs: true` to its `.openspec.yaml`. Do not write `plan.md`.
2. Ask: "openspec-lite-propose: resume-me."

**Expected**:

- The agent says that the change exists with no `plan.md`, and asks to resume.
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
- After run 2, `openspec/adr/` has one ADR for the decision, with the plain lines `Status: Accepted` and `Change: <name>`.

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
   - After 5 failed logins in 15 minutes, the system SHALL lock the account for 30 minutes.
   - A locked account SHALL NOT log in, also with a valid password.

   ## Open Questions

   ## Decisions
   ### Decision: Count failures per account, not per IP
   Chose per account because attackers rotate IP addresses. Rejected per IP because it also locks out users behind one office NAT.
   ```

3. Run `openspec-lite-archive lockout`. Approve each draft.

**Expected**:

- The requirement drafts use the existing capability `auth`. The agent does not create a new capability such as `lockout` or `account-lockout`.
- Each new rule has at least one `#### Scenario:`.
- The delta form is free. "A locked account SHALL NOT log in, also with a valid password" can be a MODIFIED "Password login" (with its full text) or an ADDED requirement. Both pass if the main spec below ends up correct.
- The decision becomes an ADR with `Change: lockout`.
- After the archive, `openspec/specs/auth/spec.md` has:
  - the "Password login" requirement, with its first scenario and the new locked-account rule;
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
   - The CSV SHALL use a semicolon separator, because the users open it in a French Excel. [non-obvious: spec]
   - The export SHALL include only the rows that match the active filters. [non-obvious: spec]
   - The CSV SHALL start with a header row of the column names. The import script of the finance team reads them. [obvious contract: spec]
   - The export button is in the toolbar. [obvious, UI layout: skip]

   ## Open Questions

   ## Decisions
   ### Decision: Build the CSV in the browser
   Chose the browser because the table already has all rows in memory. Rejected a server endpoint because it adds an API for one button. [non-obvious: ADR]
   ### Decision: Use the date in the file name
   Chose `report-YYYY-MM-DD.csv`. The import script of the finance team finds the file by this name. [obvious decision, contract: spec]
   ```

2. Run `openspec-lite-archive export-csv`. Approve each draft. Do not edit a draft.

**Expected**:

- Each item tagged `spec` is in a requirement draft. The file name decision is a contract for the finance team, so it becomes a requirement. An ADR for it is optional. Each item tagged `ADR` is in an ADR draft.
- For each item that the agent does not draft, it names the item and says why it skips it. No item disappears with no word.
- The reason for the semicolon (French Excel) stays in the spec or in the ADR. It is the non-obvious part.
- After the archive, `openspec/specs/<capability>/spec.md` has the four `spec` items, and `openspec/adr/` has the `ADR` item.

Record each mismatch with the answer key. A tagged `spec` or `ADR` item that is not promoted, and not named as skipped, is a failure.

## 16. Stock `/opsx:archive` on a plan-lite change

This scenario checks the risk of a lost promotion. Stock `/opsx:archive` does not promote `plan.md`. openspec-lite adds a hint to `openspec/config.yaml` (D95), but the hint is best effort.

### 16a. With the archive guidance in `config.yaml`

**Steps**:

1. Run scenario 1, so that `openspec/config.yaml` has the openspec-lite archive guidance item.
2. Add one non-obvious constraint and one decision to `plan.md`.
3. Run stock `/opsx:archive <name>`.

**Expected** (at least one of these):

- The agent runs `openspec-lite-archive` instead, or tells the user to run it, before it archives.
- The agent warns that `plan.md` has decisions and requirements that this archive does not promote, and asks before it continues.

**Failure**: the agent archives the change and does not mention promotion or `openspec-lite-archive`. Then the knowledge of `plan.md` stays only in `openspec/changes/archive/`. Record the exact reply, because this result decides if openspec-lite needs a stronger guard.

### 16b. Without the archive guidance

**Steps**:

1. Repeat 16a, but first delete the openspec-lite item from `operations.archive.guidance` in `openspec/config.yaml`.
2. Run stock `/opsx:archive <name>`.

**Expected**: this is the known gap. No openspec-lite rule reaches the stock skill, so the agent can archive with no warning. Record what it does. If it warns anyway, record why, for example because it read the `apply.instruction` text.

### 16c. The `openspec archive` CLI directly

**Steps**: In a terminal, run `openspec archive <name> --yes` on a plan-lite change with decisions in `plan.md`.

**Expected**: the CLI never reads the guidance (`docs/facts.md`), so it archives with no warning. This is a known gap, not a failure. Record it, so that README can warn users.

## 17. `openspec-lite-apply` after an upgrade

**Steps**:

1. Run scenario 7 to its end. The change is `spec-driven`, with `tasks.md`, and has no `plan.md`.
2. Run `openspec-lite-apply <name>`.

**Expected**:

- The agent stops at the change schema guard. It writes no code and changes no file.
- It tells the user to run stock `/opsx:apply`, because the change is spec-driven now.

**Variant 17b**: before step 2, put back a `plan.md` with only an open question, as an upgrade keeps it when a section has no slot. Expected: `openspec-lite-apply` still refuses. Only `openspec-lite-upgrade` has the resume exception (D106).

## 18. `openspec-lite-archive` after an upgrade

**Steps**:

1. Run scenario 7 to its end. Mark each task in `tasks.md` as done (`- [x]`).
2. Run `openspec-lite-archive <name>`.

**Expected**:

- The agent stops at the change schema guard. It drafts nothing and writes no spec and no ADR.
- It tells the user to run stock `/opsx:archive`.
- The decisions from `plan.md` are in `design.md` → `## Decisions` (upgrade moved them, D62).
- The agent warns that stock `/opsx:archive` does not turn these decisions into ADRs, and says to copy them to `openspec/adr/` first to keep them (D115).
- The upgrade summary from scenario 7 already gave the same warning.

## 19. Other openspec-lite skills after an upgrade

**Steps**: On the change from scenario 7, run each of these:

1. `openspec-lite-tasks-preview <name>`
2. `openspec-lite-upgrade <name>` (the change has no `plan.md`)
3. `openspec-lite-upgrade <name>`, after you put back a `plan.md` with only an open question

**Expected**:

1. tasks-preview stops and points to stock `/opsx:continue`. It does not write `tasks-preview.md`.
2. upgrade stops. It points to the stock skills `/opsx:apply` and `/opsx:archive`.
3. upgrade asks: "Resume the upgrade of <name> at step 4?" Answer no. Then it stops with no file change.

In each case, `.openspec.yaml`, `tasks.md`, and the other artifacts do not change.

## 20. Checks before a delete or a skip

This scenario checks that upgrade does not prune `plan.md` with no check, and that the user can promote a skipped item (D120). It also checks that upgrade with no requirement puts `skip_specs: true` back (D108).

### 20a. Upgrade asks before it prunes

**Steps**:

1. Create a plan-lite change with a Goal, two Constraints, one `### Decision:` entry, and one open question in `plan.md`. The answer to the question must change the specs, for example "Do internal service keys get a higher limit?" on a rate limit change.
2. Run `openspec-lite-upgrade`. When the agent asks about the open question, answer "I do not know yet". At the prune question, answer no.
3. Run `openspec-lite-upgrade` again. Answer yes to the resume question and to the prune question.

**Expected**:

- The agent asks the user to answer the open question before it writes an artifact.
- Before the prune question, the agent lists each `plan.md` section with its artifact and heading. The open question is "kept".
- After step 2, `plan.md` is the same as in step 1.
- At the end of step 2, the summary says that the moved sections in `plan.md` are old copies, and that the artifacts are the source of truth.
- After step 3, `plan.md` has only the open question. Each other item is in `proposal.md`, `specs/`, or `design.md`. `design.md` does not hold the open question.

### 20b. Archive drafts an item that the user picks

**Steps**: Run scenario 15 again. In the reply to the drafts, pick the toolbar item from the skipped list. When the agent shows the toolbar draft, reject it. Approve the other drafts.

**Expected**: the agent drafts the toolbar item and shows it for approval. It writes nothing before the approval. After the archive, the result is the same as in scenario 15.

### 20c. Upgrade with no requirement

**Steps**:

1. Create a plan-lite change with a Goal and one `### Decision:` entry in `plan.md`. Do not write a requirement.
2. Run `openspec-lite-upgrade`. When the agent asks for a requirement, answer "none".

**Expected**:

- The agent writes no file under `<change>/specs/`.
- `.openspec.yaml` has `schema: spec-driven` and `skip_specs: true`.
- `openspec validate` passes.
- The summary says that `skip_specs` was put back, because the change has no spec delta.

## 21. Archive supersedes an old ADR

This scenario checks that archive links a new ADR to the old ADR that it replaces (D122).

### 21a. Full replacement

**Steps**:

1. Write `openspec/adr/2026-01-10-fixed-window-rate-limit.md` with `# Fixed Window Rate Limit`, `Status: Accepted`, `Change: add-rate-limit`, and the three sections. Its `## Decision` says: "Use a fixed 60-second window per API key."
2. Create a plan-lite change `sliding-rate-limit`. Its `plan.md` has a Goal and one `### Decision: Use a sliding window` entry: "Chose a sliding 60-second window because the fixed window allows bursts at the window edge. Rejected the fixed window."
3. Run `openspec-lite-archive`. Approve each draft.

**Expected**:

- The ADR draft has `Supersedes: 2026-01-10-fixed-window-rate-limit.md` after `Change: sliding-rate-limit`.
- Before the approval, the agent names the old ADR and says that its `Status` line changes.
- The new ADR is in `openspec/adr/`, with the `Supersedes:` line.
- The old ADR has `Status: Superseded by <new file name>`. Each other line of the old ADR is the same as in step 1.
- The summary lists the old ADR as superseded.

### 21b. Rerun after a stop between the two writes

**Steps**:

1. Build the state after step 10 of 21a, but before the old ADR changed: the new ADR exists with `Supersedes:`, the old ADR still has `Status: Accepted`, and the change is not archived. `validate` passes.
2. Run `openspec-lite-archive`.

**Expected**: the agent does not draft the decision again. It changes the `Status:` line of the old ADR to `Status: Superseded by <new file name>`, then archives the change.

---

## Running the Scenarios Headless

You can run each scenario without a person at the keyboard, with Claude Code in print mode. This is how the scenarios ran on 2026-10-15.

1. Build the start state of the scenario in a temp folder (see each scenario's Steps).
2. Run the first prompt from inside that folder:

   ```sh
   claude -p "<prompt>" --model <full model id> --output-format json \
     --permission-mode acceptEdits \
     --allowedTools "Bash(openspec:*)" "Bash(node:*)" "Bash(git:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(mkdir:*)"
   ```

3. Read `result` and `session_id` from the JSON. When the skill asks a question, answer with the same command plus `--resume <session_id>`.
4. Check the expected results on disk, not only in the agent's reply.

Notes:

- Pin the full model ID, for example `eu.anthropic.claude-sonnet-5-5`. On a Bedrock setup, the alias `sonnet` resolved to `claude-sonnet-4-6`. Check `modelUsage` in the JSON.
- A scenario that needs an interrupt (7, 13) starts from a hand-built state, because a print-mode run cannot stop at an exact step.
- The session also loads your user setup in `~/.claude`, for example global skills. The results reflect that setup.
- Permission denials in the JSON (`permission_denials`) mostly come from compound shell commands outside the allowlist. The agent then retries with allowed commands.
