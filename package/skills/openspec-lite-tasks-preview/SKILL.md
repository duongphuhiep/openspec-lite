---
name: openspec-lite-tasks-preview
description: Generate or regenerate tasks-preview.md for a plan-lite change. It lists the code changes the agent intends to make, for human review before coding. It is a reference, not a contract. Use only when the user asks for openspec-lite-tasks-preview, or for a tasks preview of a plan-lite change.
---

# openspec-lite-tasks-preview

Write `tasks-preview.md` for a plan-lite change. Record what you learn in `plan.md`. Do not write code.

How to read this skill:

- Do the checks of section 1 in order. Then do steps 1 to 8 of section 2 in order.
- The general rules of section 2 apply at all times, in each step.
- A named rule of section 3, for example the question rule, applies in each step where its topic comes up, also when the step does not name the rule.
- The OpenSpec root is the folder that holds `openspec/`. Run each command from the OpenSpec root.
- `<name>` is the name of the change.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Input: the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- Run `openspec list --json`, and read `root.path`. The folder in `root.path` is the OpenSpec root.
- Run each command from the OpenSpec root. Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command with `cd <root> && `.
- After the user confirms a root, also start the first command with `cd <root> && `.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root.
- If more than one folder matches, ask the user to pick one folder.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Input: the prompt, and the `changes` list of `openspec list --json`.
- Output: the name of the change, written `<name>` in this skill.
- If the prompt names a change, use that change.
- If the prompt names no change, read the `changes` list from the same `openspec list --json` output.
- The `changes` list does not give the schema, so read `schema` from the `.openspec.yaml` of each change.
- If only one active change exists, use that change.
- If more than one active change exists, ask the user to pick one change. Show the name and the schema of each change, so that the user sees which changes this skill accepts.
- If no active change exists, stop. Tell the user that no active change exists.

### Guard

- Input: `openspec/changes/<name>/.openspec.yaml`, `openspec/changes/<name>/tasks.md`, and `openspec/changes/<name>/plan.md` if `plan.md` exists.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If the schema is `plan-lite`, go to the schema check.
- If the schema is not `plan-lite`, and `openspec/changes/<name>/tasks.md` exists, point the user to stock `/opsx:apply`.
- If the schema is not `plan-lite`, and `openspec/changes/<name>/tasks.md` does not exist, point the user to stock `/opsx:continue`.
- If the schema is not `plan-lite`, and `openspec/changes/<name>/plan.md` still exists, name each open question of `plan.md`.
- If you name an open question of `plan.md`, tell the user to answer the open question before the stock skill, because the stock skills do not read `plan.md`.
- If `plan.md` does not exist, or `plan.md` has no open question, say nothing about `plan.md`.
- If the schema is not `plan-lite`, stop after the pointer. Do not write `tasks-preview.md`.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare the version with the shipped version:

   Shipped schema version: 6

   - If the file is missing, the version is lower, or the file has no readable `version` line, run the `openspec-lite-schema` skill.
   - If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
   - If the user declines the copy of the schema, stop.
   - After the copy, read the version again. If the version still differs from the shipped version, stop, and report both versions.
   - After the copy, if the version equals the shipped version, go to item 3 of the schema check. Do not end your turn after `openspec-lite-schema` finishes.
   - In your end summary, copy the report of `openspec-lite-schema`: the `status:`, `backup:`, and each `copied:` line that `install.mjs` printed, as they are, and the `config.yaml` line.
   - If the version is higher than the shipped version, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   - If the version equals the shipped version, go to item 3 of the schema check.
3. Run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - The script compares `openspec --version` with the range in `schema.yaml`. The script prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run the script alone, not in a chain.
   - Read the first word of the line, not the exit code. Do not compare the versions yourself.
   - On `ok:`, continue with the next step of this skill.
   - On `warn:`, show the line as a warning. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Continue with the next step of this skill.
   - On `fail:`, show the line. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Stop.

