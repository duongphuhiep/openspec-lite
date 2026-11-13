---
name: openspec-lite-upgrade
description: Upgrade a plan-lite change to a full spec-driven OpenSpec change, at any time, for example when its scope grows. It writes proposal.md, specs, design.md, and tasks.md from plan.md and tasks-preview.md. Use only when the user asks for openspec-lite-upgrade, or to upgrade a plan-lite change.
---

# openspec-lite-upgrade

Upgrade a plan-lite change to spec-driven. The schema switch comes after step 2 writes the four artifacts, so an interrupted run can run again and resume.

## How to read this skill

- Do section 1, then section 2.
- In section 1, do the checks in this order: OpenSpec root, Change selection, Guard, Schema check.
- When the schema check says "continue with the next step of this skill", go to section 2, step 1. On the resume path of the guard, go to section 2, step 4.
- In section 2, do steps 1 to 5 in order. Each step names its next step.
- Step 2 has the sub-steps 2.1 to 2.5. Step 5 has the sub-steps 5.1 to 5.4. For example, "step 2.4" is the sub-step 4 of step 2.
- "The question turn of step 2" is the part of step 2 before step 2.1: the plan, the questions, and the reply of the user.
- Section 3 gives the content of the summary. Step 5.3 writes the summary.
- Section 4 holds the named rules of this skill, for example the requirement-source rule.
- The general rules apply at all times, in each step.
- A named rule applies in each step where its topic comes up, also when the step does not name the rule.
- The question rule, the ask rule, the decision rule, and the answer rule are rules of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`. Read these four rules in that file.
- `<name>` is the name of the change. The change selection check gives `<name>`.
- `<dir>` is `openspec/changes/<name>`.

## General rules

- When you write `proposal.md`, `specs/`, `design.md`, or `tasks.md`, follow the ID rule.
- When you write `proposal.md`, `specs/`, or `design.md`, mark each inferred item with the inferred-item rule.
- Do not mark an item of `tasks.md` with 🤖.
- When you run `openspec instructions`, follow the instructions rule.
- If an artifact already exists from an earlier run, follow the resume rule.
- In the question turn of step 2, edit `plan.md` only to add the "(kept open by the user)" marker, when the user keeps a question open.
- A closed question stays in `plan.md` until the prune of step 5.

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
- Output: the next check or step, or a stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` exists, go to the schema check.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` does not exist, stop. Tell the user to write `plan.md` with `openspec-lite-propose` first.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` does not exist, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` has any other value, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` still exists, ask the resume question, because an earlier run can stop after it wrote the artifacts, and a finished upgrade can keep `plan.md`.
- In the reply with the resume question, do not name a step number.
- The resume question is: "The upgrade of <name> wrote the artifacts, and `plan.md` still exists. Finish the upgrade now: validate the artifacts, then decide what to delete from `plan.md`?"
- After the resume question, end your turn, and wait for the answer. Do not run `validate` before the answer.
- If the user answers no to the resume question, name each open question that stays in `plan.md`, and stop.
- If the user answers yes to the resume question, do the schema check. Then go to step 4 of section 2, not to step 1.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare the version with the shipped version:

   Shipped schema version: 6

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

## 2. Upgrade

### Step 1: Keep the `skip_specs` line

- Input: `<dir>/.openspec.yaml`.
- Keep the `skip_specs: true` line of `<dir>/.openspec.yaml` for now.
- Step 2.2 removes the `skip_specs: true` line just before the first spec write.
- So a run that stops before the specs leaves a change that still passes `validate`.
- Go to step 2.

### Step 2: Plan the requirements, close the open questions, and ask the user

- Input: `<dir>/plan.md`, `<dir>/tasks-preview.md` if it exists, and each artifact that already exists in `<dir>`.
- Output: the planned requirements, the closed questions with their answers, and the answers of the user.
- Do the question turn of step 2 before you write an artifact. Steps 2.1 to 2.4 then write the four artifacts.

Plan the requirements:

- If `<dir>/specs/` already holds a delta, plan no requirement, because step 2.2 keeps the delta.
- If `<dir>/specs/` holds no delta, plan each requirement with the requirement-source rule.

