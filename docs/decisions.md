# Decisions

Design decisions for this project. Add rationale so future proposals can build on them.

---

## D1: Three-Level Workflow

**Decision**: Adopt a 3-level workflow based on change complexity.

| Level           | Trigger                                                 | Artifacts                                                      |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| 1 — Direct      | Small: bug fix, isolated refactor, obvious feature      | None (prompt → implement → verify)                             |
| 2 — Lightweight | Medium: needs planning, single session or short         | plan.md (goal + non-goals + constraints, grows with decisions) |
| 3 — OpenSpec    | Large: multi-session, team, cross-repo, contract needed | proposal + specs + design + tasks                              |

**Rationale**: OpenSpec overhead is only justified when context persistence matters across sessions, agents, or people. Most work is Level 1 or 2.

---

## D2: tasks.md Is the Main Pain Point

**Decision**: tasks.md should be optional or eliminated for Level 2 work.

**Rationale**:

- Forces premature implementation detail before exploration
- AI re-derives tasks anyway during implementation
- Becomes stale fast

For Level 2, implementation details emerge from exploration — not pre-planned.

---

## D3: plan.md Lifecycle

**Decision**: When a Level-2 change is done:

1. Archive `plan.md` locally (keep for archaeology)
2. Selectively promote non-obvious, hard-to-deduce information to permanent specs
3. Throw away implementation scaffolding (obvious from code)

**Rationale**: Not all plan content is worth keeping. The AI should help judge what's non-obvious enough to promote.

**Open question**: What heuristic does the AI use to decide what to promote? (unresolved — see grilling session)

---

## D4: plan.md Is a Living Document

**Decision**: `plan.md` starts minimal (goal + non-goals + constraints) and grows as decisions are made during work.

**Rationale**: Pre-planning implementation details is wasteful. Decisions crystallize during exploration — capture them then, not before.

---

## D5: Custom Schema for Level 2

**Decision**: Use OpenSpec's custom schema support to build a Level-2 schema.

**Rationale**: OpenSpec tooling (CLI, archive, stores) is worth keeping. Custom schemas let us drop tasks.md and simplify to a single plan artifact.

**Status**: Resolved — see D12 and D13.

---

## D6: Promotion Heuristic (Round 2)

**Decision**: When archiving a Level-2 change, the AI proposes what to promote using two filters:

1. **Non-obvious rule** — if a future reader can deduce it from the code in 5 minutes, skip it. If they'd need to ask someone, promote it.
2. **Surprise rule** — would this surprise a new team member? If yes, promote it.

User reviews and approves the proposed list before promotion happens.

**Rationale**: Keeps permanent specs lean. Avoids both losing important context and polluting specs with noise.

---

## D7: Graduated Schema (Round 2)

**Decision**: Level 2 and Level 3 are not parallel tracks. A Level-2 change can be upgraded to Level 3 by running a command that scaffolds the missing artifacts (specs, design, tasks) from the existing plan.md.

**Rationale**: Changes often grow in scope mid-flight. Rewriting from scratch is wasteful. Upgrade path avoids the "this got more complex than expected" problem.

---

## D8: Promotion Targets (Round 2)

**Decision**: When plan.md content is promoted to permanent storage:

- Requirements and scenarios → `specs/<capability>/spec.md` (OpenSpec delta format)
- Design decisions → `docs/adr/NNNN-<slug>.md` (ADR format)
- Per-item: the AI judges which bucket each piece of information belongs to, user approves.

**Rationale**: Requirements and decisions have different lifecycles and audiences. Keeping them separate makes both more useful.

---

## D9: ADR Format for Permanent Decisions (Round 3)

**Decision**: Permanent decisions are recorded as ADRs in `docs/adr/NNNN-<slug>.md`.

**Rationale**: ADRs are self-contained, searchable, and linkable. One file per decision scales better than an append-only blob. Standard format means tooling and conventions already exist.

---

## D10: plan.md Template (Round 3)

**Decision**: plan.md uses this structure:

```markdown
## Goal

## Non-Goals

## Constraints

## Open Questions

## Decisions
```

The Decisions section is append-only: decisions are captured as they crystallize during exploration/implementation, not pre-planned. Format per entry: `### Decision: <title>` / Chose X because Y. Rejected Z because W.

**Rationale**: The Decisions section is the key differentiator from a throwaway plan.md. Without it, the file has no long-term value and nothing worth promoting at archive time.

---

## D11: Graduation Trigger (Round 3)

**Decision**: Graduation from Level 2 → Level 3 is triggered two ways:

1. **Explicit** — user says "upgrade this to Level 3", command scaffolds missing artifacts from plan.md
2. **AI-suggested** — AI detects complexity signals (change spans >1 session, involves others, touches multiple capabilities) and suggests upgrading

## **Rationale**: Explicit covers intentional upgrades. AI-suggested catches the case where complexity crept in while the user was heads-down.

## D12: plan-lite Schema (Round 4)

**Decision**: The Level-2 custom schema is named `plan-lite`. Single artifact:

```yaml
name: plan-lite
version: 1
description: Lightweight plan — goal, constraints, decisions. No tasks. Upgradeable to spec-driven.
artifacts:
  - id: plan
    generates: plan.md
    description: Living plan document capturing goal, constraints, and decisions as they emerge
    template: templates/plan.md
    requires: []
```

**Rationale**: One artifact, no dependencies, no tasks. Scratch notes stay in AI context, not a file.

---

## D13: Upgrade Mechanism (Round 4)

**Decision**: Graduation from plan-lite → spec-driven is an AI skill that orchestrates existing CLI primitives. The skill:

1. Reads plan.md to extract goal, non-goals, constraints
2. Changes the change's schema metadata (`.openspec.yaml`) to `spec-driven`
3. Pre-fills proposal.md from plan.md content
4. Leaves specs/design/tasks empty for the AI to fill in from plan.md context

**Rationale**: CLI handles file/metadata mechanics. AI handles content extraction and mapping.

---

## D14: Schema Distribution (Round 5)

**Decision**: plan-lite schema starts as project-local (`openspec/schemas/plan-lite/`). If it proves useful in practice, contribute upstream to the OpenSpec package.

**Rationale**: Validate in real use before contributing. Avoids polluting upstream with an unproven design.

---

## D15: openspec-lite Scope (Round 5)

**Decision**: `openspec-lite` is a complete package containing both the plan-lite schema and the AI skills for the plan-lite workflow.

**Rationale**: Schema and skills are useless without each other. A schema with no skill means the user has to manually run CLI commands. A skill with no schema has nothing to create.

---

## D16: Skills Set (Round 5)

**Decision**: openspec-lite ships three skills:

| Skill               | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `opsx-lite:propose` | Create a plan-lite change (scaffolds plan.md)               |
| `opsx-lite:upgrade` | Promote plan-lite → spec-driven when complexity grows       |
| `opsx-lite:archive` | Archive with selective promotion (AI judges, user approves) |

`/opsx:explore` is reused as-is — no duplication needed.

---

## D17: Skill Naming (Round 5)

**Decision**: Skills use the `opsx-lite:` prefix.

**Rationale**: Signals it's an extension of the opsx family, not a standalone tool. Clearer than plain `lite:` when both opsx and opsx-lite are installed.

---

## D18: Archive Promotion UX (Round 5)

**Decision**: The archive promotion interaction is conversational. The AI lists what it would promote, the user responds yes/no/edit inline. No staging files, no extra artifacts.

**Rationale**: Lowest friction. Keeps the workflow fast for the common case.
