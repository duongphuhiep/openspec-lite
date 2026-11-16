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
- The OpenSpec root is the folder that holds `openspec/`.
- `<name>` is the name of the change.

## 1. Common checks

Do these checks in order.

### OpenSpec root

- Input: the prompt, and the output of `openspec list --json`.
- Output: the OpenSpec root, the folder that holds `openspec/`.
- If the prompt gives no OpenSpec root, run `openspec list --json`.
- If the prompt gives an OpenSpec root, run `cd <root> && openspec list --json`, with the folder of the prompt as `<root>`.
- Read `root.path` of the output. The folder in `root.path` is the OpenSpec root.
- If `openspec list --json` prints no JSON, show the error, and stop. Tell the user to check that `openspec` is installed.
- If `root` is `null`, `openspec list --json` exits with code 1. That exit code is not a failure of the action.
- Run each `openspec` command, and each command with a relative `openspec/...` path, from the OpenSpec root.
- Read each `openspec/...` path from the OpenSpec root.
- If the OpenSpec root is not the current folder, start each `openspec` command, and each command with a relative `openspec/...` path, with `cd <root> && `.
- The `cd <root> && ` prefix does not count as a chain. A command with the prefix is a single command, also for the failure rule.
- In a monorepo, the OpenSpec root can be a subfolder of the git root. OpenSpec searches only up from the current folder, not down.
- If `root` is `null`, search the subfolders for an `openspec/` folder that holds `config.yaml`, `changes/`, or `specs/`. Skip `.git/`, `node_modules/`, and `apm_modules/`.
- If one folder matches, ask the user to confirm the folder as the root. End your turn, and wait for the answer.
- If more than one folder matches, ask the user to pick one folder. End your turn, and wait for the answer.
- After the user confirms or picks a folder, run `cd <root> && openspec list --json`, with that folder as `<root>`. The next checks use the output of this run.
- If the user rejects the folder, or picks no folder, stop. Tell the user to run the skill from the OpenSpec root.
- If no folder matches, stop. Tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/`.
- Do not run `openspec init` in a parent of an existing root.

### Change selection

- Input: the prompt, and the `changes` list of the last `openspec list --json` output of the OpenSpec root block.
- Output: the name of the change, written `<name>` in this skill.
- An active change is an entry of the `changes` list.
- A change has no schema when its `.openspec.yaml` is missing or has no `schema` line. Show `none` as the schema of such a change.
- If the `changes` list is empty, stop. Tell the user that no active change exists.
- Read `schema` from the `.openspec.yaml` of each change. The `changes` list does not give the schema.
- If the prompt names a change, use that change.
- If the prompt names a change that is not in the `changes` list, ask the user to pick one change. End your turn, and wait for the answer.
- If the prompt names no change, and only one active change exists, use that change.
- If the prompt names no change, and more than one active change exists, ask the user to pick one change. End your turn, and wait for the answer.
- When you ask the user to pick one change, show the name and the schema of each active change, so that the user sees which changes this skill accepts.
- If the change to use has no schema, stop. Tell the user that the change has no schema, so this skill cannot use the change.

### Guard

- Input: `openspec/changes/<name>/.openspec.yaml`, `openspec/changes/<name>/tasks.md`, and the input of the leftover plan.md questions rule.
- Output: go to the schema check, or stop.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If the schema is `plan-lite`, go to the schema check.
- If the schema is not `plan-lite`, and `openspec/changes/<name>/tasks.md` exists, point the user to stock `/opsx:apply`.
- If the schema is not `plan-lite`, and `openspec/changes/<name>/tasks.md` does not exist, point the user to stock `/opsx:continue`.
- If the schema is not `plan-lite`, name the open questions of `plan.md` with the leftover plan.md questions rule.
- If the schema is not `plan-lite`, stop after the pointer and the open questions. Do not write `tasks-preview.md`.

### Leftover plan.md questions

- Run this rule only when a step of the guard calls this rule.
- Input: these sections of `openspec/changes/<name>/`:
  - `## Open Questions` of `plan.md`.
  - `## 0. Open questions` of `tasks.md`.
  - `## Open Questions` of `design.md`.
  - The other content of `proposal.md`, `design.md`, and `specs/` of the change, for an answer.
