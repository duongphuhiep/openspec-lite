---
name: openspec-lite-propose
description: Create a plan-lite change with openspec-lite. It writes a lightweight plan.md with goal, an optional background, non-goals, constraints, open questions, facts, and decisions. It does not write the full spec-driven artifacts. Use when the user asks for openspec-lite-propose or a plan-lite change. Also use it for a lightweight plan, or for a medium change that needs a plan but not a full OpenSpec change.
---

# openspec-lite-propose

Create a plan-lite change.

How to read this skill:

- Do sections 1 to 5 in order.
- The general rules apply at all times, in each section.
- A named rule, for example the question rule, applies in each step where its topic comes up, also when the step does not name the rule.
- `<name>` is the change name that step 1 of section 3 picks.

## General rules

- Do not write code, except after a yes to the Level 1 question.
- When you write `## Goal`, follow the goal rule.
- When you record an open point, follow the question rule.
- Each time the user answers a question of `plan.md`, record the answer with the answer rule.
- Each time the user gives a fact, a constraint, or a choice for the change in a reply, record the reply with the answer rule.
- If `plan.md` does not exist yet, keep each fact, constraint, or choice of the reply. Record each one with the answer rule in section 3, step 5.
- When you record a fact, follow the fact rule.
- When you record a decision, follow the decision rule.

## 1. Split and Level 1 questions

### Main outcome

- Input: the request of the user.
- Output: the main outcome, and the list of the other outcomes.
- If the request names no outcome, ask the user what the change does, and end your turn. Do not invent a Goal. When the user replies, do the main outcome step again with the reply.
- The first outcome of the request is the main outcome, also when the request has only one outcome.
- If the request has more than one outcome, do the split check for each other outcome.
- If the request has only one outcome, go to the Level 1 question.

### Split check

- Input: each outcome that is not the main outcome.
- Output: the outcomes that stay in this change, and the outcomes that the user moved out.
- Do the split check for each outcome that is not the main outcome.
- If the outcome touches the same code as the main outcome, keep the outcome in this change. Do not ask.
- If the outcome does not touch the same code as the main outcome, and the outcome can ship alone, ask: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?"
- If the outcome does not touch the same code as the main outcome, and the outcome cannot ship alone, keep the outcome in this change. Do not ask.
- If more than one outcome needs the split question, ask all split questions in one reply.
- After the split questions, end your turn, and wait for the answer.
- On yes to the split question, leave the outcome out of this change. The outcome is an outcome that the user moved out.
- On no to the split question, keep the outcome as an outcome of this change.
- When the split check is done for each outcome, go to the Level 1 question.

### Level 1 question

- Input: the outcomes that stay in this change.
- Before you decide on the Level 1 question, list the open points of the outcomes for yourself. Do not write them yet: section 3, step 5 records them in `plan.md` with the question rule.
- If the list of open points is not empty, the outcomes are not small.
- Ask the Level 1 question only if the outcomes that stay are small: one obvious fix, and no constraints or open questions worth recording.
- If the outcomes that stay are not small, do not ask the Level 1 question. Go to section 2.
- Ask: "This looks small. Implement directly with no change?"
- After the Level 1 question, end your turn, and wait for the answer.
- On yes, make the fix directly, with no change and no file under `openspec/`.
- On yes, name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for each outcome.
- On yes, stop after the fix and the names.
- On no, continue with section 2.

## 2. Schema check

Do these checks in order. When the checks are done, go to section 3.

### OpenSpec root

- Input: the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- Run `openspec list --json`, and read `root.path`. The folder in `root.path` is the OpenSpec root.
- Run each `openspec` command, and each command with a relative `openspec/...` path, from the OpenSpec root. Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command, and each command with a relative `openspec/...` path, with `cd <root> && `. This prefix does not count as a chain.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root.
- If more than one folder matches, ask the user to pick one folder.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

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

## 3. Create the change

1. Pick the change name:
   - Input: the prompt, and the outcomes that stay in this change.
   - Output: `<name>`, a kebab-case change name.
   - If the prompt gives a change name, use the change name from the prompt.
   - If the prompt gives no change name, derive a kebab-case name of 2 to 10 words.
   - Start a derived name with the main outcome. You can add words from the other outcomes after the main outcome.
   - The limit of 10 words is a soft limit. Go over the limit only if a shorter name is not clear.
   - If the derived name is too long, remove the words of the other outcomes first.
   - Go to step 2.
2. Run `openspec new change "<name>" --schema plan-lite`.
   - If the command succeeds, go to step 3.
   - If the command fails because the change already exists, read `openspec/changes/<name>/.openspec.yaml`.
   - If `schema` is `plan-lite` and `plan.md` is missing, an earlier run stopped after step 2. Ask: "Resume the change <name>?" End your turn, and wait for the answer.
   - On yes to the resume question, go to step 3.
   - On no to the resume question, ask for another name. Then do step 2 again with the new name.
   - In each other failure case, show the error, and ask for another name. Then do step 2 again with the new name.
