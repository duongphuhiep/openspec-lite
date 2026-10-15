---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements to OpenSpec specs and the decisions to ADRs, with user approval, then runs openspec archive. Use only when the user asks for openspec-lite-archive, or to archive a plan-lite change. Stock /opsx:archive skips this promotion.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion. Write nothing before the user approves.

## 1. Common checks

1. **OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.
2. **Change selection**: use the change named in the prompt. If no name is given, use the `changes` list from the same `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
3. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. Tell the user to run stock `/opsx:archive`. If `openspec/changes/<name>/design.md` has `### Decision` entries, also warn: "Stock `/opsx:archive` does not turn the decisions in `design.md` into ADRs. They stay only in the archive folder. To keep them as ADRs, copy them to `openspec/adr/` before you archive." A change that was upgraded from plan-lite has its decisions there.
4. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
   2. Compare it with the shipped version:

      Shipped schema version: 1

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes.
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
5. Draft the full text of each item. Before the first delta, run `openspec instructions specs --change "<name>" --schema spec-driven --json`. Follow the delta format in its `instruction`. It gives the format for each header, including the `**Reason**` and `**Migration**` lines of REMOVED and the `FROM:` and `TO:` lines of RENAMED. The result also has `skipped: true` and a warning, because `skip_specs` is still set. Ignore both: step 8 sets `skip_specs`.
   - **Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.
     - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches.
     - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
     - Write each requirement as `### Requirement: <name>`, with SHALL or MUST, as the CLI instruction says.
     - Give each ADDED or MODIFIED requirement at least one `#### Scenario: <name>` with **WHEN** and **THEN** lines. Derive it from `plan.md` and the code.
     - For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit it.
   - **Decision**: an ADR in this exact form. `Status:` and `Change:` are plain lines, not sections:

     ```markdown
     # <Title>

     Status: Accepted
     Change: <name>

     ## Context

     ## Decision

     ## Consequences
     ```

   - Before you draft a decision, search `openspec/adr/` for files with the line `Change: <name>`. An earlier run of this archive can have written them. Show them, and do not draft a decision that already has an ADR.
6. Show all drafts. The user answers yes, no, or edit for each item. Apply each edit.
7. Before you write, list the files under `<dir>/specs/`. They are from an earlier run. Show each one, and ask the user to keep or delete it. Then write the approved deltas to `<dir>/specs/<capability>/spec.md`. If a kept file has the same path, merge the new delta into it, with no duplicate requirement.
8. Look at the files under `<dir>/specs/` now. If any file exists, remove `skip_specs` from `<dir>/.openspec.yaml`. If none exists, make sure `skip_specs: true` is set. `validate` fails with a delta and the flag, and also with no delta and no flag.
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Write each approved ADR to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use today's date. Skip a decision that already has an ADR with `Change: <name>`. If the file name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR.
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas to `openspec/specs/` and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`. If it fails, report it. Keep the ADRs: each one is still a correct decision.

## 3. End

List the specs that changed, the ADRs that you wrote, and the archive path.
