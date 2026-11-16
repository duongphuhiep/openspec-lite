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

- Ask no approval for a draft, an ADR of an earlier run, a delta file of an earlier run, or a `Status:` edit.
- Do not ask the user to answer yes, no, or edit for a draft.
- Do not print the full text of a draft or of a file of an earlier run.
- In place of the text of a draft, the end reply holds the short summary of step 6.
- The user does not see the output of a tool call. To print a text for the user, write the full text in your reply.
- Write each draft exactly as step 5 drafted the draft.
- Do not remove a 🤖 yourself. Only the user removes a 🤖.
- Write no 🤖 in a spec or an ADR.
- Write no source emoji in a spec, for example 👤 or 🔬. Give the source of a fact in words in the requirement text.
- An ADR keeps the source emoji of a fact.
- If a fact of `plan.md` has no source emoji, add no emoji, and do not guess the source of the fact. Give the source in words only when the fact names the source.
- A 🤖 in an HTML comment, for example in a template comment of `plan.md`, is not a mark.
- A decision is a 🤖 decision only when the heading of the decision ends with 🤖.

### ID rule

- Use the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in `plan.md`, in `tasks-preview.md`, and in your reply to the user, for example in the summary of step 6.
- Do not write a `plan.md` ID in another file, a code comment, a commit message, a pull request, or a ticket.
- To refer to a `plan.md` item in a file other than `plan.md` and `tasks-preview.md`, use the item title, or a short form of the item text, with the change name.
- If the ID comment of an older `plan.md` gives another form of the ID rule, follow the ID rule of this skill.

### Earlier delta rule

- The user can have fixed a delta file of an earlier run after a `validate` failure.
- Do not change or delete a requirement of a delta file of an earlier run.
- Do not delete a delta file of an earlier run.

### Failure rule

- An action is a command, a script, a skill call, a tool call, or a read, a write, an edit, or a delete of a file.
- An action fails when the action exits non-zero, is denied, or gives an error. If a step names the outputs of the action, the action also fails when the action prints another output.
- A search that finds no match does not fail, also when the search command exits with code 1, as `grep` and `git grep` do. No match is the output of the search.
- If a step gives its own failure branch, follow that branch.
- If a Bash call with more than one command is denied, do the same action once more in a second form. The second form is single commands, one command in each call, or the Read, Write, or Edit tool.
- Do not try a third form.
- Do not run a denied single command again.
- If no step needs the output of the failed action, do not stop. Name the action and the error in your reply, and go on without the output.
- Examples of an action whose output no step needs: an extra check, or a read of a link for more context.
- A step always needs the output of these actions: a run of the tests that the step names, and a write, an edit, or a delete of a file.
- Do not make up a missing output yourself, for example a template, a hash, a version, or a status line.
- If a step needs the output of a failed action, and no second form is left to try, do these steps in order:
  1. Show the command or the file, and the error text.
  2. Name each file that this run changed.
  3. Tell the user what to fix, and to start this workflow again.
  4. Stop.
- Before you report a write, an edit, or a delete as done, check the file on disk.
- Do not report a file as written, or a step as done, unless the action passed.
- If a reply to a yes-or-no question has no yes and no no, and the step gives no branch for that case, ask the question again. Do no action that depends on the answer.

### Reply order rule

