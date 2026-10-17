# Design

The current rules for openspec-lite. Read this file first when you implement.
Each rule cites the decision that holds its rationale in `docs/decisions.md`.
If this file and `decisions.md` disagree, this file is correct. Fix `decisions.md`.

---

## 1. Repo Layout

```
openspec-lite/
├── package/                 # the only folder that APM downloads
│   ├── LICENSE              # MIT
│   ├── apm.yml              # name and version, for APM
│   └── skills/
│       ├── openspec-lite-propose/SKILL.md
│       ├── openspec-lite-tasks-preview/SKILL.md   # holds the preview template inline
│       ├── openspec-lite-apply/SKILL.md
│       ├── openspec-lite-upgrade/SKILL.md
│       ├── openspec-lite-archive/SKILL.md
│       └── openspec-lite-schema/
│           ├── SKILL.md
│           ├── scripts/install.mjs    # backup and copy, not copied to the user repo
│           └── assets/plan-lite/
│               ├── schema.yaml
│               ├── plan-hash.mjs
│               └── templates/
│                   └── plan.md
├── scripts/
│   └── check-version.mjs
├── tests/
│   ├── plan-hash.test.mjs
│   ├── check-version.test.mjs
│   ├── install.test.mjs
│   └── schema.test.mjs
├── .github/workflows/
│   └── test.yml
├── docs/
│   └── test-scenarios.md
├── CONTEXT.md
└── README.md
```

- The repo holds the design docs and the deliverable together (D38).
- Only `package/` is the deliverable. Tests, scripts, and docs stay outside it, so APM does not download them (D83).
- The schema source is in the assets of `openspec-lite-schema`. There is no other copy in this repo (D43, D44).
- The tasks preview template is inline in the `openspec-lite-tasks-preview` SKILL.md (D53, D76).

## 2. Delivery

- Ship through Microsoft APM only. The git repo is the package (D70).
- The repo is `github.com/duongphuhiep/openspec-lite` (D100).
- README tells users to install the `package/` subfolder with a semver range and a target: `apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude`. The user replaces `claude` with their harness. With no target and no harness folder, APM deploys nothing (D81, D83, D103).
- README lists the requirements: `npm install -g @fission-ai/openspec@1` (inside the `openspec-version` range), the APM CLI, and `openspec init --tools <harness>`, which installs the stock OpenSpec skills and `/opsx:*` commands. `--tools none` installs none (D103, D106, D118).
- README has a table of harness names for `openspec init --tools` and `apm install --target`. They are the same, except GitHub Copilot: `github-copilot` and `copilot` (D118).
- The repo has no `package.json`. `package/apm.yml` holds only `name: openspec-lite` and `version`. APM rejects a folder with only `skills/` and no `apm.yml` (D94).
- A release is a git tag named `vMAJOR.MINOR.PATCH`, for example `v1.0.0`. APM range matching recognizes this form. The tag selects the schema version (D43, D70, D93).
- Each change to a file under `assets/plan-lite/` bumps the schema `version` by 1. Any tag can ship the bump. Only a breaking schema change needs a new major tag (D109).
- CI fails if a file under `assets/plan-lite/` changed since the latest `v*` tag but `version` did not. The check runs on each pull request, on a push to `main`, and on a tag push, so a missing bump stops before the release (D109, D110).
- Ship skills only. Do not ship slash-command files or per-harness plugin manifests (D35, D42).
- `schema.yaml` is the only declaration of compatible OpenSpec versions (D48).
- The license is MIT. The one `LICENSE` file is `package/LICENSE`, with the line "Copyright (c) 2026 DUONG Phu-Hiep". The root README links to it (D89, D100).
- README has a compatibility table: each openspec-lite major tag with its `openspec-version` range (D67, D81).
- CI (`.github/workflows/test.yml`) runs on a push to `main`, on a `v*` tag push, and on each pull request (D85, D88, D107):
  - It runs a Node matrix: 20.19 (the OpenSpec minimum) and 24 (D107).
  - It runs a matrix of two `@fission-ai/openspec` versions: the lower bound of `openspec-version` in `schema.yaml`, read by a CI step, and `latest`.
  - It runs `node scripts/check-version.mjs`. Contract: `node scripts/check-version.mjs [root]`, default `.`. It checks the five workflow skills by name under `<root>/package/skills/`. It prints `ok <skill> <n>` or `FAIL <skill>: <reason>` per skill, and exits with code 1 on any failure (D99). If `schema.yaml` has no readable version, it prints only `FAIL schema.yaml: missing file or version line`. The script reads each line `Shipped schema version: <n>` in each workflow skill. The line can be indented. It normalizes CRLF to LF first. It compares numbers. It fails if a workflow skill has no marker line, or if any number differs from `version` in `assets/plan-lite/schema.yaml` (D66, D87, D93, D106).
  - It runs `node --test` from the repo root. Node finds `tests/*.test.mjs`. `node --test tests/` fails on Node 24 (D84, D99).
  - On a tag push, it fails if the tag is not `v` + `version` from `package/apm.yml`. It reads the line `^version:` with no YAML library (D94).
