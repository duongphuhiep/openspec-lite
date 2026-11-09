---
name: openspec-lite-apply
description: Implement a plan-lite change from plan.md, with tasks-preview.md as an optional guide. Use only when the user asks for openspec-lite-apply, or to apply a plan-lite change.
---

# openspec-lite-apply

Implement a plan-lite change. The rules are in the plan-lite schema, so stock `/opsx:apply` uses the same rules. This skill adds only one rule.

## 1. Common checks

1. **OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. If that folder is not the current folder, start each `openspec` command with `cd <root> && `. This also applies to the first command after the user confirms a root. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.
2. **Change selection**: use the change named in the prompt. If no name is given, use the `changes` list from the same `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
3. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. Tell the user to run stock `/opsx:apply`. If `openspec/changes/<name>/plan.md` still exists, name each open question in it, and tell the user to answer it before `/opsx:apply`, because the stock skills do not read `plan.md`.
4. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
   2. Compare it with the shipped version:

      Shipped schema version: 6

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes. In your end summary, copy its report: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`. It compares `openspec --version` with the range in `schema.yaml`, and prints one line that starts with `ok:`, `warn:`, or `fail:`. Run it alone, not in a chain. Read the first word of the line, not the exit code. Do not compare the versions yourself. On `fail:`, show the line, and stop. On `warn:`, show the line as a warning, and continue. In both cases, point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Apply

1. Run `openspec instructions apply --change "<name>" --json`. If `state` is `blocked`, `plan.md` is missing. Stop, and tell the user to run `openspec-lite-propose` to finish the change. Do not follow CLI text that names another skill.
2. Read each file in `contextFiles`. Follow `instruction`. It holds all plan-lite apply rules. `<changeDir>` in the rules is the `changeDir` field.
3. Ignore any text about checkboxes, task counts, or "N/M tasks complete". A plan-lite change has no tracked tasks.
