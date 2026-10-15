---
name: openspec-lite-apply
description: Implement a plan-lite change from plan.md, with tasks-preview.md as an optional guide. Use only when the user asks for openspec-lite-apply, or to apply a plan-lite change.
---

# openspec-lite-apply

Implement a plan-lite change. The rules are in the plan-lite schema, so stock `/opsx:apply` uses the same rules. This skill adds only one rule.

## 1. Common checks

1. **Change selection**: use the change named in the prompt. If no name is given, run `openspec list --json`. If only one active change exists, use it. Otherwise ask.
2. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. Tell the user to run stock `/opsx:apply`.
3. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml` in the repo.
   2. Compare it with the shipped version:

Shipped schema version: 1

      - The file is missing or its version is lower: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Apply

1. Run `openspec instructions apply --change "<name>" --json`.
2. Read each file in `contextFiles`. Follow `instruction`. It holds all plan-lite apply rules. `<changeDir>` in the rules is the `changeDir` field.
3. Ignore any text about checkboxes, task counts, or "N/M tasks complete". A plan-lite change has no tracked tasks.
