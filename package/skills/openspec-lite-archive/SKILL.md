---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements and the contracts of plan.md to OpenSpec specs and the decisions to ADRs, prints a short summary of the promotion, then runs openspec archive. Use this skill when the user asks for openspec-lite-archive, or asks to archive a change whose .openspec.yaml has schema plan-lite, also when the user types /opsx:archive. Stock /opsx:archive does not promote plan.md, so the knowledge in it is lost. Use this skill instead of it for a plan-lite change, before the change is archived.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion.

How to read this skill:

- Do section 1, section 2, and section 3 in order.
- In section 1, do the checks in this order: the OpenSpec root, the change selection, the guard, and the schema check.
- The guard can send you to the guard path. The guard path replaces the schema check, section 2, and section 3. The guard path uses only section 2, steps 5, 6, and 10, when a guard step calls them.
- When the schema check says "continue with the next step of this skill", go to section 2, step 1.
- In section 2, do steps 1 to 11 in order. Each step ends with the next step.
- The general rules apply at all times, in each step and on the guard path.
- `<name>` is the name of the change, from the change selection.

## General rules

- Ask no approval for a draft, an ADR of an earlier run, a delta file of an earlier run, or a `Status:` edit. Do not ask the user to answer yes, no, or edit for a draft.
- Do not print the full text of a draft or of a file of an earlier run. Step 6 prints only a short summary.
- The user does not see the output of a tool call. To print a text for the user, write the full text in your reply.
- Write each draft exactly as step 5 drafted the draft.
- Do not remove a 🤖 yourself. Only the user removes a 🤖.
- Write no 🤖 in a spec or an ADR.
- Write no source emoji in a spec, for example 👤 or 🔬. Give the source of a fact in words in the requirement text. An ADR keeps the source emoji of a fact.
- If a fact of `plan.md` has no source emoji, add no emoji, and do not guess its source. Give the source in words only when the fact names it.
- A 🤖 in an HTML comment, for example in a template comment of `plan.md`, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖.
- The ID rule: use the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in `plan.md`, in `tasks-preview.md`, and in your reply to the user, for example in the summary of step 6.
- If the ID comment of an older `plan.md` gives another form of the ID rule, follow the ID rule of this skill.
- The ID rule also forbids a `plan.md` ID in another file, a code comment, a commit message, a pull request, or a ticket.
- To refer to a `plan.md` item in a file other than `plan.md` and `tasks-preview.md`, use the item title, or a short form of its text, with the change name.

### Failure rule

- An action fails when it exits non-zero, is denied, gives an error, or prints an output that the steps do not name. An action is a command, a script, a skill call, a tool call, or a read, a write, an edit, or a delete of a file.
- If a step gives its own failure branch, follow that branch.
- If a Bash call with more than one command is denied, do the same action once more as single commands, one command in each call, or with the Read, Write, or Edit tool. Do not try a third form.
- Do not run a denied single command again.
- If no step needs the output of the failed action, for example an extra check, or a read of a link for more context, do not stop. Name the action and the error in your reply, and go on without the output.
- A step always needs a run of the tests that the step names, and a write, an edit, or a delete of a file.
- Do not make up a missing output yourself, for example a template, a hash, a version, or a status line.
- If a step needs the output, and the action fails again or a single command is denied, show the command or the file, and the error text. Name each file that this run changed. Tell the user what to fix, and to start this workflow again. Then stop.
- Before you report a write, an edit, or a delete as done, check the file on disk.
- Do not report a file as written, or a step as done, unless the action passed.
- If a reply to a yes-or-no question has no yes and no no, ask the question again. Do no action that depends on the answer.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Input: the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- Run `openspec list --json`, and read `root.path`. The folder in `root.path` is the OpenSpec root.
- If `openspec list --json` fails, or prints no JSON, show the error, and stop. Tell the user to check that `openspec` is installed.
- Run each `openspec` command, and each command with a relative `openspec/...` path, from the OpenSpec root. Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command, and each command with a relative `openspec/...` path, with `cd <root> && `. This prefix does not count as a chain.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root.
- If more than one folder matches, ask the user to pick one folder.
- If the user rejects the folder, or picks no folder, stop. Tell the user to run the skill from the OpenSpec root.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Input: the prompt, and the `changes` list of `openspec list --json`.
- Output: the name of the change, written `<name>` in this skill.
- If the prompt names a change, use that change.
- If the named change is not in the `changes` list, or its `.openspec.yaml` is missing or has no `schema` line, show the active changes, and ask the user to pick one change.
- If the prompt names no change, read the `changes` list from the same `openspec list --json` output.
- The `changes` list does not give the schema, so read `schema` from the `.openspec.yaml` of each change.
- If only one active change exists, use that change.
- If more than one active change exists, ask the user to pick one change. Show the name and the schema of each change, so that the user sees which changes this skill accepts.
- If no active change exists, stop. Tell the user that no active change exists.