- If a reply has a question or a request, put each question and each request at the end of the reply.
- A request is an action that the workflow waits for before the workflow can go on.
- Examples of a request: an answer, a fix that a stop needs, or a mark that the user must remove.
- Advice for later is not a request, for example the next skill to run, or a file to read or commit.
- Put advice before the first question or request.
- Put each summary, list, warning, report, and result of the reply before the first question or request.
- If a reply has more than one question or request, put all the questions and requests together at the end of the reply, in one numbered list.
- Write nothing after the last question or request: no note, no summary line, and no offer.
- A request can end with the step that the user does after the action, for example a re-run of this workflow. Keep that step in the request, after the action.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Input: the prompt, and the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- If the prompt gives no OpenSpec root, run `openspec list --json`.
- If the prompt gives an OpenSpec root, run `cd <root> && openspec list --json`, with the folder of the prompt as `<root>`.
- Read `root.path` of the output. The folder in `root.path` is the OpenSpec root.
- If `openspec list --json` prints no JSON, show the error, and stop. Tell the user to check that `openspec` is installed.
- If `root` is `null`, `openspec list --json` exits with code 1. That exit code is not a failure of the action.
- Run each `openspec` command, and each command with a relative `openspec/...` path, from the OpenSpec root.
- Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command, and each command with a relative `openspec/...` path, with `cd <root> && `.
- The `cd <root> && ` prefix does not count as a chain. A command with the prefix is a single command, also for the failure rule.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root. End your turn, and wait for the answer.
- If more than one folder matches, ask the user to pick one folder. End your turn, and wait for the answer.
- After the user confirms or picks a folder, run `cd <root> && openspec list --json`, with that folder as `<root>`. The next checks use the output of this run.
- If the user rejects the folder, or picks no folder, stop. Tell the user to run the skill from the OpenSpec root.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Input: the prompt, and the `changes` list of the last `openspec list --json` output of the OpenSpec root block.
- Output: the name of the change, written `<name>` in this skill.
- An active change is an entry of the `changes` list.
- A change has no schema when its `.openspec.yaml` is missing or has no `schema` line. Show `none` as the schema of such a change.
- If the `changes` list is empty, stop. Tell the user that no active change exists.
- If the prompt names a change, use that change.
- If the prompt names a change that is not in the `changes` list, show the active changes, and ask the user to pick one change. End your turn, and wait for the answer.
- If the prompt names no change, read `schema` from the `.openspec.yaml` of each change. The `changes` list does not give the schema.
- If the prompt names no change, and only one active change exists, use that change.
- If the prompt names no change, and more than one active change exists, ask the user to pick one change. Show the name and the schema of each change, so that the user sees which changes this skill accepts. End your turn, and wait for the answer.
- If the change to use has no schema, stop. Tell the user that the change has no schema, so this skill cannot use the change.

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
   - A stock spec-driven change can have no `design.md`.
   - If `openspec/changes/<name>/design.md` does not exist, or has no `### Decision` entries, go to guard step 2.
   - If `openspec/changes/<name>/design.md` has `### Decision` entries, draft an ADR for each `### Decision`. Use these parts of section 2, step 5: the ADR form, the sources of an ADR draft, the first check, the second check, and the third check.
   - Ask no question in guard step 1.
   - Build the summary of the ADR drafts as in section 2, step 6.
   - After section 2, step 6, continue guard step 1 with the write of the ADR drafts. Do not go to section 2, step 7.
   - Do not run section 2, steps 7 to 9.
   - Write each ADR draft with the file rules and the `Supersedes:` edits of section 2, step 10. Do not apply the `validate` condition of section 2, step 10.
   - After section 2, step 10, print the summary of section 2, step 6.
   - After the summary, list each ADR file that you wrote, and each old ADR whose `Status:` line you changed.
   - After section 2, step 10, go to guard step 2. Do not go to section 2, step 11.
   - Do not change `design.md`.
2. Search `proposal.md`, `specs/`, and `design.md` of the change for 🤖.
   - Do this search after guard step 1.
   - Search only the files and folders that exist. A missing `proposal.md`, `specs/`, or `design.md` holds no 🤖.
   - If a line of `proposal.md`, `specs/`, or `design.md` has a 🤖, list each such line.
   - For each 🤖 line of `proposal.md` or `design.md`, advise the user to accept the line (remove the mark) or delete the line.
   - For a 🤖 line in a delta of `specs/`, give no advice, because guard step 4 makes the request.
   - The guard path does not wait for the edit of a 🤖 line of `proposal.md` or `design.md`. So the advice for these lines comes before the request of guard step 4 or the question of guard step 5.
   - If a 🤖 line is the heading of a `design.md` decision that has an ADR with the line `Change: <name>`, name the ADR file.
   - The ADR of a 🤖 decision heading can come from this run or from an earlier run.
   - If a 🤖 line is the heading of a `design.md` decision that has an ADR with the line `Change: <name>`, tell the user to also delete the ADR file if the user deletes the decision.
   - If no line has a 🤖, you can say so in one line.
   - In guard steps 2 to 4, before each reply that says what holds a 🤖, search `proposal.md`, `specs/`, and `design.md` again.
   - Go to guard step 3.
