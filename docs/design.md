# Design

The current rules for openspec-lite. Read this file first when you implement.
Each rule cites the decision that holds its rationale in `docs/decisions.md`.
If this file and `decisions.md` disagree, this file is correct. Fix `decisions.md`.

---

## 1. Repo Layout

```
openspec-lite/
├── package/                 # the only folder that APM downloads
│   └── skills/
│       ├── openspec-lite-propose/SKILL.md
│       ├── openspec-lite-tasks-preview/SKILL.md   # holds the preview template inline
│       ├── openspec-lite-apply/SKILL.md
│       ├── openspec-lite-upgrade/SKILL.md
│       ├── openspec-lite-archive/SKILL.md
│       └── openspec-lite-schema/
│           ├── SKILL.md
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
- README tells users to install the `package/` subfolder with a semver range: `apm install <owner>/openspec-lite/package#^1.0.0` (D81, D83).
- The repo has no `package.json` and no `apm.yml`. APM finds `package/skills/<name>/SKILL.md` without a manifest (D70, D83).
- A release is a git tag. The tag selects the schema version (D43, D70).
- A change to the schema `version` is a new major tag (D81).
- Ship skills only. Do not ship slash-command files or per-harness plugin manifests (D35, D42).
- `schema.yaml` is the only declaration of compatible OpenSpec versions (D48).
- README has a compatibility table: each openspec-lite major tag with its `openspec-version` range (D67, D81).
- CI (`.github/workflows/test.yml`) runs on push and pull request (D85):
  - It installs `@fission-ai/openspec` at the lowest version in `openspec-version`.
  - It runs `node scripts/check-version.mjs`. The script fails if the shipped-version constant in a workflow skill differs from `version` in `assets/plan-lite/schema.yaml` (D66).
  - It runs `node --test tests/` (D84).
- Before each release tag:
  - Run the scenarios in `docs/test-scenarios.md` by hand (D69).
  - Install from the tag in a temp repo. Check that `apm_modules/` holds only `package/` content (D83).

## 2a. Tests (D84)

- Tests live in `tests/` and run with `node --test tests/`. They have no dependencies.
- `plan-hash.test.mjs`: CRLF, section order, Open Questions, and Decisions do not change the hash. A changed Constraint does.
- `check-version.test.mjs`: a match passes, and a mismatch fails.
- `schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It skips itself if `openspec` is not installed.

## 3. Skill Rules

### Names

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Common rules for all workflow skills

The five workflow skills are propose, tasks-preview, apply, upgrade, and archive.

**Change selection** (D61): Use the change named in the prompt. If no name is given and only one active change exists, use it. Otherwise ask.

**Change schema guard** (D75): tasks-preview, apply, upgrade, and archive refuse a change whose schema is not `plan-lite`. Point to the matching stock skill, for example `/opsx:archive`.

**Skill chaining** (D57): To run another skill, invoke it if the harness can. If the harness cannot, tell the user which skill to run, and stop.

**Schema check** (D44, D56, D81): Do this after change selection and the change schema guard, before any other step. propose has no change yet, so it starts here.

1. Read `version` from `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. Compare it with the shipped version. The shipped version is a constant in each workflow skill. It must equal `version` in `assets/plan-lite/schema.yaml` (D66).
   - The file is missing or its version is lower: run `openspec-lite-schema`. If the user declines the copy, stop.
   - Its version is higher: stop. Tell the user: "Run `apm update`." To cross a major tag, the user edits the ref in `apm.yml` and runs `apm install`.
3. Run `openspec --version`. If the result is outside the `openspec-version` range, warn the user. Point to the compatibility table at `https://github.com/<owner>/openspec-lite#compatibility`. The installed package has no README.

**Plan hash** (D72): From the repo root, run:

```sh
node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md
```

### openspec-lite-schema (D41, D43, D44, D48, D56, D65, D71, D82)

