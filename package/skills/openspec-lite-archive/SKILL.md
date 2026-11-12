---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements and the contracts of plan.md to OpenSpec specs and the decisions to ADRs, with user approval, then runs openspec archive. Use this skill when the user asks for openspec-lite-archive, or asks to archive a change whose .openspec.yaml has schema plan-lite, also when the user types /opsx:archive. Stock /opsx:archive does not promote plan.md, so the knowledge in it is lost. Use this skill instead of it for a plan-lite change, before the change is archived.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion.

How to read this skill:

- Do section 1, section 2, and section 3 in order.
- In section 1, do the checks in this order: the OpenSpec root, the change selection, the guard, and the schema check.
- The guard can send you to the guard path. The guard path replaces the schema check, section 2, and section 3.
- When the schema check says "continue with the next step of this skill", go to section 2, step 1.
- In section 2, do steps 1 to 11 in order. Each step ends with the next step.
- The general rules apply at all times, in each step and on the guard path.
- `<name>` is the name of the change, from the change selection.

## General rules

- Write nothing before the user approves.
- Write each approved draft exactly as the user approved it. If you must change an approved draft, show the change, and ask for approval again.
- An ADR that an earlier run wrote needs no new approval, because the user approved the ADR in that run. Show the ADR, and do not ask about the ADR.
- The `Status:` edit of step 10 needs no approval, because the approval of the new ADR with the `Supersedes:` line covers the edit. Do not ask about the edit.
- Do not remove a 🤖 yourself. Only the user removes a 🤖.
- Write no 🤖 in a spec or an ADR.
- Write no source emoji in a spec, for example 👤 or 🔬. Give the source of a fact in words in the requirement text. An ADR keeps the source emoji of a fact.
- If a fact of `plan.md` has no source emoji, add no emoji, and do not guess its source. Give the source in words only when the fact names it.
- A 🤖 in an HTML comment, for example in a template comment of `plan.md`, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖.
- The ID rule: use the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in `plan.md` and `tasks-preview.md`.
- The ID rule also forbids a `plan.md` ID in another file, a code comment, a commit message, a pull request, or a ticket.
- To refer to a `plan.md` item from outside `plan.md` and `tasks-preview.md`, use the item title, or a short form of its text, with the change name.

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

- Input: the `schema` line of `openspec/changes/<name>/.openspec.yaml`, and the file `openspec/changes/<name>/plan.md`.
- Output: the path to follow: the schema check, or the guard path.
- Read `schema` from `openspec/changes/<name>/.openspec.yaml`.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` exists, continue with the schema check.
- If `schema` is `plan-lite`, and `openspec/changes/<name>/plan.md` does not exist, stop. Tell the user to write `plan.md` with `openspec-lite-propose` first.
- If `schema` is not `plan-lite`, follow the guard path below. Do not run the schema check, section 2, or section 3.

The guard path:

1. Offer to copy the decisions of `design.md` to ADRs.
   - Input: `openspec/changes/<name>/design.md`.
   - Output: the approved ADRs in `openspec/adr/`, and the answer of the user to the offer.
   - If `openspec/changes/<name>/design.md` has no `### Decision` entries, go to guard step 2.
   - If `openspec/changes/<name>/design.md` has `### Decision` entries, warn: "Stock `/opsx:archive` does not turn the decisions in `design.md` into ADRs. They stay only in the archive folder. To keep them as ADRs, copy them to `openspec/adr/` before you archive."
   - A change that was upgraded from plan-lite has its decisions in `design.md`.
   - Offer to copy each `### Decision` of `design.md` to an ADR. Write nothing before the user says yes.
   - End your turn after the offer, and wait for the answer. In the same reply, offer nothing else, also not the archive.
   - If the user says no, write no ADR, and go to guard step 2.
   - If the user says yes, draft each ADR with the form and the three checks of section 2, step 5.
   - Show the drafts as in section 2, step 6.
   - Write each approved ADR with the file rules and the `Supersedes:` edits of section 2, step 10, without its `validate` condition.
   - On the guard path, do not run section 2, steps 7 to 9.
   - On the guard path, do not change `design.md`.
   - When the approved ADRs are written, go to guard step 2.
