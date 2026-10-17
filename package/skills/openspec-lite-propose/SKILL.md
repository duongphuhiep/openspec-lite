---
name: openspec-lite-propose
description: Create a plan-lite change with openspec-lite. It writes a lightweight plan.md with goal, non-goals, constraints, open questions, and decisions. It does not write the full spec-driven artifacts. Use when the user asks for openspec-lite-propose or a plan-lite change. Also use it for a lightweight plan, or for a medium change that needs a plan but not a full OpenSpec change.
---

# openspec-lite-propose

Create a plan-lite change. Do not write code.

## 1. Level 1 question

If the request is small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, stop. Write no files.

## 2. Schema check

**OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. If that folder is not the folder where the session started, start each `openspec` command with `cd <absolute root path> && `. Do this for every command, also the first one after the user confirms a root. Do not rely on the shell folder of an earlier command. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare it with the shipped version:

   Shipped schema version: 1

   - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes. In your end summary, include its report: the status, the copied files, and the backup path.
   - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 3. Create the change

1. Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 5 words from the goal.
2. Run `openspec new change "<name>" --schema plan-lite`. If it fails because the change already exists, read `openspec/changes/<name>/.openspec.yaml`. If `schema` is `plan-lite` and `plan.md` is missing, an earlier run stopped here. Ask: "Resume the change <name>?" On yes, go to step 3. In each other case, show the error and ask for another name.
3. Set `skip_specs: true` in `openspec/changes/<name>/.openspec.yaml`. If the line exists, do not add a second one. A duplicate key breaks each CLI command on the change.
4. Run `openspec instructions plan --change "<name>" --json`. Write `openspec/changes/<name>/plan.md` from its `template` field.
5. Fill only what is known. Leave the other sections empty. Do not invent non-goals, constraints, or decisions.

A decision entry is `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative.

## 4. Upgrade signals

Suggest `openspec-lite-upgrade` if one of these is true:

- Another person or agent must continue the work.
- The change touches more than one capability.
- The change touches more than one repo.
- A contract (spec) becomes necessary.

## 5. End

1. In the summary, show the change name and the path of `plan.md`.
2. Ask: "Do you want a tasks preview?" On yes, run the `openspec-lite-tasks-preview` skill. If you cannot invoke a skill, tell the user to run it.
