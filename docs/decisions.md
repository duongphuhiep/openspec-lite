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
- Design decisions → `openspec/adr/NNNN-<slug>.md` (ADR format)
- Per-item: the AI judges which bucket each piece of information belongs to, user approves.

**Rationale**: Requirements and decisions have different lifecycles and audiences. Keeping them separate makes both more useful.

---

## D9: ADR Format for Permanent Decisions (Round 3)

**Decision**: Permanent decisions are recorded as ADRs in `openspec/adr/NNNN-<slug>.md`.

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

| Skill                     | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `opsx-lite:propose`       | Create a plan-lite change (scaffolds plan.md)                     |
| `opsx-lite:tasks-preview` | Generate or regenerate tasks-preview.md (added by D26)            |
| `opsx-lite:apply`         | Implement from plan.md + optional tasks-preview.md (added by D27) |
| `opsx-lite:upgrade`       | Promote plan-lite → spec-driven when complexity grows             |
| `opsx-lite:archive`       | Archive with selective promotion (AI judges, user approves)       |

`/opsx:explore` is reused as-is — no duplication needed.

---

## D17: Skill Naming (Round 5)

**Decision**: Skills use the `opsx-lite:` prefix.

**Rationale**: Signals it's an extension of the opsx family, not a standalone tool. Clearer than plain `lite:` when both opsx and opsx-lite are installed.

---

## D18: Archive Promotion UX (Round 5)

**Decision**: The archive promotion interaction is conversational. The AI lists what it would promote, the user responds yes/no/edit inline. No staging files, no extra artifacts.

**Rationale**: Lowest friction. Keeps the workflow fast for the common case.

---

## D19: Task Preview Is AI-Generated (Tasks Round 1)

**Decision**: The AI writes the task preview. It reads `plan.md` and explores the code first. Then it lists the code changes it intends to make.

**Rationale**: The value is a look at the agent's intent before it writes code. A human-written task list does not give this.

---

## D20: Task Preview Is On Demand (Tasks Round 1)

**Decision**: The task preview is opt-in. The user asks for it when they want a preview. The default plan-lite flow does not include it.

**Rationale**: A mandatory task list makes plan-lite heavy again. It brings back downside 2 (D2).

---

## D21: Task Preview Value Is the Checkpoint (Tasks Round 1)

**Decision**: The value of the task preview is the human review before coding. The artifact itself has no long-term value.

**Rationale**: After the AI writes the code, the diff is the truth. The preview is not a contract.

---

## D22: Task Preview Is a File, tasks-preview.md (Tasks Round 2)

**Decision**: The task preview is an opt-in artifact named `tasks-preview.md`. It is not a chat-only preview.

- It is for the human. The human uses it to check that the AI will not do strange things.
- It is a reference. It is not a list of fixed steps.
- The apply skill can use it as a guide. The apply skill can change the approach during implementation. For example, it can make the implementation simpler.

**Rationale**: A file survives a context clear. It also works in tools that have no native plan mode.

---

## D23: Constraints Kept From OpenSpec tasks.md (Tasks Round 2)

**Decision**: `tasks-preview.md` keeps three constraints from OpenSpec `tasks.md`:

1. Order the tasks by dependency.
2. Give each task explicit verification criteria.
3. Write tests and docs together with the related implementation.

Do not split work into very small subtasks. Each task describes a meaningful, verifiable outcome. A task guides the coding agent. It does not specify implementation details that the agent can find itself.

**Rationale**: These three constraints give the preview its review value. Very small subtasks make the preview a script, which is the original complaint (D2).

---

## D24: tasks-preview.md Uses the tasks.md Format (Tasks Round 2)

**Decision**: `tasks-preview.md` uses the same format and detail level as OpenSpec `tasks.md`. Pseudo-diffs are permitted.

**Rationale**: The file is opt-in and reference-only. The difference from `tasks.md` is its status, not its format. Supersedes the Q5 detail-level question.

---