### Guard

- Input: the `schema` line of `openspec/changes/<name>/.openspec.yaml`, and the file `openspec/changes/<name>/plan.md`.
- Output: the path to follow: the schema check, or the guard path.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` exists, continue with the schema check.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` does not exist, stop. Tell the user to write `plan.md` with `openspec-lite-propose` first.
- If `schema` is not `plan-lite`, follow the guard path below. Do not run the schema check or section 3. Do not run section 2, except steps 5, 6, and 10 when guard step 1 calls them.

The guard path:

1. Copy the decisions of `design.md` to ADRs.
   - Input: `openspec/changes/<name>/design.md`.
   - Output: the ADRs in `openspec/adr/`.
   - Stock `/opsx:archive` does not turn the decisions in `design.md` into ADRs, so this guard step copies the decisions before the archive.
   - A change that was upgraded from plan-lite has its decisions in `design.md`.
   - If `openspec/changes/<name>/design.md` has no `### Decision` entries, go to guard step 2.
   - If `openspec/changes/<name>/design.md` has `### Decision` entries, draft an ADR for each `### Decision` with the ADR form, the sources of an ADR draft, the first check, the second check, and the third check of section 2, step 5. Ask no question.
   - Print the summary of the ADR drafts as in section 2, step 6.
   - Write each ADR draft with the file rules and the `Supersedes:` edits of section 2, step 10, without its `validate` condition.
   - On the guard path, do not run section 2, steps 7 to 9.
   - On the guard path, after section 2, step 6, continue guard step 1 with the write of the ADR drafts. Do not go to section 2, step 7.
   - On the guard path, after section 2, step 10, go to guard step 2. Do not go to section 2, step 11.
   - On the guard path, do not change `design.md`.
2. Search `proposal.md`, `specs/`, and `design.md` of the change for 🤖.
   - Do this search after guard step 1.
   - If a line of `proposal.md`, `specs/`, or `design.md` has a 🤖, list each such line. Tell the user to accept the line (remove the mark) or delete the line.
   - If a 🤖 line is the heading of a `design.md` decision that has an ADR with the line `Change: <name>`, name the ADR file. The ADR can come from this run or from an earlier run. Tell the user to also delete the ADR file if the user deletes the decision.
   - If no line has a 🤖, you can say so in one line.
   - In guard steps 2 to 4, before each reply that says what holds a 🤖, search `proposal.md`, `specs/`, and `design.md` again.
   - Go to guard step 3.
3. Name the open questions of a kept `plan.md`.
   - If `openspec/changes/<name>/plan.md` still exists, name each open question in `plan.md`.
   - If `openspec/changes/<name>/plan.md` does not exist, say nothing about `plan.md`.
   - Go to guard step 4.
4. Block the archive while a delta holds a 🤖.
   - If a delta in `specs/` holds a 🤖, do not offer the archive, and do not tell the user to run stock `/opsx:archive`, because the CLI copies the 🤖 into the main spec.
   - The block also forbids a question with a condition about the archive.
   - If a delta in `specs/` holds a 🤖, ask the user to remove the marks, and end your turn.
   - When the user replies after guard step 4, go to guard step 2. Do not run guard step 1 again.
   - If no delta in `specs/` holds a 🤖, go to guard step 5.
5. Give the archive step.
   - Ask: "Archive the change now with `openspec archive <name> --yes`?"
   - If `tasks.md` has unchecked tasks, name how many in the same question, because `--yes` skips the CLI prompt for them.
   - If `tasks.md` has no unchecked tasks, or does not exist, say nothing about tasks.
   - If the user says yes to the archive question, run the command. The command applies the deltas of `specs/` and moves the change to the archive. Report the result.
   - If the user says no to the archive question, tell the user to run stock `/opsx:archive` later.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare the version with the shipped version:

   Shipped schema version: 7

   - If the file is missing, the version is lower, or the file has no readable `version` line, run the `openspec-lite-schema` skill.
   - If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
   - If the user declines the copy of the schema, stop.
   - After the copy, read the version again. If the version still differs from the shipped version, stop, and report both versions.
   - After the copy, if the version equals the shipped version, go to item 3 of the schema check. Do not end your turn after `openspec-lite-schema` finishes.
   - In your end summary, copy the report of `openspec-lite-schema`: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
   - If the version is higher than the shipped version, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   - If the version equals the shipped version, go to item 3 of the schema check.
