---
name: openspec-lite-upgrade
description: Upgrade a plan-lite change to a full spec-driven OpenSpec change, at any time, for example when its scope grows. It writes proposal.md, specs, design.md, and tasks.md from plan.md and tasks-preview.md. Use only when the user asks for openspec-lite-upgrade, or to upgrade a plan-lite change.
---

# openspec-lite-upgrade

Upgrade a plan-lite change to spec-driven. The schema switch comes after step 2 writes the four artifacts, so an interrupted run can run again and resume.

## How to read this skill

- Do section 1, then section 2.
- In section 1, do the checks in this order: OpenSpec root, Change selection, Guard, Schema check.
- In section 2, do steps 1 to 5 in order. Each step names its next step.
- Step 2 has the sub-steps 2.1 to 2.5. Step 5 has the sub-steps 5.1 to 5.4. For example, "step 2.4" is the sub-step 4 of step 2.
- Section 3 gives the content of the summary. Step 5.3 writes the summary.
- Section 4 holds the named rules of this skill, for example the requirement-source rule.
- The general rules apply at all times, in each step.
- A named rule applies in each step where its topic comes up, also when the step does not name the rule.
- The question rule, the decision rule, and the answer rule are rules of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`. Read these three rules in that file.
- `<name>` is the name of the change. The change selection check gives `<name>`.
- `<dir>` is `openspec/changes/<name>`.

## General rules

- When you write `proposal.md`, `specs/`, `design.md`, or `tasks.md`, follow the ID rule.
- When you write `proposal.md`, `specs/`, or `design.md`, mark each inferred item with the inferred-item rule.
- Do not mark an item of `tasks.md` with 🤖.
- When you run `openspec instructions`, follow the instructions rule.
- If an artifact already exists from an earlier run, follow the resume rule.
- In step 2, edit `plan.md` only to add the "(kept open by the user)" marker, when the user keeps a question open.
- A closed question stays in `plan.md` until the prune of step 5.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Input: the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- Run `openspec list --json`, and read `root.path`. The folder in `root.path` is the OpenSpec root.
- Run each command from the OpenSpec root. Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command with `cd <root> && `.
- After the user confirms a root, also start the first command with `cd <root> && `.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root.
- If more than one folder matches, ask the user to pick one folder.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Input: the prompt, and the `changes` list of `openspec list --json`.
- Output: the name of the change, written `<name>` in this skill.
- If the prompt names a change, use that change.
- If the prompt names no change, read the `changes` list from the same `openspec list --json` output.
- The `changes` list does not give the schema, so read `schema` from the `.openspec.yaml` of each change.
- If only one active change exists, use that change.
- If more than one active change exists, ask the user to pick one change.
- If no active change exists, stop. Tell the user that no active change exists.

### Guard

- Input: the `schema` line of `openspec/changes/<name>/.openspec.yaml`, and the file `openspec/changes/<name>/plan.md`.
- Output: the next check or step, or a stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, go to the schema check.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` does not exist, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` has any other value, stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
- If `schema` is `spec-driven`, and `openspec/changes/<name>/plan.md` still exists, ask the resume question. An earlier run may have stopped after step 3. A finished upgrade can also keep `plan.md`.
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
- Do step 2 before you write an artifact. Steps 2.1 to 2.4 then write the four artifacts.

Plan the requirements:

- Plan each requirement with the requirement-source rule.

Close the open questions of `plan.md`:

- Read each question in `## Open Questions` of `plan.md`.
- A question that ends with "(kept open by the user)" is a kept question.
- Keep each kept question, also if you can decide the kept question. Do not ask a kept question again.
- For each question that is not a kept question, try to decide the question or find its answer. Use the question rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`.
- A question is open only while you cannot decide the question and cannot find its answer.
- If you find an answer that is a non-obvious fact, plan the answer as a fact in `design.md` → `## Context`.
- If you find an answer that is obvious, give the answer only in the summary.
- If you decide a point, and the point changes a visible result or was a close call, plan a decision with 🤖 in `design.md`. The decision rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` gives these two criteria.
- If you decide a point, and the point matches neither criterion of the decision rule, give the answer only in the summary.
- If a decided point is a contract, ask its requirement in the question turn, as for a decision with 🤖 in `plan.md`.
- Do not ask a question that you closed.

Ask the question turn:

- Make the question list from these items:
  - each open question in `plan.md` that is still open and that changes the specs, the approach, or the tasks, as the `design` instruction says;
  - each requirement that you plan to write from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`;
  - if you plan no requirement at all, the question if the change has a requirement.
