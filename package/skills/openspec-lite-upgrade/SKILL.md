---
name: openspec-lite-upgrade
description: Upgrade a plan-lite change to a full spec-driven OpenSpec change, at any time. The reason to upgrade is a team convention that requires stock OpenSpec. The user decides, and the skill does not check the reason. It writes proposal.md, specs, design.md, and tasks.md from plan.md and tasks-preview.md. Use only when the user asks for openspec-lite-upgrade, or to upgrade a plan-lite change.
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
- Section 3 gives the content of the summary. Steps and rules of this skill also send items to the summary. Step 5.3 writes the summary.
- Section 4 holds the named rules of this skill, for example the requirement-source rule.
- The general rules apply at all times, in each step.
- A named rule applies in each step where its topic comes up, also when the step does not name the rule.
- These seven rules are rules of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`: the question rule, the ask rule, the decision rule, the answer rule, the fact rule, the fact format, and the decision format. Read these seven rules in that file.
- A step number in the seven rules of `apply.instruction` names a step of `apply.instruction`, not a step of this skill.
- In this skill, a fact goes to `## Context` of `design.md`, not to `plan.md`.
- Two writers add a fact to `design.md`: step 2.3, and the last check of the split rule for a fact of the answer.
- If you find another fact after step 2.3, do not edit `design.md`. Name the fact in the summary as content in no artifact.
- If the resume rule kept `design.md`, do not edit `design.md` for a fact. Name the fact in the summary as content in no artifact.
- `<name>` is the name of the change. The change selection check gives `<name>`.
- `<dir>` is `openspec/changes/<name>`.

## General rules

- If the user asks for an upgrade, do the upgrade. Do not ask for the reason of the upgrade.
- When you write `proposal.md`, `specs/`, `design.md`, or `tasks.md`, follow the ID rule.
- When you write `proposal.md`, `specs/`, or `design.md`, mark each inferred item with the inferred-item rule.
- Do not mark an item of `tasks.md` with 🤖.
- When you run `openspec instructions`, follow the instructions rule.
- If an artifact already exists from an earlier run, follow the resume rule.
- In the question turn of step 2, edit `plan.md` only to add the "(kept open by the user)" marker, when the user keeps a question open.
- A closed question stays in `plan.md` until the prune of step 5.

### Failure rule

- An action is a command, a script, a skill call, a tool call, or a read, a write, an edit, or a delete of a file.
- An action fails when the action exits non-zero, is denied, gives an error, or prints an output that the steps do not name.
- If a step gives its own failure branch, follow that branch.
- If a Bash call with more than one command is denied, do the same action once more in a second form. The second form is single commands, one command in each call, or the Read, Write, or Edit tool.
- Do not try a third form.
- Do not run a denied single command again.
- If no step needs the output of the failed action, do not stop. Name the action and the error in your reply, and go on without the output.
- Examples of an action whose output no step needs: an extra check, or a read of a link for more context.
- A step always needs the output of these actions: a run of the tests that the step names, and a write, an edit, or a delete of a file.
- Do not make up a missing output yourself, for example a template, a hash, a version, or a status line.
- If a step needs the output, and the action fails again or a single command is denied, do these steps in order:
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
- If the `changes` list is empty, stop. Tell the user that no active change exists.
- If the prompt names a change, use that change.
- If the prompt names a change, and one of these conditions is true, show the active changes, and ask the user to pick one change. End your turn, and wait for the answer.
  - The named change is not in the `changes` list.
  - The `.openspec.yaml` of the named change is missing.
  - The `.openspec.yaml` of the named change has no `schema` line.
- If the prompt names no change, read `schema` from the `.openspec.yaml` of each change. The `changes` list does not give the schema.
- If the prompt names no change, and only one active change exists, use that change.
- If the prompt names no change, and more than one active change exists, ask the user to pick one change. Show the name and the schema of each change, so that the user sees which changes this skill accepts. End your turn, and wait for the answer.

### Guard