- Output: each open question of `plan.md`, with the artifact that holds the question.
- If `plan.md` does not exist, or `plan.md` has no open question, say nothing about `plan.md`.
- An HTML comment in `## Open Questions` of `plan.md` is not a question.
- For each open question of `plan.md`, check if `## 0. Open questions` of `tasks.md` or `## Open Questions` of `design.md` holds the question.
- A missing file holds no question.
- An artifact holds a question when the artifact asks the same question. The ID, a prefix such as "Answer:", and other words around the question do not decide the match.
- An artifact holds the answer of a question when the artifact states the answer as a fact, a decision, or a requirement. Content on the same topic that does not answer the question is not the answer.
- If an artifact holds the question, and no artifact holds the answer of the question, name the question and the artifact, because the stock skills meet the question there.
- If an artifact holds the answer of the question, name the question as closed, with the artifact that holds the answer. Do not ask the user to answer the question.
- If no artifact holds the question, and no artifact holds the answer of the question, do these steps:
  1. Name the question.
  2. Tell the user to write the answer of the question in an artifact of the change before the next stock skill or archive, because the stock skills do not read `plan.md`.
  3. Tell the user that the question can then be deleted from `plan.md`.

### Schema check

1. Read the `version` line from `openspec/schemas/plan-lite/schema.yaml`.
2. Compare the version with the shipped version:

   Shipped schema version: 8

   - If the version equals the shipped version, go to item 3 of the schema check.
   - If the version is higher than the shipped version, stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`."
   - If the file is missing, the version is lower, or the file has no readable `version` line, run the `openspec-lite-schema` skill. Give the OpenSpec root in the prompt of the skill call.
   - If you cannot invoke a skill, tell the user to run `openspec-lite-schema`, and stop.
   - If the user says no to the replace question of `openspec-lite-schema`, stop.
   - Do not end your turn after `openspec-lite-schema` finishes.
   - After `openspec-lite-schema` finishes, copy the report of `openspec-lite-schema` to your reply. Copy the report also when this skill stops later.
   - The report of `openspec-lite-schema` is the `status:` line, the `backup:` line, each `copied:` line, and the `config.yaml` line.
   - Copy the `status:`, `backup:`, and `copied:` lines as `install.mjs` printed them.
   - After the copy of the schema, read the version again.
   - After the copy of the schema, if the version still differs from the shipped version, stop, and report both versions.
   - After the copy of the schema, if the version equals the shipped version, go to item 3 of the schema check.
3. Run `node openspec/schemas/plan-lite/openspec-version.mjs`.
   - The script compares `openspec --version` with the range in `schema.yaml`. The script prints one line that starts with `ok:`, `warn:`, or `fail:`.
   - Run the script alone, not in a chain.
   - Read the first word of the line, not the exit code.
   - Do not compare the versions yourself.
   - On `ok:`, continue with the next step of this skill.
   - On `warn:`, show the line as a warning. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Continue with the next step of this skill.
   - On `fail:`, show the line. Point to https://github.com/duongphuhiep/openspec-lite#compatibility. Stop.
   - If the output has no line that starts with `ok:`, `warn:`, or `fail:`, handle the output as `fail:`.

## 2. Steps

### General rules

- Edit `plan.md` only as the plan.md rule says.
- Each time the user replies after step 2, record the reply with the answer rule.
- After step 2, and before step 3, record with the answer rule the request that starts this run, and each reply of the user to a question of section 1. The general rules handle the request as a reply.
- When you make a decision, record the decision with the decision rule, the decision format, and the mark rule.
- When you add or change a decision, keep `## Decisions` current with the current-decisions rule.
- When you find a fact, record the fact with the fact rule and the fact format.
- When you ask an open question, follow the ask rule.
- When you need the exit code of a command, use the exit-code rule.
- When an action fails, follow the failure rule.
- When you write a reply to the user, follow the reply order rule.
- When you add an item to `plan.md`, give the item an ID with the ID rule.
- A reply that adds an outcome to the Goal, or changes an outcome that the Goal states, asks to change the existing text of the Goal.
- A part adds an outcome only when the part asks for a result that no outcome of the Goal needs. Work that an outcome of the Goal needs is work for that outcome, not a new outcome.
- If a reply asks to change the existing text of Goal, Background, Non-Goals, or Constraints, do these actions in order:
  1. Record the other parts of the reply with the answer rule.
  2. List each item that you recorded, with its ID.
  3. Tell the user to make the requested edit in `plan.md` and to run this skill again.
  4. If the requested edit answers an open question, name the question with its ID, and tell the user to remove the question in the same edit of `plan.md`.
  5. End your turn.
