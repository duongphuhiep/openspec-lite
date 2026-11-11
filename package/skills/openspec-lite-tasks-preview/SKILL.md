---
name: openspec-lite-tasks-preview
description: Generate or regenerate tasks-preview.md for a plan-lite change. It lists the code changes the agent intends to make, for human review before coding. It is a reference, not a contract. Use only when the user asks for openspec-lite-tasks-preview, or for a tasks preview of a plan-lite change.
---

# openspec-lite-tasks-preview

Write `tasks-preview.md` for a plan-lite change. Record what you learn in `plan.md`. Do not write code.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Run `openspec list --json`, and read `root.path`. This folder is the OpenSpec root.
- Run each command from the OpenSpec root, and read each `openspec/...` path from it.
- If the OpenSpec root is not the current folder, start each `openspec` command with `cd <root> && `. This also applies to the first command after the user confirms a root.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
  - If one folder matches, ask the user to confirm it as the root.
  - If more than one folder matches, ask the user to pick one.
  - Only if no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Use the change named in the prompt.
- If no name is given, use the `changes` list from the same `openspec list --json`. The list does not give the schema, so read `schema` from the `.openspec.yaml` of each change.
- If only one active change exists, use it. Otherwise, ask.

### Guard

- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If it is `plan-lite`, continue.
- If it is not `plan-lite`, stop. A spec-driven change has `tasks.md` instead. Point the user to stock `/opsx:continue`.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare it with the shipped version:

   Shipped schema version: 6

   - If the file is missing, its version is lower, or it has no readable `version` line:
     - Run the `openspec-lite-schema` skill. If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
     - If the user declines the copy, stop.
     - After the copy, read the version again. If it still differs from the shipped version, stop, and report both versions.
     - Otherwise, continue with the next step of this skill. Do not end your turn after `openspec-lite-schema` finishes.
     - In your end summary, copy the report of `openspec-lite-schema`: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
   - If its version is higher, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - It compares `openspec --version` with the range in `schema.yaml`, and prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run it alone, not in a chain.
   - Read the first word of the line, not the exit code. Do not compare the versions yourself.
   - On `fail:`, show the line, and stop.
   - On `warn:`, show the line as a warning, and continue.
   - In both cases, point to https://github.com/duongphuhiep/openspec-lite#compatibility.

## 2. Steps

Do these steps in order. The rules of section 3 say how to record each item in `plan.md`. Each rule applies in each step where its topic comes up, also when the step does not name it. Each time the user answers an open question, or gives a fact, a rule, or a choice for the change in another reply, record it with the answer rule.

### Step 1: Check plan.md

- If `openspec/changes/<name>/plan.md` is missing, stop.
- Tell the user to run `openspec-lite-propose`.

### Step 2: Start

- Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root.
- Run it alone, not in a chain.
- If it prints a line, copy the line to the user as it is. Then continue.
- If it prints nothing, say nothing about commits.

### Step 3: Explore, and close the open questions

- Read `plan.md`.
- Explore the code that the change touches.
- Before you write the tasks, try to close each open question with the question rule.
- When you make a decision, record it with the decision rule, the decision format, and the mark rule. Keep `## Decisions` current with the current-decisions rule.
- When you find a fact, record it with the fact rule and the fact format. To know an exit code, use the exit-code rule.
- Edit `plan.md` only as the plan.md rule says.

### Step 4: Get the plan hash

- From the OpenSpec root, run:

  ```sh
  node openspec/schemas/plan-lite/plan-hash.mjs openspec/changes/<name>/plan.md
  ```

- You do not need its exit code.
- If it prints a message that starts with `plan-hash:` and no hash, show the message, and stop. Ask the user to fix `plan.md` as the message says.

### Step 5: Check plan.md

Do these two checks before you write the preview, so that no task refers to an item that the checks move or remove.

- Fact check: check each fact that you added in this run, except a fact that the user gave (👤).
  - Read the code or the file list that the fact is about.
  - If a reader can see the fact there, it is obvious, also if you found it with a run.
  - Move it to the "because" part of the decision that it justifies, or remove it.
