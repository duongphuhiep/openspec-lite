---
name: openspec-lite-propose
description: Create a plan-lite change with openspec-lite. It writes a lightweight plan.md with goal, non-goals, constraints, open questions, and decisions. It does not write the full spec-driven artifacts. Use when the user asks for openspec-lite-propose or a plan-lite change. Also use it for a lightweight plan, or for a medium change that needs a plan but not a full OpenSpec change.
---

# openspec-lite-propose

Create a plan-lite change. Do not write code.

## 1. Level 1 question

If the request is small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, stop. Write no files.

## 2. Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml` in the repo.
2. Compare it with the shipped version:

   Shipped schema version: 1

   - The file is missing or its version is lower: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
   - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`."
3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 3. Create the change

1. Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 5 words from the goal.
2. Run `openspec new change "<name>" --schema plan-lite`. If it fails, for example because the change already exists, show the error and ask for another name.
3. Add `skip_specs: true` to `openspec/changes/<name>/.openspec.yaml`.
4. Run `openspec instructions plan --change "<name>" --json`. Write `openspec/changes/<name>/plan.md` from its `template` field.
5. Fill only what is known. Leave the other sections empty. Do not invent constraints or decisions.

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