- A new constraint in a reply follows the answer rule.
- If a reply after step 8 changes no item of `plan.md`, answer the reply. Do not run step 8 again.
- If the user replies after step 8, the reply changes an item of `plan.md`, and the reply does not ask to change Goal, Background, Non-Goals, or Constraints, do these actions in order:
  1. Record the reply with the general rules.
  2. Add, update, or remove each task, so that the preview follows the changed items.
  3. If the reply answers a question that a task waits for, remove the "waits for the answer" note from that task. Change that task to follow the answer.
  4. Run step 7 and step 8 again.
- When step 8 runs again after a reply, list in the end summary of item 3 only the items that you added, changed, or removed after the reply.
- When step 8 runs again after a reply, show the table of item 3 only for the 🤖 decisions that you added after the reply. If you added no 🤖 decision after the reply, show no table.

### Failure rule

- An action is a command, a script, a skill call, a tool call, or a read, a write, an edit, or a delete of a file.
- An action fails when the action exits non-zero, is denied, or gives an error. If a step names the outputs of the action, the action also fails when the action prints another output.
- A search that finds no match does not fail, also when the search command exits with code 1, as `grep` and `git grep` do. No match is the output of the search.
- If a step gives its own failure branch, follow that branch.
- If a Bash call with more than one command is denied, do the same action once more in a second form. The second form is single commands, one command in each call, or the Read, Write, or Edit tool.
- Do not try a third form.
- Do not run a denied single command again.
- If no step needs the output of the failed action, do not stop. Name the action and the error in your reply, and go on without the output.
- Examples of an action whose output no step needs: an extra check, or a read of a link for more context.
- A step always needs the output of these actions: a run of the tests that the step names, and a write, an edit, or a delete of a file.
- Do not make up a missing output yourself, for example a template, a hash, a version, or a status line.
- If a step needs the output of a failed action, and no second form is left to try, do these steps in order:
  1. Show the command or the file, and the error text.
  2. Name each file that this run changed.
  3. Tell the user what to fix, and to start this workflow again.
  4. Stop.
- Before you report a write, an edit, or a delete as done, check the file on disk.
- Do not report a file as written, or a step as done, unless the action passed.
- If a reply to a yes-or-no question has no yes and no no, and the step gives no branch for that case, ask the question again. Do no action that depends on the answer.

### Reply order rule

- If a reply has a question or a request, put each question and each request at the end of the reply.
- A request is an action that the workflow waits for before the workflow can go on.
- Examples of a request: an answer, a fix that a stop needs, or a mark that the user must remove.
- Advice for later is not a request, for example the next skill to run, or a file to read or commit.
- Put advice before the first question or request.
- Put each summary, list, warning, report, and result of the reply before the first question or request.
- If a reply has more than one question or request, put all the questions and requests together at the end of the reply, in one numbered list.
- Write nothing after the last question or request: no note, no summary line, and no offer.
- A request can end with the step that the user does after the action, for example a re-run of this workflow. Keep that step in the request, after the action.

### Step 1: Check that plan.md exists

- Input: `openspec/changes/<name>/plan.md`.
- If `openspec/changes/<name>/plan.md` is missing, stop. Tell the user to run `openspec-lite-propose`.
- If `openspec/changes/<name>/plan.md` exists, go to step 2.

### Step 2: Commit plan.md if it is not committed