3. Name the open questions of a `plan.md` that still exists.
   - Input: the input of the leftover plan.md questions rule.
   - Archive does not record an answer on the guard path.
   - Name the open questions of `plan.md` with the leftover plan.md questions rule, before the questions and the requests of the reply.
   - Go to guard step 4.
4. Block the archive while a delta holds a 🤖.
   - If a delta in `specs/` holds a 🤖, do not offer the archive, and do not tell the user to run stock `/opsx:archive`, because the CLI copies the 🤖 into the main spec.
   - The block also forbids a question with a condition about the archive.
   - If a delta in `specs/` holds a 🤖, ask the user to accept each 🤖 line of the delta (remove the mark) or delete the line, and end your turn.
   - When the user replies after guard step 4, and the reply says that the user will not edit the 🤖 lines, say that the archive stays blocked while a delta holds a 🤖, and stop.
   - When the user replies after guard step 4 with another reply, go to guard step 2. Do not run guard step 1 again.
   - If no delta in `specs/` holds a 🤖, go to guard step 5.
5. Give the archive step.
   - Ask: "Archive the change now with `openspec archive <name> --yes`?"
   - If `tasks.md` has unchecked tasks, name how many in the same question, because `--yes` skips the CLI prompt for the unchecked tasks.
   - If `tasks.md` has no unchecked tasks, or does not exist, say nothing about tasks.
   - If `plan.md` still has open questions that no artifact holds, and whose answer no artifact holds, name how many in the same question.
   - The count of these open questions matters because the archive moves `plan.md` to the archive folder, and no artifact holds these questions.
   - After the archive question, end your turn, and wait for the answer.
   - If the user says yes to the archive question, run the command. The command applies the deltas of `specs/` and moves the change to the archive. Report the result.
   - If the user says no to the archive question, tell the user to run stock `/opsx:archive` later.

### Leftover plan.md questions

- Run this rule only when a step of the guard calls this rule.
- Input: these sections of `openspec/changes/<name>/`:
  - `## Open Questions` of `plan.md`.
  - `## 0. Open questions` of `tasks.md`.
  - `## Open Questions` of `design.md`.
  - The other content of `design.md` and `specs/` of the change, for an answer.
- Output: each open question of `plan.md`, with the artifact that holds the question.
- If `plan.md` does not exist, or `plan.md` has no open question, say nothing about `plan.md`.
- An HTML comment in `## Open Questions` of `plan.md` is not a question.
- For each open question of `plan.md`, check if `## 0. Open questions` of `tasks.md` or `## Open Questions` of `design.md` holds the question.
- A missing file holds no question.
- An artifact holds a question when the artifact asks the same question. The ID, a prefix such as "Answer:", and other words around the question do not decide the match.
- An artifact holds the answer of a question when the artifact states the answer as a fact, a decision, or a requirement. Content on the same topic that does not answer the question is not the answer.
- If an artifact holds the question, name the question and the artifact, because the stock skills meet the question there.
- If an artifact holds the answer of the question, name the question as closed, with the artifact that holds the answer. Do not ask the user to answer the question.
- If no artifact holds the question, and no artifact holds the answer of the question, do these steps:
  1. Name the question.
  2. Tell the user to write the answer of the question in an artifact of the change before the next stock skill or archive, because the stock skills do not read `plan.md`.
  3. Tell the user that the question can then be deleted from `plan.md`.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare the version with the shipped version:

   Shipped schema version: 8

   - If the version equals the shipped version, go to item 3 of the schema check.
   - If the version is higher than the shipped version, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   - If the file is missing, the version is lower, or the file has no readable `version` line, run the `openspec-lite-schema` skill. Give the OpenSpec root in the prompt of the skill call.
   - If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
   - If the user says no to the replace question of `openspec-lite-schema`, stop.
   - Do not end your turn after `openspec-lite-schema` finishes.
   - After `openspec-lite-schema` finishes, copy the report of `openspec-lite-schema` to your reply. Copy the report also when this skill stops later.
   - The report of `openspec-lite-schema` is the `status:` line, the `backup:` line, each `copied:` line, and the `config.yaml` line.
   - Copy the `status:`, `backup:`, and `copied:` lines as `install.mjs` printed them.
   - After the copy of the schema, read the version again.
   - After the copy of the schema, if the version still differs from the shipped version, stop, and report both versions.
   - After the copy of the schema, if the version equals the shipped version, go to item 3 of the schema check.
