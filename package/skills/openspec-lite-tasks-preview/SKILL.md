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

      Shipped schema version: 6

      - The file is missing, its version is lower, or it has no readable `version` line: run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes. In your end summary, copy its report: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
      - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`. It compares `openspec --version` with the range in `schema.yaml`, and prints one line that starts with `ok:`, `warn:`, or `fail:`. Run it alone, not in a chain. Read the first word of the line, not the exit code. Do not compare the versions yourself. On `fail:`, show the line, and stop. On `warn:`, show the line as a warning, and continue. In both cases, point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Write the preview

1. If `openspec/changes/<name>/plan.md` is missing, stop. Tell the user to run `openspec-lite-propose`.
2. Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root, alone, not in a chain. If it prints a line, copy the line to the user as it is. Then continue. If it prints nothing, say nothing about commits.
3. Read `plan.md`. Explore the code that the change touches. Record in `plan.md` as you go (see "Record in plan.md").
4. From the OpenSpec root, run:

   ```sh
   node openspec/schemas/plan-lite/plan-hash.mjs openspec/changes/<name>/plan.md
   ```

   If it prints a message that starts with `plan-hash:` and no hash, show the message and stop. You do not need its exit code. Ask the user to fix `plan.md` as the message says.
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

6. Record the open questions in `plan.md` (see "Record in plan.md").

Rules for the preview of step 5:

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order the tasks by dependency.
- Give each task verification criteria.
- Put tests and docs in the same task as the related code.
- Each task is a meaningful, verifiable result. Do not split the work into very small subtasks. Do not specify details that the coding agent can find itself.
- Pseudo-diffs are permitted.

## 3. Record in plan.md

Write to `plan.md` with no question. Edit only `## Facts`, `## Decisions`, and `## Open Questions`. The plan hash does not cover these sections, so the preview stays current. Do not edit Goal, Background, Non-Goals, or Constraints.

- **Fact**, when you find it, as `- F<n>: <fact>`. Record each non-obvious fact. A non-obvious fact needs one of these to find: a run or a test result; research of remote sources, for example documentation on the internet, another repo, logs, or a remote database; a long analysis of the code; or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found it. A run alone is not enough: the result must be one that a reader cannot see in the code or in the file list. For example, what a script prints when its code shows it, or which files exist, is obvious. When a command, a tool, or a service gives an error or an output that makes you change what you do, record it, with the command and the error text. If a reader can see the same output in the code, it is an obvious fact: write it in the "because" part of the item that it justifies. To know the exit code of a command, run `node openspec/schemas/plan-lite/exit-code.mjs <command> <args...>` from the OpenSpec root, alone, not in a chain, and read its last line `exit: <code>`. Do not add `echo $?`. If you did not get the exit code, record nothing about it. Give the source of each fact: a command or a test that you ran, the files that you analyzed, a doc URL, a log, or an error text. Do not record a guess, an obvious fact that a reader can easily deduce from the code (also if you found it with a run), or a well-known fact. If such a fact is the reason of a decision, a constraint, or a non-goal, write it in the "because" part of that item. A sentence that states a choice, for example "the script must read the item count", is a decision, not a fact. Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK.
- **Decision**, when you make it: Record a decision when one of these is true: (1) you picked something that changes a visible result: a UI, a public interface, the input or output of a program, a function signature, a data format, a file name or path that a user or another program uses, a config key, an error message, or a new dependency. You picked it when plan.md, the user, and the constraints do not fix it. (2) You weighed two or more close options, and no option was a clear winner, also for an internal choice. Do not record other choices. Record only the part of the decision that matches (1) or (2). Write `### Decision D<n>: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. Each reason must come from this run, the user, plan.md, the code, or a well-known fact. A claim about how a tool, a runtime, or a platform behaves is not a well-known fact: check it with a run or a doc, and give the source. If no source supports a reason, write "Reason not checked." in its place. Do not guess a reason, also not a wish of the user.
  - **Mark**: end the heading with 🤖, unless the decision records an answer or an instruction of the user. A decision with no 🤖 belongs to the user, also one that the user wrote by hand. It holds only what the user said: put each choice that you add in its own 🤖 decision. When you update a 🤖 decision to follow an answer or an instruction of the user, remove its 🤖. The user removes the 🤖 to accept a decision.
  - **Keep current**: `## Decisions` holds only the current decisions. You can update or remove a 🤖 decision: remove each one that a new decision supersedes, update each one that it makes stale, and update or remove each one that conflicts with a constraint or with a decision with no 🤖, for example after the user corrected `plan.md`. Change a decision with no 🤖 only when the user tells you to in this session. If your approach conflicts with such a decision, record an open question. Then remove each fact that justifies no current decision or constraint, except a non-obvious fact.
- **Open question**, after you write the preview: each point that you are unsure or worried about and cannot resolve, as `- OQ<n>: <question>`. Do not answer an existing open question yourself. If the user answers one in this session, record the answer as a decision with no 🤖, and remove the question. Only an answer of the user closes a question.

Give each new item a number higher than each ID of its kind in the file. Do not add an ID to an existing item that has none.

## 4. End

Before the list, check each fact that you added in this run. Read the code or the file list that the fact is about. If a reader can see the fact there, it is obvious, also if you found it with a run: move it to the "because" part of the item that it justifies, or remove it.

List each fact, decision, and open question that you added, changed, or removed in `plan.md`, with its ID. Tell the user to read the preview. If they disagree, they put the correction in `plan.md` and run this skill again. They do not edit `tasks-preview.md`.
