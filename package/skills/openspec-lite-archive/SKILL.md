---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements to OpenSpec specs and the decisions to ADRs, with user approval, then runs openspec archive. Use only when the user asks for openspec-lite-archive, or to archive a plan-lite change. Stock /opsx:archive skips this promotion.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion. Write nothing before the user approves.

## 1. Common checks

1. **Change selection**: use the change named in the prompt. If no name is given, run `openspec list --json`. If only one active change exists, use it. Otherwise ask.
2. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. Tell the user to run stock `/opsx:archive`.
3. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml` in the repo.
   2. Compare it with the shipped version:

Shipped schema version: 1

      - The file is missing or its version is lower: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Archive

`<dir>` is `openspec/changes/<name>`.

1. **Done check**: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty? If an answer is "no", show the warnings and ask: "Archive anyway?" On no, stop.
2. Read `<dir>/plan.md`. Do not use `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
4. Sort each item: a requirement goes to a spec, a decision goes to an ADR.
5. Draft the full text of each item:
   - **Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.
     - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches.
     - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
     - Write each requirement as `### Requirement: <name>`, with SHALL, SHOULD, or MAY.
     - Give each ADDED or MODIFIED requirement at least one `#### Scenario: <name>` with **WHEN** and **THEN** lines. Derive it from `plan.md` and the code.
     - For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit it.
   - **Decision**: an ADR with the sections Title, Status, Context, Decision, Consequences. Status is `Accepted`.
6. Show all drafts. The user answers yes, no, or edit for each item. Apply each edit.
7. Write the approved deltas to `<dir>/specs/<capability>/spec.md`.
8. If step 7 wrote files, remove `skip_specs` from `<dir>/.openspec.yaml`. Otherwise, make sure `skip_specs: true` is set. Without deltas and without the flag, `validate` fails.
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Write each approved ADR to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use today's date.
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas to `openspec/specs/` and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`. If it fails, report it. Keep the ADRs: each one is still a correct decision.

## 3. End

List the specs that changed, the ADRs that you wrote, and the archive path.