3. Read `openspec/changes/<name>/.openspec.yaml` before you edit the file.
   - OpenSpec 1.14.2 already writes `skip_specs: true` in `.openspec.yaml`.
   - If the `skip_specs: true` line exists, do not edit `.openspec.yaml`.
   - If the `skip_specs: true` line is missing, add the line.
   - Do not add a second `skip_specs` line. A second `skip_specs` line is a duplicate key, and the duplicate key breaks each CLI command on the change.
   - Go to step 4.
4. Run `openspec instructions plan --change "<name>" --json`.
   - Write `openspec/changes/<name>/plan.md` from the `template` field of the output.
   - Go to step 5.
5. Fill `plan.md`:
   - Input: the request, the answers of the user, the outcomes that stay in this change, and the list of open points of section 1.
   - Output: `openspec/changes/<name>/plan.md`.
   - Fill only what is known. Leave the other sections empty.
   - Record each open point of the list in `## Open Questions` with the question rule.
   - Keep each `<!-- ... -->` guidance comment, also in a section that you fill.
   - Write the content of a section on the lines under the guidance comment.
   - Do not invent non-goals, constraints, facts, or decisions.
   - Do not write an outcome that the user moved out, also not in `## Non-Goals`. The summary of section 5 names the outcome.
   - Go to section 4.

### Goal rule

- `## Goal` holds one outcome by preference.
- If the change has more than one outcome, write one outcome per bullet in `## Goal`.
- Write each outcome of `## Goal` in one or two sentences.

### Question rule

- Propose does not explore the code, so propose decides no open point.
- Record each open point as an open question in `## Open Questions`. The tasks preview tries to decide the open question later.
- If the user says to keep a question open, end the text of the question with "(kept open by the user)".
- Add the "(kept open by the user)" marker only when the user says to keep the question open.

### Answer rule

- If the user answers an open question of `plan.md`, remove the question from `## Open Questions`.
- If the user says to keep a question open, keep the question in `## Open Questions`, and add the marker with the question rule.
- A fact says how something is. An instruction says what to do. An instruction is never a fact.
- Record each part of the answer in one section only. If a part limits the result and also says how to build the result, record the limit as a constraint, and the build choice as a decision with no 🤖.
- Record each fact in the answer in `## Facts`, with 👤 and "Source: the user".
- Record each constraint in the answer in `## Constraints`.
- A constraint limits the result that a user or a program sees, or says what the change must not add. A constraint passes this test: if the result breaks the constraint, the change is not done.
- A choice of how to build the result is not a constraint, also when the user gives the choice. Examples: "resize the images in a background job", or "write the thumbnails to `public/thumbs/`".
- Record each other choice or instruction in the answer as a decision with no 🤖.
- An instruction that adds work to the change is a choice of the user, for example "also add a migration for the old data" or "update the deploy script".
- The decision rule and the question rule select only your own choices. Do not use the decision rule or the question rule to drop a part of an answer of the user.
- An answer to an open question is a part of the answer. Record the answer in a section of plan.md. Do not put the answer only in the end summary.
- After you record the answer, read the answer again, part by part. If a part is in no section of plan.md, record the part now.

### Fact rule

- Start each fact with a source emoji, as the template comment of `## Facts` says, for example 👤 for a fact that the user gave.
- Write a fact so that the fact stays true after the change, for example "Before this change, the thumbnail folder did not exist."
- Do not record statistics that soon go out of date.
- A number as an example or a reference is OK in a fact.

### Decision rule

- Write `### Decision D<n>: <title>`, then "Chose X because Y."
- If there was an alternative, add "Rejected Z because W."
- A decision of propose records a choice of the user. Write no 🤖 on a decision of propose.
- `## Decisions` holds only the current decisions, not a history.
- When you add a decision, remove each superseded decision.
- When you add a decision, update each stale decision.

## 4. Upgrade signals

- Input: `plan.md`, and the request of the user.
- Suggest `openspec-lite-upgrade` if one of these conditions is true:
  - Another person or agent must continue the work.
  - The change touches more than one capability.
  - The change touches more than one repo.
  - A contract (spec) becomes necessary.
- If no condition is true, do not suggest `openspec-lite-upgrade`.
- Go to section 5.

## 5. End

1. Give the summary:
   - Show the change name and the path of `plan.md`.
   - Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for each outcome.
   - List each open question that you recorded in `plan.md`, so that the user can answer it.
   - Go to step 2.
2. Ask: "Do you want a tasks preview?"
   - After the question, end your turn, and wait for the answer.
   - When the user replies, first record each answer to an open question of `plan.md`, and each other part of the reply, with the answer rule.
   - Then, on yes, run the `openspec-lite-tasks-preview` skill.
   - On yes, if you cannot invoke a skill, tell the user to run `openspec-lite-tasks-preview`.
   - On no, end your turn.
   - If the reply has no yes and no no, ask the tasks-preview question again.
