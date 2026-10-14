# openspec-lite

A lightweight workflow on top of OpenSpec for medium changes. It replaces the full spec-driven change with a plan and an optional tasks preview.

## Language

**Plan**:
The living document of a plan-lite change. It holds the goal, non-goals, constraints, open questions, and decisions.
_Avoid_: Proposal, design

**Tasks preview**:
An opt-in list of intended code changes for human review before coding. It is a reference, not a contract.
_Avoid_: Tasks, task list, checklist

**Tasks** (OpenSpec):
The `tasks.md` artifact of a spec-driven change. The apply phase follows it and tracks it as a checklist.
_Avoid_: Tasks preview

**Promotion**:
The move of non-obvious information from an archived plan into permanent specs or ADRs.
_Avoid_: Sync, merge, upgrade

**Upgrade**:
The switch of an active change from plan-lite to spec-driven, when its scope grows.
_Avoid_: Graduation, promotion, migration
