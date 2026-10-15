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
- README lists the requirements: `@fission-ai/openspec` in the `openspec-version` range, and `openspec init`, which installs the stock `/opsx:*` skills (D103).
- The repo has no `package.json`. `package/apm.yml` holds only `name: openspec-lite` and `version`. APM rejects a folder with only `skills/` and no `apm.yml` (D94).
- A release is a git tag named `vMAJOR.MINOR.PATCH`, for example `v1.0.0`. APM range matching recognizes this form. The tag selects the schema version (D43, D70, D93).
- A change to the schema `version` is a new major tag (D81).
- Ship skills only. Do not ship slash-command files or per-harness plugin manifests (D35, D42).
- `schema.yaml` is the only declaration of compatible OpenSpec versions (D48).
- The license is MIT. The one `LICENSE` file is `package/LICENSE`, with the line "Copyright (c) 2026 DUONG Phu-Hiep". The root README links to it (D89, D100).
- README has a compatibility table: each openspec-lite major tag with its `openspec-version` range (D67, D81).
- CI (`.github/workflows/test.yml`) runs on push and pull request (D85, D88):
  - It uses Node 20.19, the OpenSpec minimum.
  - It runs a matrix of two `@fission-ai/openspec` versions: the lower bound of `openspec-version` in `schema.yaml`, read by a CI step, and `latest`.
  - It runs `node scripts/check-version.mjs`. Contract: `node scripts/check-version.mjs [root]`, default `.`. It checks the five workflow skills by name under `<root>/package/skills/`. It prints `ok <skill> <n>` or `FAIL <skill>: <reason>` per skill, and exits with code 1 on any failure (D99). If `schema.yaml` has no readable version, it prints only `FAIL schema.yaml: missing file or version line`. The script reads each line `Shipped schema version: <n>` in each workflow skill. The line can be indented. It normalizes CRLF to LF first. It compares numbers. It fails if a workflow skill has no marker line, or if any number differs from `version` in `assets/plan-lite/schema.yaml` (D66, D87, D93, D106).
  - It runs `node --test` from the repo root. Node finds `tests/*.test.mjs`. `node --test tests/` fails on Node 24 (D84, D99).
  - On a tag push, it fails if the tag is not `v` + `version` from `package/apm.yml`. It reads the line `^version:` with no YAML library (D94).
- Before each release tag:
  - Run the scenarios in `docs/test-scenarios.md` by hand (D69). Each scenario has steps and an expected result. The list (D99):
    1. Fresh repo: propose installs the schema, creates the change, writes `plan.md`.
    2. Small request: propose offers Level 1 and stops on yes, with no files written.
    3. Tasks preview, then edit a Constraint: apply warns that the preview is stale.
    4. Stock `/opsx:apply` on a plan-lite change: it follows `apply.instruction` and ends with the done check.
    5. Archive with one requirement and one decision: the delta merges, the ADR is written.
    6. Archive with nothing promoted: `skip_specs` is set, archive succeeds.
    7. Upgrade with a preview, interrupted after it writes `proposal.md`, then run again: it resumes and validates.
    8. Newer repo schema: each workflow skill stops with the "edit the ref" message.
    9. Schema re-copy: the old folder moves to `openspec/schemas-backup/`.
    10. Real APM install from the tag (D83).
  - Install from the tag in a temp repo. Check that `apm_modules/` holds only `package/` content (D83).

## 2a. Tests (D84)