2. Search `specs/` and `design.md` of the change for 🤖.
   - Do this search after the ADRs of guard step 1 are written, or after the user says no to the offer of guard step 1.
   - If a line of `specs/` or `design.md` has a 🤖, list each such line. Tell the user to accept the line (remove the mark) or delete the line.
   - If no line has a 🤖, say nothing about marks.
   - Before each reply that says what holds a 🤖, search `specs/` and `design.md` again.
   - Go to guard step 3.
3. Name the open questions of a kept `plan.md`.
   - If `openspec/changes/<name>/plan.md` still exists, name each open question in `plan.md`.
   - If `openspec/changes/<name>/plan.md` does not exist, say nothing about `plan.md`.
   - Go to guard step 4.
4. Block the archive while a delta holds a 🤖.
   - If a delta in `specs/` holds a 🤖, do not offer the archive, and do not tell the user to run stock `/opsx:archive`, because the CLI copies the 🤖 into the main spec.
   - The block also forbids a question with a condition, such as "Do you want me to archive after you remove the marks?".
   - If a delta in `specs/` holds a 🤖, ask the user to remove the marks, and end your turn.
   - When the user replies after guard step 4, go to guard step 2. Keep the answer of the user to the offer of guard step 1.
   - If no delta in `specs/` holds a 🤖, go to guard step 5.
5. Give the archive step.
   - If the user said no to the offer of guard step 1, tell the user to run stock `/opsx:archive`, and stop.
   - If the user said no to the offer of guard step 1, do not offer the `openspec archive` command yourself. Do not offer to archive in any other words, for example "I can run the archive for you".
   - In each other case, ask: "Archive the change now with `openspec archive <name> --yes`?"
   - If `tasks.md` has unchecked tasks, name how many in the same question, because `--yes` skips the CLI prompt for them.
   - If `tasks.md` has no unchecked tasks, or does not exist, say nothing about tasks.
   - If the user says yes to the archive question, run the command. The command applies the deltas of `specs/` and moves the change to the archive. Report the result.
   - If the user says no to the archive question, tell the user to run stock `/opsx:archive` later.

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

## 2. Archive

`<dir>` is `openspec/changes/<name>`.

### Step 1: Done check

- Input: `<dir>/plan.md`, and the code.
- Output: the warnings for each item that is not met, or no warning.
- Answer three questions: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty?
- An HTML comment in `## Open Questions` does not count as a question.
- To find the code, search for what each outcome of the Goal names, for example with `git grep`.
- Run each search from the git root, because an earlier `cd` can stay in effect.
- Get the git root with `git rev-parse --show-toplevel` as its own command.
- Then search with `git -C <git root> grep <word>`.
- Do not judge from the first lines of `git ls-files`, because tool folders such as `.claude/` and `apm_modules/` fill them.
- Name each outcome and each constraint that is not met, and each open question that is left.
- If each answer is "yes", go to step 2.
- If an answer is "no", show the warnings, and ask only: "Archive anyway?" Give no other options in this question. End your turn.
- If the user says yes to "Archive anyway?", go to step 2.
- If the user says no to "Archive anyway?", give the paths below, then stop:
  - For each outcome or constraint that is not met, give two paths: implement it with `openspec-lite-apply`, or remove it from `plan.md` and propose it as a separate change with `openspec-lite-propose`.
  - For each open question that is left, tell the user to run `openspec-lite-apply` with the answer, so that apply records it.
  - Tell the user to run `openspec-lite-archive` again.
  - Also say: to keep an item that is not in `plan.md`, add it to `plan.md` first.

### Step 2: Read plan.md

- Input: `<dir>/plan.md`.
- Read `<dir>/plan.md`.
- Do not use `tasks-preview.md` for promotion.
- Go to step 3.

### Step 3: Select the items

