# openspec-lite

A lightweight workflow extension for [OpenSpec](https://github.com/Fission-AI/OpenSpec). It fills the gap between a throwaway `plan.md` and a full spec-driven change.

## The Problem

The OpenSpec workflow has four artifacts: `proposal → specs → design → tasks`. This is too heavy for a medium change. `tasks.md` is the main problem. It forces implementation details before you explore the code.

## The Solution: Three Levels

```
Level 1 ── Direct implementation   (no artifacts)
Level 2 ── openspec-lite           (plan.md + optional tasks-preview.md)
Level 3 ── spec-driven             (full OpenSpec)
                ↑
                upgrade path when scope grows
```

| Level | When to use                                              | Artifacts                               |
| ----- | -------------------------------------------------------- | --------------------------------------- |
| 1     | Bug fix, isolated refactor, obvious feature              | None                                    |
| 2     | Medium change: needs planning, single session            | `plan.md` + optional `tasks-preview.md` |
| 3     | Multi-session, team handoff, cross-repo, contract needed | `proposal + specs + design + tasks`     |

## What openspec-lite Ships

- **`plan-lite` schema**: one artifact, `plan.md`. It has no design and no `tasks.md`. The opt-in `tasks-preview.md` is outside the schema.
- **`openspec-lite-propose`**: creates a plan-lite change. It asks if you want a tasks preview.
- **`openspec-lite-tasks-preview`**: generates or regenerates `tasks-preview.md`.
- **`openspec-lite-apply`**: implements from `plan.md`. It uses `tasks-preview.md` as a guide.
- **`openspec-lite-upgrade`**: upgrades a plan-lite change to spec-driven when the scope grows.
- **`openspec-lite-archive`**: archives the change. It promotes selected items to specs and ADRs.
- **`openspec-lite-schema`**: installs the plan-lite schema into the repo and checks its version. The other skills run it when necessary.

Try stock `/opsx:apply` first. If it does not work well, use `openspec-lite-apply`.

Use stock `/opsx:explore` before you propose. openspec-lite has no explore skill.

## plan.md Structure

`plan.md` is a living document. It starts small. It grows when you make decisions during the work.

```markdown
## Goal

## Non-Goals

## Constraints

## Open Questions

## Decisions
```

The **Decisions** section is append-only. Record each decision when you make it, during exploration or implementation:

```markdown
### Decision: Use optimistic locking

Chose optimistic locking over pessimistic because contention is low.
Rejected row-level locks because they add too much overhead for a read-heavy workload.
```

## Tasks Preview

`tasks-preview.md` is opt-in. It shows the code changes that the AI intends to make. Read it before coding starts, to find a wrong approach early.

- It is a reference, not a contract. Apply can change the approach, for example to make the code simpler.
- It uses the OpenSpec `tasks.md` layout, with plain bullets instead of checkboxes. Tasks are in dependency order. Each task has verification criteria. Tests and docs go with the related code.
- Each task is a meaningful, verifiable outcome. Do not split the work into very small subtasks.
- Do not edit it by hand. Put corrections in `plan.md`. Then run `openspec-lite-tasks-preview` again. It overwrites the old file.

During apply:

- When the two files conflict, `plan.md` wins.
- If `plan.md` changed after the preview was generated, apply warns you. The preview stores a hash of `plan.md` for this check. The hash ignores the `## Decisions` section, because apply adds to it.
- Apply records each meaningful deviation in the `plan.md` decisions.

## Lifecycle

```
openspec-lite-propose
      │
      ▼
  plan.md (grows during work)
      │
      ├── want a preview? → openspec-lite-tasks-preview → tasks-preview.md
      │                         ↑ disagree? edit plan.md, regenerate
      │
      ├── /opsx:apply or openspec-lite-apply → code
      │
      ├── scope grows? → openspec-lite-upgrade → spec-driven change
      │
      └── done? → openspec-lite-archive
                        │
                        ├── requirements → specs/<capability>/spec.md
                        ├── decisions → openspec/adr/YYYY-MM-DD-<slug>.md
                        └── plan.md, tasks-preview.md → local archive
```

At archive time, the AI uses two filters to select what to promote:

- **Non-obvious**: a future reader cannot deduce it from the code in 5 minutes.
- **Surprising**: it would surprise a new team member.

One filter is sufficient. The AI shows the list. You approve, reject, or edit each item in the conversation. The AI writes nothing before your approval.

## Upgrade Path

When a Level 2 change grows past its original scope, `openspec-lite-upgrade` does these steps:

1. It changes `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`.
2. It removes `skip_specs: true` from `.openspec.yaml`.
3. It writes `proposal.md`, `specs/`, `design.md`, and `tasks.md` in that order, from `plan.md`. The `plan.md` decisions go to `design.md`.
4. If `tasks-preview.md` exists, it seeds `tasks.md` and adds checkboxes. Then it deletes the preview.
5. It deletes each `plan.md` section whose content moved. If nothing is left, it deletes `plan.md`.

Review all artifacts after the upgrade. Review `tasks.md` carefully, because it is a contract.

After an upgrade, archive with stock `/opsx:archive`.

## Compatibility

| openspec-lite | OpenSpec CLI |
| ------------- | ------------ |
| (unreleased)  | `>=1.9.0`    |

## See Also

- [`docs/design.md`](docs/design.md): current rules for skills, schema, and delivery
- [`CONTEXT.md`](CONTEXT.md): glossary of project terms
- [`docs/facts.md`](docs/facts.md): verified facts about OpenSpec internals
- [`docs/decisions.md`](docs/decisions.md): design decisions with rationale
