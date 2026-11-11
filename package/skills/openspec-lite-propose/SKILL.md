---
name: openspec-lite-propose
description: Create a plan-lite change with openspec-lite. It writes a lightweight plan.md with goal, an optional background, non-goals, constraints, open questions, facts, and decisions. It does not write the full spec-driven artifacts. Use when the user asks for openspec-lite-propose or a plan-lite change. Also use it for a lightweight plan, or for a medium change that needs a plan but not a full OpenSpec change.
---

# openspec-lite-propose

Create a plan-lite change. Do not write code, except after a yes to the Level 1 question.

## 1. Split and Level 1 questions

### Main outcome

- The first outcome of the request is the main outcome, also when the request has only one outcome.
- If the request has more than one outcome, do the split check for each other outcome.

### Split check

For each outcome that is not the main outcome:

- If it touches the same code as the main outcome, keep it in this change. Do not ask.
- Otherwise, if it can ship alone, ask: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?"
  - On yes, leave it out of this change.
  - On no, keep it as an outcome of this change.

### Level 1 question

- Ask this question only if the outcomes that stay are small: one obvious fix, and no constraints or open questions worth recording.
- Ask: "This looks small. Implement directly with no change?"
- On yes:
  - Make the fix directly, with no change and no file under `openspec/`.
  - Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it.
  - Then stop.
- On no, continue with section 2.

## 2. Schema check

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
   - Use the change name from the prompt.
   - Otherwise, derive a kebab-case name of 2 to 10 words.
   - Start the name with the main outcome. You can add words from the other outcomes after it.
   - 10 words is a soft limit: go over it only if a shorter name is not clear.
   - If the name is too long, remove the words of the other outcomes first.
2. Run `openspec new change "<name>" --schema plan-lite`.
   - If it fails because the change already exists, read `openspec/changes/<name>/.openspec.yaml`.
   - If `schema` is `plan-lite` and `plan.md` is missing, an earlier run stopped here. Ask: "Resume the change <name>?" On yes, go to step 3.
   - In each other case, show the error, and ask for another name.
3. Read `openspec/changes/<name>/.openspec.yaml` before you edit it.
   - OpenSpec 1.14.2 already writes `skip_specs: true` there.
   - If the line exists, do not edit the file. If it is missing, add it.
   - A second `skip_specs` line is a duplicate key, and it breaks each CLI command on the change.
4. Run `openspec instructions plan --change "<name>" --json`. Write `openspec/changes/<name>/plan.md` from its `template` field.
5. Fill `plan.md`:
   - Fill only what is known. Leave the other sections empty.
   - Keep each `<!-- ... -->` guidance comment, also in a section that you fill. Write the content on the lines under the comment.
   - Do not invent non-goals, constraints, facts, or decisions.
   - Do not write an outcome that the user moved out, also not in `## Non-Goals`. The summary names it.
   - Follow the rules below for the goal, the open questions, the answers of the user, the facts, and the decisions.

### Goal rule

- `## Goal` holds one outcome by preference.
- If the change has more than one outcome, write one outcome per bullet, in one or two sentences each.

### Question rule

- Propose does not explore the code, so it decides no open point.
- Record each open point as an open question. The tasks preview tries to decide it later.
- If the user says to keep a question open, end its text with "(kept open by the user)". Add the marker only when the user says to keep the question open, for example "keep it open" or "leave it open". An answer such as "I do not know yet" leaves the question open with no marker.

### Answer rule

When the user answers a question:

- Remove the question.
- Record each fact in the answer in `## Facts`, with 👤 and "Source: the user".
- Record each rule in the answer that the change must follow as a constraint. Test: if the result breaks it, the change is not done.
- Record each other choice or instruction in the answer as a decision with no 🤖.

### Fact rule

- Start each fact with a source emoji, as the template comment of `## Facts` says, for example 👤 for a fact that the user gave.
- Write a fact so that it stays true after the change, for example "Before this change, the report page did not exist."
- Do not record statistics that soon go out of date. A number as an example or a reference is OK.

### Decision rule

- Write `### Decision D<n>: <title>`, then "Chose X because Y."
- Add "Rejected Z because W." when there was an alternative.
- A decision of propose records a choice of the user: write no 🤖.
- `## Decisions` holds only the current decisions, not a history. When you add a decision, check the others:
  - Remove each superseded decision.
  - Update each stale decision.
  - Then remove each fact that justifies no current decision or constraint, except a non-obvious fact.

## 4. Upgrade signals

Suggest `openspec-lite-upgrade` if one of these is true:

- Another person or agent must continue the work.
- The change touches more than one capability.
- The change touches more than one repo.
- A contract (spec) becomes necessary.

## 5. End

1. Give the summary:
   - Show the change name and the path of `plan.md`.
   - Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it.
2. Ask: "Do you want a tasks preview?"
   - On yes, run the `openspec-lite-tasks-preview` skill.
   - If you cannot invoke a skill, tell the user to run it.
