# openspec-lite

A lightweight workflow extension for [OpenSpec](https://github.com/Fission-AI/OpenSpec) — filling the gap between a throwaway `plan.md` and a full spec-driven change.

## The Problem

OpenSpec's 4-artifact workflow (`proposal → specs → design → tasks`) is too heavy for medium-complexity work. `tasks.md` in particular forces premature implementation detail before you've explored the code.

## The Solution: Three Levels

```
Level 1 ── Direct implementation      (no artifacts)
Level 2 ── opsx-lite                  (plan.md + optional tasks-preview.md)
Level 3 ── spec-driven                (full OpenSpec)
                ↑
                upgrade path when scope grows
```

| Level | When to use                                              | Artifacts                           |
| ----- | -------------------------------------------------------- | ----------------------------------- |
| 1     | Bug fix, isolated refactor, obvious feature              | None                                |
| 2     | Medium change: needs planning, single session            | `plan.md` + optional `tasks-preview.md` |
| 3     | Multi-session, team handoff, cross-repo, contract needed | `proposal + specs + design + tasks` |

## What openspec-lite Ships

- **`plan-lite` schema** — a required `plan.md` and an opt-in `tasks-preview.md`. No design, no `tasks.md`.
- **`opsx-lite:propose`** — create a plan-lite change. It asks if you want a task preview.
- **`opsx-lite:tasks-preview`** — generate or regenerate `tasks-preview.md`.
- **`opsx-lite:apply`** — implement from `plan.md`, with `tasks-preview.md` as a guide.
- **`opsx-lite:upgrade`** — promote a plan-lite change to full spec-driven when complexity grows
- **`opsx-lite:archive`** — archive with selective promotion to permanent specs

Try stock `/opsx:apply` first. Use `opsx-lite:apply` if stock apply does not work well.

Use `/opsx:explore` as-is before proposing — no duplication needed.

## plan.md Structure

`plan.md` is a living document. It starts minimal and grows as decisions crystallize during work.

```markdown
## Goal

## Non-Goals

## Constraints

## Open Questions

## Decisions
```

The **Decisions** section is append-only. As decisions emerge during exploration or implementation, capture them here:

```markdown
### Decision: Use optimistic locking

Chose optimistic locking over pessimistic because contention is low.
Rejected row-level locks — too much overhead for read-heavy workload.
```

## Task Preview

`tasks-preview.md` is opt-in. It shows the code changes that the AI intends to make. You read it before coding starts, to catch a wrong approach early.

- It is a reference, not a contract. Apply can change the approach, for example to make the code simpler.
- It uses the OpenSpec `tasks.md` format. Tasks are ordered by dependency. Each task has verification criteria. Tests and docs go with the related code.
- Each task is a meaningful, verifiable outcome. Do not split work into very small subtasks.
- Do not edit it by hand. Put corrections in `plan.md`, then run `opsx-lite:tasks-preview` again. It overwrites the old file.

During apply:

- `plan.md` wins when the two files conflict.
- Apply warns you if `plan.md` is newer than `tasks-preview.md`.
- Apply records each meaningful deviation in the `plan.md` decisions.

## Lifecycle

```
opsx-lite:propose
      │
      ▼
  plan.md (grows during work)
      │
      ├── want a preview? → opsx-lite:tasks-preview → tasks-preview.md
      │                         ↑ disagree? edit plan.md, regenerate
      │
      ├── /opsx:apply or opsx-lite:apply → code
      │
      ├── scope grows? → opsx-lite:upgrade → spec-driven change
      │
      └── done? → opsx-lite:archive
                        │
                        ├── plan.md, tasks-preview.md → local archive
                        ├── requirements → specs/<capability>/spec.md
                        └── decisions → docs/adr/NNNN-<slug>.md
```

At archive time, the AI proposes what to promote using two filters:

- **Non-obvious**: a future reader can't deduce it from the code in 5 minutes
- **Surprising**: would this surprise a new team member?

You review and approve the list conversationally before anything is written.

## Upgrade Path

When a Level-2 change grows beyond its original scope, `opsx-lite:upgrade`:

1. Edits `.openspec.yaml` — changes `schema: plan-lite` → `schema: spec-driven`
2. Pre-fills `proposal.md` from `plan.md` content
3. Scaffolds empty `specs/` and `design.md` for the AI to fill in
4. Seeds `tasks.md` from `tasks-preview.md` if it exists. Review it again: `tasks.md` is a contract.

No data is lost. The original `plan.md` stays as context.

## See Also

- [`CONTEXT.md`](CONTEXT.md) — glossary of project terms
- [`docs/facts.md`](docs/facts.md) — discovered facts about OpenSpec internals
- [`docs/decisions.md`](docs/decisions.md) — design decisions with rationale