- Input: `openspec/changes/<name>/plan.md`.
- Run `node openspec/schemas/plan-lite/plan-status.mjs openspec/changes/<name>/plan.md` from the OpenSpec root.
- Run the `plan-status.mjs` command alone, not in a chain.
- If `plan-status.mjs` does not run, or prints an error, say nothing about commits, and go to step 3.
- If `plan-status.mjs` prints nothing, say nothing about commits, and go to step 3.
- If `plan-status.mjs` prints a line, commit only `openspec/changes/<name>/plan.md`, from the OpenSpec root. A file that the user staged then stays out of the commit.
- To commit `plan.md`, run `git add -- openspec/changes/<name>/plan.md` alone. Then run `git commit -m "plan.md: checkpoint before tasks-preview" -- openspec/changes/<name>/plan.md` alone.
- If the commit succeeds, tell the user that you committed `plan.md`.
- If `git add` or `git commit` fails, show the error. Tell the user to commit `plan.md` themselves before the next run.
- Wait for the result of `git commit` before you go to step 3. Do not run a command of step 3 in parallel with the commit.
- Go to step 3.

### Step 3: Explore, and close the open questions

- Input: `plan.md`, and the code that the change touches.
- Output: the updates of `## Facts`, `## Decisions`, and `## Open Questions` in `plan.md`.
- Read `plan.md`.
- Explore the code that the change touches.
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
- If `plan-hash.mjs` prints a message that starts with `plan-hash:` and no hash, follow the failure rule. The message says what to fix in `plan.md`.
- If the output has no hash and no `plan-hash:` message, follow the failure rule. Do not compute the hash another way.
- If `plan-hash.mjs` prints a hash, keep the hash for step 6. Go to step 5.

### Step 5: Check the facts and the 🤖 decisions

Do these two checks before you write the preview, so that no task refers to an item that the checks move or remove.

1. Fact check: check each fact that you added in this run, except a fact that the user gave (👤).
   - Read the code or the file list that the fact is about.
   - Decide if the fact is obvious with the fact rule.
   - Move each obvious fact to the "because" part of the 🤖 decision that the fact justifies, or remove the obvious fact.
2. 🤖 decision check: check each 🤖 decision that you added in this run.
   - If a 🤖 decision matches none of the criteria (1), (2), and (3) of the decision rule, remove the 🤖 decision from `plan.md`.

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

- Input: the points that you found in steps 3 to 6, and the reply of the user when step 7 runs again after a reply.
- Output: the new questions in `## Open Questions` of `plan.md`, and the updates of `tasks-preview.md`.
- Record each point that you cannot close with the question rule as an open question.
- If a task of the preview depends on a new open question, add to that task that the task waits for the answer.
- Go to step 8.

### Step 8: End

1. If you added a fact or a decision after step 5, do the two checks of step 5 for that fact or decision.
2. If a check of item 1 moves or removes an item that a task of the preview names, update that task.
3. Give the end summary:
   - List each fact, decision, and open question that you added, changed, or removed in `plan.md`, with its ID.
   - If you added, changed, or removed no item in `plan.md`, say that you changed no item.
   - For each open question that you removed, give its answer.
   - Show a table of each 🤖 decision that you added: `| Decision | Criterion | Why |`. In the Criterion column, write (1), (2), or (3) of the decision rule. In the Why column, write the visible result for (1), the close options for (2), or what can surprise for (3).
   - If you added no 🤖 decision, show no table.
   - Give each other item that a step or a rule sends to the end summary.
   - For each decision that you added in this run to record a constraint of the user, say that the user can move the decision to `## Constraints`. Also say that the move makes the preview stale, so the user runs this skill again after the move.
4. In one sentence, give a tip: `openspec-lite-upgrade` can convert the change to a stock spec-driven OpenSpec change, if the team convention requires one. Do not recommend the upgrade. If you gave the tip in an earlier reply of this run, do not give the tip again.
5. Tell the user to read the preview.
6. Tell the user what to do on disagreement: put the correction in `plan.md`, and run this skill again. The user does not edit `tasks-preview.md`.
7. Recommend `openspec-lite-apply` as the next step.
8. Last, ask each open question that is still open and is not a kept question, new or existing, with the ask rule. Put the questions at the end of the reply, after items 3 to 7, as the reply order rule says.
   - Do not ask a question for which a part of kind 3 of the answer rule came in this session. Name the question as still open, with each task that waits for the answer.

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
- A task that depends on an open question, kept or not, says that the task waits for the answer.

