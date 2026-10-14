# openspec-lite

A lightweight workflow on top of OpenSpec for medium changes. It replaces the full spec-driven change with a plan and an optional tasks preview.

## Language

**Level 1 / Level 2 / Level 3**:
The three sizes of a change. Level 1 is a direct implementation with no artifacts. Level 2 is a plan-lite change. Level 3 is a spec-driven change.
_Avoid_: Tier, mode

**plan-lite**:
The custom OpenSpec schema for Level 2. Its only artifact is the plan. The tasks preview is a file outside the schema.
_Avoid_: Lite schema, openspec-lite schema

**Plan**:
The living document of a plan-lite change. It holds the goal, non-goals, constraints, open questions, and decisions.
_Avoid_: Proposal, design

**Tasks preview**:
An opt-in list of intended code changes for human review before coding. It is a reference, not a contract.
_Avoid_: Task preview, tasks, task list, checklist

**Tasks** (OpenSpec):
The `tasks.md` artifact of a spec-driven change. The apply phase follows it and tracks it as a checklist.
_Avoid_: Tasks preview

**Deviation**:
A meaningful change of approach during apply, compared to the tasks preview. Apply records it in the `## Decisions` section of the plan.
_Avoid_: Drift, divergence

**Promotion**:
The move of non-obvious information from a plan into permanent specs or ADRs. It happens during archive, before the change moves to the archive.
_Avoid_: Sync, merge, upgrade

**Upgrade**:
The switch of an active change from plan-lite to spec-driven, when its scope grows.
_Avoid_: Graduation, promotion, migration

**Schema update**:
A change to the `version` of the plan-lite schema, and the copy of the new version into a repo.
_Avoid_: Schema upgrade, schema migration