- If the question list is empty, do not ask. Go to step 2.1.
- If each of the four artifacts already exists, do not ask. Go to step 2.1.
- If the question list is not empty, ask all items of the question list in one reply, before you write any artifact.
- For each open question in the reply, give your recommended answer.
- If the answer to an open question is a fact that only the user knows, give no recommendation for that question.
- For each planned requirement in the reply, show its text, and ask if you can write it.
- For the question if the change has a requirement, say that "None" is a valid answer. If the user answers "None", upgrade writes no spec (step 2.2).
- In the same reply, give the answer of each question that you closed.
- End the turn, and wait for the answer.

Read the answer of the user:

- Split each answer of the user with the split rule.
- If the user says yes to a planned requirement, the user is the source of that requirement.
- If the user says no to a planned requirement, do not write that requirement.
- If the user cannot answer an open question now, keep the question in `plan.md`, with no marker.
- An answer such as "I do not know yet" leaves the question open with no marker.
- If the user says to keep a question open, add the "(kept open by the user)" marker to the question in `plan.md`.
- Examples of such a reply: "keep it open" or "leave it open".
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
- If no requirement is left after step 2, write no spec, and keep `skip_specs: true` in `<dir>/.openspec.yaml`. Without a delta and without the flag, `validate` fails. Go to step 2.3.
- If you write at least one delta, first remove the `skip_specs: true` line from `<dir>/.openspec.yaml`. While the line is set, the CLI forbids spec files.
- After you remove the `skip_specs: true` line, run `openspec instructions specs`, in the full form of the instructions rule.
- Write one delta per capability, for the requirements of step 2.
- To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new capability only when none matches.
- For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without a `## Purpose` section, the CLI writes "TBD" as the Purpose of the new main spec.
- Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
- Give each ADDED or MODIFIED requirement at least one `#### Scenario:` with **WHEN** and **THEN** lines.
- For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit the copy.
- Write only the requirements of step 2.
- After a yes in step 2, the user is the source of a requirement, so the requirement gets no 🤖 mark.
- Go to step 2.3.

### Step 2.3: Write `design.md`

- Input: `plan.md`, the planned facts and decisions of step 2, and the answers of the user.
- Output: `<dir>/design.md`.
- If `<dir>/design.md` already exists, follow the resume rule, and go to step 2.4.
- Run the instructions command for `design` with the instructions rule.
- Non-Goals go to `## Goals / Non-Goals`.
- Each `### Decision` entry of `plan.md` goes to `## Decisions`.
- A decision with 🤖 in `plan.md` keeps its 🤖 in `design.md`, because the user did not confirm it yet.
- Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
- Facts go to `## Context`.
- An open question that is safe to answer later goes to `## Open Questions`, as the `design` instruction says.
- A kept question that is safe to answer later goes to `## Open Questions`, like each other such question. The kept question also stays in `plan.md`.
- An open question that changes the specs, the approach, or the tasks has no slot. Do not put that question, or a note that points to it, in `design.md`.
- If the user answered a question that changes the specs, the approach, or the tasks, split the answer with the split rule.
- If the user has no answer to a question that changes the specs, the approach, or the tasks, keep the question in `plan.md`. Also put the question as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
- If a kept question changes the specs, the approach, or the tasks, keep the question in `plan.md`. Also put the question as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
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
  - Then delete `tasks-preview.md`.
- If no preview exists, write `tasks.md` from the template.
- In both cases, put these questions before the first group, as `## 0. Open questions`:
  - each open question that step 2 asked and that the user could not answer;
  - each question with the "(kept open by the user)" marker that changes the specs, the approach, or the tasks.
- Give each question of `## 0. Open questions` one task: `- [ ] 0.1 Answer: <question> The answer can change the specs.`
- Go to step 2.5.

### Step 2.5: Check the pointers

- Input: `<dir>/proposal.md`, `<dir>/design.md`, and `## 0. Open questions` of `<dir>/tasks.md`.
- Output: `proposal.md` and `design.md` with no pointer to a question of `## 0`.
- Read `proposal.md` and `design.md` again.
- Remove each sentence that restates a question of `## 0. Open questions`, or points to it, for example "See the open questions in tasks.md" or "See task 0.2".
- Also remove such a sentence for a question that the tasks preview added.
- In the artifacts, the task in `## 0. Open questions` is the only place of each question of `## 0`. The question also stays in `plan.md`.
- Go to step 3.

### Step 3: Switch the schema

- Input: `<dir>/.openspec.yaml`.
- Change `schema: plan-lite` to `schema: spec-driven` in `<dir>/.openspec.yaml`.
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
- List each `plan.md` section with its destination: the artifact and the heading that now hold its content, or "kept".
- A question that step 2 closed has the destination "closed", with its answer. A yes to the prune question deletes the closed question.
- If the items of one section go to different destinations, list each item.
- Keep a section that has no slot, for example an open question that the user cannot answer now (step 2.3).
- Go to step 5.2.

