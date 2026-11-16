---
name: openspec-lite-propose
description: Create a plan-lite change with openspec-lite. It writes a lightweight plan.md with goal, an optional background, non-goals, constraints, open questions, facts, and decisions. It does not write the full spec-driven artifacts. Use when the user asks for openspec-lite-propose or a plan-lite change. Also use it for a lightweight plan, or for a medium or large change that needs a plan but not a full OpenSpec change.
---

# openspec-lite-propose

Create a plan-lite change.

How to read this skill:

- Do sections 1 to 4 in order.
- The general rules apply at all times, in each section.
- A named rule, for example the question rule, applies in each step where its topic comes up, also when the step does not name the rule.
- `<name>` is the change name that step 1 of section 3 picks.

## General rules

- Do not write code, except after a yes to the Level 1 question, or to revert the code of a stopped Level 1 fix.
- When you write `## Goal`, follow the goal rule.
- When you record an open point, follow the question rule.
- If `plan.md` exists, record each reply of the user with the answer rule.
- If `plan.md` does not exist yet, keep each part of the reply that the answer rule records, also a part that adds or changes an outcome of the Goal. Record each part with the answer rule in section 3, step 5.
- If the request already answers a step question of the answer rule, follow that answer, and do not ask the question.
- If this workflow stops before section 3, step 5 is done, and the stop is not the end of a finished Level 1 fix, list in the stop report each answer of the user in this session, and each outcome that the user moved out. Tell the user to add the list to the request of the next run.
- When you record a fact, follow the fact rule.
- When you record a decision, follow the decision rule.
- When you add an item to `plan.md`, give the item an ID with the ID rule.

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

## 1. Split and Level 1 questions

### Main outcome

- Input: the request of the user.
- Output: the main outcome, and the list of the other outcomes.
- If the request names no outcome, ask the user what the change does, and end your turn. Do not invent a Goal. When the user replies, do the main outcome step again with the reply.
- The first outcome of the request is the main outcome, also when the request has only one outcome.
- If the request has more than one outcome, do the split check for each other outcome.
- If the request has only one outcome, go to the Level 1 question.

### Split check

- Input: each outcome that is not the main outcome, and the code that the outcomes touch.
- Output: the outcomes that stay in this change, and the outcomes that the user moved out.
- Do the split check for each outcome that is not the main outcome.
- If the outcome touches the same code as the main outcome, keep the outcome in this change. Do not ask.
- If the outcome does not touch the same code as the main outcome, and the outcome can ship alone, ask: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?"
- If the outcome does not touch the same code as the main outcome, and the outcome cannot ship alone, keep the outcome in this change. Do not ask.
- If more than one outcome needs the split question, ask all split questions in one reply.
- After the split questions, end your turn, and wait for the answer.
- On yes to the split question, leave the outcome out of this change. The outcome is an outcome that the user moved out.
- On no to the split question, keep the outcome as an outcome of this change.
- When the split check is done for each outcome, go to the Level 1 question.

### Level 1 question

- Input: the outcomes that stay in this change.
- Before you decide on the Level 1 question, list the open points of the outcomes for yourself.
- Do not write the open points yet. Section 3, step 5 records the open points in `plan.md` with the question rule.
- Put each point that the user leaves to the agent in the list too, so that section 3, step 5 records the point with its marker.
- A constraint of the request does not block the Level 1 question, because the fix follows each constraint of the request.
- If the outcomes that stay are one obvious fix, and each open point of the list is a point that the user leaves to the agent, ask: "This looks small. Implement directly with no change?"
- An empty list of open points also passes the test for the Level 1 question.
- Otherwise, do not ask the Level 1 question. Go to section 2.
- After the Level 1 question, end your turn, and wait for the answer.
- On yes, make the fix directly, with no change and no file under `openspec/`.
- On yes, follow each fact, constraint, and choice of the request and of the replies that you kept.
- On yes, follow the moved-out outcome rule.
- On yes, decide each point that the user leaves to the agent in the fix.
- On yes, in the reply, name each point that the user left to the agent, and the choice that the fix made.
- On yes, if the choice for a point that the user left to the agent is a guessed value of a fact that only the user knows, say so in the reply.
- On yes, if you find a point during the fix that you cannot decide, and that the user did not leave to you, stop the fix.
- You cannot decide a point when the point is an intent of the user, or a fact that only the user knows.
- You also cannot decide a point when the point is a value that must match something outside the repo, and no code or doc that you can reach shows the value.
- At the stop, name the point and the code that you already changed.
- At the stop, ask the user to answer the point, or to ask for a change. End your turn. Write no file under `openspec/`.
- After the stop, if the user answers the point, or leaves the point to you, and does not ask for a change, finish the fix, and give the reply that the "On yes" bullets describe.
- After the stop, if the user asks for a change, add the point that stopped the fix to the list of open points, and continue with section 2.
- After the stop, if the reply is not an answer, does not leave the point to you, and is not a request for a change, do not continue the fix, and create no change. Do what the reply asks, and name the code that the stopped fix changed.
- After the stop, if the reply asks to undo the fix, revert only the code that the stopped fix changed, and say that the code is reverted.
- On yes, stop after the fix and the names.
- On no, continue with section 2.