- 🤖 decision check: check each 🤖 decision that you added.
  - If it matches neither criterion (1) nor criterion (2) of the decision rule, remove it from `plan.md`.

### Step 6: Write the preview

- Overwrite `openspec/changes/<name>/tasks-preview.md` with this template.
- Put the hash of step 4 in the second line:

  ```markdown
  <!-- Generated. Edit plan.md, not this file. -->
  <!-- plan-sha256: <hash> -->

  ## 1. <group title>

  - 1.1 <task: a verifiable result>
    - Verify: <criteria>
    - Files: <paths, optional>

  ## 2. <next group, depends on 1>
  ```

- Follow the preview rule.

### Step 7: Record the new open questions

- Record each point that you cannot close with the question rule as an open question.
- Keep each kept question.
- If a task of the preview depends on a new open question, add to that task that it waits for the answer.

### Step 8: End

- If you added a fact or a decision after step 5, do the two checks of step 5 for it. If a check moves or removes an item that a task of the preview names, update that task.
- If the user answers a question that a task waits for, remove the "waits for the answer" note from that task, and change the task to follow the answer.
- If the user moves a rule to `## Constraints`, the preview is stale. Tell the user to run this skill again.
- List each fact, decision, and open question that you added, changed, or removed in `plan.md`, with its ID.
- For each open question that you removed, also give its answer.
- Ask each open question that is still open, also an existing one, with your recommended answer. Do not ask a kept question again. Give no recommendation when the answer is a fact that only the user knows.
- Show a table of each 🤖 decision that you added: `| Decision | Criterion | Why |`.
  - In Criterion, write (1) or (2) of the decision rule.
  - In Why, write the visible result for (1), or the close options for (2).
- Tell the user to read the preview.
- If the user disagrees, they put the correction in `plan.md`, and run this skill again. They do not edit `tasks-preview.md`.

## 3. Rules

### Plan.md rule: what you can edit

- Write to `plan.md` with no question.
- Edit only `## Facts`, `## Decisions`, and `## Open Questions`.
- The plan hash does not cover these sections, so the preview stays current.
- Do not edit Goal, Background, Non-Goals, or Constraints.

### Preview rule: the tasks

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order the tasks by dependency.
- Give each task verification criteria.
- Put tests and docs in the same task as the related code.
- Each task is a meaningful, verifiable result.
- Do not split the work into very small subtasks.
- Do not specify details that the coding agent can find itself.
- Pseudo-diffs are permitted.
- A task that depends on an open question, also a kept question, says that it waits for the answer.

### Question rule: close an open question

- A question is open only while you cannot decide it and cannot find its answer.
- You cannot decide a question when its answer depends on information that only the user has. Examples: an intent, or where some code is when a search of the repo does not find it.
- A question that ends with "(kept open by the user)" is a kept question:
  - Keep it, also if you can decide it, unless the user answers it now.
- For each other question, read the code and the docs, or run a command.
- If you find the answer:
  - If it is a non-obvious fact, record it with the fact rule.
  - If it is obvious, give it in the summary of step 8.
- If you can decide the question, also when no option is a clear winner:
  - If the decision rule records the choice, record a 🤖 decision.
  - If not, record no decision, and give the answer in the summary of step 8.
- Then remove the question.
- Do not record a point that you can decide as an open question.
- Write a new open question as `- OQ<n>: <question>`.
- If the user says to keep a question open, end its text with "(kept open by the user)".

### Answer rule: record an answer of the user

- If the user answers a question in this session, remove the question.
- Split the answer as well as you can:
  - Record each fact in it in `## Facts`, with 👤 and "Source: the user".
  - Record each choice or instruction in it in `## Decisions`, as a decision with no 🤖. You cannot edit `## Constraints`, so a rule that the change must follow is also a decision. A rule passes this test: if the result breaks it, the change is not done. In the summary, say that the user can move it to `## Constraints`.

### Decision rule: when to record a decision