### Step 5.2: Find the content in no artifact

- If a section has content that is in no artifact, list the content as "kept, in no artifact".
- A yes to the prune question does not delete content that is "kept, in no artifact".
- In the summary, name each content that is "kept, in no artifact". Say that the user can ask you to add it to an artifact.
- Go to step 5.3.

### Step 5.3: Ask the prune question

- Write one reply in this order: the result of step 4, the summary of section 3, the list from step 5.1, and last the prune question.
- The prune question is: "Delete the moved sections from `plan.md`?"
- If `validate` failed, recommend to keep `plan.md` until the errors are fixed.
- The summary must not say that `plan.md` is deleted or kept, because the user did not answer yet.
- The prune question is the last line of the reply.
- End your turn, and wait for the answer. Then go to step 5.4.

### Step 5.4: Act on the answer

- If the user answers no, keep `plan.md` as it is. Say in one line that its moved sections are old copies, and that the artifacts are the source of truth.
- If the user answers yes, delete each section or item whose content moved. Keep each kept item.
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
- A decision of `plan.md` that is not a contract goes only to `design.md` → `## Decisions`.
- A fact is not a source of a requirement. A fact goes to `design.md` → `## Context`, with its source emoji.
- The Goal and `tasks-preview.md` alone are not sources.
- If you plan a requirement from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`, ask the user in the question turn of step 2.

### Split rule

- Split the answer of the user, as the answer rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` says.
- Write each part of the answer to an artifact, not to `plan.md`.
- A fact of the answer goes to `## Context` of `design.md`, with 👤 and "Source: the user".
- A rule of the answer is a rule that the change must follow. Test: if the result breaks the rule, the change is not done.
- A rule of the answer is a requirement source, like a constraint of `plan.md`. Write its requirement with no new question, because the answer of the user is the source of the requirement.
- A choice of the answer goes to the specs only when the choice is a contract.
- A choice of the answer that is not a contract goes to `## Decisions` of `design.md`.

### Inferred-item rule

- In `proposal.md`, `specs/`, and `design.md`, put 🤖 at the end of the line or the heading of each inferred item.
- An item is inferred only if the item holds a new claim.
- A new claim is a case, a value, a behavior, a risk, a dependency, a choice, or a reason.
- A claim is new only when no section of `plan.md` and no answer of the user in this upgrade states the claim.
- `tasks-preview.md` is not a source: a claim that only the preview states is new.
- An item can be a `#### Scenario:`, a `### Decision`, or a list item.
- A requirement is never inferred, because step 2 gives each requirement a source.
- A fact with a source, for example a run, a doc, or an analysis of the code, is not inferred. The fact gets no 🤖, and the fact keeps its source emoji.
- Before you mark an item, check each sentence of the item, not only its main source.
- If one sentence holds a new claim, mark the item, and name that claim in a few words.
- If no sentence holds a new claim, do not mark the item.
- One exception: a `### Decision` from a decision with 🤖 in `plan.md` keeps its 🤖, because the user did not confirm it yet.
- These are not new claims:
  - other words for a `plan.md` item or an answer;
  - another form of a `plan.md` item, for example a `#### Scenario:` that only restates its requirement;
  - another artifact or section for a `plan.md` item;
  - the code, file, or module that a `plan.md` item clearly touches.
- Example: the scenario "Table is empty" gets 🤖, because `plan.md` does not say what the export does for an empty table.
- Example: the Why line "no trace of who changed what" gets 🤖, because `plan.md` does not say that an entry records the user.
- Example: the scenario "Columns follow the on-screen order" gets no 🤖, because it restates the column-order constraint.
- Put one mark per item.
- Do not mark `tasks.md`.

### ID rule

- Do not write the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) in an artifact.
- To refer to a `plan.md` item in an artifact, use its title, or a short form of its text, with the change name.

### Instructions rule

- Write the four artifacts in this order: `proposal`, `specs`, `design`, `tasks`.
- For each artifact, run `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`.
- Run the `openspec instructions` command as one plain command. Do not put it in a loop or a chain, and do not pipe it to another command.
- Read the full JSON output.
- Do not write the artifact without its `template` and `instruction`.
- Use the `template` of the JSON output, and follow its `instruction`.

### Resume rule

- If an artifact already exists from an earlier run, keep the artifact, and go to the next artifact.
- On a resumed run, ask the questions of step 2 again before you write a missing artifact, because the answers of the earlier session are not on disk.
- If a kept artifact looks incomplete, for example a template section that is still empty, tell the user, and offer to complete it.
