# Facts

Discovered facts about OpenSpec and this project's context.
Add evidence/source so we don't re-discover the same thing.

---

## OpenSpec: Building Blocks

**Source**: `openspec schemas --json`, package templates

The default `spec-driven` schema has 4 artifacts:

```
proposal → specs + design → tasks
```

| Artifact | File                       | Purpose                                     |
| -------- | -------------------------- | ------------------------------------------- |
| proposal | proposal.md                | WHY (motivation, scope, non-goals)          |
| specs    | specs/<capability>/spec.md | WHAT (requirements + scenarios, delta only) |
| design   | design.md                  | HOW (architecture, decisions, tradeoffs)    |
| tasks    | tasks.md                   | STEPS (implementation checklist)            |

A **Capability** is a named area of functionality (e.g. `user-auth`, `billing/invoices`).
A **Requirement** is a behavioral rule using RFC 2119 keywords (SHALL/SHOULD/MAY).
A **Scenario** is a concrete WHEN/THEN testable example of a requirement.

"Domain" is NOT an OpenSpec concept — only Capability, Requirement, Scenario.

---

## OpenSpec: Custom Schema Support

**Source**: package internals — `dist/core/artifact-graph/types.d.ts`, `schemas/spec-driven/schema.yaml`

Custom schemas are fully supported. A `schema.yaml` needs:

```yaml
name: <string> # required
version: <number> # required
description: <string> # optional
artifacts: # required
  - id: <string> # required
    generates: <string> # required (file glob or path)
    description: <string> # required
    template: <string> # required (path to template file)
    instruction: <string> # optional
    requires: <string[]> # optional, default []
apply: # optional
  requires: <string[]>
  tracks: <string>
  instruction: <string>
```

Validation rules: no duplicate ids, no cycles, all `requires` entries must reference existing artifact ids.

**To omit an artifact**: just remove it from the `artifacts` array. No `optional` flag exists.

**Only skip escape hatch**: `skip_specs: true` in a change's `.openspec.yaml` (allows zero spec deltas).

---

## OpenSpec: Downsides

**Source**: analysis against actual templates + README

1. **Artifact proliferation** — 4 files minimum even for small changes. Mitigated: use Level 1 for small changes.
2. **tasks.md is premature detail** — forces implementation thinking before exploration; can become stale.
3. **spec vs design boundary is blurry** — "use optimistic locking": WHAT or HOW? Not critical as long as info is recorded somewhere.
4. **Brownfield catch-up** — need baseline specs before writing deltas. Mitigated: `/opsx:explore` learns current state first.
5. **Ceremony creep** — floor is low, ceiling is high, teams drift toward the ceiling.

---

## OpenSpec: Spec Delta Format

**Source**: `schemas/spec-driven/templates/spec.md`

```markdown
## ADDED Requirements

### Requirement: <name>

<text using SHALL/SHOULD/MAY>

#### Scenario: <name>

- **WHEN** <condition>
- **THEN** <expected outcome>

## MODIFIED Requirements

## REMOVED Requirements
```

---

## OpenSpec: Stores

**Source**: README

Stores = standalone OpenSpec repos registered on this machine. Cross-repo planning.
Still in beta. Used when planning spans multiple repos or teams.

---

## OpenSpec: Archive Behavior With No Specs

**Source**: `dist/cli/archive.js` lines 1120-1567

When a change has no `specs/` directory or empty delta, `openspec archive` works fine:

- Skips the entire spec merge/validate/confirm block
- Goes straight to moving the change directory to archive
- No error thrown, no special flag needed

An unmarked zero-delta change archives with only non-blocking proposal warnings.

---

## OpenSpec: `.openspec.yaml` schema Field

**Source**: `dist/core/change-metadata/schema.d.ts`

The change metadata file has a **required** `schema` field (`z.ZodString`). Full shape:

```ts
{
  schema: string;              // required — controls which schema the change uses
  created?: string;
  goal?: string;
  affected_areas?: string[];
  initiative?: object;
  skip_specs?: boolean;
  retire_capabilities?: boolean;
}
```

To switch a change from `plan-lite` to `spec-driven`, edit the `schema:` value in `.openspec.yaml`.

---

## OpenSpec: No Upgrade Command Exists

**Source**: `dist/cli/index.js` full command surface

No `openspec change upgrade`, `migrate`, or schema-switching subcommand exists. Schema switch = manual edit to `.openspec.yaml`.

The upgrade AI skill must:

1. Edit `.openspec.yaml` — change `schema: plan-lite` → `schema: spec-driven`
2. Scaffold missing artifacts (proposal.md, specs/, design.md, tasks.md) using content from plan.md

---

## OpenSpec: apply Without tasks.md

**Source**: read from code, not run. `dist/commands/workflow/instructions.js` lines 253–327, `dist/core/artifact-graph/graph.js:140`, `dist/core/archive.js:1062`, `dist/core/validation/validator.js:391`, `~/.claude/skills/openspec-apply-change/SKILL.md`.

`openspec instructions apply` works with no `tasks.md` if the schema has `apply.requires: [plan]` and no `apply.tracks`.

```js
const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
const tracksFile = applyConfig?.tracks ?? null;
// no tracksFile → state 'ready', instruction = apply.instruction or default text
```

- Apply is `blocked` only when an artifact in `requires` has no output file.
- With no `tracks`, the state is `ready` with 0/0 tasks. There is no error.
- **Trap 1**: with no `apply` block, `requires` defaults to all artifacts. A missing opt-in artifact then blocks apply.
- **Trap 2**: with `tracks: tasks-preview.md`, apply is `blocked` when the file is missing or has no checkboxes.

**Stock apply skill**: it mostly follows the CLI output (`contextFiles`, `state`, `instruction`). But its text assumes tasks: "Mark task complete `- [ ]` → `- [x]`", "Progress: N/M tasks complete". With zero tasks, the agent depends on `apply.instruction`.

**Done signal**: `all_done` needs `tracksFile && remaining === 0 && total > 0`. With no `tracks`, the state stays `ready`. The CLI never reports a plan-lite change as done.

**status**: an artifact that nothing depends on shows as not done. "All planning artifacts complete!" does not print until every artifact exists. This does not block apply.

**archive**: checks only checkbox progress. With no tracked file and no `tasks.md`, the count is 0 and there is no warning. It does not check artifacts.

**validate**: raises `CHANGE_NO_DELTAS` for a change with no spec deltas. Set `skip_specs: true` in `.openspec.yaml` to prevent this. Archive skips this check.