## D25: plan-lite Schema Has Two Artifacts (Tasks Round 2)

**Decision**: `plan-lite` has a required `plan` artifact and an opt-in `tasks-preview` artifact. This revises D12.

The schema has `apply.requires: [plan]` and no `apply.tracks`. This prevents both apply traps in `docs/facts.md`.

**Status**: Resolved — see D27.

---

## D26: opsx-lite:tasks-preview Skill (Tasks Round 3)

**Decision**: Two ways create the task preview:

1. `opsx-lite:propose` asks at the end: "Do you want a task preview?"
2. A separate skill, `opsx-lite:tasks-preview`, generates the preview at any time.

`opsx-lite:tasks-preview` overwrites the old `tasks-preview.md`.

**Rationale**: Two real workflows need the separate skill:

- The user clears the context and explores more details. Then the user generates the preview with more confidence.
- The user disagrees with the preview. The user adds constraints, non-goals, or decisions to `plan.md`. Then the user regenerates the preview and reads it again. This confirms that the AI understands the plan.

---

## D27: opsx-lite:apply Skill (Tasks Round 3)

**Decision**: Make an `opsx-lite:apply` skill. It implements from `plan.md`. It uses `tasks-preview.md` as a guide if the file exists.

The user starts with stock `/opsx:apply`. The schema `apply.instruction` holds the plan-lite rules. If stock apply does not work as expected, the user changes to `opsx-lite:apply` and compares.

**Rationale**: Stock apply runs without `tasks.md`, but its text assumes checkboxes. It also never gets a done signal (see `docs/facts.md`). The user expects that `opsx-lite:apply` is not redundant. This is an instinct, with no evidence yet.

**Review trigger**: Remove `opsx-lite:apply` if real use shows that stock `/opsx:apply` does the same job.

---

## D28: New Changes Set skip_specs (Tasks Round 3)

**Decision**: `opsx-lite:propose` sets `skip_specs: true` in `.openspec.yaml` for each new plan-lite change.

**Rationale**: Without it, `openspec validate` fails with `CHANGE_NO_DELTAS`. A plan-lite change usually has no spec deltas.

---

## D29: Deviations Go to plan.md Decisions (Tasks Round 3)

**Decision**: When apply changes the approach from the preview, it adds an entry to the `## Decisions` section of `plan.md`. It does this only for meaningful changes. The end-of-apply summary also lists the deviations. Apply does not edit `tasks-preview.md`.

**Rationale**: A deviation is a decision that the code does not explain. The archive step can promote it (D6). The preview stays as the record of what the user approved.

---

## D30: tasks-preview.md Is Never Promoted (Tasks Round 3)

**Decision**: At archive time, `tasks-preview.md` goes to the archive with `plan.md`. Promotion (D6) does not read it.

**Rationale**: Anything worth keeping is already in the `plan.md` decisions (D29). This keeps one source for promotion.

---

## D31: Upgrade Seeds tasks.md From the Preview (Tasks Round 3)

**Decision**: `opsx-lite:upgrade` uses `tasks-preview.md` as the seed for `tasks.md`. The user reviews `tasks.md` again after the upgrade.

**Rationale**: The format is the same (D24), so the content is reusable. The second review is necessary because `tasks.md` is a contract, not a reference.

---

## D32: Do Not Edit tasks-preview.md (Tasks Round 4)

**Decision**: `tasks-preview.md` is output only. The user puts every correction in `plan.md` and regenerates the preview. The file starts with this notice: "Generated. Edit plan.md, not this file."

**Rationale**: `opsx-lite:tasks-preview` overwrites the file (D26). With one source of truth, a regeneration never loses information.

---

## D33: Apply Warns About a Stale Preview (Tasks Round 4)

**Decision**: If `plan.md` is newer than `tasks-preview.md`, apply tells the user and offers to regenerate the preview. When the two files conflict, `plan.md` wins.

**Rationale**: A cheap check that catches a real mistake: the user changes the plan and forgets to regenerate.