3. Run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - The script compares `openspec --version` with the range in `schema.yaml`. The script prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run the script alone, not in a chain.
   - Read the first word of the line, not the exit code.
   - Do not compare the versions yourself.
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
- Then search with `git -C <git root> grep --untracked <word>`, because a plain `git grep` does not find a new file that is not committed.
- If `git rev-parse --show-toplevel` fails, the repo does not use git. Then search the files under the OpenSpec root with the search tool of the harness.
- In a search with the search tool of the harness, skip `.git/`, `node_modules/`, and `apm_modules/`.
- Do not judge from the first lines of `git ls-files`, because tool folders such as `.claude/` and `apm_modules/` fill them.
- Name each outcome and each constraint that is not met, and each open question that is left.
- If each answer is "yes", go to step 2.
- If an answer is "no", show the warnings, and ask only: "Archive anyway?" Give no other options in this question. End your turn.
- If the reply to "Archive anyway?" answers an open question, or gives a fact, a constraint, or a choice for `plan.md`, do not go to step 2. Quote that part of the reply. Tell the user to run `openspec-lite-apply` with that part, so that apply records the part, and then to run `openspec-lite-archive` again. Stop.
- If the user says yes to "Archive anyway?", go to step 2.
- If the user says no to "Archive anyway?", give the paths below, then stop:
  - For each outcome or constraint that is not met, give two paths. Path 1: implement the item with `openspec-lite-apply`. Path 2: remove the item from `plan.md`, and propose the item as a separate change with `openspec-lite-propose`.
  - For each open question that is left and does not end with "(left to the agent by the user)", tell the user to run `openspec-lite-apply` with the answer, so that apply records the answer.
  - For each open question that ends with "(left to the agent by the user)", tell the user to run `openspec-lite-apply`, which decides the point.
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
- Apply the **Non-obvious**, **Surprising**, and **Contract** filters to each outcome, constraint, and decision.
- Apply only the **Non-obvious fact** filter to a fact.
- If `plan.md` says that a constraint applies only to this change, do not select the constraint. The not-drafted reason of the constraint is that the constraint applies only to this change.
- A constraint that says only what the change must not add limits only how this change is built.
- Do not select a constraint that says only what the change must not add, unless `plan.md` says that a later change must keep the constraint. The not-drafted reason of the constraint is that the constraint limits only how this change is built.
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
- A fact that a reader can easily deduce from the code or the file list is never a non-obvious fact, also if a run found the fact.
- A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to a 👤 fact.
- Step 4 says where a non-obvious fact goes.
- Go to step 4.

### Step 4: Sort each item