- Input: the `schema` line of `openspec/changes/<name>/.openspec.yaml`, the file `openspec/changes/<name>/plan.md`, the `### Decision` entries of `openspec/changes/<name>/design.md`, and the input of the leftover plan.md questions rule.
- Output: the next check or step, or a stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` exists, go to the schema check.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` does not exist, stop. Tell the user to write `plan.md` with `openspec-lite-propose` first.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` does not exist, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` is `spec-driven`, the guard stops, and `openspec/changes/<name>/design.md` has `### Decision` entries, also say that stock `/opsx:archive` does not turn them into ADRs, and that `openspec-lite-archive` copies them to `openspec/adr/`: run it before `/opsx:archive`.
- If `schema` has any other value, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` still exists, ask the resume question.
- The guard asks the resume question because an earlier run can stop after it wrote the artifacts, and a finished upgrade can keep `plan.md`.
- In the reply with the resume question, do not name a step number.
- The resume question is: "The upgrade of <name> wrote the artifacts, and `plan.md` still exists. Finish the upgrade now: validate the artifacts, then decide what to delete from `plan.md`?"
- After the resume question, end your turn, and wait for the answer. Do not run `validate` before the answer.
- If the user answers no to the resume question:
  - Name the open questions of `plan.md` with the leftover plan.md questions rule.
  - Then stop.
- If the user answers yes to the resume question, do the schema check. Then go to step 4 of section 2, not to step 1.

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

- The specs step of an earlier run is done when `<dir>/specs/` holds a delta, or when `<dir>/design.md` or `<dir>/tasks.md` exists. The instructions rule writes `design.md` and `tasks.md` only after the specs step.
- If the specs step of an earlier run is done, plan no requirement, because step 2.2 keeps the result of the earlier run.
- If `<dir>/specs/` already holds a delta, find each decision with 🤖 in `plan.md` whose rule a requirement of the delta states. The agent-decision rule says what to write for such a decision.
- If the specs step of an earlier run is not done, plan each requirement with the requirement-source rule.

Close the open questions of `plan.md`:

- Read each question in `## Open Questions` of `plan.md`.
- A question that ends with "(kept open by the user)" is a kept question.
- A question that ends with "(left to the agent by the user)" is a point that the user left to you. Decide the point with the question rule, and do not ask the question.
- For each question that is not a kept question, try to decide the question or find its answer.
- If an artifact of an earlier run in `<dir>` states the answer of a question as a fact, a decision, or a requirement, the question is closed. Plan nothing for that question. Give the answer and the name of the artifact, as for each other question that you closed.
- To try, use the test of the question rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`: can you decide the question, or find its answer?
- In the question turn of step 2, do not do the `plan.md` writes of the question rule. Record no fact or decision in `plan.md`, and remove no question from `plan.md`.
- In the question turn of step 2, plan each answer for an artifact or for the summary, as the next bullets say.
- If you find an answer that is a non-obvious fact, plan the answer as a fact in `design.md` → `## Context`.
- If you find an answer that is obvious, follow the no-artifact answer rule.
- If you decide a point, and the decision rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` records the choice, plan a decision with 🤖 in `design.md`.
- If you decide a point, and the point matches no criterion of the decision rule, follow the no-artifact answer rule.
- If the user left to you a fact that only the user knows, plan a decision with 🤖 in `design.md` for the value that you choose for the code.
- If the user left to you a fact that only the user knows, say in the summary that the fact stays unknown. The question rule says that the decision for this fact matches criterion (3).
- If a decided point is a contract, and the specs step of an earlier run is not done, ask its requirement in the question turn, as for a decision with 🤖 in `plan.md`.
- If a decided point or a decision with 🤖 in `plan.md` is a contract, the specs step of an earlier run is done, and no requirement of a delta states the rule of the point, name the point in the summary. Say that the point has no requirement, because the resume rule kept the specs of the earlier run. Tell the user to add the requirement by hand.
- Do not ask a question that you closed.

Ask the question turn:

- Make the question list from these items:
  - each open question in `plan.md` that is still open, that is not a kept question, and that changes the specs, the approach, or the tasks;
  - each requirement that you plan to write from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`;
  - each requirement that you plan from a point that step 2 decided and that is a contract;
  - if you plan no requirement at all, and the specs step of an earlier run is not done, the question if the change has a requirement.
- If the question list is empty, do not ask. Go to step 2.1.
- If `proposal.md`, `design.md`, and `tasks.md` already exist, do not ask. Go to step 2.1.
- If the question list is not empty, and one of `proposal.md`, `design.md`, and `tasks.md` does not exist, ask all items of the question list in one reply, before you write any artifact.
- First in the reply, give the answer of each question that you closed.
- Then, if the specs step of an earlier run is not done, for each decision with 🤖 in `plan.md` that you do not plan as a requirement, give the reason why the decision is not a contract, in one sentence.
- Last in the reply, ask all items of the question list, in one numbered list.
- Ask each open question with the ask rule.
- For each planned requirement in the list, show its text, and ask if you can write it.
- For the question if the change has a requirement, say that "None" is a valid answer. If the user answers "None", upgrade writes no spec (step 2.2).
- End the turn, and wait for the answer.