3. Run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - The script compares `openspec --version` with the range in `schema.yaml`. The script prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run the script alone, not in a chain.
   - Read the first word of the line, not the exit code. Do not compare the versions yourself.
   - On `ok:`, continue with the next step of this skill.
   - On `warn:`, show the line as a warning. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Continue with the next step of this skill.
   - On `fail:`, show the line. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Stop.
   - If the output has no line that starts with `ok:`, `warn:`, or `fail:`, handle the output as `fail:`.

## 2. Archive

`<dir>` is `openspec/changes/<name>`.

### Step 1: Done check

- Input: `<dir>/plan.md`, and the code.
- Output: the warnings for each item that is not met, or no warning.
- Answer three questions: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty?
- An HTML comment in `## Open Questions` does not count as a question.
- To find the code, search for what each outcome of the Goal names, for example with `git grep`.
- Get the git root with `git rev-parse --show-toplevel` as its own command.
- Then search with `git -C <git root> grep <word>`.
- Do not judge from the first lines of `git ls-files`, because tool folders such as `.claude/` and `apm_modules/` fill them.
- Name each outcome and each constraint that is not met, and each open question that is left.
- If each answer is "yes", go to step 2.
- If an answer is "no", show the warnings, and ask only: "Archive anyway?" Give no other options in this question. End your turn.
- If the user says yes to "Archive anyway?", go to step 2.
- If the user says no to "Archive anyway?", give the paths below, then stop:
  - For each outcome or constraint that is not met, give two paths: implement it with `openspec-lite-apply`, or remove it from `plan.md` and propose it as a separate change with `openspec-lite-propose`.
  - For each open question that is left, tell the user to run `openspec-lite-apply` with the answer, so that apply records it.
  - Tell the user to run `openspec-lite-archive` again.
  - If the user names an item that is not in `plan.md`, say: to keep the item, add it to `plan.md` first.

### Step 2: Read plan.md

- Input: `<dir>/plan.md`.
- Read `<dir>/plan.md`.
- Do not use `tasks-preview.md` for promotion.
- Go to step 3.

### Step 3: Select the items

- Input: the items of `<dir>/plan.md`.
- Output: the selected items.
- Each outcome of the Goal is an item, as each constraint, decision, and fact is an item.
- Select each item that passes at least one filter. The filters are **Non-obvious**, **Surprising**, **Contract**, and **Non-obvious fact**.
- **Non-obvious**: a reader cannot deduce the item from the code in 5 minutes.
- **Surprising**: the item would surprise a new team member.
- **Contract**: externally observable behavior that a client or another team depends on.
- Internal helpers, log text, and UI layout are not contracts.
- The format of a file or of an output that another program reads is a contract, for example the line format of a log file that a monitor parses, or the date format of a JSON field.
- A contract is a requirement, even if the contract is obvious from the code.
- **Non-obvious fact**: a fact of `## Facts` that needs one of these to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find it
- A fact that a reader can easily deduce from the code or the file list is never a non-obvious fact, also if a run found the fact: a run alone is not enough.
- A fact that the user gave (👤) is always non-obvious.
- Step 4 says where a non-obvious fact goes.
- Go to step 4.

### Step 4: Sort each item

- Input: the items of `<dir>/plan.md`, and the selected items of step 3.
- Output: the list of items to draft, each with its destination, and the list of items that you do not draft.
- A selected constraint goes to a spec, as a requirement.
- A selected outcome of the Goal goes to a spec, as a requirement. If a constraint already states the outcome, draft one requirement for both.
- A selected decision goes to an ADR.
- If a decision is also a contract, draft the contract as a requirement. The rationale of the decision can also go to an ADR.
- List each other item of `plan.md` that you do not draft, including each non-goal, with a one-line reason. No item disappears with no word.
- A non-obvious fact goes to the `## Context` of each drafted ADR that the fact relates to. Keep the source emoji of the fact.
- An obvious fact goes to the `## Context` of an ADR only when the fact justifies the decision of that ADR. Keep the source emoji of the fact.
- A fact that justifies a requirement goes into the requirement text, as its reason, with no source emoji, for example "The token SHALL expire after 24 hours, because the mobile app caches it for one day."
- If no drafted ADR holds a non-obvious fact, no drafted requirement holds the fact as its reason, and the change depends on the fact, draft an ADR for the fact:
  - The `## Context` of the fact ADR holds the fact and its source.
  - The `## Decision` of the fact ADR says how the change uses or handles the fact, as the code shows.
  - The `## Consequences` of the fact ADR says what a later change must keep.