- Before each release tag:
  - Run scenarios 1–9 and 11–20 in `docs/test-scenarios.md` by hand (D69, D113, D115, D120). Each scenario has steps and an expected result. The list (D99):
    1. Fresh repo: propose installs the schema, creates the change, writes `plan.md`.
    2. Small request: propose offers Level 1 and stops on yes, with no files written.
    3. Tasks preview, then edit a Constraint: apply warns that the preview is stale.
    4. Stock `/opsx:apply` on a plan-lite change: it follows `apply.instruction` and ends with the done check.
    5. Archive with one requirement and one decision: the delta merges, the ADR is written.
    6. Archive with nothing promoted: `skip_specs` is set, archive succeeds.
    7. Upgrade with a preview, interrupted after it writes `proposal.md`, then run again: it resumes and validates.
    8. Newer repo schema: each workflow skill stops with the "Run `apm update`" message.
    9. Schema re-copy: the old folder moves to `openspec/schemas-backup/`. An existing `operations.archive.guidance` list keeps its items and gets the openspec-lite item, with one `operations:` key (D110).
    10. Real APM install from the tag (D83). Run this one right after the tag push (D107).
    11. OpenSpec root in a subfolder of the git root: the skills run from `root.path`, and the skill-folder search finds the skill in a parent folder (D111).
    12. propose resume: a plan-lite change with no `plan.md` resumes with one `skip_specs` line (D111, D112).
    13. archive rerun: (a) after a failed validate, the agent shows earlier deltas before the write and drafts the decision again; (b) after a failed `openspec archive`, it skips the ADRs with `Change: <name>` (D111, D112, D113).
    14. Promotion into an existing capability: archive reuses the capability, and the main spec ends up correct (D115).
    15. Promotion keeps each non-obvious item and each contract of `plan.md`, or names it as skipped (D115, D119).
    16. Stock `/opsx:archive` on a plan-lite change: (a) with the guidance, the agent warns or runs `openspec-lite-archive`; (b) without the guidance, and (c) the CLI directly, are known gaps that the run records (D95, D115).
    17. `openspec-lite-apply` after an upgrade refuses and points to `/opsx:apply` (D75).
    18. `openspec-lite-archive` after an upgrade refuses, points to `/opsx:archive`, and warns about the decisions in `design.md` (D115).
    19. tasks-preview and upgrade after an upgrade: refuse, or ask to resume when `plan.md` exists (D107, D108).
    20. Upgrade lists the destination of each `plan.md` section and asks before it prunes. Archive drafts an item that the user picks from the skipped list. Upgrade with no requirement puts `skip_specs: true` back (D108, D120).
  - Right after the tag push, install from the tag in a temp repo. Check that `apm_modules/` holds only `package/` content (D83, D107).

## 2a. Tests (D84)