Read the answer of the user:

- Split each answer of the user with the split rule, and plan each part for its artifact. Steps 2.1 to 2.4 write the parts.
- If the user says yes to a planned requirement that the question turn asked, the user is the source of that requirement.
- If the user says no to a planned requirement that the question turn asked, do not write that requirement.
- If the user gave no answer for a planned requirement that the question turn asked, do not write that requirement. Name the requirement in the summary.
- If the user did not answer an open question, keep the question in `plan.md`, with no marker.
- If the user says to keep a question open, add the "(kept open by the user)" marker to the question in `plan.md`.
- Add the "(kept open by the user)" marker only when the user says to keep the question open.
- If the user answers yes to the question if the change has a requirement, but gives no requirement text, ask for the text, and end the turn. Do not write an artifact before the answer.
- When the user gives the requirement text, keep the plans of the earlier reply. Read only the new reply with the "Read the answer of the user" part of step 2.
- If the user gives no answer to the question if the change has a requirement, write no spec, as for "None", and name the question in the summary.
- Go to step 2.1.

### Step 2.1: Write `proposal.md`

- Input: `## Goal` of `plan.md`, `## Background` of `plan.md` if it exists, and each part of the answers of the user that the split rule sends to `proposal.md`.
- Output: `<dir>/proposal.md`.
- If `<dir>/proposal.md` already exists, follow the resume rule, and go to step 2.2.
- Run the instructions command for `proposal` with the instructions rule.
- Write `proposal.md` from `## Goal` of `plan.md`, and from `## Background` if it exists.
- If an answer of the user changes an outcome of the Goal, write the new outcome in What Changes, not the old outcome.
- If the Goal has more than one outcome, give each outcome its own item in What Changes.
- If `## Background` exists, use its scope items and source links for the proposal context.
- Go to step 2.2.

### Step 2.2: Write `specs/<capability>/spec.md`

- Input: the requirements of step 2, and the list of `openspec/specs/`.
- Output: one delta per capability in `<dir>/specs/`, and the `skip_specs` state of `<dir>/.openspec.yaml`.
- If the specs step of an earlier run is done, follow the resume rule, and go to step 2.3.
- If no requirement is left after step 2, write no spec, and set `skip_specs: true` in `<dir>/.openspec.yaml`. Then go to step 2.3.
- Without a delta and without the `skip_specs: true` line, `validate` fails.
- If you write at least one delta, first remove the `skip_specs: true` line from `<dir>/.openspec.yaml`.
- While the `skip_specs: true` line is set, the CLI forbids spec files.
- After you remove the `skip_specs: true` line, run the instructions command for `specs` with the instructions rule.
- Write one delta per capability, for the requirements of step 2.
- To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new capability only when none matches.
- If you reuse a capability, read `openspec/specs/<capability>/spec.md`.
- If a requirement changes a requirement of the main spec, write the requirement under `## MODIFIED Requirements`, with the name of the requirement of the main spec.
- If a requirement removes a requirement of the main spec, write the requirement under `## REMOVED Requirements`.
- Write each other requirement under `## ADDED Requirements`.
- For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without a `## Purpose` section, the CLI writes "TBD" as the Purpose of the new main spec.
- Write in the `## Purpose` section only what `plan.md` or an answer of the user states.
- The CLI instruction asks "what the capability is for". If `plan.md` does not state a purpose, describe what the capability does, not why a user wants it.
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
- If a part of the answer supersedes, changes, or corrects a decision of `plan.md`, or a fact or a 🤖 decision that the question turn of step 2 planned, write only the item that follows the answer, with no 🤖. Do not copy the old item.
- If the part of the answer that supersedes, changes, or corrects an item leaves the new choice to you, follow the bullet of this step that starts with "If a part of the answer leaves a choice to you".
- Write each part that the user chose with no 🤖.
- Write each decision with 🤖 in `plan.md` with the agent-decision rule.
- Write each constraint of `plan.md` and of the answer to `## Context`, or to `## Risks / Trade-offs` if the constraint states a risk.
- Facts go to `## Context`.
- Write each fact that step 2 planned to `## Context`, with its source emoji, unless a part of the answer corrected the fact.
- Write each decision with 🤖 that the question turn of step 2 planned to `## Decisions`, with the agent-decision rule.
- Write each choice that the user made in the answer and that is not a contract to `## Decisions`, with no 🤖.
- If a part of the answer leaves a choice to you, decide the point with the question rule. Write a decision with 🤖 to `## Decisions` only if the decision rule records the choice, or the point is a fact that only the user knows. Otherwise, give the choice in the summary. If the point is a contract, also name the point in the summary, because the point has no requirement.
- If the user said yes in the question turn of step 2 to a requirement that you planned from a decision with 🤖, or from a contract point that step 2 decided, write that decision with no 🤖, because the yes confirms the choice. In the summary, say that the yes removed the mark.
- An open question that does not change the specs, the approach, or the tasks goes to `## Open Questions`, as the `design` instruction says. This bullet also applies to a kept question that no message of the user answered.
- A kept question in `## Open Questions` of `design.md` also stays in `plan.md`.
- An open question that changes the specs, the approach, or the tasks has no slot in `design.md`. Do not put that question, or a note that points to it, in `design.md`.
- If the user did not answer a question that changes the specs, the approach, or the tasks, keep the question in `plan.md`. This bullet also applies to a kept question.
- Put each question that the user did not answer and that changes the specs, the approach, or the tasks, also a kept question, as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
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
  - each open question that step 2 asked and that the user did not answer;
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
- Before you switch, check that `proposal.md`, `design.md`, and `tasks.md` exist.
- Before you switch, check that `<dir>/specs/` holds a delta or `<dir>/.openspec.yaml` has `skip_specs: true`.
- If a check before the switch fails, follow the failure rule. Do not switch the schema.
- Change `schema: plan-lite` to `schema: spec-driven` in `<dir>/.openspec.yaml`.
- Read the `schema` line again. If the line is not `schema: spec-driven`, follow the failure rule.
- Go to step 4.