## 2. Steps

### General rules

- Edit `plan.md` only as the plan.md rule says.
- Each time the user answers an open question, record the answer with the answer rule.
- Each time the user gives a fact, a rule, or a choice for the change in a reply, record the reply with the answer rule.
- When you make a decision, record the decision with the decision rule, the decision format, and the mark rule.
- When you add or change a decision, keep `## Decisions` current with the current-decisions rule.
- When you find a fact, record the fact with the fact rule and the fact format.
- When you need the exit code of a command, use the exit-code rule.
- When you add an item to `plan.md`, give the item an ID with the ID rule.
- If the user answers a question that a task of the preview waits for, remove the "waits for the answer" note from that task. Then change the task to follow the answer.
- If the user moves a rule to `## Constraints`, the preview is stale. Tell the user to run this skill again.
- If the user replies after step 8, and the reply does not make the preview stale, record the reply with the general rules. Then run step 8 again for the items that the reply changed.

### Step 1: Check that plan.md exists

- Input: `openspec/changes/<name>/plan.md`.
- If `openspec/changes/<name>/plan.md` is missing, stop. Tell the user to run `openspec-lite-propose`.
- If `openspec/changes/<name>/plan.md` exists, go to step 2.

### Step 2: Report the commit state of plan.md

- Input: `openspec/changes/<name>/plan.md`.
- Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root.
- Run the `plan-status.mjs` command alone, not in a chain.
- If `plan-status.mjs` prints a line, copy the line to the user as it is.
- If `plan-status.mjs` prints nothing, say nothing about commits.
- Go to step 3.

### Step 3: Explore, and close the open questions

- Input: `plan.md`, and the code that the change touches.
- Output: the updates of `## Facts`, `## Decisions`, and `## Open Questions` in `plan.md`.
- Read `plan.md`.
- Explore the code that the change touches.
- A question that ends with "(kept open by the user)" is a kept question.
- Keep each kept question, also if you can decide the kept question, unless the user answers the kept question now.
- Before you write the tasks, try to close each question that is not a kept question with the question rule.
- Go to step 4.

### Step 4: Get the plan hash

- Input: `openspec/changes/<name>/plan.md`.
- Output: the plan hash.
- From the OpenSpec root, run:

  ```sh
  node openspec/schemas/plan-lite/plan-hash.mjs openspec/changes/<name>/plan.md
  ```

- You do not need the exit code of `plan-hash.mjs`.
- If `plan-hash.mjs` prints a message that starts with `plan-hash:` and no hash, show the message, and stop. Ask the user to fix `plan.md` as the message says.
- If `plan-hash.mjs` prints a hash, keep the hash for step 6. Go to step 5.

### Step 5: Check the facts and the 🤖 decisions

Do these two checks before you write the preview, so that no task refers to an item that the checks move or remove.

1. Fact check: check each fact that you added in this run, except a fact that the user gave (👤).
   - Read the code or the file list that the fact is about.
   - If a reader can see the fact in the code or in the file list, the fact is obvious, also if you found the fact with a run.
   - Move each obvious fact to the "because" part of the decision that the fact justifies, or remove the obvious fact.
2. 🤖 decision check: check each 🤖 decision that you added in this run.
   - If a 🤖 decision matches neither criterion (1) nor criterion (2) of the decision rule, remove the 🤖 decision from `plan.md`.

When the checks are done, go to step 6.

### Step 6: Write the preview

- Input: `plan.md`, and the plan hash of step 4.
- Output: `openspec/changes/<name>/tasks-preview.md`.
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

- Write the tasks with the preview rule.
- Go to step 7.

### Step 7: Record the new open questions

- Input: the points that you found in steps 3 to 6.
- Output: the new questions in `## Open Questions` of `plan.md`, and the updates of `tasks-preview.md`.
- Record each point that you cannot close with the question rule as an open question.
- Keep each kept question.
- If a task of the preview depends on a new open question, add to that task that the task waits for the answer.
- Go to step 8.