Close the open questions of `plan.md`:

- Read each question in `## Open Questions` of `plan.md`.
- A question that ends with "(kept open by the user)" is a kept question.
- Keep each kept question until a message of the user answers the kept question, also if you can decide the kept question. Do not ask a kept question.
- For each question that is not a kept question, try to decide the question or find its answer. Use the test of the question rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`: can you decide the question, or find its answer?
- In the question turn of step 2, do not do the `plan.md` writes of the question rule: record no fact or decision in `plan.md`, and remove no question from `plan.md`. Plan each answer for an artifact or for the summary, as the next bullets say.
- A question is open only while you cannot decide the question and cannot find its answer.
- If you find an answer that is a non-obvious fact, plan the answer as a fact in `design.md` → `## Context`.
- If you find an answer that is obvious, give the answer only in the summary.
- If you decide a point, and the point changes a visible result or was a close call, plan a decision with 🤖 in `design.md`. The decision rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` gives these two criteria.
- If you decide a point, and the point matches neither criterion of the decision rule, give the answer only in the summary.
- If a decided point is a contract, and `<dir>/specs/` holds no delta, ask its requirement in the question turn, as for a decision with 🤖 in `plan.md`.
- Do not ask a question that you closed.

Ask the question turn:

- Make the question list from these items:
  - each open question in `plan.md` that is still open and that changes the specs, the approach, or the tasks;
  - each requirement that you plan to write from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`;
  - each requirement that you plan from a point that step 2 decided and that is a contract;
  - if you plan no requirement at all, and `<dir>/specs/` holds no delta, the question if the change has a requirement.
- If the question list is empty, do not ask. Go to step 2.1.
- If each of the four artifacts already exists, do not ask. Go to step 2.1.
- If the question list is not empty, ask all items of the question list in one reply, before you write any artifact.
- Ask each open question with the ask rule.
- For each planned requirement in the reply, show its text, and ask if you can write it.
- For each decision with 🤖 in `plan.md` that you do not plan as a requirement, give in the reply the reason why the decision is not a contract, in one sentence.
- For the question if the change has a requirement, say that "None" is a valid answer. If the user answers "None", upgrade writes no spec (step 2.2).
- In the same reply, give the answer of each question that you closed.
- End the turn, and wait for the answer.

Read the answer of the user:

- Split each answer of the user with the split rule, and plan each part for its artifact. Steps 2.1 to 2.4 write the parts.
- If `<dir>/specs/` holds no delta, plan a requirement for each constraint of the answer, with no new question.
- If the user says yes to a planned requirement, the user is the source of that requirement.
- If the user says no to a planned requirement, do not write that requirement.
- If the user gave no answer for a planned requirement, do not write that requirement. Name it in the summary.
- If the user cannot answer an open question now, keep the question in `plan.md`, with no marker.
- If the user says to keep a question open, add the "(kept open by the user)" marker to the question in `plan.md`.
- Add the "(kept open by the user)" marker only when the user says to keep the question open.
- Go to step 2.1.

### Step 2.1: Write `proposal.md`

- Input: the Goal and the scope in `plan.md`, and `## Background` of `plan.md` if it exists.
- Output: `<dir>/proposal.md`.
- If `<dir>/proposal.md` already exists, follow the resume rule, and go to step 2.2.
- Run the instructions command for `proposal` with the instructions rule.
- Write `proposal.md` from the Goal and the scope in `plan.md`.
- If the Goal has more than one outcome, give each outcome its own item in What Changes.
- If `## Background` exists, use its scope items and source links for the proposal context.
- Go to step 2.2.

### Step 2.2: Write `specs/<capability>/spec.md`

