---
name: openspec-lite-apply
description: Implement a plan-lite change from plan.md, with tasks-preview.md as an optional guide. Use only when the user asks for openspec-lite-apply, or to apply a plan-lite change.
---

# openspec-lite-apply

Implement a plan-lite change. The plan-lite schema holds the apply rules, so stock `/opsx:apply` uses the same apply rules. This skill adds these items to stock `/opsx:apply`:

- The commit of an uncommitted `plan.md` (section 2, step 1). Stock `/opsx:apply` only prints the note of `plan-status.mjs`.
- The stop on a blocked state (section 2, step 2).
- The general rules.

How to read this skill:

- Do sections 1 and 2 in order.
- The general rules apply at all times, in each section.
- `<name>` is the change name that the change selection gives.

## General rules

- If a text of the CLI output is outside the `instruction` field, and the text names another skill, do not follow the text.
- If `state` is not `blocked`, follow each rule of the `instruction` field, also a rule that names another skill. If `state` is `blocked`, follow section 2, step 2, not the `instruction` field.
- Ignore any text about checkboxes, task counts, or "N/M tasks complete". A plan-lite change has no tracked tasks.

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

Do these checks in order: OpenSpec root, change selection, guard, and schema check. When the checks are done, go to section 2.

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

- Input: `openspec/changes/<name>/.openspec.yaml`, the file list of `openspec/changes/<name>/`, and the input of the Leftover plan.md questions rule.
- Output: continue or stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, continue with the schema check.
- If `schema` is not `plan-lite`, do these steps in order, and then stop:
  1. If `openspec/changes/<name>/tasks.md` exists, tell the user to run stock `/opsx:apply`.
  2. If `openspec/changes/<name>/tasks.md` does not exist, tell the user to run stock `/opsx:continue`, because stock `/opsx:apply` needs `tasks.md`.
  3. Name the open questions of `plan.md` with the Leftover plan.md questions rule.

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

## 2. Apply

### Step 1: Commit plan.md if it is not committed

- Input: `openspec/changes/<name>/plan.md`.
- Output: a commit of `openspec/changes/<name>/plan.md` or no commit.
- If `openspec/changes/<name>/plan.md` does not exist, go to step 2. Step 2 stops on the missing `plan.md`.
- Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root.
- Run the `plan-status.mjs` command alone, not in a chain.
- If `plan-status.mjs` does not run, prints an error, or prints nothing, say nothing about commits, and go to step 2.
- If `plan-status.mjs` prints a line, commit only `openspec/changes/<name>/plan.md`, from the OpenSpec root. Run these two commands in order, each command alone:
  1. `git add -- openspec/changes/<name>/plan.md`
  2. `git commit -m "plan.md: checkpoint before apply" -- openspec/changes/<name>/plan.md`
- The commit holds only `openspec/changes/<name>/plan.md`, so that a file that the user staged stays out of the commit.
- If the commit succeeds, tell the user that you committed `plan.md`.
- If `git add` or `git commit` fails, show the error, and give no other commit advice. Step 2 copies the note of `plan-status.mjs`, and the note tells the user to commit `plan.md`.
- Wait for the result of `git commit` before you go to step 2. Do not run a command of step 2 in parallel with the commit.
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