### Question rule: close an open question

- A question is open only while you cannot decide the question and cannot find its answer.
- You cannot decide a question when its answer is an intent of the user, or a fact that only the user knows.
- You cannot decide a point when the code must match something outside the repo, and no code, doc, or run that you can reach shows what the code must match. For example, the folder where a deploy tool expects the build output.
- A convention or "Reason not checked." does not decide a point that must match something outside the repo, because the other side can use another form.
- Record a point that must match something outside the repo, and that you cannot decide, as an open question, not as a 🤖 decision.
- The user left a point to you when the user answered that the point is left to you, or when the question ends with "(left to the agent by the user)".
- A point that the user left to you is not open any more, also when the code must match something outside the repo.
- If the user left a point to you, and the point is an intent or a choice, decide the point with the own-choice rule.
- If the user left a point to you, and the point is a fact that only the user knows, do not record a guess as a fact. Choose the value that the tasks plan for the code. Record the choice as a 🤖 decision. Say in the end summary that the fact stays unknown.
- A 🤖 decision that records a value for a fact that only the user knows matches criterion (3) of the decision rule, because a guessed value can surprise a reader.
- If the user left a point to you, and the point depends on an intent and also on a fact that only the user knows, follow both the intent bullet and the fact bullet of this rule.
- To close a question, read the code and the docs, or run a command.
- If you find the answer, and the answer is a non-obvious fact, record the fact with the fact rule.
- If you find the answer, and the answer is obvious, give the answer in the end summary of step 8.
- If you can decide the question, also when no option is a clear winner, decide the question with the own-choice rule.
- When you close a question, remove the question from `## Open Questions`.
- Do not record a point that you can decide as an open question.
- Write a new open question as `- OQ<n>: <question>`.
- One open question asks one thing. If you have two questions, write two open questions.
- A question that ends with "(kept open by the user)" is a kept question.
- Keep each kept question until a message of the user answers the kept question, also if you can decide the kept question.
- Do not ask a kept question.
- If a message of the user answers a kept question, record the answer with the answer rule.

### Own-choice rule: record a choice that you decide

- If the decision rule records your choice, record the choice as a 🤖 decision.
- If the decision rule does not record your choice, record no decision. Give the choice in the end summary of step 8.

### Ask rule: ask an open question

- Give your recommended answer for each open question.
- Give no recommendation when the answer is a fact that only the user knows. Say why you give no recommendation.
- If the answer depends on an intent of the user and also on a fact that only the user knows, give your recommended answer for the intent, and name the fact that you need.
- If the answer can change an outcome that the Goal states, quote that outcome of the Goal in the question, and say that the answer can change the Goal.

### Answer rule: record a reply of the user