### Step 4: Validate

- Run `openspec validate "<name>"`.
- `validate` exits non-zero when an artifact has an error. A non-zero exit with a list of errors is a result of this step, not a failure of the action.
- If `validate` reports errors, report each error. Do not fix errors silently. Go to step 5.
- If `validate` passes, go to step 5.
- If `validate` does not run, or prints no result, follow the failure rule.

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
- Go to step 5.2.

### Step 5.2: Find the content in no artifact

- If a section has content that is in no artifact, list the content as "kept, in no artifact".
- A yes to the prune question does not delete content that is "kept, in no artifact".
- Go to step 5.3.

### Step 5.3: Ask the prune question

- Write one reply in this order: the result of step 4, the list from step 5.1, the summary of section 3, and last the prune question.
- The prune question is: "Delete the moved sections from `plan.md`?"
- If `validate` failed, write in the line just before the prune question: keep `plan.md` until the errors are fixed.
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
- After a yes, if an item is kept and no artifact holds it, repeat in one line the advice of section 3 for the item.
- Do not write the summary again.
- Upgrade ends here.

## 3. End

Write the summary in the reply of step 5.3, before the prune question. In the summary:

- List the files that you wrote, and `tasks-preview.md` if you deleted it.
- Give each item that a step or a rule of this skill sends to the summary.
- Do not name `plan.md` in the file list, as deleted or as kept. Step 5.4 says what happens to `plan.md` after the answer.
- If an artifact has 🤖 items, list each 🤖 item with its new claim, or as an agent decision of `plan.md`.
- A decision with 🤖 in `plan.md` and no 🤖 in `design.md` has the confirmation of the user.
- The 🤖 mark of a decision of `plan.md` goes away only after an action of the user: a yes in the question turn of step 2, a yes of an earlier run that exception 3 of the agent-decision rule finds, an answer that supersedes, changes, or corrects the decision, or an edit of the user.
- Do not ask the user again to confirm a decision that has the confirmation of the user, also on a resumed run.
- Say the final `skip_specs` state: absent, because the change has spec deltas, or set, because it has none.
- Say that from now on the change uses the stock skills: `/opsx:apply` and `/opsx:archive`.
- Name each part of the answer whose artifact the resume rule kept. Tell the user to add the part to that artifact by hand.
- Name each `plan.md` item that stays in `plan.md` and that no artifact holds, also each content that step 5.2 lists as "kept, in no artifact".
- Name each item that stays in `plan.md` one time.
- For each item that stays in `plan.md` and that no artifact holds, advise the user to add the item to an artifact by hand, or to resolve the item before `/opsx:apply`. Give the reason: the stock skills do not read `plan.md`.
- If `design.md` has `### Decision` entries, warn: stock `/opsx:archive` does not turn them into ADRs.
- If `design.md` has `### Decision` entries, say: to keep them as ADRs, copy them to `openspec/adr/` before the archive. `openspec-lite-archive` can do this copy: run it before `/opsx:archive`.
- At the end of the summary, advise the user to review all artifacts.
- At the end of the summary, if an artifact has 🤖 items, advise the user to review each 🤖 item: remove the mark to accept the item, or delete the item.
- At the end of the summary, advise an extra review of `tasks.md`, because `tasks.md` is a contract, not a reference.
- The review advice at the end of the summary comes before the prune question of step 5.3.

