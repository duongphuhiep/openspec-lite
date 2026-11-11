---
name: openspec-lite-upgrade
description: Upgrade a plan-lite change to a full spec-driven OpenSpec change, at any time, for example when its scope grows. It writes proposal.md, specs, design.md, and tasks.md from plan.md and tasks-preview.md. Use only when the user asks for openspec-lite-upgrade, or to upgrade a plan-lite change.
---

# openspec-lite-upgrade

Upgrade a plan-lite change to spec-driven. The schema switch comes after step 2 writes the four artifacts, so an interrupted run can run again and resume.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Run `openspec list --json`, and read `root.path`. This folder is the OpenSpec root.
- Run each command from the OpenSpec root, and read each `openspec/...` path from it.
- If the OpenSpec root is not the current folder, start each `openspec` command with `cd <root> && `. This also applies to the first command after the user confirms a root.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
  - If one folder matches, ask the user to confirm it as the root.
  - If more than one folder matches, ask the user to pick one.
  - Only if no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Use the change named in the prompt.
- If no name is given, use the `changes` list from the same `openspec list --json`. The list does not give the schema, so read `schema` from the `.openspec.yaml` of each change.
- If only one active change exists, use it. Otherwise, ask.

### Guard

Read `schema` from `openspec/changes/<name>/.openspec.yaml`. There are three cases:

- `plan-lite`: continue.
- `spec-driven`, and `plan.md` still exists: an earlier run may have stopped after step 3. A finished upgrade can also keep `plan.md`.
  - Ask the user: "The upgrade of <name> wrote the artifacts, and `plan.md` still exists. Finish the upgrade now: validate the artifacts, then decide what to delete from `plan.md`?"
  - End your turn, and wait for the answer. Do not run `validate` before the answer.
  - On no, name each open question that stays in `plan.md`, and stop.
  - On yes, do the schema check, then go to step 4 of the upgrade.
- Any other case, including `spec-driven` with no `plan.md`: stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare it with the shipped version:

   Shipped schema version: 6

   - If the file is missing, its version is lower, or it has no readable `version` line:
     - Run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
     - If the user declines the copy, stop.
     - After the copy, read the version again. If it still differs from the shipped version, stop, and report both versions.
     - Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes.
     - In your end summary, copy the report of `openspec-lite-schema`: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
   - If its version is higher, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - It compares `openspec --version` with the range in `schema.yaml`, and prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run it alone, not in a chain.
   - Read the first word of the line, not the exit code. Do not compare the versions yourself.
   - On `fail:`, show the line, and stop.
   - On `warn:`, show the line as a warning, and continue.
   - In both cases, point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Upgrade

`<dir>` is `openspec/changes/<name>`.

1. Keep the `skip_specs: true` line of `<dir>/.openspec.yaml` for now.
   - Step 2.2 removes it just before the first spec write.
   - So a run that stops before the specs leaves a change that still passes `validate`.