- Tests live in `tests/` and run with `node --test` from the repo root. They have no dependencies.
- `plan-hash.test.mjs`: CRLF, a UTF-8 BOM, section order, Open Questions, and Decisions do not change the hash. A changed Constraint does. A missing heading or a missing file exits with code 1.
- `check-version.test.mjs`: runs the script on fixture folders. A match passes. A mismatch fails. A missing marker line fails. A missing skill fails. A skill with CRLF line endings passes. An indented marker passes. A second marker with a wrong number fails. `01` equals `1`. A root with no `package/` prints one `schema.yaml` failure (D106).
- `install.test.mjs`: a first install copies. A lower repo version moves to a timestamped backup, then copies. An equal version prints `status: current`. A higher version exits with code 2. Missing shipped assets exit with code 3. A second backup with the same timestamp gets a `-2` suffix. A quoted higher version with a comment exits with code 2. A file system error exits with code 1, with an `install:` message and no stack trace (D96, D98, D102, D106).
- `schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It also tests the upgrade path (`instructions <artifact> --schema spec-driven` on a plan-lite change), an archive that merges a delta, and a `validate` failure with no delta and no `skip_specs` (D108). It also tests the CLI behavior that the skills rely on: `state: blocked` with no `plan.md`, `root.path` from a subfolder and `root: null` above it, `skipped: true` on `instructions specs` with `skip_specs`, and the failure on a duplicate key in `.openspec.yaml` (D112). The CLI test skips itself if `openspec` is not installed. When the `CI` environment variable is set, it fails instead, so a broken CI install cannot pass (D99). The `plan-hash.mjs` test in this file does not need `openspec` and never skips.

## 3. Skill Rules

### Names

- Skill descriptions (D104): `openspec-lite-propose` triggers on its name, on "plan-lite", and on "lightweight plan" or "medium change". The other five skills trigger only on their name or on "plan-lite". `openspec-lite-archive` also says to use it instead of stock `/opsx:archive` for a change with `schema: plan-lite` (D116).

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Common rules for all workflow skills

The five workflow skills are propose, tasks-preview, apply, upgrade, and archive.

**OpenSpec root** (D111): Each skill runs `openspec list --json` first and reads `root.path`. It runs each command from that folder, and reads each `openspec/...` path from it. OpenSpec finds the nearest `openspec/` folder, which can be a subfolder of the git root. OpenSpec searches only up from the current folder, so an agent that starts at the git root of a monorepo gets `root: null`. Then the skill searches the subfolders for an initialized `openspec/` (with `config.yaml`, `changes/`, or `specs/`), and skips `.git/`, `node_modules/`, and `apm_modules/`. It asks the user to confirm one match, or to pick one of several. Only with no match does it stop and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/` (D113).

**Change selection** (D61): Use the change named in the prompt. If no name is given and only one active change exists, use it. Otherwise ask. List active changes with `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml` (D99).

**Change schema guard** (D75): tasks-preview, apply, upgrade, and archive refuse a change whose schema is not `plan-lite`. Point to the matching stock skill, for example `/opsx:archive`. When archive refuses a change whose `design.md` has `### Decision` entries, it also warns: stock `/opsx:archive` does not turn them into ADRs, so copy them to `openspec/adr/` first to keep them (D115). One exception: upgrade accepts a `spec-driven` change that still has `plan.md`. A `spec-driven` change with no `plan.md` is refused, like any other schema (D108). An earlier run stopped after the schema switch, so upgrade resumes at the step after it (D106). A finished upgrade can also keep `plan.md`, so upgrade asks the user before it resumes (D107).

**Skill chaining** (D57): To run another skill, invoke it if the harness can. If the harness cannot, tell the user which skill to run, and stop.

**Schema check** (D44, D56, D81): Do this after change selection and the change schema guard, before any other step. propose has no change yet. It first asks the Level 1 question (see openspec-lite-propose), then starts here (D93).

1. Read `version` from `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. Compare it with the shipped version. Each workflow skill holds the line `Shipped schema version: <n>` (D87). The number must equal `version` in `assets/plan-lite/schema.yaml` (D66).
   - The file is missing, its version is lower, or it has no readable `version` line: run `openspec-lite-schema` (D110). If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of the calling skill, in the same turn (D93, D114).
   - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`." A minor or patch tag can bump the schema, so `apm update` usually fixes it. Only a breaking schema change needs the next major tag (D93, D109).