- If a part of the reply only asks you to run a command or a skill, or asks you a question, do the request or answer the question. Record nothing from that part. If you run an openspec-lite skill for the part, give the change name and the OpenSpec root in the prompt of the skill call. Do the request of the part last, after you record and finish the other parts of the reply.
- A step question is a question that a step or a rule of the current workflow asks, also a question of a skill that the current workflow runs. An open point or an open question is never a step question.
- An answer to a step question is not a fact, a constraint, or a choice for plan.md. Follow the step that asked the question, also when the answer asks you to run a command or a skill. Record the other parts of the reply.
- If the request that starts the run already answers a step question, follow that answer, and do not ask the question.
- If the user says to keep a question open, keep the question in `## Open Questions`, and end its text with "(kept open by the user)".
- Add the "(kept open by the user)" marker only when the user says to keep the question open.
- Sort each other part of the reply into one of three kinds. Each part has one kind.
- These parts have no kind: a part that only asks you to run a command or a skill, or asks you a question; an answer to a step question; a part that says to keep a question open; and a part that asks to change Goal, Background, Non-Goals, or Constraints. The general rules of section 2 handle a part that asks to change Goal, Background, Non-Goals, or Constraints.
- Kind 1, a part to record: a fact, a constraint, a choice, or an instruction of the user. A part that accepts an option or a recommended answer that you named is a choice of the user.
- Kind 2, a part that leaves a choice to you: the user names no option, and says that you can choose, or that each option is good for the user. Follow the question rule for the point.
- Kind 3, a part that says that the user cannot answer the question now: keep the question in `## Open Questions`, with no marker, and record nothing. Do not ask the question again in this session.
- If a part of kind 1 or kind 2 answers an open question, remove that question from `## Open Questions`. Remove no other question.
- Split the reply of the user as well as you can into facts, constraints, and choices.
- A fact says how something is, for example "before this change, the thumbnail folder did not exist". An instruction says what to do, for example "write the thumbnails to `public/thumbs/`". An instruction is never a fact.
- Record each part of the reply in one section only.
- If a part limits the result and also says how to build the result, record the limit and the build choice as two decisions with no 🤖.
- Record each fact of the reply in `## Facts`, with 👤 and "Source: the user".
- The user can name an item of `## Facts`, `## Decisions`, or `## Open Questions`, for example by its ID or its title.
- If the user names an item and tells you to change or remove the item, change or remove the item. Do not record the instruction as a decision.
- Record each choice or instruction of the reply in `## Decisions`, as a decision with no 🤖.
- A part that leaves a choice to you is not a choice of the user.
- An instruction that adds work for an outcome of the Goal is a choice of the user, for example "also add a migration for the old data" or "update the deploy script".
- The decision rule and the question rule select only your own choices. Do not use the decision rule or the question rule to drop a part of a reply of the user.
- Record each part of kind 1 in a section of plan.md, also an answer to an open question. Do not put a part of kind 1 only in the end summary.
- After you record the reply, read the reply again, part by part. If a part of kind 1 is in no section of plan.md, record the part now.
- You cannot edit `## Constraints`, so record each constraint of the reply in `## Decisions`, as a decision with no 🤖.
- A constraint limits the result that a user or a program sees, or says what the change must not add. A constraint passes this test: if the result breaks the constraint, the change is not done.
- A choice of how to build the result is not a constraint, also when the user gives the choice. Examples: "resize the images in a background job", or "write the thumbnails to `public/thumbs/`".

### Decision rule: when to record a decision

- Record a decision when criterion (1), criterion (2), or criterion (3) is true.
- Criterion (1): you plan something for the code that changes a visible result, and plan.md and the user did not say that thing.
- A visible result is one of these things:
  - a UI, a public interface, or the signature of an exported function
  - the input or output of a program, or a data format
  - a file name or path in the repo that another program, a config, or a doc outside this change refers to
  - a name that the program gives to its output
  - a key in a config file that a program or a user reads, for example a key of a YAML config file, or an env var
  - a new dependency
  - the result on an error or an edge case, for example a status code, an exit code, an error message, or a thrown error
- plan.md or the user can fix only one part of a visible result, for example the width of a thumbnail. Each other part that you plan for the code is your choice, for example the height, the file format, or the file name.
- Criterion (2): you weighed two or more close options, and no option was a clear winner. Criterion (2) also applies to an internal choice.
- Criterion (3): your choice is not obvious, and the choice can surprise a reader of the code or a user. Criterion (3) also applies to an internal choice.
- Do not record a choice that matches none of the criteria (1), (2), and (3). An obvious choice gets no decision only when the choice matches none of the criteria.
- Record only the part of the decision that matches criterion (1), criterion (2), or criterion (3).
- If you need an internal detail to explain the reason, write the detail in the "because" part, not in the title or in "Chose X".

### Decision format

- Write `### Decision D<n>: <title>`, with `<n>` higher than each decision ID in the file.
- After the heading, write "Chose X because Y."
- One decision records one choice. If you made two choices, write two decisions, each with its own reason.
- Add "Rejected Z because W." when there was an alternative.
- Each reason must come from this run, the user, plan.md, the code, or a well-known fact.
- A claim about how a tool, a runtime, or a platform behaves is not a well-known fact. Check the claim with a run or a doc, and give the source.
- If no source supports a reason, end the sentence after X or Z, and add the sentence "Reason not checked."
- Do not guess a reason, also not a wish of the user.