- Input: the requirements of step 2, and the list of `openspec/specs/`.
- Output: one delta per capability in `<dir>/specs/`, and the `skip_specs` state of `<dir>/.openspec.yaml`.
- If `<dir>/specs/` already holds a delta, follow the resume rule, and go to step 2.3.
- If no requirement is left after step 2, write no spec, and set `skip_specs: true` in `<dir>/.openspec.yaml`. Without a delta and without the flag, `validate` fails. Go to step 2.3.
- If you write at least one delta, first remove the `skip_specs: true` line from `<dir>/.openspec.yaml`. While the line is set, the CLI forbids spec files.
- After you remove the `skip_specs: true` line, run `openspec instructions specs`, in the full form of the instructions rule.
- Write one delta per capability, for the requirements of step 2.
- To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new capability only when none matches.
- For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without a `## Purpose` section, the CLI writes "TBD" as the Purpose of the new main spec.
- Write in the `## Purpose` section only what `plan.md` or an answer of the user states. The CLI instruction asks "what the capability is for". If `plan.md` does not state a purpose, describe what the capability does, not why a user wants it.
- Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
- Give each ADDED or MODIFIED requirement at least one `#### Scenario:` with **WHEN** and **THEN** lines.
- For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit the copy.
- Write only the requirements that step 2 planned and that the user approved, or whose source is a constraint, a decision with no 🤖 that is a contract, or an answer of the user.
- Do not write a requirement that step 2 did not plan, also if the CLI instruction or the Goal suggests it.
- In the summary, name the source of each requirement: a constraint, a contract decision, or an answer of the user.
- After a yes in the question turn of step 2, the user is the source of a requirement, so the requirement gets no 🤖 mark.
- Go to step 2.3.

### Step 2.3: Write `design.md`

- Input: `plan.md`, the planned facts and decisions of step 2, and the answers of the user.
- Output: `<dir>/design.md`.
- If `<dir>/design.md` already exists, follow the resume rule, and go to step 2.4.
- Run the instructions command for `design` with the instructions rule.
- Non-Goals go to `## Goals / Non-Goals`.
- Each `### Decision` entry of `plan.md` goes to `## Decisions`.
- If a choice of the answer supersedes or changes a decision of `plan.md`, write only the decision that follows the answer, with no 🤖. Do not copy the old decision.
- A decision with 🤖 in `plan.md` keeps its 🤖 in `design.md`, because the user did not confirm it yet.
- Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
- Facts go to `## Context`.
- Write each fact that step 2 planned to `## Context`, with its source emoji.
- Write each decision with 🤖 that the question turn of step 2 planned to `## Decisions`, with 🤖 at the end of its heading.
- Write each choice from the answer of the user that is not a contract to `## Decisions`, with no 🤖.
- If the user said yes in the question turn of step 2 to a requirement that you planned from a decision with 🤖, or from a contract point that step 2 decided, write that decision with no 🤖, because the yes confirms the choice. In the summary, say that the yes removed the mark.
- An open question that does not change the specs, the approach, or the tasks goes to `## Open Questions`, as the `design` instruction says.
- A kept question that no message of the user answered, and that does not change the specs, the approach, or the tasks, goes to `## Open Questions`, like each other such question. The kept question also stays in `plan.md`.
- An open question that changes the specs, the approach, or the tasks has no slot. Do not put that question, or a note that points to it, in `design.md`.
- If the user has no answer to a question that changes the specs, the approach, or the tasks, keep the question in `plan.md`. Also put the question as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
- If a kept question that no message of the user answered changes the specs, the approach, or the tasks, keep the question in `plan.md`. Also put the question as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
- Go to step 2.4.

### Step 2.4: Write `tasks.md`

- Input: `<dir>/tasks-preview.md` if it exists, the answers of step 2, and the open questions of step 2.3.
- Output: `<dir>/tasks.md`, and no `<dir>/tasks-preview.md`.
- If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here. Keep `tasks.md`, delete `tasks-preview.md`, and go to step 2.5.
- If `tasks.md` already exists and `tasks-preview.md` does not exist, follow the resume rule, and go to step 2.5.
- Run the instructions command for `tasks` with the instructions rule.
- If `<dir>/tasks-preview.md` exists, use the preview as the seed:
  - Remove its two header comment lines.
  - Replace each `plan.md` ID in the seed with the item title, or a short form of its text.
  - Add `[ ]` to each task line, for example `- [ ] 1.1 <task>`.
  - If an answer from step 2 changes the tasks, edit the seed to match the answer, and say so in the summary.