3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the `openspec-version` range (D93). If the result is outside the `openspec-version` range, warn the user. Point to the compatibility table at `https://github.com/duongphuhiep/openspec-lite#compatibility`. The installed package has no README.

**Plan hash** (D72): From the OpenSpec root, run:

```sh
node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md
```

If it exits with code 1, show its message and stop. Ask the user to fix `plan.md` as the message says (D93, D99).

### openspec-lite-schema (D41, D43, D44, D48, D56, D65, D71, D82, D86, D90, D95, D96, D98)

- Find the skill's own folder, `<skillDir>`. It holds `scripts/` and `assets/plan-lite/`:
  1. Use the base directory from the harness, if it gives one.
  2. Otherwise, search for `openspec-lite-schema/` with `assets/plan-lite/` in it, and use the first match (D111, D112):
     1. Project folders: in the OpenSpec root, then in each parent folder, check `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, and then `apm_modules/` (D99).
     2. User folders, only after all project folders: `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
  3. If no path has the folder, stop and tell the user.
- Then compare the repo version with the shipped version. Read the shipped version from `<skillDir>/assets/plan-lite/schema.yaml` (D93, D99):
  - Higher: stop, with the same message as the schema check.
  - Equal: say "already current". Skip the install, but still do the archive guidance step, which is idempotent. To repair a damaged schema, the user deletes `openspec/schemas/plan-lite/` and runs the skill again (D101, D107).
  - Lower, missing, or no readable version: continue.