- Input: the items of `<dir>/plan.md`, and the selected items of step 3.
- Output: the list of items to draft, each with its destination, and the not-drafted list.
- A selected constraint goes to a spec, as a requirement.
- A selected outcome of the Goal goes to a spec, as a requirement. If a constraint already states the outcome, draft one requirement for both.
- A selected decision that is not a contract goes to an ADR.
- If a decision is also a contract, draft the contract as a requirement.
- If a decision is also a contract, and the reason of the decision passes the **Non-obvious** or the **Surprising** filter, also draft an ADR for the decision.
- If a decision is also a contract, and the reason of the decision passes no filter, draft no ADR for the decision.
- Make the not-drafted list for the summary of step 6. Do not write the list to a file. The not-drafted list holds each outcome, constraint, decision, and fact of `plan.md` that you do not draft, each non-goal, and each open question that is left.
- Give each item of the not-drafted list a one-line reason. No item disappears with no word.
- A fact that goes into another draft is drafted. Do not put the fact in the not-drafted list.
- Do not put the items of `## Background` in the not-drafted list. `## Background` gives context, and stays in the archive folder.
- A non-obvious fact goes to the `## Context` of each drafted ADR that the fact relates to. Keep the source emoji of the fact.
- An obvious fact goes to the `## Context` of an ADR only when the fact justifies the decision of that ADR. Keep the source emoji of the fact.
- A fact that justifies a requirement goes into the requirement text, as its reason, with no source emoji, for example "The token SHALL expire after 24 hours, because the mobile app caches it for one day."
- Draft a fact ADR for a non-obvious fact when all these conditions are true:
  - No drafted ADR holds the fact.
  - No drafted requirement holds the fact as its reason.
  - The change depends on the fact.
- The parts of a fact ADR:
  - The `## Context` of the fact ADR holds the fact and its source.
  - The `## Decision` of the fact ADR says how the change uses or handles the fact, as the code shows.
  - The `## Consequences` of the fact ADR says what a later change must keep.
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
- If you reuse a capability, read `openspec/specs/<capability>/spec.md`.
- If a requirement changes a requirement of the main spec, write the requirement under `## MODIFIED Requirements`, with the name of the requirement of the main spec.
- If a requirement removes a requirement of the main spec, write the requirement under `## REMOVED Requirements`.
- Write each other requirement under `## ADDED Requirements`.
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

- If `openspec/adr/` does not exist, the folder holds no ADR. The first check and the second check find no file. Step 10 creates the folder.
- Before you draft a decision, search `openspec/adr/` for files with the line `Change: <name>`.
- An earlier run of this archive can have written these files.
- Do not draft a decision or a fact that already has an ADR.
- Outside the guard path, put each item that an ADR of an earlier run holds in the not-drafted list, with the reason that the ADR of the earlier run keeps the item.
- An ADR with the line `Change: <name>` holds a decision when the `## Decision` of the ADR records the same choice as the decision.
- An ADR with the line `Change: <name>` holds a fact when the `## Context` of the ADR records the same fact.
- The title of the ADR alone does not decide the match.
- The summary of step 6 names each file that has the line `Change: <name>`, with its title.

The check for an earlier delta:

- Before you draft a delta, list the files under `<dir>/specs/`.
- If a file exists under `<dir>/specs/`, an earlier run of this archive wrote the file.
- Follow the earlier delta rule.
- Do not draft a requirement that a delta file of an earlier run already holds.
- A delta file holds a requirement when a requirement of the file states the same rule as the item.
- A delta file also holds a requirement when the file has a requirement with the same name as the requirement that you would draft for the item.
- Put each item that a delta file of an earlier run holds in the not-drafted list, with the reason that the delta file of the earlier run keeps the requirement.
- The summary of step 6 names each such file. Step 7 merges into the file each delta draft with the same path.

The second check, for a **Superseded ADR**:

- Read the title and `## Decision` of each ADR in `openspec/adr/` with the line `Status: Accepted`.
- If a new decision fully replaces an old ADR, add the line `Supersedes: <old file name>` after the `Change:` line of the draft.
- If a new decision changes only part of an old decision, add no line. The summary of step 6 says that both ADRs stay `Accepted`.
- If a new decision replaces no old ADR, add no line.

The third check, for `plan.md` IDs:

- Search each draft for a `plan.md` ID (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`).
- Replace each ID with the item title, or a short form of its text, as the ID rule says.

When each item has a draft, go to step 6.

### Step 6: Build the summary

- Input: the drafts of step 5, the files of an earlier run of step 5, and the not-drafted list of step 4. On the guard path, step 4 does not run.
- Output: the summary, for the end reply.
- Build a short summary of the promotion. Do not print the summary now.
- Outside the guard path, section 3 prints the summary at the start of the end reply, after the writes and the archive.
- If a step from step 7 to step 11 stops, print the summary before the stop report.
- On the guard path, guard step 1 prints the summary after the ADR writes.
- In the summary, write one line for each item: the `plan.md` ID, if the item has an ID, and the title of the item.
- If the item has no title, for example a constraint, a fact, or an outcome of the Goal, write a short form of the item text.
- On the guard path, write the title of the `design.md` decision.
- In the summary, put the items in these groups. Start each group with its count. Omit an empty group.
  - The decisions that go to an ADR.
  - The outcomes of the Goal and the constraints that go to a requirement.
  - The decisions that are also a contract and go to a requirement. For each decision, name the requirement that holds the decision.
  - The facts that go into a requirement text as its reason.
  - The facts that go to the `## Context` of an ADR. Name the ADR for each fact.
  - The facts that get an ADR of their own, from step 4.
  - The deltas. For each delta, give the capability, the count of requirements and scenarios, and the items that the delta comes from. Give the ID of each item that has an ID, or a short form of the text of each item that has no ID.
  - The not-drafted list of step 4, with the one-line reason of each item. A decision that goes only to a requirement is in the group of the contract decisions, not in this group.
- After the groups, give each other point that the user must know, one line for each point:
  - Name each draft that holds content from a 🤖 decision of `plan.md` or, on the guard path, of `design.md`. Name the 🤖 decision. Say that the user did not confirm the decision, and that the archive promotes the decision.
  - On the guard path, name each draft that holds content from another line of `proposal.md` or `design.md` with a 🤖. Name the line. The draft holds no 🤖.
  - For each draft with a `Supersedes:` line, name the old ADR, and say that the archive changes the `Status` line of the old ADR.
  - For each new decision that changes only part of an old ADR, say that both ADRs stay `Accepted`.
  - Name each ADR of an earlier run, with its title. Say that the earlier run wrote the ADR, and that this run does not write the ADR again.
  - Outside the guard path, name each delta file of an earlier run. Say that the archive keeps the file, and merges into the file each delta draft with the same path.
- Outside the guard path, if step 5 has no draft, and finds no ADR and no delta file of an earlier run, say in one line that the archive promotes no item.
- Outside the guard path, if step 5 has no draft, and finds no ADR and no delta file of an earlier run, still give the group of the not-drafted list.
- On the guard path, give only the group of the decisions that go to an ADR, and the points about 🤖, `Supersedes:`, a new decision that changes only part of an old ADR, and the ADRs of an earlier run.
- If no decision heading ends with 🤖, you can say so in one line.
- Do not say that a decision has a 🤖 when its heading does not end with 🤖.
- Ask no question about the summary. Do not end your turn after you build the summary.
- On the guard path, continue with guard step 1.
- Outside the guard path, go to step 7.

### Step 7: Write the deltas

- Input: the delta drafts of step 5, and the delta files of an earlier run.
- Output: the deltas in `<dir>/specs/`.
- Follow the earlier delta rule.
- Write each delta draft to `<dir>/specs/<capability>/spec.md`.
- If a delta file of an earlier run has the same path as a delta draft, merge the delta draft into the file, with no duplicate requirement.
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
- If the file name exists, add `-2`, `-3`, and so on. Never overwrite an ADR.
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

- Start the end reply with the summary of step 6, with its groups and its counts. One line with the result of the archive can come before the summary.
- Then list the specs that changed, the ADRs that you wrote, the ADRs that you marked as superseded, and the archive path.