- If no preview exists, write `tasks.md` from the template.
- In both cases, put these questions before the first group, as `## 0. Open questions`:
  - each open question that step 2 asked and that the user could not answer;
  - each question with the "(kept open by the user)" marker that no message of the user answered, and that changes the specs, the approach, or the tasks.
- Give each question of `## 0. Open questions` one task: `- [ ] 0.1 Answer: <question> The answer can change the specs, the approach, or the tasks.`
- After you write `tasks.md`, check that `tasks.md` exists. Then, if `tasks-preview.md` exists, delete `tasks-preview.md`.
- Do the last check of the split rule.
- Go to step 2.5.

### Step 2.5: Check the pointers

- Input: `<dir>/proposal.md`, `<dir>/design.md`, and `## 0. Open questions` of `<dir>/tasks.md`.
- Output: `proposal.md` and `design.md` with no pointer to a question of `## 0`.
- Read `proposal.md` and `design.md` again.
- Remove each sentence that restates a question of `## 0. Open questions`, or points to it.
- In the artifacts, the task in `## 0. Open questions` is the only place of each question of `## 0`. The question also stays in `plan.md`.
- Go to step 3.

### Step 3: Switch the schema

- Input: `<dir>/.openspec.yaml`, and the four artifacts.
- Before you switch, check that `proposal.md`, `design.md`, and `tasks.md` exist, and that `<dir>/specs/` holds a delta or `<dir>/.openspec.yaml` has `skip_specs: true`. If a check fails, follow the failure rule. Do not switch the schema.
- Change `schema: plan-lite` to `schema: spec-driven` in `<dir>/.openspec.yaml`.
- Read the `schema` line again. If the line is not `schema: spec-driven`, follow the failure rule.
- Go to step 4.

### Step 4: Validate

- Run `openspec validate "<name>"`.
- Report each error. Do not fix errors silently.
- Go to step 5.

### Step 5: Prune `plan.md`

Do steps 5.1 to 5.4 in order.

### Step 5.1: List the destinations

- Input: `plan.md`, and the four artifacts.
- Output: the destination list.
- List each `plan.md` section with its destination, in a table with the columns `Section`, `Artifact`, and `Heading`. Give one row for each section that has content.
- A decision of `plan.md` that an answer superseded has the heading of the decision that replaced it.
- In the `Heading` column, write the heading of the artifact that now holds the content, for example `## Context`, or write "kept".
- If a question also stays in `plan.md` (step 2.3 or step 2.4), write the heading of the artifact and "kept", for example "`## Open Questions`, kept".
- If an artifact holds a question of `plan.md` or its answer, give the question the heading of that artifact, or `## 0. Open questions`.
- If no artifact holds a question or its answer, and step 2 did not run in this session, for example on the resume path, use the test of the question rule again to find the answer.
- The closed rule: a question that no artifact holds has the destination "closed", with its answer, only when the answer is obvious, or the answer is a decision that the decision rule does not record.
- A yes to the prune question deletes a closed question.
- If no artifact holds a question, and its answer is a non-obvious fact or a decision that the decision rule records, the destination is "kept, in no artifact". This case occurs when step 2.3 kept a `design.md` of an earlier run.
- If no artifact holds a question, and you cannot decide the question or find its answer, the destination is "kept, in no artifact".
- If the items of one section go to different destinations, list each item.
- Keep a section that has no slot, for example an open question that the user cannot answer now (step 2.3).
- Go to step 5.2.

### Step 5.2: Find the content in no artifact

- If a section has content that is in no artifact, list the content as "kept, in no artifact".
- A yes to the prune question does not delete content that is "kept, in no artifact".
- In the summary, name each content that is "kept, in no artifact". Tell the user to add the content to an artifact by hand, to keep it in an artifact.
- Go to step 5.3.

### Step 5.3: Ask the prune question