- Record a decision when one of these is true:
  - (1) You plan something for the code that changes a visible result, and plan.md and the user did not say it. Then it is your choice: record it. A visible result is one of these:
    - a UI, a public interface, or the signature of an exported function
    - the input or output of a program, or a data format, also the output of another tool that the code reads, for example a field of its JSON output
    - a file name or path in the repo that another program, a config, or a doc outside this change refers to. A name that the program gives to its output, for example a download file name, is an output of the program
    - a key in a config file that a program or a user reads, for example a field of `package.json` or an env var, or a new dependency
    - the result on an error or an edge case, for example a status code, an exit code, an error message, or a thrown error
  - (2) You weighed two or more close options, and no option was a clear winner, also for an internal choice.
- Do not record your other choices.
- Record only the part of the decision that matches (1) or (2).
- If you need an internal detail to explain the reason, write it in the "because" part, not in the title or in "Chose X".

### Decision format

- Write `### Decision D<n>: <title>`.
- Then write "Chose X because Y."
- Add "Rejected Z because W." when there was an alternative.
- Each reason must come from this run, the user, plan.md, the code, or a well-known fact.
- A claim about how a tool, a runtime, or a platform behaves is not a well-known fact. Check it with a run or a doc, and give the source.
- If no source supports a reason, write "Reason not checked." in its place.
- Do not guess a reason, also not a wish of the user.

### Mark rule: the 🤖 mark

- End the heading with 🤖, unless the decision records an answer or an instruction of the user.
- A decision with no 🤖 belongs to the user, also one that the user wrote by hand.
- A decision with no 🤖 holds only what the user said. Put each choice that you add, and that the decision rule records, in its own 🤖 decision.
- When you update a 🤖 decision to follow an answer or an instruction of the user, remove its 🤖.
- The user removes the 🤖 to accept a decision.

### Current-decisions rule: keep `## Decisions` current

- `## Decisions` holds only the current decisions.
- You can update or remove a 🤖 decision:
  - Remove each one that a new decision supersedes.
  - Update each one that a new decision makes stale.
  - Update or remove each one that conflicts with a constraint or with a decision with no 🤖, for example after the user corrected `plan.md`.
- Change a decision with no 🤖 only when the user tells you to in this session.
- If your approach conflicts with a decision with no 🤖, record an open question.
- Then remove each fact that justifies no current decision or constraint, except a non-obvious fact.

### Fact rule: when to record a fact

- Record each non-obvious fact when you find it.
- A non-obvious fact needs one of these to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find it
- A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found it:
  - A run alone is not enough. The result must be one that a reader cannot see in the code or in the file list.
  - For example, what a script prints when its code shows it, or which files exist, is obvious.
- A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to it, also not the fact check of step 5.
- When a command, a tool, or a service gives an error or an output that makes you change what you do, record it, with the command and the error text. If a reader can see the same output in the code, it is an obvious fact.
- Do not record an obvious fact or a well-known fact in `## Facts`:
  - If it is the reason of a decision, write it in the "because" part of that decision.
  - If it justifies only a constraint or a non-goal, do not record it, because an edit of those sections makes the preview stale.
- Do not record a guess.
- A sentence that states a choice, for example "the script must read the item count", is a decision, not a fact.
- Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK.

### Fact format

- Write `- F<n>: <fact>`.
- Start the fact text with one emoji for its source:
  - 👤 the user
  - 📖 documentation
  - 🎫 a ticket
  - 📊 an external report
  - 🌐 online research or a community
  - 🔬 a test run or a probe
  - 🔍 a long analysis of the code
- Also give the source in words: a command or a test that you ran, the files that you analyzed, a doc URL, a log, or an error text.
- Do not change an existing fact only to add an emoji.
- Write a fact so that it stays true after the change, for example "Before this change, the report page did not exist."

### Exit-code rule

- To know the exit code of a command, run `node openspec/schemas/plan-lite/exit-code.mjs <command> <args...>` from the OpenSpec root.
- Run it alone, not in a chain. Read its last line `exit: <code>`.
- Do not add `echo $?`.
- If you did not get the exit code, record nothing about it.

### ID rule

- Give each new item a number higher than each ID of its kind in the file.
- Do not add an ID to an existing item that has none.