## 4. Rules

### Requirement-source rule

- A requirement can come only from one of these sources:
  - a constraint of `plan.md`;
  - a decision of `plan.md` that is also a contract;
  - an answer of the user, except a part that leaves a choice to you.
- A constraint that `plan.md` or the answer says applies only to this change is not a requirement source.
- A constraint that says only what the change must not add is not a requirement source, unless `plan.md` or the answer says that a later change must keep the constraint.
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
- The last check of the split rule: after steps 2.1 to 2.4 write the answer, read the answer again, part by part.
- In the last check of the split rule, if a part of kind 1 of the answer rule is in no artifact, write the part to its artifact before step 2.5.
- In the last check of the split rule, if the write is the first delta, first remove the `skip_specs: true` line. Then run the instructions command for `specs`, as step 2.2 says.
- If the resume rule kept the artifact of a part, do not edit the artifact. Section 3 names the part in the summary.
- A fact of the answer goes to `## Context` of `design.md`, with 👤 and "Source: the user".
- A constraint of the answer is a constraint that the change must follow. A constraint limits the result that a user or a program sees, or says what the change must not add. Test: if the result breaks the constraint, the change is not done.
- A choice of how to build the result is not a constraint, also when the user gives the choice.
- A constraint of the answer goes to `design.md`, as step 2.3 says.
- A constraint of the answer is a requirement source only when the requirement-source rule accepts the constraint.
- If the specs step of an earlier run is not done, write the requirement of a constraint of the answer that the requirement-source rule accepts, with no new question, because the answer of the user is the source of the requirement.
- If the resume rule kept the specs step of an earlier run, follow the bullet of this rule that starts with "If the resume rule kept the artifact of a part".
- A choice of the answer goes to the specs only when the choice is a contract, and the user made the choice.
- A part of the answer that leaves a choice to you is not a choice of the user. Step 2.3 says what to write for the part.
- A choice of the answer that is not a contract goes to `## Decisions` of `design.md`.
- A part of the answer that changes an outcome of the Goal goes to What Changes of `proposal.md`, and to the requirement of that outcome if step 2 planned one.
- A part of the answer that changes or removes a named item of `plan.md` changes or removes the copy of the item in the artifact that holds the copy.

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
- One exception: a `### Decision` from a decision with 🤖 in `plan.md` follows the agent-decision rule, also when the decision holds no new claim.
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
- If a format of `apply.instruction` holds a `plan.md` ID, for example the fact format or the decision format, write the format with no ID in an artifact.
- To refer to a `plan.md` item in an artifact, use its title, or a short form of its text, with the change name.

### Agent-decision rule

- The agent-decision rule applies to two kinds of decision: a decision with 🤖 in `plan.md`, and a decision with 🤖 that the question turn of step 2 planned.
- If no exception of the agent-decision rule applies, write the decision to `## Decisions` of `design.md`, with 🤖 at the end of its heading, because the user did not confirm the decision yet.
- Exception 1: if a part of the answer supersedes, changes, or corrects the decision, follow the bullet of step 2.3 that starts with "If a part of the answer supersedes".
- Exception 2: if the user said yes in the question turn of step 2 to a requirement that you planned from the decision, or from a contract point that step 2 decided, follow the bullet of step 2.3 that starts with "If the user said yes in the question turn of step 2".
- Exception 3: if a requirement of a delta of an earlier run states the rule of a decision with 🤖 in `plan.md`, write the decision with no 🤖. Step 2.2 writes a requirement from a decision with 🤖 only after a yes of the user, so the requirement shows that yes. In the summary, say that the requirement of the earlier run removed the mark.

### No-artifact answer rule

- Plan the answer for no artifact.
- If the question turn of step 2 runs, give the answer in the question-turn reply.
- If no question turn runs, give the answer in the summary.

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
- If the specs step of an earlier run is done, and `<dir>/specs/` holds no delta, the earlier run wrote no spec. Keep the `skip_specs: true` line, and write no spec.
- On a resumed run, ask the questions of step 2 again before you write a missing artifact, because the answers of the earlier session are not on disk.
- On a resumed run, do not ask again a question whose answer an artifact of the earlier run states. Step 2 closes that question.
- If a kept artifact looks incomplete, for example a template section that is still empty, name the section in the summary, and tell the user to complete it by hand.
