---
name: openspec-lite-tasks-preview
description: Generate or regenerate tasks-preview.md for a plan-lite change. It lists the code changes the agent intends to make, for human review before coding. It is a reference, not a contract. Use only when the user asks for openspec-lite-tasks-preview, or for a tasks preview of a plan-lite change.
---

# openspec-lite-tasks-preview

Write `tasks-preview.md` for a plan-lite change. Record what you learn in `plan.md`. Do not write code.

## 1. Common checks

1. **OpenSpec root**: run `openspec list --json`, and read `root.path`. Run each command from that folder, and read each `openspec/...` path from it. If that folder is not the current folder, start each `openspec` command with `cd <root> && `. This also applies to the first command after the user confirms a root. In a monorepo, it can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down. If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`. If one folder matches, ask the user to confirm it as the root. If more than one matches, ask the user to pick one. Only if none matches, stop, and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`. Do not run `openspec init` in a parent of an existing root.
2. **Change selection**: use the change named in the prompt. If no name is given, use the `changes` list from the same `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml`. If only one active change exists, use it. Otherwise ask.
3. **Guard**: read `schema` from `openspec/changes/<name>/.openspec.yaml`. If it is not `plan-lite`, stop. A spec-driven change has `tasks.md` instead. Point the user to stock `/opsx:continue`.
4. **Schema check**:
   1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
   2. Compare it with the shipped version:

      Shipped schema version: 5

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes. In your end summary, include its report: the status, the copied files, and the backup path.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the range of `openspec-version` in the repo `schema.yaml`. If the version is outside that range, warn the user. Point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Write the preview

1. If `openspec/changes/<name>/plan.md` is missing, stop. Tell the user to run `openspec-lite-propose`.
2. Run `git status --porcelain -- openspec/changes/<name>/plan.md` from the OpenSpec root. If it prints a line, tell the user in one line: "plan.md is not committed. Commit it to see the changes of this run in git diff." Then continue. If the command fails, for example with no git repo, say nothing.
3. Read `plan.md`. Explore the code that the change touches. Record in `plan.md` as you go (see "Record in plan.md").
4. From the OpenSpec root, run:

   ```sh
   node openspec/schemas/plan-lite/plan-hash.mjs openspec/changes/<name>/plan.md
   ```

   If it exits with code 1, show its message and stop. Ask the user to fix `plan.md` as the message says.
5. Overwrite `openspec/changes/<name>/tasks-preview.md` with this template. Put the hash in the second line:

   ```markdown
   <!-- Generated. Edit plan.md, not this file. -->
   <!-- plan-sha256: <hash> -->

   ## 1. <group title>

   - 1.1 <task: a verifiable result>
     - Verify: <criteria>
     - Files: <paths, optional>

   ## 2. <next group, depends on 1>
   ```

Rules:

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order the tasks by dependency.
- Give each task verification criteria.
- Put tests and docs in the same task as the related code.
- Each task is a meaningful, verifiable result. Do not split the work into very small subtasks. Do not specify details that the coding agent can find itself.
- Pseudo-diffs are permitted.

## 3. Record in plan.md

Write to `plan.md` with no question. Edit only `## Facts`, `## Decisions`, and `## Open Questions`. The plan hash does not cover these sections, so the preview stays current. Do not edit Goal, Background, Non-Goals, or Constraints.

- **Fact**, when you find it: each behavior of an external service or tool that this change uses and that you saw in this run, for example an API response, a library limit, or a CLI error. When a command, a tool, or a service gives an error or an output that makes you change what you do, record it, with the command and the error text. Give the source of each fact: a command that you ran, a file that you read, a doc URL, or an error text. Also record each other non-obvious fact that justifies a new decision. Do not record a guess, or a fact that a reader finds in the code of this repo. Write `- F<n>: <fact>`.
- **Decision**, when you make it: each choice between real alternatives in the approach that another person could make in a different way. Do not record a choice that follows directly from the code or from a constraint. Write `### Decision D<n>: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. `## Decisions` holds only the current decisions. When you add a decision, remove each decision that it supersedes, and update each decision that it makes stale. Then remove each fact that justifies no current decision or constraint, except a fact about an external service or tool.
- **Open question**, after you write the preview: each point that you are unsure or worried about and cannot resolve, as `- OQ<n>: <question>`.

Give each new item a number higher than each ID of its kind in the file. Do not add an ID to an existing item that has none.

## 4. End

List each fact, decision, and open question that you added, changed, or removed in `plan.md`, with its ID. Tell the user to read the preview. If they disagree, they put the correction in `plan.md` and run this skill again. They do not edit `tasks-preview.md`.
