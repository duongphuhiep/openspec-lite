---
name: openspec-lite-schema
description: Install or update the plan-lite OpenSpec schema of openspec-lite in openspec/schemas/plan-lite/ of the repo. Use only when the user asks for openspec-lite-schema, or when another openspec-lite skill asks you to run it.
---

# openspec-lite-schema

Install or replace `openspec/schemas/plan-lite/` in the OpenSpec root. Do not read the schema content into the conversation.

## 1. Find the folders

**OpenSpec root** (`<root>`): run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. If that folder is not the folder where the session started, start each `openspec` command with `cd <absolute root path> && `. Do this for every command, also the first one after the user confirms a root. Do not rely on the shell folder of an earlier command. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.

Then find this skill's folder.

Find `<skillDir>`, the folder of this `SKILL.md`. It holds `scripts/install.mjs` and `assets/plan-lite/`.

1. Use the base directory that the harness gives for this skill, if it gives one.
2. Otherwise, search for the folder `openspec-lite-schema/` with `assets/plan-lite/` in it. Use the first match:
   1. Project folders: in `<root>`, then in each parent folder of `<root>`, check `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, and then `apm_modules/` (at any depth).
   2. User folders, only after all project folders: `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
3. If no path has the folder, stop and tell the user.

## 2. Compare the versions

Read the `version` line of `<skillDir>/assets/plan-lite/schema.yaml` (shipped) and of `openspec/schemas/plan-lite/schema.yaml` (repo).

- Repo version higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
- Equal: say "The plan-lite schema is already current." Skip section 3, and go to section 4. To repair a damaged schema, the user deletes `openspec/schemas/plan-lite/` and runs this skill again.
- Repo copy exists and is lower, or has no readable version: ask the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`. Proceed?" End your turn, and wait for the answer. Do not run the install script before the user says yes. On no, stop.
- No repo copy: continue.

## 3. Install

Run:

```sh
node "<skillDir>/scripts/install.mjs" "<root>"
```

The first output line is the status:

- `status: installed` or `status: replaced`: success. The next lines are `backup: <path>` (only on replace) and `copied: <path>`.
- `status: current`: nothing to do.
- `status: newer` (exit code 2): stop, with the "newer schema" message above.
- Exit code 3: the shipped assets are damaged. Stop and tell the user to reinstall openspec-lite.
- Exit code 1, with a line `install: <message>`: a file system error. Stop and show the message. If the output names the old schema folder, tell the user where it is.

## 4. Archive guidance

Stock `/opsx:archive` skips promotion on a plan-lite change. Add a hint for it in `openspec/config.yaml`. This is best effort: the stock skill treats guidance as optional advice.

The item:

```yaml
operations:
  archive:
    guidance:
      - "For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."
```

- If `openspec/config.yaml` is missing, create it with only this block.
- If the file has no `operations` key, add the whole block at the end. `openspec init` writes `operations` only in a comment, so this is the usual case. Keep the other keys and the comments.
- If `operations` exists but has no `archive` key, add `archive:` and its `guidance:` list under the existing `operations`.
- If `operations.archive` exists but has no `guidance` key, add `guidance:` and the item under it.
- Never add a second `operations:` key. OpenSpec then ignores the whole `config.yaml`.
- If `operations.archive.guidance` is a list, add the item if the list does not have it yet. Keep the other items and keys.
- If `guidance` is a plain string, OpenSpec ignores it. Do not edit it. Show the user how to change it to a list.

## 5. End

Report:

- the status, the copied files, and the backup path, from the script output;
- the `config.yaml` line that you added, or why you did not add it.

Do not use `git diff` or `git status` to report changes. The repo may not use git.

If there is a backup, tell the user to compare it with the new schema and then delete it. Tell the user to commit `openspec/schemas/plan-lite/` and `openspec/config.yaml` to git.