- If a repo copy exists, ask the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`. Proceed?" End the turn, and wait. Do not run the install script before a yes. On no, stop (D114).
- Run the install script with the OpenSpec root as its argument. Do not read the schema content into the conversation (D98, D111):

  ```sh
  node "<skillDir>/scripts/install.mjs" "<root>"
  ```

  `install.mjs` contract (D98, D101, D102):
  - Usage: `node install.mjs <repoRoot>`. It finds its own `assets/plan-lite/` through `import.meta.url`.
  - It reads each version from the line `^version:\s*["']?(\d+)["']?\s*(?:#.*)?$` in `schema.yaml`, with no YAML library. Quotes and a trailing comment are allowed (D106).
  - Shipped version missing or not readable: exit 3.
  - No repo copy: copy. A repo copy with no readable version counts as lower.
  - Repo version lower: move the repo copy to `openspec/schemas-backup/plan-lite-v<old>-<YYYYMMDD-HHMMSS>/`, then copy. If that name exists, add `-2`, `-3`, and so on.
  - Repo version equal: copy nothing.
  - Repo version higher: copy nothing, exit 2.
  - Output: one line `status: installed`, `replaced`, `current`, or `newer`. Then `backup: <path>` if it made a backup, and `copied: <path>` for each file. Exit 0 on `installed`, `replaced`, and `current`.
  - A file system error: exit 1, with `install: <message>` on stderr and no stack trace. If the old schema already moved, a second line names the backup folder (D106).
- Add this item to `operations.archive.guidance` in `openspec/config.yaml`, if the list does not have it yet. `guidance` must be a YAML list (D95):

  ```yaml
  operations:
    archive:
      guidance:
        - "For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."
  ```

  This guard is best effort. The stock archive skill treats guidance as optional advice.

  - If `openspec/config.yaml` is missing, create it with only this block. `openspec new change` keeps such a file.
  - If the file has no `operations` key, add the whole block, and keep the other keys and comments. `openspec init` writes `operations` only in a comment, so this is the usual case (D106).
  - If `operations` exists without `archive`, or `operations.archive` exists without `guidance`, add only the missing part under the existing key. Never add a second `operations:` key: OpenSpec then ignores the whole file (D107).
  - If `guidance` is a plain string, OpenSpec ignores it. Do not edit it. Show the user how to change it to a list (D99).

- Report the copied files, the backup path, and the `config.yaml` line. Do not use `git diff` or `git status`. Tell the user to compare and delete the backup.
- Tell the user to commit the schema to git.

### openspec-lite-propose (D10, D26, D28, D50, D54, D68, D78, D80)

- If the request is small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, stop.
- Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 5 words from the goal.
- Run `openspec new change "<name>" --schema plan-lite`. If it fails because a plan-lite change with that name exists and has no `plan.md`, an earlier run stopped here: offer to resume. In each other case, show the error and ask for another name (D99, D111).
- Set `skip_specs: true` in `.openspec.yaml`. If the line exists, do not add a second one. A duplicate key breaks each CLI command on the change (D112).
- Get the template from `openspec instructions plan --change "<name>" --json` → `template`. Write `plan.md` from it. Fill only what is known. Leave the other sections empty. Do not invent non-goals, constraints, or decisions (D114).
- If an upgrade signal is present (see §5), suggest an upgrade.
- In the summary, show the change name.
- At the end, ask: "Do you want a tasks preview?" On yes, run `openspec-lite-tasks-preview`.
- Do not write code.

### openspec-lite-tasks-preview (D19, D23, D24, D26, D32, D49, D52, D53, D72, D76)

- If `plan.md` is missing, stop. Tell the user to run `openspec-lite-propose` (D99).
- Read `plan.md` and explore the code first.
- Write `tasks-preview.md` from this template. Pseudo-diffs are permitted.

  ```markdown
  <!-- Generated. Edit plan.md, not this file. -->
  <!-- plan-sha256: <hash> -->

  ## 1. <group title>

  - 1.1 <task: a verifiable outcome>
    - Verify: <criteria>
    - Files: <paths, optional>

  ## 2. <next group, depends on 1>
  ```

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order tasks by dependency. Give each task verification criteria. Put tests and docs with the related code.
- Each task is a meaningful, verifiable outcome. Do not split into very small subtasks.
- Get `<hash>` with the plan hash command.
- Overwrite the old file.

### openspec-lite-apply (D27, D64, D73)

- Run `openspec instructions apply --change "<name>" --json`. Follow its `instruction`. The schema `apply.instruction` is the only copy of the plan-lite apply rules.
- Add one rule to the CLI output: ignore checkbox and task-count text. A plan-lite change has no tracked tasks.
- If `state` is `blocked`, `plan.md` is missing. Stop, and point to `openspec-lite-propose`. Do not follow CLI text that names another skill (D111).
- Users try stock `/opsx:apply` first (D27).

### openspec-lite-upgrade (D13, D31, D46, D52, D62, D79, D97, D120)

1. Remove `skip_specs: true` from `.openspec.yaml`. While it is set, the CLI forbids spec files (D99).
2. Ask the user to answer each open question that changes the specs, the approach, or the tasks. Do this before you write an artifact. If the user cannot answer now, the question stays in `plan.md` (D120, `docs/facts.md`). Then write the four artifacts in dependency order, while the change is still plan-lite. Get each template from `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`. On a resumed run, keep each artifact that already exists, and write only the missing ones. Follow the `instruction` field of each result.
   1. `proposal.md`: from Goal and the scope. Non-Goals go to `design.md` → `## Goals / Non-Goals`.
   2. `specs/` and `design.md`: from `plan.md`. For specs, use the archive delta rules: pick `<capability>` from `openspec/specs/` first, add a `## Purpose` section for a new capability (D117), give each ADDED or MODIFIED requirement at least one `#### Scenario:`, and copy the full requirement for MODIFIED. If `plan.md` has no requirement, ask the user for one. If the user has none, put `skip_specs: true` back and say so in the summary (D108). Decisions go to `design.md` → `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit. An open question that is safe to answer later goes to `## Open Questions`. An open question that changes the specs, the approach, or the tasks has no slot. Its answer goes to the specs or to `## Decisions`.
   3. `tasks.md`: if `tasks-preview.md` exists, use it as the seed and add `[ ]` to each task line. If an answer from step 2 changes the tasks, edit the seed to match it, and say so in the summary. Then delete `tasks-preview.md`. If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here: keep `tasks.md`, and delete `tasks-preview.md` (D107).
3. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. If a step before this one fails, the change is still plan-lite, and a new upgrade run resumes it.
4. List each `plan.md` section with its destination artifact and heading, or "kept". If the items of one section go to different destinations, list each item. Keep a section that has no slot, for example an open question that the user cannot answer now. Name each content that is in no artifact and is not kept, and offer to add it first. Show the list, and ask before the delete in the same reply. On yes, delete each section or item whose content moved. If no section is left, delete `plan.md`. On no, keep `plan.md` (D120).
5. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.
6. In the summary, ask the user to review all artifacts. Ask for an extra review of `tasks.md`, because it is a contract. Say if `skip_specs` was removed, or put back because the change has no spec delta. If `plan.md` is kept, name each kept section. The stock skills do not read `plan.md`. Tell the user to resolve the kept items before `/opsx:apply`. If the user said no to the delete, say that the moved sections in `plan.md` are old copies, and that the artifacts are the source of truth (D120). If `design.md` has `### Decision` entries, warn that stock `/opsx:archive` does not turn them into ADRs (D115).

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47, D55, D58, D59, D60, D74, D77, D105, D119, D120)

