---
name: openspec-lite-apply
description: Implement a plan-lite change from plan.md, with tasks-preview.md as an optional guide. Use only when the user asks for openspec-lite-apply, or to apply a plan-lite change.
---

# openspec-lite-apply

Implement a plan-lite change. The rules are in the plan-lite schema, so stock `/opsx:apply` uses the same rules. This skill adds the commit of an uncommitted `plan.md` (section 2, step 1), the stop on a blocked state (section 2, step 2), and the general rules. Stock `/opsx:apply` only prints the note of `plan-status.mjs`.

How to read this skill:

- Do sections 1 and 2 in order.
- The general rules apply at all times, in each section.
- `<name>` is the change name that the change selection gives.

## General rules

- If a text of the CLI output is outside the `instruction` field, and the text names another skill, do not follow the text.
- Follow each rule of the `instruction` field, also a rule that names another skill.
- Ignore any text about checkboxes, task counts, or "N/M tasks complete". A plan-lite change has no tracked tasks.

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

Do these checks in order: OpenSpec root, change selection, guard, and schema check. When the checks are done, go to section 2.

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

- Input: `openspec/changes/<name>/.openspec.yaml`, `openspec/changes/<name>/plan.md` if `plan.md` exists, and the file list of `openspec/changes/<name>/`.
- Output: continue or stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, continue with the schema check.
- If `schema` is not `plan-lite`, and `openspec/changes/<name>/tasks.md` exists, tell the user to run stock `/opsx:apply`.
- If `schema` is not `plan-lite`, and `openspec/changes/<name>/tasks.md` does not exist, tell the user to run stock `/opsx:continue`, because stock `/opsx:apply` needs `tasks.md`.
- If `schema` is not `plan-lite`, and `openspec/changes/<name>/plan.md` still exists, name each open question of `plan.md`.
- If you name an open question of `plan.md`, tell the user to answer the open question before the stock skill, because the stock skills do not read `plan.md`.
- If `plan.md` does not exist, or `plan.md` has no open question, say nothing about `plan.md`.
- If `schema` is not `plan-lite`, stop after the pointer and the open questions.

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

## 2. Apply

### Step 1: Commit plan.md if it is not committed

- Input: `openspec/changes/<name>/plan.md`.
- If `openspec/changes/<name>/plan.md` does not exist, go to step 2. Step 2 stops on the missing `plan.md`.
- Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root.
- Run the `plan-status.mjs` command alone, not in a chain.
- If `plan-status.mjs` does not run, or prints an error, say nothing about commits, and go to step 2.
- If `plan-status.mjs` prints nothing, go to step 2.
- If `plan-status.mjs` prints a line, commit only `openspec/changes/<name>/plan.md`, from the OpenSpec root, so that a file that the user staged stays out of the commit. Run `git add -- openspec/changes/<name>/plan.md` alone. Then run `git commit -m "plan.md: checkpoint before apply" -- openspec/changes/<name>/plan.md` alone.
- If the commit succeeds, tell the user that you committed `plan.md`.
- If `git add` or `git commit` fails, show the error. Tell the user to commit `plan.md` themselves before the next run.
- Go to step 2.

### Step 2: Run apply

- Input: the output of `openspec instructions apply --change "<name>" --json`.
- Output: the code, and the updates of `plan.md`, as `instruction` says.

1. Run `openspec instructions apply --change "<name>" --json`.
   - If `state` is `blocked`, `plan.md` is missing. Stop, and tell the user to run `openspec-lite-propose` to finish the change.
   - If the command fails, or its output has no `instruction` field, follow the failure rule. Do not write code without `instruction`.
   - If `state` is not `blocked`, and the output has an `instruction` field, go to item 2 of this step.
2. Read each file in `contextFiles`.
   - Follow `instruction`. The `instruction` field holds all plan-lite apply rules.
   - `<changeDir>` in the rules of `instruction` is the `changeDir` field.