## 2. Schema check

Do these checks in order. When the checks are done, go to section 3.

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

## 3. Create the change

1. Pick the change name:
   - Input: the prompt, and the outcomes that stay in this change.
   - Output: `<name>`, a kebab-case change name.
   - If the prompt gives a change name, use the change name from the prompt.
   - If the prompt gives no change name, derive a kebab-case name of 2 to 10 words.
   - Start a derived name with the main outcome. You can add words from the other outcomes after the main outcome.
   - The limit of 10 words is a soft limit. Go over the limit only if a shorter name is not clear.
   - If the derived name is too long, remove the words of the other outcomes first.
   - Go to step 2.
2. Run `openspec new change "<name>" --schema plan-lite`.
   - If the command succeeds, go to step 3.
   - If the command fails because the change already exists, read `openspec/changes/<name>/.openspec.yaml`.
   - If `schema` is `plan-lite` and `plan.md` is missing, an earlier run stopped after step 2. Ask: "Resume the change <name>?" End your turn, and wait for the answer.
   - On yes to the resume question, go to step 3.
   - On no to the resume question, tell the user that the folder `openspec/changes/<name>/` stays, and that the user can delete it. Ask for another name. End your turn, and wait for the answer. Then do step 2 again with the new name.
   - If the change already exists, and has `plan.md` or a schema that is not `plan-lite`, show the error, and ask for another name. End your turn, and wait for the answer. Then do step 2 again with the new name.
   - In each other failure case, follow the failure rule. A new name does not fix the error.
3. Read `openspec/changes/<name>/.openspec.yaml` before you edit the file.
   - OpenSpec 1.14.2 already writes `skip_specs: true` in `.openspec.yaml`.
   - If the `skip_specs: true` line exists, do not edit `.openspec.yaml`.
   - If the `skip_specs: true` line is missing, add the line.
   - Do not add a second `skip_specs` line. A second `skip_specs` line is a duplicate key, and the duplicate key breaks each CLI command on the change.
   - Go to step 4.
4. Run `openspec instructions plan --change "<name>" --json`.
   - If the command fails, or its output has no `template` field, follow the failure rule. Do not write `plan.md` from memory.
   - Write `openspec/changes/<name>/plan.md` from the `template` field of the output.
   - Go to step 5.
5. Fill `plan.md`:
   - Input: the request, the answers of the user, the outcomes that stay in this change, and the list of open points of section 1.
   - Output: `openspec/changes/<name>/plan.md`.
   - Fill only what is known. Leave the other sections empty.
   - Write `## Goal` with the goal rule, from the outcomes that stay in this change.
   - Record each open point of the list in `## Open Questions` with the question rule.
   - Record each fact, constraint, or choice of the request with the answer rule.
   - Record each part of a reply that you kept before `plan.md` existed with the answer rule.
   - Do not remove a `<!-- ... -->` guidance comment from `plan.md`.
   - Do not remove a line of a guidance comment that spans more than one line.
   - Each guidance comment must still be in `plan.md` when you are done.
   - Write the content of a section on the lines under the guidance comment, not in place of it.
   - Do not invent non-goals, constraints, facts, or decisions.
   - Do not write an outcome that the user moved out, also not in `## Non-Goals`. The summary of section 4 names the outcome.
   - Go to section 4.

### Goal rule

- `## Goal` holds one outcome by preference.
- If the change has more than one outcome, write one outcome per bullet in `## Goal`.
- Write each outcome of `## Goal` in one or two sentences.

### Question rule

- Outside the Level 1 fix, propose decides no open point, and reads the code only for the split check, for the Level 1 test, and to answer a question of the user.
- Record each open point as an open question in `## Open Questions`. The tasks preview tries to decide the open question later.
- If the user says to keep a question open, end the text of the question with "(kept open by the user)".
- Add the "(kept open by the user)" marker only when the user says to keep the question open.
- If the request or a reply of the user leaves a point to the agent, keep or record the point as an open question in `## Open Questions`.
- If the request or a reply of the user leaves a point to the agent, end the text of the question with "(left to the agent by the user)".
- The tasks preview or apply decides a point that the user left to the agent later.

### Answer rule