- Write one reply in this order: the result of step 4, the summary of section 3, the list from step 5.1, and last the prune question.
- The prune question is: "Delete the moved sections from `plan.md`?"
- If `validate` failed, recommend to keep `plan.md` until the errors are fixed.
- The summary must not say that `plan.md` is deleted or kept, because the user did not answer yet. This ban is about the whole file. Name each item that stays in `plan.md` after any answer, as section 3 says.
- The prune question is the last line of the reply.
- End your turn, and wait for the answer. Then go to step 5.4.

### Step 5.4: Act on the answer

- If the user answers no, keep `plan.md` as it is. Say in one line that its moved sections are old copies, and that the artifacts are the source of truth.
- If the user answers yes, delete each section or item whose content moved, except the items that stay.
- These items stay in `plan.md` after a yes:
  - each row of step 5.1 whose `Heading` holds "kept"
  - each content that step 5.2 lists as "kept, in no artifact"
  - each question with the "(kept open by the user)" marker that no message of the user answered, also when `design.md` → `## Open Questions` holds a copy of the question (step 2.3)
  - each question of `## 0. Open questions` of `tasks.md` (step 2.4)
- After a yes, keep the ID comment at the top of `plan.md` while a section is left.
- After a yes, if no section is left, delete `plan.md`. A section with only an HTML comment counts as no section.
- After a yes, say in one line what you deleted and what you kept.
- After a yes, if a section is kept, tell the user to resolve it before `/opsx:apply`, because the stock skills do not read `plan.md`.
- Do not write the summary again.
- Upgrade ends here.

## 3. End

Write the summary in the reply of step 5.3, before the prune question. In the summary:

- List the files that you wrote, and `tasks-preview.md` if you deleted it.
- Do not name `plan.md` in the file list, as deleted or as kept. Step 5.4 says what happens to `plan.md` after the answer.
- Ask the user to review all artifacts.
- If an artifact has 🤖 items, list each 🤖 item with its new claim, or as an agent decision of `plan.md`.
- Ask the user to review each 🤖 item: remove the mark to accept the item, or delete the item.
- Ask for an extra review of `tasks.md`, because `tasks.md` is a contract, not a reference.
- Say the `skip_specs` state at the end: absent, because the change has spec deltas, or set, because it has none.
- Say that from now on the change uses the stock skills: `/opsx:apply` and `/opsx:archive`.
- Name each part of the answer whose artifact the resume rule kept. Tell the user to add the part to that artifact by hand.
- Name each `plan.md` item that has no slot and stays in `plan.md`, for example an open question that the user cannot answer now. The stock skills do not read `plan.md`.
- If `design.md` has `### Decision` entries, warn: stock `/opsx:archive` does not turn them into ADRs.
- If `design.md` has `### Decision` entries, say: to keep them as ADRs, copy them to `openspec/adr/` before the archive. `openspec-lite-archive` can do this copy: run it before `/opsx:archive`.

## 4. Rules

### Requirement-source rule

- A requirement can come only from one of these sources:
  - a constraint of `plan.md`;
  - a decision of `plan.md` that is also a contract;
  - an answer of the user.
- A contract is externally observable behavior that a client or another team depends on.
- Internal helpers, log text, and UI layout are not contracts.
- The format of a file or of an output that another program reads is a contract, for example the line format of a log file that a monitor parses, or the date format of a JSON field.
- A decision with 🤖 in `plan.md` has no confirmation of the user. If you are not sure that a decision with 🤖 is a contract, plan its requirement, and ask the user in the question turn.
- A decision of `plan.md` that is not a contract goes only to `design.md` → `## Decisions`.
- A fact is not a source of a requirement. A fact goes to `design.md` → `## Context`, with its source emoji.
- The Goal and `tasks-preview.md` alone are not sources.
- If you plan a requirement from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`, ask the user in the question turn of step 2.

### Split rule

- Split the answer of the user, as the answer rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` says.
- In steps 2.1 to 2.4, write each part of the answer to its artifact, not to `plan.md`. Where the answer rule says a section of `plan.md`, use the artifact that this split rule names.
- The last check of the split rule: after steps 2.1 to 2.4 write the answer, read the answer again, part by part. If a part is in no artifact, write the part to its artifact before step 2.5. If that write is the first delta, first remove the `skip_specs: true` line, and run the instructions command for `specs`, as step 2.2 says.
- If the resume rule kept the artifact of a part, do not edit the artifact. Section 3 names the part in the summary.
- A fact of the answer goes to `## Context` of `design.md`, with 👤 and "Source: the user".
- A constraint of the answer is a constraint that the change must follow. A constraint limits the result that a user or a program sees, or says what the change must not add. Test: if the result breaks the constraint, the change is not done.
- A choice of how to build the result is not a constraint, also when the user gives the choice.
- A constraint of the answer is a requirement source, like a constraint of `plan.md`. If `<dir>/specs/` holds no delta, write its requirement with no new question, because the answer of the user is the source of the requirement. If the resume rule kept a delta in `<dir>/specs/`, follow the kept-artifact bullet of this rule.
- A choice of the answer goes to the specs only when the choice is a contract.
- A choice of the answer that is not a contract goes to `## Decisions` of `design.md`.