1. Ask the done check (see §4). If an answer is "no", show the warnings and ask: "Archive anyway?" On no, stop.
2. Read `plan.md`. Do not read `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
   - **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It goes to a spec, even if it is obvious from the code (D119).
4. Sort each item: requirement → spec, decision → ADR. If a decision is also a contract, draft the contract as a requirement. Its rationale can also go to an ADR (D119). List each other `plan.md` item that is not drafted, including each non-goal, with a one-line reason (D116).
5. Draft the full text of each item:
   - A requirement becomes a delta under ADDED, MODIFIED, REMOVED, or RENAMED. Give each ADDED or MODIFIED requirement at least one `#### Scenario:`, derived from `plan.md` and the code. For MODIFIED, copy the full requirement from the main spec, then edit it. To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches (D93). For a new capability, start the delta with a `## Purpose` section, because the CLI otherwise writes "TBD" as the Purpose of the new main spec (D117).
   - A decision becomes an ADR: a `# <Title>` heading, then the plain lines `Status: Accepted` and `Change: <name>`, then the sections `## Context`, `## Decision`, and `## Consequences` (D112). Before drafting, skip each decision that already has an ADR with `Change: <name>` in `openspec/adr/`, because an earlier run wrote it (D111).
   - Get the delta format from the `instruction` of `openspec instructions specs --change <name> --schema spec-driven --json`. It defines REMOVED (`**Reason**`, `**Migration**`) and RENAMED (`FROM:`, `TO:`) (D111). While `skip_specs` is set, the result also has `skipped: true` and a warning: ignore both. Use SHALL or MUST, as the instruction says (D112).
6. Show the drafts. The user answers yes, no, or edit for each item. Tell the user that they can pick a skipped item to draft. If the user picks one, draft it and show it for approval (D120). Write nothing before approval.
7. Before the write, list the files under `<change>/specs/` from an earlier run. Show each one, and ask the user to keep or delete it. Then write the approved deltas to `<change>/specs/<capability>/spec.md`. Merge into a kept file with the same path (D110, D112).
8. Decide from the files on disk, not from this run. If any file exists under `<change>/specs/`, remove `skip_specs`. If none exists, set `skip_specs: true`. `validate` fails with a delta and the flag, and also with no delta and no flag (D93, D110).
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Only after `validate` passes, write the approved ADRs to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use the archive date. Set Status to `Accepted` (D93, D105). If the name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR (D112).
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas and moves the change (with `plan.md` and `tasks-preview.md`) to the archive. If it fails after step 10, report it. The ADRs stay, because each one is still a correct decision (D105).

## 4. plan-lite Schema

`assets/plan-lite/schema.yaml` (D12, D25, D40, D53):