- Tests live in `tests/` and run with `node --test` from the repo root. They have no dependencies.
- `plan-hash.test.mjs`: CRLF, a UTF-8 BOM, section order, Open Questions, and Decisions do not change the hash. A changed Constraint does. A missing heading or a missing file exits with code 1.
- `check-version.test.mjs`: runs the script on fixture folders. A match passes. A mismatch fails. A missing marker line fails. A missing skill fails. A skill with CRLF line endings passes. An indented marker passes. A second marker with a wrong number fails. `01` equals `1`. A root with no `package/` prints one `schema.yaml` failure (D106).
- `install.test.mjs`: a first install copies. A lower repo version moves to a timestamped backup, then copies. An equal version prints `status: current`. A higher version exits with code 2. Missing shipped assets exit with code 3. A second backup with the same timestamp gets a `-2` suffix. A quoted higher version with a comment exits with code 2. A file system error exits with code 1, with an `install:` message and no stack trace (D96, D98, D102, D106).
- `schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. The CLI test skips itself if `openspec` is not installed. When the `CI` environment variable is set, it fails instead, so a broken CI install cannot pass (D99). The `plan-hash.mjs` test in this file does not need `openspec` and never skips.

## 3. Skill Rules

### Names

- Skill descriptions (D104): `openspec-lite-propose` triggers on its name, on "plan-lite", and on "lightweight plan" or "medium change". The other five skills trigger only on their name or on "plan-lite".

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Common rules for all workflow skills

The five workflow skills are propose, tasks-preview, apply, upgrade, and archive.

**Change selection** (D61): Use the change named in the prompt. If no name is given and only one active change exists, use it. Otherwise ask. List active changes with `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml` (D99).

**Change schema guard** (D75): tasks-preview, apply, upgrade, and archive refuse a change whose schema is not `plan-lite`. Point to the matching stock skill, for example `/opsx:archive`. One exception: upgrade accepts a `spec-driven` change that still has `plan.md`. An earlier run stopped after the schema switch, so upgrade resumes at the step after it (D106).

**Skill chaining** (D57): To run another skill, invoke it if the harness can. If the harness cannot, tell the user which skill to run, and stop.

**Schema check** (D44, D56, D81): Do this after change selection and the change schema guard, before any other step. propose has no change yet. It first asks the Level 1 question (see openspec-lite-propose), then starts here (D93).

1. Read `version` from `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. Compare it with the shipped version. Each workflow skill holds the line `Shipped schema version: <n>` (D87). The number must equal `version` in `assets/plan-lite/schema.yaml` (D66).
   - The file is missing or its version is lower: run `openspec-lite-schema`. If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions (D93).
   - Its version is higher: stop. A schema version change is a new major tag, so `apm update` cannot reach it. Tell the user: "Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`." (D93)
3. Run `openspec --version`. If the command fails, stop. Tell the user to install `@fission-ai/openspec` in the `openspec-version` range (D93). If the result is outside the `openspec-version` range, warn the user. Point to the compatibility table at `https://github.com/duongphuhiep/openspec-lite#compatibility`. The installed package has no README.

**Plan hash** (D72): From the repo root, run:

```sh
node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md
```

If it exits with code 1, show its message and stop. Ask the user to fix `plan.md` as the message says (D93, D99).

### openspec-lite-schema (D41, D43, D44, D48, D56, D65, D71, D82, D86, D90, D95, D96, D98)

- Find the skill's own folder, `<skillDir>`. It holds `scripts/` and `assets/plan-lite/`:
  1. Use the base directory from the harness, if it gives one.
  2. Otherwise, search for `openspec-lite-schema/assets/plan-lite/` under these folders, in order: `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`. Last, search `apm_modules/` in the repo for `openspec-lite-schema/` (D99).
  3. If no path has the folder, stop and tell the user.
- Then compare the repo version with the shipped version. Read the shipped version from `<skillDir>/assets/plan-lite/schema.yaml` (D93, D99):
  - Higher: stop, with the same message as the schema check.
  - Equal: say "already current" and stop. To repair a damaged schema, the user deletes `openspec/schemas/plan-lite/` and runs the skill again (D101).
  - Lower, missing, or no readable version: continue.
- If a repo copy exists, tell the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`." If the user declines, stop.
- Run the install script from the repo root. Do not read the schema content into the conversation (D98):

  ```sh
  node "<skillDir>/scripts/install.mjs" .
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
  - If the file has no `operations.archive.guidance` key, add the block, and keep the other keys and comments. `openspec init` writes `operations` only in a comment, so this is the usual case (D106).
  - If `guidance` is a plain string, OpenSpec ignores it. Do not edit it. Show the user how to change it to a list (D99).

- Report the copied files, the backup path, and the `config.yaml` line. Do not use `git diff` or `git status`. Tell the user to compare and delete the backup.
- Tell the user to commit the schema to git.

### openspec-lite-propose (D10, D26, D28, D50, D54, D68, D78, D80)

- If the request is small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, stop.
- Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 5 words from the goal.
- Run `openspec new change "<name>" --schema plan-lite`. If it fails, for example because the change already exists, show the error and ask for another name (D99).
- Set `skip_specs: true` in `.openspec.yaml`.
- Get the template from `openspec instructions plan --change "<name>" --json` → `template`. Write `plan.md` from it. Fill only what is known. Leave the other sections empty.
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
- Users try stock `/opsx:apply` first (D27).

### openspec-lite-upgrade (D13, D31, D46, D52, D62, D79, D97)

