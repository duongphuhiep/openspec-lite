# openspec-lite

A lightweight workflow extension for [OpenSpec](https://github.com/Fission-AI/OpenSpec) — filling the gap between a throwaway `plan.md` and a full spec-driven change.

## The Problem

OpenSpec's 4-artifact workflow (`proposal → specs → design → tasks`) is too heavy for medium-complexity work. `tasks.md` in particular forces premature implementation detail before you've explored the code.

## The Solution: Three Levels

```
Level 1 ── Direct implementation      (no artifacts)
Level 2 ── opsx-lite                  (plan.md only)
Level 3 ── spec-driven                (full OpenSpec)
                ↑
                upgrade path when scope grows
```

| Level | When to use                                              | Artifacts                           |
| ----- | -------------------------------------------------------- | ----------------------------------- |
| 1     | Bug fix, isolated refactor, obvious feature              | None                                |
| 2     | Medium change: needs planning, single session            | `plan.md`                           |
| 3     | Multi-session, team handoff, cross-repo, contract needed | `proposal + specs + design + tasks` |

## What openspec-lite Ships

- **`plan-lite` schema** — single `plan.md` artifact, no tasks, no design
- **`opsx-lite:propose`** — create a plan-lite change
- **`opsx-lite:upgrade`** — promote a plan-lite change to full spec-driven when complexity grows
- **`opsx-lite:archive`** — archive with selective promotion to permanent specs

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

## Lifecycle

```
opsx-lite:propose
      │
      ▼
  plan.md (grows during work)
      │
      ├── scope grows? → opsx-lite:upgrade → spec-driven change
      │
      └── done? → opsx-lite:archive
                        │
                        ├── plan.md → local archive
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
3. Scaffolds empty `specs/`, `design.md`, `tasks.md` for the AI to fill in

No data is lost. The original `plan.md` stays as context.

## See Also

- [`docs/facts.md`](docs/facts.md) — discovered facts about OpenSpec internals
- [`docs/decisions.md`](docs/decisions.md) — design decisions with rationale