2. Before you write an artifact, plan the requirements, close the open questions, and ask the user. Then write the four artifacts.

   **Requirement sources.** A requirement can come only from these sources:
   - a constraint of `plan.md`. A fact is not a source of a requirement, so it goes to `design.md` → `## Context`, with its source emoji.
   - a decision of `plan.md` that is also a contract: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. A decision that is not a contract goes only to `design.md` → `## Decisions`.
   - an answer of the user.

   The Goal and `tasks-preview.md` alone are not sources.

   **Open questions.** Before you ask, look at each open question of `plan.md`:
   - Keep a question that ends with "(kept open by the user)", also if you can decide it. Do not ask it again.
   - For each other question, try to decide it or find its answer, with the question rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml`. A question is open only while you cannot decide it and cannot find its answer.
   - Plan a found answer that is a non-obvious fact as a fact in `design.md` → `## Context`.
   - Give an obvious answer only in the summary.
   - Plan a decided point as a decision with 🤖 in `design.md` only when it changes a visible result or was a close call, as the decision rule of `apply.instruction` in `openspec/schemas/plan-lite/schema.yaml` says. Otherwise, give the answer only in the summary. If the decided point is a contract, ask its requirement in the question turn below, as for a decision with 🤖 in `plan.md`.
   - Do not ask a question that you closed.

   **Question turn.** Ask the user, in one reply, before you write any artifact:
   - each open question in `plan.md` that is still open and that changes the specs, the approach, or the tasks, as the `design` instruction says. Give your recommended answer, except when the answer is a fact that only the user knows.
   - each requirement that you plan to write from the Goal, from `tasks-preview.md`, or from a decision with 🤖 in `plan.md`. Show its text, and ask if you can write it.
   - if you plan no requirement at all, ask the user if the change has a requirement. "None" is a valid answer: then upgrade writes no spec (step 2.2).

   In the same reply, give the answer of each question that you closed. End the turn, and wait for the answer.
   - If all three lists are empty, do not ask.
   - If the user cannot answer an open question now, keep the question in `plan.md`, with no marker. Add the "(kept open by the user)" marker only when the user says to keep the question open, for example "keep it open" or "leave it open". An answer such as "I do not know yet" leaves the question open with no marker.

   **IDs.** Do not write the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) in an artifact. To refer to an item, use its title, or a short form of its text, with the change name.

   **Inferred items.** In `proposal.md`, `specs/`, and `design.md`, put 🤖 at the end of the line or the heading of each inferred item.
   - An item is inferred only if it holds a new claim: a case, a value, a behavior, a risk, a dependency, a choice, or a reason that no section of `plan.md` and no answer of the user in this upgrade states.
   - `tasks-preview.md` is not a source: a claim that only the preview states is new.
   - An item can be a `#### Scenario:`, a `### Decision`, or a list item.
   - A requirement is never inferred, because step 2 gives each requirement a source.
   - A fact with a source, for example a run, a doc, or an analysis of the code, is not inferred. It gets no 🤖, and it keeps its source emoji.
   - Before you mark an item, check each sentence of it, not only its main source. If one sentence holds a new claim, mark the item, and name that claim in a few words. If no sentence holds one, do not mark the item.
   - One exception: a `### Decision` from a decision with 🤖 in `plan.md` keeps its 🤖, because the user did not confirm it yet.
   - These are not new claims:
     - other words for a `plan.md` item or an answer;
     - another form of it, for example a `#### Scenario:` that only restates its requirement;
     - another artifact or section for it;
     - the code, file, or module that a `plan.md` item clearly touches.
   - Examples: the scenario "Table is empty" gets 🤖, because `plan.md` does not say what the export does for an empty table. The Why line "no trace of who changed what" gets 🤖, because `plan.md` does not say that an entry records the user. The scenario "Columns follow the on-screen order" gets no 🤖, because it restates the column-order constraint.
   - One mark per item. Do not mark `tasks.md`.

   **Write the artifacts.** Write the four artifacts in this order: `proposal`, `specs`, `design`, `tasks`.
   - For each one, run `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`.
   - Run it as one plain command. Do not put it in a loop or a chain, and do not pipe it to another command.
   - Read the full JSON output. Do not write the artifact without its `template` and `instruction`. Use its `template`, and follow its `instruction`.
   - If an artifact already exists from an earlier run, keep it, and go to the next one.
   - On such a resumed run, ask the questions of step 2 again before you write a missing artifact, because the answers of the earlier session are not on disk.
   - If a kept artifact looks incomplete, for example a template section that is still empty, tell the user, and offer to complete it.

   1. `proposal.md`: from the Goal and the scope in `plan.md`.
      - If the Goal has more than one outcome, give each outcome its own item in What Changes.
      - If `## Background` exists, use its scope items and source links for the proposal context.
   2. `specs/<capability>/spec.md`: one delta per capability, for the requirements of step 2.
      - If you write at least one delta, first remove the `skip_specs: true` line from `<dir>/.openspec.yaml`, then run `openspec instructions specs`. While the line is set, the CLI forbids spec files.
      - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches.
      - For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without it, the CLI writes "TBD" as the Purpose of the new main spec.
      - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
      - Give each ADDED or MODIFIED requirement at least one `#### Scenario:` with **WHEN** and **THEN** lines.
      - For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit it.
      - Write only the requirements of step 2. After a yes in step 2, the user is the source of a requirement, so it gets no 🤖 mark.
      - If no requirement is left after step 2, write no spec, and keep `skip_specs: true` in `<dir>/.openspec.yaml`. Without a delta and without the flag, `validate` fails.
   3. `design.md`:
      - Non-Goals go to `## Goals / Non-Goals`.
      - Each `### Decision` entry of `plan.md` goes to `## Decisions`. A decision with 🤖 in `plan.md` keeps its 🤖, because the user did not confirm it yet.
      - Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
      - Facts go to `## Context`.
      - An open question that is safe to answer later goes to `## Open Questions`, as the `design` instruction says.
      - An open question that changes the specs, the approach, or the tasks has no slot. Do not put it, or a note that points to it, in `design.md`.
      - Split the answer of such a question, as the answer rule of `apply.instruction` says, but write each part to an artifact, not to `plan.md`. In step 2, edit `plan.md` only to add the "(kept open by the user)" marker when the user keeps a question open. A closed question stays in `plan.md` until the prune of step 5:
        - A fact goes to `## Context`, with 👤 and "Source: the user".
        - A rule that the change must follow (test: if the result breaks it, the change is not done) is a requirement source, like a constraint of `plan.md`. Plan its requirement, and ask it in the question turn.
        - A choice goes to the specs only when it is a contract. Otherwise, it goes to `## Decisions`.
      - If the user has no answer to such a question, or it ends with "(kept open by the user)", keep the question in `plan.md`, and also put it as the first task of `tasks.md` (step 2.4), because the stock skills do not read `plan.md`.
      - A question with the "(kept open by the user)" marker that is safe to answer later goes to `## Open Questions`, like each other such question. It also stays in `plan.md`.
   4. `tasks.md`:
      - If `<dir>/tasks-preview.md` exists, use it as the seed:
        - Remove its two header comment lines.
        - Replace each `plan.md` ID in it with the item title, or a short form of its text.
        - Add `[ ]` to each task line, for example `- [ ] 1.1 <task>`.
        - If an answer from step 2 changes the tasks, edit the seed to match it, and say so in the summary.
        - Then delete `tasks-preview.md`.
      - If no preview exists, write `tasks.md` from the template.
      - In both cases, put these questions before the first group, as `## 0. Open questions`, with one task each: `- [ ] 0.1 Answer: <question> The answer can change the specs.`
        - each open question that step 2 asked and that the user could not answer;
        - each question with the "(kept open by the user)" marker that changes the specs, the approach, or the tasks.
      - If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here. Keep `tasks.md`, and delete `tasks-preview.md`.
   5. Check the pointers: read `proposal.md` and `design.md` again.
      - Remove each sentence that restates a question of `## 0. Open questions`, or points to it, for example "See the open questions in tasks.md" or "See task 0.2".
      - Do this also for a question that the tasks preview added.
      - In the artifacts, the task in `## 0. Open questions` is the only place of each question of `## 0`. The question also stays in `plan.md`.