- Find the skill's own `assets/plan-lite/` folder:
  1. Use the base directory from the harness, if it gives one.
  2. Otherwise, search for `openspec-lite-schema/assets/plan-lite/` under these folders, in order: `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
  3. If no path has the folder, stop and tell the user.
- Copy the folder to `<repo>/openspec/schemas/plan-lite/` with one command. Do not read the schema content into the conversation to install it:

  ```sh
  node -e 'require("fs").cpSync(process.argv[1], "openspec/schemas/plan-lite", {recursive: true})' "<assets>/plan-lite"
  ```

- After the copy, show `git diff openspec/schemas/plan-lite/`. The user can revert overwritten local edits.
- Tell the user to commit the schema to git.
- If the repo copy is older than the shipped copy, offer to copy again.

### openspec-lite-propose (D10, D26, D28, D50, D54, D68, D78, D80)

- If the request is small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, stop.
- Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 5 words from the goal.
- Run `openspec new change "<name>" --schema plan-lite`.
- Set `skip_specs: true` in `.openspec.yaml`.
- Get the template from `openspec instructions plan --change "<name>" --json` → `template`. Write `plan.md` from it. Fill only what is known. Leave the other sections empty.
- If an upgrade signal is present (see §5), suggest an upgrade.
- In the summary, show the change name.
- At the end, ask: "Do you want a tasks preview?" On yes, run `openspec-lite-tasks-preview`.
- Do not write code.

### openspec-lite-tasks-preview (D19, D23, D24, D26, D32, D49, D52, D53, D72, D76)

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

### openspec-lite-upgrade (D13, D31, D46, D52, D62, D79)

1. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`.
2. Remove `skip_specs: true`.
3. Write the four artifacts in dependency order. Get each template from `openspec instructions <artifact> --change "<name>" --json`.
   1. `proposal.md`: from Goal and Non-Goals.
   2. `specs/` and `design.md`: from `plan.md`. Decisions go to `design.md` → `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
   3. `tasks.md`: if `tasks-preview.md` exists, use it as the seed and add `[ ]` to each task line. Then delete `tasks-preview.md`.
4. Delete each `plan.md` section whose content moved. Keep a section that has no slot, for example open questions that are still open. If no section is left, delete `plan.md`.
5. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.
6. In the summary, ask the user to review all artifacts. Ask for an extra review of `tasks.md`, because it is a contract. Say that `skip_specs` was removed.

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47, D55, D58, D59, D60, D74, D77)

1. Ask the done checklist (see §4). If an answer is "no", show the warnings and ask: "Archive anyway?" On no, stop.
2. Read `plan.md`. Do not read `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
4. Sort each item: requirement → spec, decision → ADR.
5. Draft the full text of each item:
   - A requirement becomes a delta under ADDED, MODIFIED, REMOVED, or RENAMED. Give each ADDED or MODIFIED requirement at least one `#### Scenario:`, derived from `plan.md` and the code. For MODIFIED, copy the full requirement from the main spec, then edit it.
   - A decision becomes an ADR with these sections: Title, Status, Context, Decision, Consequences.
6. Show the drafts. The user answers yes, no, or edit for each item. Write nothing before approval.
7. Write the approved deltas to `<change>/specs/<capability>/spec.md`.
8. If step 7 wrote files, remove `skip_specs` from `.openspec.yaml`.
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Run `openspec archive "<name>" --yes`. The CLI merges the deltas and moves the change (with `plan.md` and `tasks-preview.md`) to the archive.
11. Write the approved ADRs to `openspec/adr/YYYY-MM-DD-<slug>.md`.

## 4. plan-lite Schema

`assets/plan-lite/schema.yaml` (D12, D25, D40, D53):

```yaml
name: plan-lite
version: 1
openspec-version: ">=1.9.0"
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
  instruction: <the plan-lite apply rules, see below>
```

- Do not add `tasks-preview` as an artifact. Stock `/opsx:continue` and `/opsx:ff` would generate it (D53).
- Keep the `apply` block. Do not set `apply.tracks` (`docs/facts.md`, Trap 2).
- OpenSpec ignores the `openspec-version` key. Only the skills read it (D48).
- `version` is an integer. A change to it is a schema **update** (D45).

`apply.instruction` holds the plan-lite apply rules (D29, D33, D49, D60, D64, D72, D73):

- Implement from `plan.md`. If `<changeDir>/tasks-preview.md` exists, use it as a guide. The CLI does not list it in `contextFiles`.
- If the preview exists, run `node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md` from the repo root. If the result differs from `plan-sha256` in the preview header, or the header is missing, tell the user and offer to regenerate the preview.
- When the two files conflict, `plan.md` wins.
- The approach may differ from the preview, for example to make the code simpler. Record each meaningful deviation in `## Decisions` of `plan.md`. List the deviations in the end summary.
- Record the answer to each open question in `## Decisions`, and remove the question.
- Do not edit `tasks-preview.md`.
- Suggest an upgrade when a signal from §5 appears.
- End with the done checklist: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty?

`plan-hash.mjs` (D72):

```js
// Usage: node plan-hash.mjs <plan.md>
// Hashes only Goal, Non-Goals, and Constraints. Ignores line endings, whitespace, and section order.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const KEEP = ["Goal", "Non-Goals", "Constraints"];
const text = readFileSync(process.argv[2], "utf8").replace(/\r\n/g, "\n");
const kept = text
  .split(/^## /m)
  .slice(1)
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

Decisions are append-only. Entry format: `### Decision: <title>`, then "Chose X because Y. Rejected Z because W."

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