### Inferred-item rule

- In `proposal.md`, `specs/`, and `design.md`, put 🤖 at the end of the line or the heading of each inferred item.
- An item is inferred only if the item holds a new claim.
- A new claim is a case, a value, a behavior, a risk, a dependency, a choice, or a reason.
- A claim is new only when no section of `plan.md` and no answer of the user in this upgrade states the claim.
- `tasks-preview.md` is not a source: a claim that only the preview states is new.
- An item can be a `#### Scenario:`, a `### Decision`, a list item, or the text of a `## Purpose` section.
- A requirement is never inferred, because step 2 gives each requirement a source.
- A fact with a source, for example a run, a doc, or an analysis of the code, is not inferred. The fact gets no 🤖, and the fact keeps its source emoji.
- Before you mark an item, check each sentence of the item, not only its main source.
- If one sentence holds a new claim, mark the item, and name that claim in a few words.
- If no sentence holds a new claim, do not mark the item.
- One exception: a `### Decision` from a decision with 🤖 in `plan.md` keeps its 🤖, because the user did not confirm it yet. Step 2.3 removes the 🤖 when the user said yes to a requirement from that decision, or from a contract point that step 2 decided.
- These are not new claims:
  - other words for a `plan.md` item or an answer;
  - another form of a `plan.md` item, for example a `#### Scenario:` that only restates its requirement;
  - another artifact or section for a `plan.md` item;
  - the code, file, or module that a `plan.md` item clearly touches.
- Example: `plan.md` asks for a thumbnail of each uploaded image, and does not say what happens to a file that is not an image. A `#### Scenario: Upload is not an image` gets 🤖, because the scenario adds a new claim.
- Example: `plan.md` asks for an email when an invoice is paid, and does not say that the email names the payer. The Why line "customers do not know who paid" in `proposal.md` gets 🤖, because the line adds the claim that the email names the payer.
- Example: `plan.md` has the constraint "Each thumbnail is 200 pixels wide". A `#### Scenario: Thumbnail width is 200 pixels` gets no 🤖, because the scenario only restates that constraint.
- Put one mark per item.
- Do not mark `tasks.md`.

### ID rule

- Do not write the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) in an artifact.
- To refer to a `plan.md` item in an artifact, use its title, or a short form of its text, with the change name.

### Instructions rule

- Write the four artifacts in this order: `proposal`, `specs`, `design`, `tasks`. The last check of the split rule can write to an earlier artifact after `tasks.md`.
- For each artifact, run `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`.
- Run the `openspec instructions` command as one plain command. Do not put it in a loop or a chain, and do not pipe it to another command.
- Read the full JSON output.
- Do not write the artifact without its `template` and `instruction`.
- If the command fails, or its output has no `template` or `instruction`, follow the failure rule. The change stays plan-lite until step 3, so a rerun resumes.
- Use the `template` of the JSON output, and follow its `instruction`.

### Resume rule

- If an artifact already exists from an earlier run, keep the artifact, and go to the next artifact.
- On a resumed run, ask the questions of step 2 again before you write a missing artifact, because the answers of the earlier session are not on disk.
- If a kept artifact looks incomplete, for example a template section that is still empty, name the section in the summary, and tell the user to complete it by hand.