- Input: the items of `<dir>/plan.md`.
- Output: the selected items.
- Select each item that passes at least one filter. The filters are **Non-obvious**, **Surprising**, **Contract**, and **Non-obvious fact**.
- **Non-obvious**: a reader cannot deduce the item from the code in 5 minutes.
- **Surprising**: the item would surprise a new team member.
- **Contract**: externally observable behavior that a client or another team depends on.
- Internal helpers, log text, and UI layout are not contracts.
- The format of a file or of an output that another program reads is a contract, for example the line format of a log file that a monitor parses, or the date format of a JSON field.
- A contract is a requirement, even if the contract is obvious from the code.
- **Non-obvious fact**: a fact of `## Facts` that needs one of these to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find it
- A fact that a reader can easily deduce from the code or the file list is never a non-obvious fact, also if a run found the fact: a run alone is not enough.
- A fact that the user gave (👤) is always non-obvious.
- Step 4 says where a non-obvious fact goes.
- Go to step 4.

### Step 4: Sort each item

- Input: the items of `<dir>/plan.md`, and the selected items of step 3.
- Output: the list of items to draft, each with its destination, and the list of items that you do not draft.
- A selected constraint goes to a spec, as a requirement.
- A selected decision goes to an ADR.
- If a decision is also a contract, draft the contract as a requirement. The rationale of the decision can also go to an ADR.
- List each other item of `plan.md` that you do not draft, including each non-goal, with a one-line reason. No item disappears with no word.
- A fact goes to the `## Context` of each ADR whose decision the fact justifies. Keep the source emoji of the fact.
- A fact that justifies a requirement goes into the requirement text, as its reason, with no source emoji, for example "The token SHALL expire after 24 hours, because the mobile app caches it for one day."
- A non-obvious fact goes to the `## Context` of each drafted ADR that the fact relates to.
- If no drafted ADR holds a non-obvious fact, and no drafted requirement holds the fact as its reason, draft an ADR for the fact:
  - The `## Context` of the fact ADR holds the fact and its source.
  - The `## Decision` of the fact ADR says how the change uses or handles the fact, as the code shows.
  - The `## Consequences` of the fact ADR says what a later change must keep.
- If the change does not depend on a non-obvious fact, do not draft the fact: list the fact as not drafted.
- List each other fact that is in no draft as not drafted, with a one-line reason.
- Go to step 5.

### Step 5: Draft the full text of each item

- Input: the items to draft of step 4, `openspec/specs/`, and `openspec/adr/`.
- Output: the drafts of the deltas and the ADRs.

The delta format:

- Before the first delta, run `openspec instructions specs --change "<name>" --schema spec-driven --json`.
- Follow the delta format in the `instruction` of the result. The `instruction` gives the format for each header, including the `**Reason**` and `**Migration**` lines of REMOVED and the `FROM:` and `TO:` lines of RENAMED.
- If `skip_specs` is set, the result also has `skipped: true` and a warning. Ignore both, because step 8 removes `skip_specs` when a delta exists.

**Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.

- To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new capability only when none matches.
- For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without the `## Purpose` section, the CLI writes "TBD" as the Purpose of the new main spec.
- Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
- Write each requirement as `### Requirement: <name>`, with SHALL or MUST, as the CLI instruction says.
- If an item gives a reason, for example the "because" part of a constraint, keep the reason in the requirement text. A scenario title alone does not keep the reason.
- Give each ADDED or MODIFIED requirement at least one `#### Scenario: <name>` with **WHEN** and **THEN** lines. Derive the scenario from `plan.md` and the code.
- For MODIFIED, copy the full requirement from `openspec/specs/<capability>/spec.md`, then edit the copy.

**Decision**: an ADR in this exact form. `Status:` and `Change:` are plain lines, not sections:

```markdown
# <Title>

Status: Accepted
Change: <name>

## Context

## Decision

## Consequences
```

The first check, for existing ADRs:

- Before you draft a decision, search `openspec/adr/` for files with the line `Change: <name>`.
- An earlier run of this archive can have written these files.
- Show each file with the line `Change: <name>`.
- Do not draft a decision or a fact that already has an ADR.

The second check, for a **Superseded ADR**:

- Read the title and `## Decision` of each ADR in `openspec/adr/` with the line `Status: Accepted`.
- If a new decision fully replaces an old ADR, add the line `Supersedes: <old file name>` after the `Change:` line of the draft.
- If a new decision changes only part of an old decision, add no line. Tell the user that both ADRs stay `Accepted`.
- If a new decision replaces no old ADR, add no line.

The third check, for `plan.md` IDs:

- Search each draft for a `plan.md` ID (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`).
- Replace each ID with the item title, or a short form of its text, as the ID rule says.

When each item has a draft, go to step 6.

### Step 6: Show all drafts

- Input: the drafts of step 5.
- Output: the approved drafts.
- Show all drafts.
- Name each draft, a spec draft or an ADR draft, that holds content from a decision whose heading ends with 🤖, in `plan.md` or, on the guard path, in `design.md`, because the user did not confirm the decision yet. Name the 🤖 decision for each such draft.
- If no decision heading ends with 🤖, say nothing about marks.
- For each draft with a `Supersedes:` line, name the old ADR, and say that the `Status` line of the old ADR changes.
- The user answers yes, no, or edit for each item. Apply each edit.
- Tell the user that they can pick a skipped item to draft.
- After you show the drafts, end your turn, and wait for the answer of the user.
- If the user picks a skipped item, draft the item, show the draft for approval, end your turn, and wait for the answer.
- When the user approved or rejected each draft, go to step 7.

### Step 7: Write the deltas

- Input: the files under `<dir>/specs/`, and the approved deltas of step 6.
- Output: the deltas in `<dir>/specs/`.
- Before you write, list the files under `<dir>/specs/`.
- If no file exists under `<dir>/specs/`, write the approved deltas to `<dir>/specs/<capability>/spec.md`.
- If a file exists under `<dir>/specs/`, the file is from an earlier run. Show each file, ask the user to keep or delete each file, and end your turn.
- When the user replies, delete each file that the user said to delete. Keep each other file for the merge.
- Then write the approved deltas to `<dir>/specs/<capability>/spec.md`.
- If a kept file has the same path as an approved delta, merge the new delta into the kept file, with no duplicate requirement.
- Go to step 8.

### Step 8: Set skip_specs

- Input: the files under `<dir>/specs/` now.
- Output: `<dir>/.openspec.yaml`.
- If any file exists under `<dir>/specs/`, remove `skip_specs` from `<dir>/.openspec.yaml`.
- If no file exists under `<dir>/specs/`, make sure that `skip_specs: true` is set.
- `validate` fails with a delta and the flag, and also with no delta and no flag.
- Go to step 9.

### Step 9: Validate

- Run `openspec validate "<name>"`.
- If `validate` fails, stop and report.
- If `validate` passes, go to step 10.

### Step 10: Write the ADRs

- Input: the approved ADRs of step 6.
- Output: the ADR files in `openspec/adr/`.
- Only after `validate` passes in step 9, write each approved ADR to `openspec/adr/YYYY-MM-DD-<slug>.md`.
- Do not write an ADR in the same command as `validate`.
- Use today's date.
- Skip a decision or a fact that already has an ADR with `Change: <name>`.
- If the file name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR.
- After you write a new ADR with a `Supersedes:` line, edit the old ADR. Change only the `Status:` line of the old ADR to `Status: Superseded by <new file name>`. Do not change any other line of the old ADR.
- Then check each ADR with `Change: <name>` and a `Supersedes:` line, also the ADRs of an earlier run. If the old ADR of such an ADR does not have `Status: Superseded by`, edit the `Status:` line of the old ADR now.
- Go to step 11.

### Step 11: Archive

- Run `openspec archive "<name>" --yes`.
- The CLI applies the deltas to `openspec/specs/`, and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`.
- If `openspec archive` fails, report the failure, and list the ADRs that you wrote. Then stop.
- If `openspec archive` fails, keep the ADRs: each ADR is still a correct decision.
- If `openspec archive` passes, go to section 3.

## 3. End

- List the specs that changed, the ADRs that you wrote, the ADRs that you marked as superseded, and the archive path.
- If the user rejected a draft of a decision, say that this decision now exists only in `openspec/changes/archive/`.