### Mark rule: the 🤖 mark

- End the heading of a decision with 🤖, unless the decision records an answer or an instruction of the user.
- A 🤖 in an HTML comment, for example in a template comment, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖.
- A decision with no 🤖 belongs to the user, also a decision that the user wrote by hand.
- A decision with no 🤖 holds only what the user said. Put each choice that you add, and that the decision rule records, in its own 🤖 decision.
- When you update a 🤖 decision to follow a part of kind 1 of the answer rule, remove the 🤖 of that decision.
- If a part of kind 2 of the answer rule leaves the new choice of a 🤖 decision to you, decide the new choice with the question rule. A decision for the new choice keeps its 🤖, because a part of kind 2 is not a choice of the user.
- Each part that the user chose keeps no 🤖.
- The user removes the 🤖 to accept a decision.

### Current-decisions rule: keep `## Decisions` current

- `## Decisions` holds only the current decisions.
- Remove each 🤖 decision that a new decision supersedes.
- If a new instruction of the user supersedes a decision with no 🤖, and the instruction does not name the decision, remove the old decision. Record each part that the user chose as a decision with no 🤖. Decide each part that the user leaves to you with the question rule.
- If a new instruction of the user supersedes a decision with no 🤖, and the instruction names the decision, follow the answer rule.
- Update each 🤖 decision that a new decision makes stale.
- Update or remove each 🤖 decision that conflicts with a constraint or with a decision with no 🤖, for example after the user corrected `plan.md`. Record no question for that conflict.
- Change a decision with no 🤖 only when the user tells you to in this session, when a new instruction of the user supersedes the decision, or to move a choice that you added into its own 🤖 decision.
- If the tasks of the preview cannot follow a constraint or a decision with no 🤖, record the conflict as an open question.
- After you update the decisions, remove each fact that justifies no current decision or constraint, except a non-obvious fact.

### Fact rule: when to record a fact

- Record each non-obvious fact when you find the fact.
- A non-obvious fact needs one of these sources to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find the fact
- A fact that a reader can easily deduce from the code or the file list, with no long analysis, is an obvious fact, also if a run found the fact.
- A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to a 👤 fact, also not the fact check of step 5.
- When a command, a tool, or a service gives an error or an output that makes you change what you do, and the output is a non-obvious fact, record the output as a fact, with the command and the error text.
- Do not record an obvious fact or a well-known fact in `## Facts`.
- If an obvious fact or a well-known fact is the reason of a 🤖 decision, write the fact in the "because" part of that decision. If the decision has no 🤖, do not record the fact.
- If an obvious fact or a well-known fact justifies only a constraint or a non-goal, do not record the fact. The preview cannot edit `## Constraints` or `## Non-Goals`, so the fact has no place.
- Do not record a guess.
- A sentence that states a choice, for example "the code must resize the images in one batch", is a decision, not a fact.
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
- Write a fact so that the fact stays true after the change, for example "Before this change, the thumbnail folder did not exist."

### Exit-code rule

- To know the exit code of a command, run `node openspec/schemas/plan-lite/exit-code.mjs <command> <args...>` from the OpenSpec root.
- Run the `exit-code.mjs` command alone, not in a chain.
- `exit-code.mjs` runs `<command>` in the current folder. If `<command>` must run in a folder that is not the OpenSpec root, start the call with `cd <folder> && `, and give the absolute path of `exit-code.mjs`. A command with the `cd <folder> && ` prefix is a single command.
- Read the last line of the output: `exit: <code>`.
- If the last line is `exit: not run (...)`, or has no `exit:`, the command did not run. Follow the failure rule.
- Do not add `echo $?`.

### ID rule

- Give each new item a number higher than each ID of its kind in the file.
- Do not add an ID to an existing item that has none.
- You can use the `plan.md` IDs in `plan.md`, in `tasks-preview.md`, and in your reply to the user, for example in the summary.
- If the ID comment of an older `plan.md` gives another form of the ID rule, follow this ID rule.
