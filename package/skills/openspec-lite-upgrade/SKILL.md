---
name: openspec-lite-upgrade
description: Upgrade a plan-lite change to a full spec-driven OpenSpec change when its scope grows. It writes proposal.md, specs, design.md, and tasks.md from plan.md and tasks-preview.md. Use only when the user asks for openspec-lite-upgrade, or to upgrade a plan-lite change.
---

# openspec-lite-upgrade

Upgrade a plan-lite change to spec-driven. The schema switch is the last write, so an interrupted run can run again and resume.

## 1. Common checks

1. **Change selection**: use the change named in the prompt. If no name is given, run `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
2. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. There are three cases:
   - `plan-lite`: continue.
   - `spec-driven`, and `plan.md` still exists: an earlier run may have stopped after step 3. A finished upgrade can also keep `plan.md`. Ask the user: "Resume the upgrade of <name> at step 4?" On no, stop. On yes, do the schema check, then go to step 4 of the upgrade.
   - Any other case, including `spec-driven` with no `plan.md`: stop. Point the user to the stock skills `/opsx:apply` and `/opsx:archive`.
3. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml` in the repo.
   2. Compare it with the shipped version:

      Shipped schema version: 1

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Upgrade

`<dir>` is `openspec/changes/<name>`.

1. Remove the `skip_specs: true` line from `<dir>/.openspec.yaml`. While it is set, the CLI forbids spec files.
2. Write the four artifacts in this order: `proposal`, `specs`, `design`, `tasks`. For each one, run `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`. Use its `template` and follow its `instruction`. If an artifact already exists from an earlier run, keep it and go to the next one. If a kept artifact looks incomplete, for example a template section that is still empty, tell the user and offer to complete it.
   1. `proposal.md`: from the Goal and the scope in `plan.md`.
   2. `specs/<capability>/spec.md`: one delta per capability, for the requirements in `plan.md`.
      - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches.
      - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
      - Give each ADDED or MODIFIED requirement at least one `#### Scenario:` with **WHEN** and **THEN** lines.
      - For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit it.
      - If `plan.md` has no requirement for a spec, ask the user for at least one. If the user has none, add `skip_specs: true` back to `<dir>/.openspec.yaml`, and say so in the summary. Without a delta and without the flag, `validate` fails.
   3. `design.md`: Non-Goals go to `## Goals / Non-Goals`. Each `### Decision:` entry of `plan.md` goes to `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
   4. `tasks.md`: if `<dir>/tasks-preview.md` exists, use it as the seed. Remove its two header comment lines. Add `[ ]` to each task line, for example `- [ ] 1.1 <task>`. Then delete `tasks-preview.md`. If no preview exists, write `tasks.md` from the template. If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here. Keep `tasks.md`, and delete `tasks-preview.md`.
3. Change `schema: plan-lite` to `schema: spec-driven` in `<dir>/.openspec.yaml`.
4. Delete each `plan.md` section whose content moved. Keep a section that has no slot, for example open questions that are still open. If no section is left, delete `plan.md`.
5. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.

## 3. End

In the summary:

- List the files that you wrote and deleted.
- Ask the user to review all artifacts.
- Ask for an extra review of `tasks.md`, because it is a contract, not a reference.
- Say if `skip_specs` was removed, or put back because the change has no spec delta.
- Say that from now on the change uses the stock skills: `/opsx:apply` and `/opsx:archive`.