3. Change `schema: plan-lite` to `schema: spec-driven` in `<dir>/.openspec.yaml`.
4. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.
5. Prune `plan.md`:
   1. List each `plan.md` section with its destination: the artifact and the heading that now hold its content, or "kept".
      - A question that step 2 closed has the destination "closed", with its answer. A yes to the prune question deletes it.
      - If the items of one section go to different destinations, list each item.
      - Keep a section that has no slot, for example an open question that the user cannot answer now (step 2.3).
   2. If a section has content that is in no artifact, list it as "kept, in no artifact".
      - A yes to the prune question does not delete it.
      - In the summary, name it, and say that the user can ask you to add it to an artifact.
   3. Write one reply in this order: the result of step 4, the summary of section 3, the list from step 5.1, and last the question "Delete the moved sections from `plan.md`?".
      - If `validate` failed, recommend to keep `plan.md` until the errors are fixed.
      - The summary must not say that `plan.md` is deleted or kept, because the user did not answer yet.
      - The question is the last line of the reply. End your turn, and wait for the answer.
   4. Act on the answer:
      - On no, keep `plan.md` as it is. Say in one line that its moved sections are old copies, and that the artifacts are the source of truth.
      - On yes, delete each section or item whose content moved. Keep each kept item.
        - Keep the ID comment at the top of `plan.md` while a section is left.
        - If no section is left, delete `plan.md`. A section with only an HTML comment counts as no section.
        - Then say in one line what you deleted and what you kept.
        - If a section is kept, tell the user to resolve it before `/opsx:apply`, because the stock skills do not read `plan.md`.
      - Do not write the summary again.

## 3. End

Write the summary in the reply of step 5.3, before the question. In the summary:

- List the files that you wrote, and `tasks-preview.md` if you deleted it. Do not name `plan.md` in this list, as deleted or as kept: step 5.4 says what happens to it after the answer.
- Ask the user to review all artifacts.
- If an artifact has 🤖 items, list each one with its new claim, or as an agent decision of `plan.md`. Ask the user to review each one: remove the mark to accept the item, or delete the item.
- Ask for an extra review of `tasks.md`, because it is a contract, not a reference.
- Say the `skip_specs` state at the end: absent, because the change has spec deltas, or set, because it has none.
- Say that from now on the change uses the stock skills: `/opsx:apply` and `/opsx:archive`.
- Name each `plan.md` item that has no slot and stays in `plan.md`, for example an open question that the user cannot answer now. The stock skills do not read `plan.md`.
- If `design.md` has `### Decision` entries, warn: stock `/opsx:archive` does not turn them into ADRs. To keep them as ADRs, copy them to `openspec/adr/` before the archive. `openspec-lite-archive` can do this copy: run it before `/opsx:archive`.