### Step 8: End

1. If you added a fact or a decision after step 5, do the two checks of step 5 for that fact or decision.
2. If a check of item 1 moves or removes an item that a task of the preview names, update that task.
3. Give the end summary:
   - List each fact, decision, and open question that you added, changed, or removed in `plan.md`, with its ID.
   - If you added, changed, or removed no item in `plan.md`, say that you changed no item.
   - For each open question that you removed, give its answer.
   - Ask each open question that is still open, also an existing one, with your recommended answer.
   - Do not ask a kept question again.
   - Give no recommendation when the answer is a fact that only the user knows.
   - Show a table of each 🤖 decision that you added: `| Decision | Criterion | Why |`. In the Criterion column, write (1) or (2) of the decision rule. In the Why column, write the visible result for (1), or the close options for (2).
   - If you added no 🤖 decision, show no table.
4. Tell the user to read the preview.
5. Tell the user what to do on disagreement: put the correction in `plan.md`, and run this skill again. The user does not edit `tasks-preview.md`.

## 3. Rules

### Plan.md rule: what you can edit

- Write to `plan.md` with no question.
- Edit only `## Facts`, `## Decisions`, and `## Open Questions`.
- The plan hash does not cover `## Facts`, `## Decisions`, and `## Open Questions`, so your edits of these sections do not make the preview stale.
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
- A task that depends on an open question, also a kept question, says that the task waits for the answer.

### Question rule: close an open question

- A question is open only while you cannot decide the question and cannot find its answer.
- You cannot decide a question when its answer depends on information that only the user has. Examples: an intent, or where some code is when a search of the repo does not find the code.
- To close a question, read the code and the docs, or run a command.
- If you find the answer, and the answer is a non-obvious fact, record the fact with the fact rule.
- If you find the answer, and the answer is obvious, give the answer in the end summary of step 8.
- If you can decide the question, also when no option is a clear winner, and the decision rule records the choice, record a 🤖 decision.
- If you can decide the question, and the decision rule does not record the choice, record no decision. Give the answer in the end summary of step 8.
- When you close a question, remove the question from `## Open Questions`.
- Do not record a point that you can decide as an open question.
- Write a new open question as `- OQ<n>: <question>`.

### Answer rule: record a reply of the user

- If a reply of the user in this session answers an open question, remove the question from `## Open Questions`.
- If the user says to keep a question open, keep the question in `## Open Questions`, and end its text with "(kept open by the user)".
- Add the "(kept open by the user)" marker only when the user says to keep the question open, for example "keep it open" or "leave it open".
- An answer such as "I do not know yet" leaves the question open with no marker.
- Split the reply of the user as well as you can into facts, rules, and choices.
- A fact says how something is, for example "the report page does not exist yet". An instruction says what to do, for example "use plain HTML under `src/`". An instruction is never a fact.
- Record each part of the reply in one section only.
- Record each fact of the reply in `## Facts`, with 👤 and "Source: the user".
- Record each choice or instruction of the reply in `## Decisions`, as a decision with no 🤖.
- You cannot edit `## Constraints`, so record each rule of the reply that the change must follow in `## Decisions`, as a decision with no 🤖.
- A rule limits the result that a user or a program sees, or says what the change must not add. A rule passes this test: if the result breaks the rule, the change is not done.
- A choice of how to build the result is not a rule, also when the user gives the choice. Examples: "use a sliding window", or "use plain HTML under `src/`".
- For each rule that you record as a decision, say in the end summary that the user can move the rule to `## Constraints`.

### Decision rule: when to record a decision

