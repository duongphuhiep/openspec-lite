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

## 1. Find the folders

- Output: `<root>` and `<skillDir>`.
- Find `<root>` with the OpenSpec root block. Then find `<skillDir>` with the skill folder block. Then go to section 2.

### OpenSpec root

- Input: the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- Run `openspec list --json`, and read `root.path`. The folder in `root.path` is the OpenSpec root.
- If `openspec list --json` fails, or prints no JSON, show the error, and stop. Tell the user to check that `openspec` is installed.
- Run each `openspec` command, and each command with a relative `openspec/...` path, from the OpenSpec root. Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command, and each command with a relative `openspec/...` path, with `cd <root> && `. This prefix does not count as a chain.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root. End your turn, and wait for the answer.
- If more than one folder matches, ask the user to pick one folder. End your turn, and wait for the answer.
- If the user rejects the folder, or picks no folder, stop. Tell the user to run the skill from the OpenSpec root.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Skill folder

- Output: `<skillDir>`, the folder of this `SKILL.md`. `<skillDir>` holds `scripts/install.mjs` and `assets/plan-lite/`.

1. If the harness gives a base directory for this skill, use the base directory as `<skillDir>`. Go to section 2.
2. If the harness gives no base directory, search for the folder `openspec-lite-schema/` with `assets/plan-lite/` in it. Use the first match as `<skillDir>`, in this order:
   1. Project folders: in `<root>`, then in each parent folder of `<root>`, check `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, and then `apm_modules/` (at any depth).
   2. User folders, only after all project folders: `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
   - If a path has the folder, go to section 2.
3. If no path has the folder, stop and tell the user.

## 2. Compare the versions

- Input: the `version` line of `<skillDir>/assets/plan-lite/schema.yaml` (shipped), and the `version` line of `openspec/schemas/plan-lite/schema.yaml` (repo).
- Output: the next section to do, or stop.
- Read the shipped version and the repo version.
- If the repo version is higher than the shipped version, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
- If the repo version equals the shipped version, tell the user: to repair a damaged schema, delete `openspec/schemas/plan-lite/`, and run this skill again. Skip section 3, and go to section 4.
- If the repo copy exists and the repo version is lower, or the repo copy has no readable version, ask the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`. Proceed?"
- After you ask the replace question, end your turn, and wait for the answer.
- Do not run the install script before the user says yes to the replace question.
- On yes to the replace question, go to section 3.
- On no to the replace question, stop.
- If no repo copy exists, go to section 3.

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
- If the status is `status: newer`, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
- If the output has no `status:` line, and an `install:` line says that the shipped `schema.yaml` is missing, the shipped assets are damaged. Stop, and tell the user to reinstall openspec-lite.
- If the output has no `status:` line and no `install:` line, the script did not run. Follow the failure rule. Do not copy the schema files with another tool.
- If the output has no `status:` line in each other case, a file system error occurred. Show each `install:` line. If an `install:` line names the folder of the old schema, tell the user where the old schema folder is. Also tell the user to delete `openspec/schemas/plan-lite/`, which can be a partial copy, and to run this skill again. Then stop.

## 4. Archive guidance

- Input: `openspec/config.yaml`, if the file exists.
- Output: `openspec/config.yaml` with the guidance item, or the reason why you did not add the item.

Stock `/opsx:archive` skips promotion on a plan-lite change. Add a hint for stock `/opsx:archive` in `openspec/config.yaml`. The hint is best effort: the stock skill treats guidance as optional advice.

The item:

```yaml
operations:
  archive:
    guidance:
      - "For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."
```

- If `openspec/config.yaml` is missing, create `openspec/config.yaml` with only the item block.
- If `openspec/config.yaml` has no `operations` key, add the whole item block at the end. `openspec init` writes `operations` only in a comment, so this case is the usual case.
- When you edit `openspec/config.yaml`, keep the other keys and the comments.
- If `operations` exists but has no `archive` key, add `archive:` and its `guidance:` list under the existing `operations`.
- If `operations.archive` exists but has no `guidance` key, add `guidance:` and the item under `operations.archive`.
- Never add a second `operations:` key. If `config.yaml` has a second `operations:` key, OpenSpec ignores the whole `config.yaml`.
- If `operations.archive.guidance` is a list and the list does not have the item yet, add the item. Keep the other items and keys.
- If `operations.archive.guidance` is a list and the list already has the item, do not edit `openspec/config.yaml`.
- If `guidance` is a plain string, OpenSpec ignores the string. Do not edit the string. Show the user how to change the string to a list.
- If the edit of `openspec/config.yaml` fails, or the file is not valid YAML, do not edit the file again. Report that the hint is not added, and show the item block for a manual edit. Say that the schema install is still good.
- Go to section 5.

## 5. End

- If section 3 ran, report the `status:`, `backup:`, and each `copied:` line of the script output, copied as they are.
- If section 3 did not run, report "The plan-lite schema is already current."
- Report the `config.yaml` line that you added, or why you did not add the line.
- If the script printed a `backup:` line, tell the user to compare the backup with the new schema and then delete the backup.
- Tell the user to commit `openspec/schemas/plan-lite/` and `openspec/config.yaml` to git.