- If a part of the answer only asks you to run a command or a skill, or asks you a question, do the request or answer the question. Record nothing from that part. If you run an openspec-lite skill for the part, give the change name and the OpenSpec root in the prompt of the skill call. Do the request of the part last, after you record and finish the other parts of the answer.
- A step question is a question that a step or a rule of the current workflow asks, also a question of a skill that the current workflow runs. An open point or an open question is never a step question.
- An answer to a step question is not a fact, a constraint, or a choice for plan.md. Follow the step that asked the question, also when the answer asks you to run a command or a skill. Record the other parts of the answer.
- If the user says to keep a question open, keep the question in `## Open Questions`, and add the marker with the question rule.
- Sort each other part of the answer into one of three kinds. Each part has one kind.
- These parts have no kind: a part that only asks for a command, a skill, or an answer; an answer to a step question; and a part that says to keep a question open.
- Kind 1, a part to record: a fact, a constraint, a choice, or an instruction of the user. A part that accepts an option or a recommended answer that the agent named is a choice of the user.
- Kind 2, a part that leaves a choice to the agent: the user names no option, and says that the agent can choose, or that each option is good for the user. Follow the question rule for the point.
- Kind 3, a part that says that the user cannot answer the question now: keep the question in `## Open Questions`, with no marker, and record nothing. Do not ask the question again in this session.
- If a part of kind 1 answers an open question of `plan.md`, remove that question from `## Open Questions`. Remove no other question.
- A fact says how something is. An instruction says what to do. An instruction is never a fact.
- Record each part of the answer in one section only.
- If a part limits the result and also says how to build the result, record the limit as a constraint, and the build choice as a decision with no 🤖.
- Record each fact in the answer in `## Facts`, with 👤 and "Source: the user".
- A problem that the Goal fixes is part of the Goal. Do not record the problem as a fact.
- If a part of the answer adds an outcome to the Goal, or changes an outcome that the Goal states, edit the Goal to match the answer. Do not ask the split question for an added outcome, because the user chose the outcome.
- Do not record a constraint or a decision that contradicts the Goal.
- Record each constraint in the answer in `## Constraints`.
- A constraint limits the result that a user or a program sees, or says what the change must not add. A constraint passes this test: if the result breaks the constraint, the change is not done.
- A choice of how to build the result is not a constraint, also when the user gives the choice. Examples: "resize the images in a background job", or "write the thumbnails to `public/thumbs/`".
- If the user names an item of `plan.md`, for example by its ID or its title, and tells you to change or remove the item, change or remove the item. Do not record the instruction as a decision.
- Record each other choice or instruction in the answer as a decision with no 🤖.
- A part of kind 2 is not a choice of the user.
- An instruction that adds work for an outcome of the Goal is a choice of the user, for example "also add a migration for the old data" or "update the deploy script".
- The decision rule and the question rule select only your own choices. Do not use the decision rule or the question rule to drop a part of an answer of the user.
- Record each part of kind 1 in a section of plan.md, also an answer to an open question.
- Do not put a part of kind 1 only in the end summary.
- After you record the answer, read the answer again, part by part.
- If a part of kind 1 is in no section of plan.md after the second read, record the part now.

### Fact rule

- Start each fact with a source emoji, as the template comment of `## Facts` says, for example 👤 for a fact that the user gave.
- Write a fact so that the fact stays true after the change, for example "Before this change, the thumbnail folder did not exist."
- Do not record statistics that soon go out of date.
- A number as an example or a reference is OK in a fact.

### Decision rule

- Write `### Decision D<n>: <title>`, then "Chose X because Y."
- One decision records one choice. If the user made two choices, write two decisions.
- If there was an alternative, add "Rejected Z because W."
- If the user gave no reason, end the sentence after X or Z, and add the sentence "Reason not checked." Do not guess a reason.
- A decision of propose records a choice of the user. Write no 🤖 on a decision of propose.
- `## Decisions` holds only the current decisions, not a history.
- When you add a decision, remove each superseded decision.
- When you add a decision, update each stale decision.

### ID rule

- Give each constraint, open question, fact, and decision an ID: `C<n>`, `OQ<n>`, `F<n>`, or `D<n>`, as the template comments of `plan.md` say.
- Give each new item a number higher than each ID of its kind in the file.
- You can use the `plan.md` IDs in `plan.md` and in your reply to the user, for example in the summary.
- In another file, a code comment, or a commit message, refer to an item by its title, or a short form of its text, with the change name.

### Moved-out outcome rule

- Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for each outcome.

## 4. End

1. Give the summary:
   - Show the change name and the path of `plan.md`.
   - If a stopped Level 1 fix changed code that you did not revert, name each file of that code.
   - Follow the moved-out outcome rule.
   - Go to step 2.
2. At the end of the reply, after the summary, write the questions in one numbered list:
   - First, each open question that you recorded in `plan.md`, so that the user can answer the open question.
   - Do not ask a question that ends with "(kept open by the user)", or a question that ends with "(left to the agent by the user)".
   - Do not ask a question that the user said in this session that the user cannot answer now. Name the question as still open.
   - Last, the question: "Do you want a tasks preview?"
   - If the list has a question, end your turn after the list, and wait for the answer.
   - If the list has no question, because the request answers the tasks-preview question, follow that answer now.
   - When the user replies, first record the reply with the answer rule.
   - If you added, changed, or removed an item in `plan.md`, list each such item, with its ID.
   - If you added an outcome to the Goal, quote the new outcome. If you changed an outcome of the Goal, quote the old outcome and the new outcome.
   - Then, on a yes of the reply or of the request, run the `openspec-lite-tasks-preview` skill. Give `<name>` and the OpenSpec root in the prompt of the skill call.
   - On yes, if you cannot invoke a skill, tell the user to run `openspec-lite-tasks-preview`.
   - On no, recommend `openspec-lite-apply` as the next step, and end your turn.
   - If the reply has no yes and no no, and the request does not answer the tasks-preview question, ask the tasks-preview question again.