1. Remove `skip_specs: true` from `.openspec.yaml`. While it is set, the CLI forbids spec files (D99).
2. Write the four artifacts in dependency order, while the change is still plan-lite. Get each template from `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`. On a resumed run, keep each artifact that already exists, and write only the missing ones. Follow the `instruction` field of each result.
   1. `proposal.md`: from Goal and the scope. Non-Goals go to `design.md` → `## Goals / Non-Goals`.
   2. `specs/` and `design.md`: from `plan.md`. For specs, use the archive delta rules: pick `<capability>` from `openspec/specs/` first, give each ADDED or MODIFIED requirement at least one `#### Scenario:`, and copy the full requirement for MODIFIED. Decisions go to `design.md` → `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
   3. `tasks.md`: if `tasks-preview.md` exists, use it as the seed and add `[ ]` to each task line. Then delete `tasks-preview.md`.
3. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. If a step before this one fails, the change is still plan-lite, and a new upgrade run resumes it.
4. Delete each `plan.md` section whose content moved. Keep a section that has no slot, for example open questions that are still open. If no section is left, delete `plan.md`.
5. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.
6. In the summary, ask the user to review all artifacts. Ask for an extra review of `tasks.md`, because it is a contract. Say that `skip_specs` was removed.

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47, D55, D58, D59, D60, D74, D77, D105)

1. Ask the done check (see §4). If an answer is "no", show the warnings and ask: "Archive anyway?" On no, stop.
2. Read `plan.md`. Do not read `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
4. Sort each item: requirement → spec, decision → ADR.
5. Draft the full text of each item:
   - A requirement becomes a delta under ADDED, MODIFIED, REMOVED, or RENAMED. Give each ADDED or MODIFIED requirement at least one `#### Scenario:`, derived from `plan.md` and the code. For MODIFIED, copy the full requirement from the main spec, then edit it. To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches (D93).
   - A decision becomes an ADR with these sections: Title, Status, Context, Decision, Consequences.
6. Show the drafts. The user answers yes, no, or edit for each item. Write nothing before approval.
7. Write the approved deltas to `<change>/specs/<capability>/spec.md`.
8. If step 7 wrote files, remove `skip_specs` from `.openspec.yaml`. Otherwise, set `skip_specs: true`, because `validate` fails on a plan-lite change with no deltas and no `skip_specs` (D93).
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Write the approved ADRs to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use the archive date. Set Status to `Accepted` (D93, D105).
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
- If the preview exists, run `node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md` from the repo root. If the result differs from `plan-sha256` in the preview header, the preview is stale. It is also stale if the header is missing. Tell the user, and offer to regenerate the preview with openspec-lite-tasks-preview.
- If the plan hash command exits with code 1, show its message and stop.
- When plan.md and tasks-preview.md conflict, plan.md wins.
- The approach may differ from the preview, for example to make the code simpler. Record each meaningful deviation in `## Decisions` of plan.md, as `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. List the deviations in the end summary.
- Record the answer to each open question in `## Decisions`, and remove the question.
- Do not edit tasks-preview.md.
- Suggest running openspec-lite-upgrade when one of these is true: another person or agent must continue the work; the change touches more than one capability; the change touches more than one repo; a contract (spec) becomes necessary.
- End with the done check: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty?
- When the done check passes, tell the user to archive with openspec-lite-archive, not /opsx:archive. It promotes the decisions first. Ignore any built-in text that suggests /opsx:archive.
```

`plan-hash.mjs` (D72, D91):

```js
// Usage: node plan-hash.mjs <plan.md>
// Hashes only Goal, Non-Goals, and Constraints. Ignores line endings, whitespace, and section order.
// Exits with code 1 if the file cannot be read or one of these headings is missing.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const KEEP = ["Goal", "Non-Goals", "Constraints"];
let text;
try {
  text = readFileSync(process.argv[2], "utf8");
} catch {
  console.error(`plan-hash: cannot read ${process.argv[2]}`);
  process.exit(1);
}
text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
const sections = text.split(/^## /m).slice(1);
const titles = sections.map((s) => s.split("\n")[0].trim());
const missing = KEEP.filter((k) => !titles.includes(k));
if (missing.length > 0) {
  console.error(`plan-hash: missing heading: ${missing.map((k) => `## ${k}`).join(", ")}`);
  process.exit(1);
}
const kept = sections
  .filter((s) => KEEP.includes(s.split("\n")[0].trim()))
  .map((s) => s.replace(/\s+/g, " ").trim())
  .sort();
console.log(createHash("sha256").update(kept.join("\n")).digest("hex"));
```

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
