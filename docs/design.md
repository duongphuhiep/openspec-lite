# Design

The current rules for openspec-lite. Read this file first when you implement.
Each rule cites the decision that holds its rationale in `docs/decisions.md`.
If this file and `decisions.md` disagree, this file is correct. Fix `decisions.md`.

---

## 1. Repo Layout

```
openspec-lite/
├── skills/
│   ├── openspec-lite-propose/SKILL.md
│   ├── openspec-lite-tasks-preview/SKILL.md
│   ├── openspec-lite-apply/SKILL.md
│   ├── openspec-lite-upgrade/SKILL.md
│   ├── openspec-lite-archive/SKILL.md
│   └── openspec-lite-schema/
│       ├── SKILL.md
│       └── assets/plan-lite/
│           ├── schema.yaml
│           └── templates/
│               ├── plan.md
│               └── tasks-preview.md
├── apm.yml          # Microsoft APM manifest
├── package.json     # npm manifest, for skillpm
├── docs/
├── CONTEXT.md
└── README.md
```

- The repo holds the design docs and the deliverable together (D38).
- The schema source is in the assets of `openspec-lite-schema`. There is no other copy in this repo (D43, D44).

## 2. Delivery

- Publish through skillpm (npm package `openspec-lite`) and Microsoft APM (git source) (D34, D36).
- Ship skills only. Do not ship slash-command files or per-harness plugin manifests (D35, D42).
- `package.json` has no `peerDependencies` on OpenSpec (D48).

## 3. Skill Rules

### Names

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Schema check — first step of every workflow skill

The five workflow skills (propose, tasks-preview, apply, upgrade, archive) start with this check (D44):

1. Read `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. If the file is missing, or its `version` is lower than the shipped version, run `openspec-lite-schema`.

The shipped version is a constant in each workflow skill. It must equal `version` in `assets/plan-lite/schema.yaml`.

### openspec-lite-schema (D41, D43, D44, D48)

- Copy `assets/plan-lite/` to `<repo>/openspec/schemas/plan-lite/` with one shell command. Do not read the schema content into the conversation to install it.
- Tell the user to commit the schema to git.
- Run `openspec --version`. If the result is outside the `openspec-version` range, warn the user. Tell them to install an openspec-lite package version that matches.
- If the repo copy is older than the shipped copy, offer to copy again.

### openspec-lite-propose (D10, D26, D28, D50)

- Run `openspec new change "<name>" --schema plan-lite`.
- Set `skip_specs: true` in `.openspec.yaml`.
- Write `plan.md` from the template. Fill only what is known. Leave the other sections empty.
- If the request looks large, suggest an upgrade (see §5).
- At the end, ask: "Do you want a tasks preview?" On yes, run `openspec-lite-tasks-preview`.
- Do not write code.

### openspec-lite-tasks-preview (D19, D23, D24, D26, D32, D49)

- Read `plan.md` and explore the code first.
- Write `tasks-preview.md` in the OpenSpec `tasks.md` format. Pseudo-diffs are permitted.
- Order tasks by dependency. Give each task verification criteria. Put tests and docs with the related code.
- Each task is a meaningful, verifiable outcome. Do not split into very small subtasks.
- Overwrite the old file. Start the file with this header:

  ```markdown
  <!-- Generated. Edit plan.md, not this file. -->
  <!-- plan-sha256: <sha256 of plan.md> -->
  ```

### openspec-lite-apply (D22, D27, D29, D33, D49, D50)

- Implement from `plan.md`. Use `tasks-preview.md` as a guide if it exists.
- If the hash in the preview header differs from the hash of the current `plan.md`, tell the user and offer to regenerate the preview.
- When the two files conflict, `plan.md` wins.
- The approach may differ from the preview, for example to make the code simpler. Record each meaningful deviation in the `## Decisions` section of `plan.md`. List the deviations in the end summary.
- Do not edit `tasks-preview.md`.
- Suggest an upgrade when signals appear (see §5).
- Users try stock `/opsx:apply` first. The schema `apply.instruction` holds the same rules (D27).

### openspec-lite-upgrade (D13, D31, D46)

1. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`.
2. Remove `skip_specs: true`.
3. Write `proposal.md` from the goal, non-goals, and constraints in `plan.md`.
4. Leave `specs/` and `design.md` for the AI to fill in from `plan.md`.
5. If `tasks-preview.md` exists, use it as the seed for `tasks.md`. Tell the user to review `tasks.md` again, because it is a contract.
6. Keep `plan.md` in place as context.
7. In the summary, say that `skip_specs` was removed.

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47)

1. Read the `## Decisions` and other sections of `plan.md`. Do not read `tasks-preview.md` for promotion.
2. Select items with two filters:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
3. Sort each item: requirement → spec, decision → ADR.
4. Show the list. The user answers yes, no, or edit for each item. Write nothing before approval.
5. For approved requirements, write delta files at `<change>/specs/<capability>/spec.md` (ADDED / MODIFIED format).
6. For approved decisions, write `openspec/adr/NNNN-<slug>.md`.
7. If step 5 wrote files, remove `skip_specs` from `.openspec.yaml`.
8. Run `openspec archive`. The CLI validates and merges the deltas, then moves the change (with `plan.md` and `tasks-preview.md`) to the archive.

## 4. plan-lite Schema

`assets/plan-lite/schema.yaml` (D12, D25, D40):

```yaml
name: plan-lite
version: 1
openspec-version: ">=1.9.0"
description: Lightweight plan — goal, constraints, decisions. No tasks. Upgradeable to spec-driven.
artifacts:
  - id: plan
    generates: plan.md
    description: Living plan — goal, non-goals, constraints, open questions, decisions
    template: templates/plan.md
    requires: []
  - id: tasks-preview
    generates: tasks-preview.md
    description: Opt-in preview of intended code changes, for human review. Not a contract.
    template: templates/tasks-preview.md
    requires: [plan]
apply:
  requires: [plan]
  # no `tracks`: a missing or checkbox-free tasks-preview.md must not block apply
  instruction: <plan-lite apply rules from §3>
```

- `apply.requires` must be `[plan]` only. Without the `apply` block, the opt-in artifact blocks apply (`docs/facts.md`, Trap 1).
- Do not set `apply.tracks` (Trap 2).
- OpenSpec ignores the `openspec-version` key. Only the skills read it (D48).
- `version` is an integer. A change to it is a schema **update** (D45).

`templates/plan.md` (D10):

```markdown
## Goal

## Non-Goals

## Constraints

## Open Questions

## Decisions
```

Decisions are append-only. Entry format: `### Decision: <title>`, then "Chose X because Y. Rejected Z because W."

## 5. Upgrade Signals (D11, D50)

Suggest an upgrade when one of these is true:

- The work spans more than one session.
- Other people are involved.
- The change touches more than one capability.
- A contract (spec) becomes necessary.

Only propose and apply check these signals.

## 6. Out of Scope

- A schema index with many versions. Add it when a second schema version exists (D40).
- Slash commands and raw harness manifests (D35, D42).
- The user-level schema location `${XDG_DATA_HOME}/openspec/schemas/` (D41).
- Upstream contribution of the schema to OpenSpec, until real use proves it (D14).