```yaml
name: plan-lite
version: 1
openspec-version: ">=1.9.0 <2.0.0"
description: Lightweight plan — goal, constraints, decisions. No tasks. Upgradeable to spec-driven.
artifacts:
  - id: plan
    generates: plan.md
    description: Living plan — goal, non-goals, constraints, open questions, decisions
    template: plan.md   # relative to templates/
    requires: []
apply:
  requires: [plan]
  # no `tracks`: plan-lite has no tracked tasks file
  instruction: |
    <the exact text of the apply rules below>
```

- Do not add `tasks-preview` as an artifact. Stock `/opsx:continue` and `/opsx:ff` would generate it (D53).
- Keep the `apply` block. Do not set `apply.tracks` (`docs/facts.md`, Trap 2).
- OpenSpec ignores the `openspec-version` key. Only the skills read it (D48).
- `version` is an integer. A change to it is a schema **update** (D45).

`apply.instruction` holds the plan-lite apply rules (D29, D33, D49, D60, D64, D72, D73, D99, D106). It ships in the user's repo, so it must not refer to this file. This is the exact text in `schema.yaml`:

```text
This is a plan-lite change. It has no tasks.md and no checkboxes.
- Implement from plan.md. If <changeDir>/tasks-preview.md exists, use it as a guide. The CLI does not list it in contextFiles.
- Before you write any code: if the preview exists, run `node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md` from the OpenSpec root, the folder that holds `openspec/`. If the result differs from `plan-sha256` in the preview header, the preview is stale. It is also stale if the header is missing. If it is stale, stop and ask the user: regenerate the preview with openspec-lite-tasks-preview, or continue from plan.md? End your turn, and wait for the answer.
- If the plan hash command exits with code 1, show its message and stop.
- When plan.md and tasks-preview.md conflict, plan.md wins.
- The approach may differ from the preview, for example to make the code simpler. Record each meaningful deviation in `## Decisions` of plan.md, as `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. List the deviations in the end summary.
- Record the answer to each open question in `## Decisions`, and remove the question.
- Do not edit tasks-preview.md.
- Suggest running openspec-lite-upgrade when one of these is true: another person or agent must continue the work; the change touches more than one capability; the change touches more than one repo; a contract (spec) becomes necessary.
- End with the done check: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty?
- When the done check passes, tell the user to archive with openspec-lite-archive, not /opsx:archive. It promotes the decisions first. Ignore any built-in text that suggests /opsx:archive.
```

`plan-hash.mjs` (D72, D91, D107) is in `package/skills/openspec-lite-schema/assets/plan-lite/plan-hash.mjs`. Its behavior:

- Usage: `node plan-hash.mjs <plan.md>`. It prints a 64-character hex SHA-256.
- It strips a UTF-8 BOM and changes CRLF to LF.
- A `## ` line outside a ``` or ~~~ fence starts a section. A `## ` line inside a fence is content. As in CommonMark, a fence closes only with the same character, at least the same length, and no info string (D108).
- It hashes only the `Goal`, `Non-Goals`, and `Constraints` sections. It collapses whitespace and sorts the sections, so whitespace and section order do not change the hash.
- It exits with code 1 if the file cannot be read, or if one of the three headings is missing. The message names each missing heading.
- `tests/plan-hash.test.mjs` covers each rule.
`templates/plan.md` (D10):

```markdown
## Goal

## Non-Goals

## Constraints

## Open Questions

## Decisions
```

Decisions are append-only. Entry format: `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative (D92).

## 5. Upgrade Signals (D11, D50, D54)

Suggest an upgrade when one of these is true:

- Another person or agent must continue the work.
- The change touches more than one capability.
- The change touches more than one repo.
- A contract (spec) becomes necessary.

Only propose and apply check these signals.

## 6. Out of Scope

- A schema index with many versions. Add it when a second schema version exists (D40).
- Slash commands and raw harness manifests (D35, D42).
- The user-level schema location `${XDG_DATA_HOME}/openspec/schemas/` (D41).
- Upstream contribution of the schema to OpenSpec, until real use proves it (D14).
- Automated skill evals. Add them when a regression happens (D69).
- npm and skillpm delivery. skillpm installs one skill per package. Add per-skill npm packages when a user asks for npm (D70).