- Record a decision when criterion (1) or criterion (2) is true.
- Criterion (1): you plan something for the code that changes a visible result, and plan.md and the user did not say it. The thing is your choice, so record the thing as a decision.
- A visible result is one of these things:
  - a UI, a public interface, or the signature of an exported function
  - the input or output of a program, or a data format, also the output of another tool that the code reads, for example a field of its JSON output
  - a file name or path in the repo that another program, a config, or a doc outside this change refers to
  - a name that the program gives to its output, for example a download file name
  - a key in a config file that a program or a user reads, for example a field of `package.json` or an env var
  - a new dependency
  - the result on an error or an edge case, for example a status code, an exit code, an error message, or a thrown error
- Criterion (2): you weighed two or more close options, and no option was a clear winner. Criterion (2) also applies to an internal choice.
- Do not record your other choices.
- Record only the part of the decision that matches criterion (1) or criterion (2).
- If you need an internal detail to explain the reason, write the detail in the "because" part, not in the title or in "Chose X".

### Decision format

- Write `### Decision D<n>: <title>`, with `<n>` higher than each decision ID in the file.
- After the heading, write "Chose X because Y."
- Add "Rejected Z because W." when there was an alternative.
- Each reason must come from this run, the user, plan.md, the code, or a well-known fact.
- A claim about how a tool, a runtime, or a platform behaves is not a well-known fact. Check the claim with a run or a doc, and give the source.
- If no source supports a reason, write "Reason not checked." in place of the reason.
- Do not guess a reason, also not a wish of the user.

### Mark rule: the 🤖 mark

- End the heading of a decision with 🤖, unless the decision records an answer or an instruction of the user.
- A 🤖 in an HTML comment, for example in a template comment, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖.
- A decision with no 🤖 belongs to the user, also a decision that the user wrote by hand.
- A decision with no 🤖 holds only what the user said. Put each choice that you add, and that the decision rule records, in its own 🤖 decision.
- When you update a 🤖 decision to follow an answer or an instruction of the user, remove the 🤖 of that decision.
- The user removes the 🤖 to accept a decision.

### Current-decisions rule: keep `## Decisions` current

- `## Decisions` holds only the current decisions.
- Remove each 🤖 decision that a new decision supersedes.
- Update each 🤖 decision that a new decision makes stale.
- Update or remove each 🤖 decision that conflicts with a constraint or with a decision with no 🤖, for example after the user corrected `plan.md`.
- Change a decision with no 🤖 only when the user tells you to in this session.
- If your approach conflicts with a decision with no 🤖, record an open question.
- After you update the decisions, remove each fact that justifies no current decision or constraint, except a non-obvious fact.

### Fact rule: when to record a fact

- Record each non-obvious fact when you find the fact.
- A non-obvious fact needs one of these sources to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find the fact
- A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found the fact.
- A run alone does not make a fact non-obvious. The result must be one that a reader cannot see in the code or in the file list.
- For example, the output of a script is obvious when the code of the script shows the output. The list of files that exist is obvious too.
- A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to a 👤 fact, also not the fact check of step 5.
- When a command, a tool, or a service gives an error or an output that makes you change what you do, record the output as a fact, with the command and the error text.
- If a reader can see the same output in the code, the output is an obvious fact.
- Do not record an obvious fact or a well-known fact in `## Facts`.
- If an obvious fact or a well-known fact is the reason of a decision, write the fact in the "because" part of that decision.
- If an obvious fact or a well-known fact justifies only a constraint or a non-goal, do not record the fact. The preview cannot edit `## Constraints` or `## Non-Goals`, so the fact has no place.
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
- Write a fact so that the fact stays true after the change, for example "Before this change, the report page did not exist."

### Exit-code rule

- To know the exit code of a command, run `node openspec/schemas/plan-lite/exit-code.mjs <command> <args...>` from the OpenSpec root.
- Run the `exit-code.mjs` command alone, not in a chain.
- Read the last line of the output: `exit: <code>`.
- Do not add `echo $?`.
- If you did not get the exit code, record nothing about the exit code.

### ID rule

- Give each new item a number higher than each ID of its kind in the file.
- Do not add an ID to an existing item that has none.