- List each other fact that is in no draft as not drafted, with a one-line reason.
- Go to step 5.

### Step 5: Draft the full text of each item

- Input: the items to draft of step 4, `openspec/specs/`, `openspec/adr/`, and `<dir>/specs/`.
- Output: the drafts of the deltas and the ADRs, and the list of the delta files of an earlier run.

The delta format:

- Before the first delta, run `openspec instructions specs --change "<name>" --schema spec-driven --json`.
- If the command fails, or its output has no `instruction` field, follow the failure rule. Do not write a delta without `instruction`.
- Follow the delta format in the `instruction` of the result. The `instruction` gives the format for each header, including the `**Reason**` and `**Migration**` lines of REMOVED and the `FROM:` and `TO:` lines of RENAMED.
- If `skip_specs` is set, the result also has `skipped: true` and a warning. Ignore both, because step 8 removes `skip_specs` when a delta exists.

**Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.

- To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new capability only when none matches.
- For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without the `## Purpose` section, the CLI writes "TBD" as the Purpose of the new main spec.
- Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
- Write each requirement as `### Requirement: <name>`, with SHALL or MUST, as the CLI instruction says.
- If an item gives a reason, for example the "because" part of a constraint, keep the reason in the requirement text. A scenario title alone does not keep the reason.
- Give each ADDED or MODIFIED requirement at least one `#### Scenario: <name>` with **WHEN** and **THEN** lines. Derive the scenario from `plan.md` and the code.
- For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit the copy.

**Decision**: an ADR in this exact form. `Status:` and `Change:` are plain lines, not sections:

```markdown
# <Title>

Status: Accepted
Change: <name>

## Context

## Decision

## Consequences
```

The sources of an ADR draft:

- Write each section of an ADR from `plan.md`, from `design.md` on the guard path, from the code, and from the facts of `plan.md`.
- Write no claim that no source states, for example a consequence that you inferred. The user does not review the drafts, so a claim with no source goes into the ADR with no check.

The first check, for existing ADRs:

- Before you draft a decision, search `openspec/adr/` for files with the line `Change: <name>`.
- An earlier run of this archive can have written these files.
- Do not draft a decision or a fact that already has an ADR.
- Step 6 names each file that has the line `Change: <name>`, with its title.

The check for an earlier delta:

- Before you draft a delta, list the files under `<dir>/specs/`.
- If a file exists under `<dir>/specs/`, an earlier run of this archive wrote the file.
- The user can have fixed a delta file of an earlier run after a `validate` failure. Do not change or delete a requirement of such a file. Do not delete the file.
- Do not draft a requirement that a delta file of an earlier run already holds.
- Step 6 names each such file. Step 7 merges into the file each delta draft with the same path.

The second check, for a **Superseded ADR**:

- Read the title and `## Decision` of each ADR in `openspec/adr/` with the line `Status: Accepted`.
- If a new decision fully replaces an old ADR, add the line `Supersedes: <old file name>` after the `Change:` line of the draft.
- If a new decision changes only part of an old decision, add no line. Step 6 says that both ADRs stay `Accepted`.
- If a new decision replaces no old ADR, add no line.

The third check, for `plan.md` IDs:

- Search each draft for a `plan.md` ID (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`).
- Replace each ID with the item title, or a short form of its text, as the ID rule says.

When each item has a draft, go to step 6.

### Step 6: Print the summary

- Input: the drafts of step 5, the files of an earlier run of step 5, and the items that step 4 does not draft. On the guard path, step 4 does not run, so the only group is the decisions that go to an ADR.
- Output: the summary, in your reply.
- Print a short summary of the promotion. Do not print the full text of a draft or of a file of an earlier run.
- In the summary, write one line for each item: the `plan.md` ID, if the item has an ID, and the title of the item. If the item has no title, for example a constraint, a fact, or an outcome of the Goal, write a short form of its text. On the guard path, write the title of the `design.md` decision.
- In the summary, put the items in these groups. Start each group with its count. Omit an empty group.
  - The decisions that go to an ADR.
  - The outcomes of the Goal and the constraints that go to a requirement.
  - The decisions that are also a contract and go to a requirement.
  - The facts that go into a requirement text as its reason.
  - The facts that go to the `## Context` of an ADR. Name the ADR for each fact.
  - The facts that get an ADR of their own, from step 4.
  - The deltas. For each delta, give the capability, the count of requirements and scenarios, and the items that the delta comes from: the ID of each item that has an ID, or a short form of the text of each item that has no ID.
  - The items that step 4 does not draft, each with its one-line reason.
- After the groups, give each other point that the user must know, one line for each point:
  - Name each draft that holds content from a decision whose heading ends with 🤖, in `plan.md` or, on the guard path, in `design.md`. Name the 🤖 decision. Say that the user did not confirm the decision, and that the archive promotes the decision.
  - On the guard path, name each draft that holds content from another line of `proposal.md` or `design.md` with a 🤖, for example a `## Why` line. Name the line. The draft holds no 🤖.
  - For each draft with a `Supersedes:` line, name the old ADR, and say that the archive changes the `Status` line of the old ADR.
  - For each new decision that changes only part of an old ADR, say that both ADRs stay `Accepted`.
  - Name each ADR of an earlier run, with its title. Say that the earlier run wrote the ADR, and that this run does not write the ADR again.
  - Outside the guard path, name each delta file of an earlier run. Say that the archive keeps the file, and merges into the file each delta draft with the same path.
- Outside the guard path, if step 5 has no draft, and finds no ADR and no delta file of an earlier run, say in one line that the archive promotes no item. Still give the group of the items that step 4 does not draft.
- On the guard path, give only the group of the decisions that go to an ADR, and the points about 🤖, `Supersedes:`, and the ADRs of an earlier run.
- If no decision heading ends with 🤖, you can say so in one line.
- Do not say that a decision has a 🤖 when its heading does not end with 🤖.
- Ask no question in the summary. Do not end your turn after the summary.
- On the guard path, continue with guard step 1.
- Outside the guard path, go to step 7.

### Step 7: Write the deltas

- Input: the delta drafts of step 5, and the delta files of an earlier run.
- Output: the deltas in `<dir>/specs/`.
- Do not change or delete a requirement of a delta file of an earlier run. Do not delete the file.
- Write each delta draft to `<dir>/specs/<capability>/spec.md`.
- If a delta file of an earlier run has the same path as a delta draft, merge the delta draft into the file, with no duplicate requirement. If the file and the draft hold a requirement with the same name, keep the requirement of the file.
- Before you go to step 8, check that each delta draft exists on disk. If a check fails, follow the failure rule.
- Go to step 8.

### Step 8: Set skip_specs

- Input: the files under `<dir>/specs/` now.
- Output: `<dir>/.openspec.yaml`.
- If any file exists under `<dir>/specs/`, remove `skip_specs` from `<dir>/.openspec.yaml`.
- If no file exists under `<dir>/specs/`, make sure that `skip_specs: true` is set.
- `validate` fails with a delta and the flag, and also with no delta and no flag.
- Go to step 9.

### Step 9: Validate

- Run `openspec validate "<name>"`.
- If `validate` fails, report each error. Tell the user to fix the errors, and to run `openspec-lite-archive` again. Then stop.
- If `validate` passes, go to step 10.

### Step 10: Write the ADRs

- Input: the ADR drafts of step 5.
- Output: the ADR files in `openspec/adr/`.
- Only after `validate` passes in step 9, write each ADR draft to `openspec/adr/YYYY-MM-DD-<slug>.md`.
- Do not write an ADR in the same command as `validate`.
- Use today's date.
- Skip a decision or a fact that already has an ADR with `Change: <name>`.
- If the file name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR.
- After you write a new ADR with a `Supersedes:` line, edit the old ADR. Change only the `Status:` line of the old ADR to `Status: Superseded by <new file name>`. Do not change any other line of the old ADR.
- Then check each ADR with `Change: <name>` and a `Supersedes:` line, also the ADRs of an earlier run. If the old ADR of such an ADR does not have `Status: Superseded by`, edit the `Status:` line of the old ADR now.
- If a write of an ADR, or an edit of a `Status:` line, fails, follow the failure rule. Do not go to step 11.
- Before you go to step 11, check that the file of each ADR draft exists.
- Go to step 11.

### Step 11: Archive

- Run `openspec archive "<name>" --yes`.
- The CLI applies the deltas to `openspec/specs/`, and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`.
- If `openspec archive` fails, report the failure, and list the ADRs that you wrote. Tell the user to fix the error, and to run `openspec-lite-archive` again. Then stop.
- If `openspec archive` fails, keep the ADRs: each ADR is still a correct decision.
- If `openspec archive` passes, go to section 3.

## 3. End

- List the specs that changed, the ADRs that you wrote, the ADRs that you marked as superseded, and the archive path.
- If a decision of `plan.md` has no ADR, say that the reason of this decision now exists only in `openspec/changes/archive/`. If a requirement holds the decision, name the requirement, and say that the requirement keeps only the rule.
