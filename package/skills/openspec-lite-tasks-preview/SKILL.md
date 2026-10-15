---
name: openspec-lite-tasks-preview
description: Generate or regenerate tasks-preview.md for a plan-lite change. It lists the code changes the agent intends to make, for human review before coding. It is a reference, not a contract. Use only when the user asks for openspec-lite-tasks-preview, or for a tasks preview of a plan-lite change.
---

# openspec-lite-tasks-preview

Write `tasks-preview.md` for a plan-lite change. Do not write code.

## 1. Common checks

1. **OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.
2. **Change selection**: use the change named in the prompt. If no name is given, use the `changes` list from the same `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
3. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. A spec-driven change has `tasks.md` instead. Point the user to stock `/opsx:continue`.
4. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
   2. Compare it with the shipped version:

      Shipped schema version: 1

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Write the preview

1. If `openspec/changes/<name>/plan.md` is missing, stop. Tell the user to run `openspec-lite-propose`.
2. Read `plan.md`. Explore the code that the change touches.
3. From the OpenSpec root, run:

   ```sh
   node openspec/schemas/plan-lite/plan-hash.mjs openspec/changes/<name>/plan.md
   ```

   If it exits with code 1, show its message and stop. Ask the user to fix `plan.md` as the message says.
4. Overwrite `openspec/changes/<name>/tasks-preview.md` with this template. Put the hash in the second line:

   ```markdown
   <!-- Generated. Edit plan.md, not this file. -->
   <!-- plan-sha256: <hash> -->

   ## 1. <group title>

   - 1.1 <task: a verifiable outcome>
     - Verify: <criteria>
     - Files: <paths, optional>

   ## 2. <next group, depends on 1>
   ```

Rules:

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order the tasks by dependency.
- Give each task verification criteria.
- Put tests and docs in the same task as the related code.
- Each task is a meaningful, verifiable outcome. Do not split the work into very small subtasks. Do not specify details that the coding agent can find itself.
- Pseudo-diffs are permitted.

## 3. End

Tell the user to read the preview. If they disagree, they put the correction in `plan.md` and run this skill again. They do not edit `tasks-preview.md`.
