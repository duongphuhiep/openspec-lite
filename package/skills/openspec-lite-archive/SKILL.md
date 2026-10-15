---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements to OpenSpec specs and the decisions to ADRs, with user approval, then runs openspec archive. Use only when the user asks for openspec-lite-archive, or to archive a plan-lite change. Stock /opsx:archive skips this promotion.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion. Write nothing before the user approves.

## 1. Common checks

1. **OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. In a monorepo, it can be a subfolder of the git root. If `root` is `null`, stop. Tell the user to run `openspec init --tools <harness>` in the project folder.
2. **Change selection**: use the change named in the prompt. If no name is given, use the `changes` list from the same `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
3. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. Tell the user to run stock `/opsx:archive`.
4. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
   2. Compare it with the shipped version:

      Shipped schema version: 1

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Archive

`<dir>` is `openspec/changes/<name>`.

1. **Done check**: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty? If an answer is "no", show the warnings and ask: "Archive anyway?" On no, stop.
2. Read `<dir>/plan.md`. Do not use `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
4. Sort each item: a requirement goes to a spec, a decision goes to an ADR.
5. Draft the full text of each item. Before the first delta, run `openspec instructions specs --change "<name>" --schema spec-driven --json`. Follow the delta format in its `instruction`. It gives the format for each header, including the `**Reason**` and `**Migration**` lines of REMOVED and the `FROM:` and `TO:` lines of RENAMED.
   - **Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.
     - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches.
     - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
     - Write each requirement as `### Requirement: <name>`, with SHALL, SHOULD, or MAY.
     - Give each ADDED or MODIFIED requirement at least one `#### Scenario: <name>` with **WHEN** and **THEN** lines. Derive it from `plan.md` and the code.
     - For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit it.
   - **Decision**: an ADR with the sections Title, Status, Change, Context, Decision, Consequences. Status is `Accepted`. Change is the change name, `<name>`.
   - Before you draft a decision, search `openspec/adr/` for files with `Change: <name>`. An earlier run of this archive can have written them. Show them, and do not draft a decision that already has an ADR.
6. Show all drafts. The user answers yes, no, or edit for each item. Apply each edit.
7. Write the approved deltas to `<dir>/specs/<capability>/spec.md`. If `<dir>/specs/` already holds files from an earlier run, show each one. Ask the user to keep or delete it.
8. Look at the files under `<dir>/specs/` now. If any file exists, remove `skip_specs` from `<dir>/.openspec.yaml`. If none exists, make sure `skip_specs: true` is set. `validate` fails with a delta and the flag, and also with no delta and no flag.
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Write each approved ADR to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use today's date. Skip a decision that already has an ADR with `Change: <name>`.
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas to `openspec/specs/` and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`. If it fails, report it. Keep the ADRs: each one is still a correct decision.

## 3. End

List the specs that changed, the ADRs that you wrote, and the archive path.
