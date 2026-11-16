---
name: openspec-lite-schema
description: Install or update the plan-lite OpenSpec schema of openspec-lite in openspec/schemas/plan-lite/ of the repo. Use only when the user asks for openspec-lite-schema, or when another openspec-lite skill asks you to run it.
---

# openspec-lite-schema

Install or replace `openspec/schemas/plan-lite/` in the OpenSpec root.

How to read this skill:

- Do sections 1 to 5 in order, unless a step says to skip a section.
- The general rules apply at all times, in each section.
- `<root>` is the OpenSpec root.
- `<skillDir>` is the folder of this `SKILL.md`.

## General rules

- Do not read the schema content into the conversation.
- Do not use `git diff` or `git status` to report changes. The repo may not use git.

### Newer schema rule

- Follow the newer schema rule only when a step of this skill sends you to it.
- Stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."

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

## 1. Find the folders

- Output: `<root>` and `<skillDir>`.

1. Find `<root>` with the OpenSpec root block.
2. Find `<skillDir>` with the Skill folder block.
3. Go to section 2.

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

### Skill folder

- Output: `<skillDir>`, the folder of this `SKILL.md`. `<skillDir>` holds `scripts/install.mjs` and `assets/plan-lite/`.

1. If the harness gives a base directory for this skill, use the base directory as `<skillDir>`.
2. If the harness gives no base directory, search for the folder `openspec-lite-schema/` that holds `assets/plan-lite/`. Search the paths in this order, and use the first match as `<skillDir>`:
   1. Project folders: start in `<root>`, then go to each parent folder of `<root>`. In each folder, check `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, and then `apm_modules/` (at any depth).
   2. User folders, only after all project folders: `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
3. If no path has the folder, stop and tell the user.

## 2. Compare the versions

- Input: the `version` line of `<skillDir>/assets/plan-lite/schema.yaml` (shipped), and the `version` line of `openspec/schemas/plan-lite/schema.yaml` (repo).
- Output: the next section to do, or stop.
- The repo copy is the folder `openspec/schemas/plan-lite/`. The repo copy exists when the folder exists, also when the folder has no `schema.yaml`.
- Read only the `version` line of each `schema.yaml`. The `version` line is not schema content for the general rules.
- If the shipped `schema.yaml` is missing, or has no readable `version` line, the shipped assets are damaged. Stop, and tell the user to reinstall openspec-lite.
- If no repo copy exists, go to section 3.
- If the repo version is higher than the shipped version, follow the Newer schema rule.
- If the repo version equals the shipped version, tell the user how to repair a damaged schema: delete `openspec/schemas/plan-lite/`, and run this skill again. Skip section 3, and go to section 4.
- If the repo copy exists, and the repo version is lower or the repo copy has no readable version, ask the user the replace question: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`. Proceed?"
- If the repo copy has no readable version, write `unknown` in place of `v<old>` in the replace question.
- After you ask the replace question, end your turn, and wait for the answer.
- Do not run the install script before the user says yes to the replace question.
- On yes to the replace question, go to section 3.
- On no to the replace question, stop.

## 3. Install

- Input: the output of `install.mjs`.
- Output: the `status:`, `backup:`, and `copied:` lines for section 5.

Run:

```sh
node "<skillDir>/scripts/install.mjs" "<root>"
```

The first output line is the status:

- If the status is `status: installed` or `status: replaced`, the install succeeded. The next lines are `backup: <path>` (only on replace) and `copied: <path>`. Go to section 4.
- If the status is `status: current`, there is nothing to do. Go to section 4.
- If the status is `status: newer`, follow the Newer schema rule.
- If the output has no `status:` line, and an `install:` line says that the shipped `schema.yaml` is missing, the shipped assets are damaged. Stop, and tell the user to reinstall openspec-lite.
- If the output has no `status:` line and no `install:` line, the script did not run. Follow the failure rule. Do not copy the schema files with another tool.
- If the output has no `status:` line in each other case, a file system error occurred. Do these steps in order, and then stop:
  1. Show each `install:` line.
  2. If an `install:` line names the folder of the old schema, tell the user where the old schema folder is.
  3. Tell the user to delete `openspec/schemas/plan-lite/`, which can be a partial copy, and to run this skill again.

## 4. Archive guidance

- Input: `openspec/config.yaml`, if the file exists.
- Output: `openspec/config.yaml` with the guidance item, or the reason why you did not add the item.

Stock `/opsx:archive` skips promotion on a plan-lite change. Add the guidance item for stock `/opsx:archive` to `openspec/config.yaml`. The guidance item is best effort: stock `/opsx:archive` treats guidance as optional advice.

The guidance item:

```yaml
operations:
  archive:
    guidance:
      - "For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."
```

- If `openspec/config.yaml` exists, and the file is not valid YAML or has more than one `operations:` key, do not edit the file. Report that the guidance item is not added. Name the error, and show the guidance item block for a manual edit.
- When you edit `openspec/config.yaml`, keep the other keys, the other items, and the comments.
- Never add a second `operations:` key. If `openspec/config.yaml` has a second `operations:` key, OpenSpec ignores the whole `openspec/config.yaml`.
- If `openspec/config.yaml` is missing, create `openspec/config.yaml` with only the guidance item block.
- If `openspec/config.yaml` has no `operations` key, add the whole guidance item block at the end. `openspec init` writes `operations` only in a comment, so this case is the usual case.
- If `operations` exists but has no `archive` key, add `archive:` and its `guidance:` list under the existing `operations`.
- If `operations.archive` exists but has no `guidance` key, add `guidance:` and the guidance item under `operations.archive`.
- If `operations.archive.guidance` is a list, and the list does not have the guidance item yet, add the guidance item.
- If `operations.archive.guidance` is a list, and the list already has the guidance item, do not edit `openspec/config.yaml`.
- If `operations.archive.guidance` is a plain string, OpenSpec ignores the string. Do not edit the string. Show the user how to change the string to a list.
- If the edit of `openspec/config.yaml` fails, or the file is not valid YAML after the edit, do not edit the file again. Report that the guidance item is not added, and show the guidance item block for a manual edit. Say that the schema install is still good.
- Go to section 5.

## 5. End

- If section 3 ran, report the `status:`, `backup:`, and each `copied:` line of the script output, copied as they are.
- If section 3 did not run, report "The plan-lite schema is already current."
- Report the `config.yaml` line that you added, or why you did not add the line.
- If the script printed a `backup:` line, tell the user to compare the backup with the new schema and then delete the backup.
- Run `git rev-parse --show-toplevel` alone, from the OpenSpec root. If the OpenSpec root is not the current folder, start the command with `cd <root> && `.
- If `git rev-parse --show-toplevel` succeeds, tell the user to commit each of `openspec/schemas/plan-lite/` and `openspec/config.yaml` that this run changed.
- If this run changed no file, say nothing about commits.
- If `git rev-parse --show-toplevel` fails, the repo does not use git. Say nothing about commits.
