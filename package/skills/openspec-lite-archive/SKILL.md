---
name: openspec-lite-archive
description: Archive a finished plan-lite change. It promotes the non-obvious requirements and the contracts of plan.md to OpenSpec specs and the decisions to ADRs, with user approval, then runs openspec archive. Use this skill when the user asks for openspec-lite-archive, or asks to archive a change whose .openspec.yaml has schema plan-lite, also when the user types /opsx:archive. Stock /opsx:archive does not promote plan.md, so the knowledge in it is lost. Use this skill instead of it for a plan-lite change, before the change is archived.
---

# openspec-lite-archive

Archive a plan-lite change with selective promotion. Write nothing before the user approves.

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
- If it is `plan-lite`, continue with the schema check.
- If it is not `plan-lite`, follow the guard path below, and do not run section 2.

The guard path:

1. Tell the user to run stock `/opsx:archive`.
2. If `openspec/changes/<name>/design.md` has `### Decision` entries:
   - Warn: "Stock `/opsx:archive` does not turn the decisions in `design.md` into ADRs. They stay only in the archive folder. To keep them as ADRs, copy them to `openspec/adr/` before you archive." A change that was upgraded from plan-lite has its decisions there.
   - Offer to copy each `### Decision` of `design.md` to an ADR. Write nothing before the user says yes.
   - On no, tell the user to run stock `/opsx:archive`, and stop. Do not offer the `openspec archive` command yourself.
   - On yes, draft each ADR with the form and the two checks of section 2, step 5, and show the drafts as in step 6. Write each approved ADR with the file rules and the `Supersedes:` edits of step 10, without its `validate` condition. Do not run steps 7 to 9, and do not change `design.md`.
3. After the ADRs are written, search `specs/` and `design.md` of the change for 🤖.
   - If a line has one, list each such line. Tell the user to accept it (remove the mark) or delete it.
   - Do not remove a 🤖 yourself: only the user removes it.
   - Before each reply that says what holds a 🤖, search again.
4. If `plan.md` still exists, name each open question in it.
5. Do not offer the archive while a delta in `specs/` holds a 🤖, because the CLI copies it into the main spec.
   - This also forbids a question with a condition, such as "Do you want me to archive after you remove the marks?".
   - Ask the user to remove the marks, and end your turn.
6. Otherwise, ask: "Archive the change now with `openspec archive <name> --yes`?"
   - If `tasks.md` has unchecked tasks, name how many in the same question, because `--yes` skips the CLI prompt for them.
   - On yes, run the command. It applies the deltas of `specs/` and moves the change to the archive. Report the result.
   - On no, tell the user to run stock `/opsx:archive` later.

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

## 2. Archive

`<dir>` is `openspec/changes/<name>`.

1. **Done check**: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty? An HTML comment does not count. To find the code, search for what each outcome of the Goal names, for example with `git grep`. Run each search from the git root, because an earlier `cd` can stay in effect: get the root with `git rev-parse --show-toplevel` as its own command, then search with `git -C <git root> grep <word>`. Name each outcome that is not met. Do not judge from the first lines of `git ls-files`, because tool folders such as `.claude/` and `apm_modules/` fill them. If an answer is "no", show the warnings and ask only: "Archive anyway?" Give no other options in this question. On no, give the paths below, then stop. For each outcome or constraint that is not met, give two paths: implement it with `openspec-lite-apply`, or remove it from `plan.md` and propose it as a separate change with `openspec-lite-propose`. For each open question that is left, tell the user to run `openspec-lite-apply` with the answer, so that apply records it. Then tell the user to run `openspec-lite-archive` again. Also say: to keep an item that is not in `plan.md`, add it to `plan.md` first.
2. Read `<dir>/plan.md`. Do not use `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
   - **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It is a requirement, even if it is obvious from the code.
   - **Non-obvious fact**: a fact of `## Facts` that needs an answer of the user, a run or a test result, research of remote sources, a long analysis of the code, or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code or the file list is not one, also if a run found it: a run alone is not enough. Step 4 says where it goes.
4. Sort each item:
   - A requirement goes to a spec, and a decision goes to an ADR. If a decision is also a contract, draft the contract as a requirement. Its rationale can also go to an ADR.
   - List each other item of `plan.md` that you do not draft, including each non-goal, with a one-line reason. No item disappears with no word.
   - A fact goes to the `## Context` of each ADR whose decision it justifies. Keep its source emoji. A fact that justifies a requirement goes into the requirement text, as its reason, for example "The token SHALL expire after 24 hours, because the mobile app caches it for one day."
   - A non-obvious fact goes to the `## Context` of each drafted ADR that it relates to. If no drafted ADR holds it, and no drafted requirement holds it as its reason, draft an ADR for the fact. Its `## Context` holds the fact and its source. Its `## Decision` says how the change uses or handles the fact, as the code shows. Its `## Consequences` says what a later change must keep. If the change does not depend on the fact, do not draft it: list it as not drafted. A non-obvious fact needs one of these to find: an answer of the user; a run or a test result; research of remote sources, for example documentation on the internet, another repo, logs, or a remote database; a long analysis of the code; or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code or the file list is never a non-obvious fact, also if a run found it: a run alone is not enough. A fact that the user gave (👤) is always non-obvious.
   - List each other fact that is in no draft as not drafted, with a one-line reason.
   - Use the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in `plan.md` and `tasks-preview.md`. Do not write them in another file, a code comment, a commit message, a pull request, or a ticket. To refer to an item from outside these two files, use the item title, or a short form of its text, with the change name.
5. Draft the full text of each item. Before the first delta, run `openspec instructions specs --change "<name>" --schema spec-driven --json`. Follow the delta format in its `instruction`. It gives the format for each header, including the `**Reason**` and `**Migration**` lines of REMOVED and the `FROM:` and `TO:` lines of RENAMED. The result also has `skipped: true` and a warning, because `skip_specs` is still set. Ignore both: step 8 sets `skip_specs`.
   - **Requirement**: a delta for `<dir>/specs/<capability>/spec.md`.
     - To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches. For a new capability, start the delta with a `## Purpose` section of one or two sentences on what the capability covers. Without it, the CLI writes "TBD" as the Purpose of the new main spec.
     - Use the headers `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.
     - Write each requirement as `### Requirement: <name>`, with SHALL or MUST, as the CLI instruction says.
     - If an item gives a reason, for example the "because" part of a constraint, keep the reason in the requirement text. A scenario title alone does not keep it.
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

   - Before you draft a decision, search `openspec/adr/` for files with the line `Change: <name>`. An earlier run of this archive can have written them. Show them, and do not draft a decision or a fact that already has an ADR.
   - **Superseded ADR**: read the title and `## Decision` of each ADR in `openspec/adr/` with the line `Status: Accepted`. If a new decision fully replaces one of them, add the line `Supersedes: <old file name>` after the `Change:` line of the draft. If it changes only part of an old decision, add no line, and tell the user that both ADRs stay `Accepted`.
6. Show all drafts. Name each draft that comes from a decision whose heading ends with 🤖, in `plan.md` or, on the guard path, in `design.md`, because the user did not confirm it yet. If no decision heading ends with 🤖, say nothing about marks. Write no 🤖 in a spec or an ADR. For each draft with a `Supersedes:` line, name the old ADR and say that its `Status` line changes. The user answers yes, no, or edit for each item. Apply each edit. Tell the user that they can pick a skipped item to draft. If the user picks one, draft it and show it for approval.
7. Before you write, list the files under `<dir>/specs/`. They are from an earlier run. Show each one, and ask the user to keep or delete it. Then write the approved deltas to `<dir>/specs/<capability>/spec.md`. If a kept file has the same path, merge the new delta into it, with no duplicate requirement.
8. Look at the files under `<dir>/specs/` now. If any file exists, remove `skip_specs` from `<dir>/.openspec.yaml`. If none exists, make sure `skip_specs: true` is set. `validate` fails with a delta and the flag, and also with no delta and no flag.
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Only after `validate` passes in step 9, write each approved ADR to `openspec/adr/YYYY-MM-DD-<slug>.md`. Do not write an ADR in the same command as `validate`. Use today's date. Skip a decision or a fact that already has an ADR with `Change: <name>`. If the file name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR.
    - After you write a new ADR with a `Supersedes:` line, edit the old ADR. Change only its `Status:` line to `Status: Superseded by <new file name>`. Do not change any other line of the old ADR.
    - Then check each ADR with `Change: <name>` and a `Supersedes:` line, also the ADRs of an earlier run. If its old ADR does not have `Status: Superseded by`, edit that line now.
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas to `openspec/specs/` and moves the change, with `plan.md` and `tasks-preview.md`, to `openspec/changes/archive/`. If it fails, report it. Keep the ADRs: each one is still a correct decision.

## 3. End

List the specs that changed, the ADRs that you wrote, the ADRs that you marked as superseded, and the archive path. If the user rejected a draft of a decision, say that this decision now exists only in `openspec/changes/archive/`.
