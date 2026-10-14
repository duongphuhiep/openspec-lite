# Facts

Discovered facts about OpenSpec and this project's context.
Add evidence/source so we don't re-discover the same thing.

All OpenSpec facts come from `@fission-ai/openspec` **1.9.0**, unless an entry states a different version.

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

**Unknown keys are dropped**: `SchemaYamlSchema` in `dist/core/artifact-graph/types.js:39` is a plain `z.object`, not `.strict()`. Zod removes unknown keys, so a key such as `openspec-version` causes no error. OpenSpec does not read it.

---

## OpenSpec: Schema Resolution Order

**Source**: `dist/core/artifact-graph/resolver.js:107-119`

The CLI looks for `<name>/schema.yaml` in this order:

1. Project-local: `<projectRoot>/openspec/schemas/<name>/`
2. User override: `${XDG_DATA_HOME}/openspec/schemas/<name>/`
3. Package built-in: `<package>/schemas/<name>/`

---

## OpenSpec: `new change --schema`

**Source**: `openspec new change --help`

`openspec new change <name>` accepts `--schema <name>`. The default is `spec-driven`. Other options: `--description`, `--goal`, `--json`, `--store`.

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

**MODIFIED needs full content** (source: `schemas/spec-driven/schema.yaml:75`, `:96-102`): a MODIFIED requirement must hold the full updated requirement. Copy it from `openspec/specs/<capability>/spec.md`, then edit it. Partial content loses detail at archive time.

**Spec-driven template sections** (source: `schemas/spec-driven/templates/`): `proposal.md` has Why, What Changes, Capabilities, Impact. `design.md` has Context, Goals / Non-Goals, Decisions, Risks / Trade-offs. Neither has a section for constraints or open questions.

**Node requirement** (source: `package.json` `engines`): `@fission-ai/openspec` requires Node `>=20.19.0`.

---

## OpenSpec: Stores

**Source**: README

Stores = standalone OpenSpec repos registered on this machine. Cross-repo planning.
Still in beta. Used when planning spans multiple repos or teams.

---

## OpenSpec: Archive Behavior With No Specs

**Source**: `dist/core/archive.js` lines 1115-1567

When a change has no `specs/` directory or empty delta, `openspec archive` works fine:

- Skips the entire spec merge/validate/confirm block
- Goes straight to moving the change directory to archive
- No error thrown, no special flag needed

An unmarked zero-delta change archives with only non-blocking proposal warnings.

---

## OpenSpec: Archive Confirmation Prompts

**Source**: `dist/core/archive.js:1047`, `:1076`, `:1183`

`openspec archive` asks for confirmation in three cases. `--yes` skips each prompt:

- `--no-validate` is set: "Skipping validation may archive invalid specs."
- The tracked tasks file has unchecked tasks: "N incomplete task(s) found."
- The change has spec deltas: "Proceed with spec updates?"

If the CLI cannot read an answer from stdin, it blocks with `archive_confirmation_required`.

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

No `openspec change upgrade`, `migrate`, or schema-switching subcommand exists. To switch the schema, edit `.openspec.yaml` by hand. The CLI does not create the missing artifacts. `docs/design.md` §3 defines what the upgrade skill does (D62).

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

---

## skillpm: Install, Placement, and One Skill per Package

**Source**: skillpm 2.0.0 (`npm pack skillpm@2.0.0`, `dist/commands/publish.js`, `dist/scanner/index.js`); https://github.com/sbroenne/skillpm `README.md` lines 19-54 (commit 3a531ea)

- Install: `npx skillpm install <pkg>`. It runs `npm install`, scans `node_modules/`, then links. Run `skillpm sync` after `npm install`, `npm ci`, or `npm update`.
- skillpm delegates harness wiring to the vercel-labs `skills` tool, pinned to `skills@1.7.0` (`src/utils/exec.ts:6`). It runs `npx --yes skills@1.7.0 add <skillDir> -y --json`. skillpm has no harness list of its own.
- The `skills` tool copies the skill into `.agents/skills/` and links harness folders to that copy. In `skills@1.7.0`, `src/agents.ts:158` maps `claude-code` to `.claude/skills`.
- The copy keeps the whole skill folder, including `assets/`. It skips only `metadata.json`, `.git`, `__pycache__`, and `__pypackages__` (`vercel-labs/skills` v1.7.0 `src/installer.ts:458-463`, `:500-530`).
- **One skill per package.** `publish` fails unless `skills/` holds exactly one skill: "A skillpm package must contain exactly one skill in skills/. Split multiple skills into separate npm packages." (`publish.js:44-45`). The scanner also returns only the first `skills/<name>/SKILL.md` of each package (`tryReadSkill`, `scanner/index.js:75-101`).
- The scanner walks nested `node_modules/` folders (`scanPackage` → `scanDirectory`), so it finds skills in dependency packages too.
- `publish` also requires `"keywords": ["agent-skill"]` in `package.json` and runs the `skills-ref validate` reference validator.

---

## Microsoft APM: Install and Skill Paths

**Source**: https://github.com/microsoft/apm (commit fe39119), files under `docs/src/content/docs/`

- Install: `apm install [PACKAGE_REF...] [-t <target>]`. With no arguments, it installs from `apm.yml`. `apm install owner/repo --skill <name>` selects one skill (`reference/cli/install.md:11-18`, `:55`).
- Skills deploy at install time. `apm compile -t <target>` builds only context files, for example `AGENTS.md` and `CLAUDE.md` (`reference/cli/compile.md:81`, `:146`).
- The package source is a git repo. A registry HTTP API exists, but it is experimental (`reference/registry-http-api.md`).
- `apm.yml` accepts 13 target slugs: copilot, claude, grok-build, cursor, opencode, codex, gemini, antigravity, windsurf, kiro, agent-skills, hermes, grok-bot. Nine are auto-detected (`concepts/primitives-and-targets.md:81`, `reference/targets-matrix.md`).
- Project skill paths (default "skills convergence", `producer/author-primitives/skills.md:96-127`):
  - `.claude/skills/<name>/` for claude
  - `.grok/skills/<name>/` for grok-build
  - `.kiro/skills/<name>/` for kiro
  - `.agents/skills/<name>/` for copilot, cursor, codex, gemini, opencode, windsurf, antigravity, hermes, agent-skills
  - `agent-data/workflows/<name>/` for grok-bot
  - `--legacy-skill-paths` restores the old per-target folders.
- The whole skill folder is copied with `shutil.copytree`, so `assets/` stays next to `SKILL.md` (`skills.md:121-124`, `src/apm_cli/integration/skill_integrator.py:369`).
- A git repo with `skills/<name>/SKILL.md` needs no root `apm.yml`. If `apm.yml` exists, `name` and `version` are required (`reference/package-types.md:14-16`, `reference/manifest-schema.md:47-48`).

---

## Agent Skills Spec: Name, Folders, Paths

**Source**: https://agentskills.io/specification; https://github.com/agentskills/agentskills (commit 69ef37e) `docs/specification.mdx`, `docs/client-implementation/adding-skills-support.mdx`

- `name`: 1-64 characters. Only `a-z`, `0-9`, and `-`. It must not start or end with `-`. It must not contain `--`. It must match the parent folder name (`specification.mdx:58-65`).
- Optional folders are recommendations: `scripts/` (executable code), `references/` (docs loaded on demand), `assets/` (templates, images, data) (`specification.mdx:187-214`).
- File references in a skill use relative paths from the skill root (`specification.mdx:228`). The client guide tells clients to give the model the skill's base directory, so it can resolve those paths (`adding-skills-support.mdx:157`, `:206-207`).

---

## Harnesses: Does the Model Get the Skill Directory?

| Harness | Gets it | Source |
| --- | --- | --- |
| Claude Code | Yes. `${CLAUDE_SKILL_DIR}` substitution. At load, prints "Base directory for this skill: <path>". | https://code.claude.com/docs/en/skills ("Available string substitutions") |
| OpenAI Codex CLI | Yes, as the `SKILL.md` path in the catalog. The prompt says to resolve relative paths against its folder. | `openai/codex` `codex-rs/ext/skills/src/catalog_prompt.rs:29` (commit 76ed3b4) |
| GitHub Copilot (VS Code) | Yes. The skill tool returns `Base directory: <path>`. | `microsoft/vscode` `extensions/copilot/src/extension/tools/node/skillTool.ts:93` (commit e84d1cd) |
| Gemini CLI | Yes. `activate_skill` returns a folder tree that starts with the absolute skill folder. | `google-gemini/gemini-cli` `packages/core/src/tools/activate-skill.ts:131-151` (commit 42c5182) |
| Cursor | Unverified. The source is closed and the docs were not reachable. | — |

With skillpm, harness folders are symlinks to `.agents/skills/`. A harness can report the symlink path or the real path. Both paths reach the same `assets/`. Not tested per harness.

---

## OpenSpec: plan-lite Flow, Tested End to End

**Source**: run in an empty git repo with OpenSpec 1.9.0 and a minimal plan-lite schema (2026-10-14)

- `openspec init` is not necessary. `openspec new change <name> --schema plan-lite` creates `openspec/config.yaml`, `openspec/specs/`, and the change folder.
- `new change` writes only `.openspec.yaml` (`schema`, `created`). It does not create `plan.md`.
- With `skip_specs: true` and no deltas, `openspec validate <name>` passes.
- `openspec instructions apply --change <name> --json` returns `state: ready`, `progress` 0/0, `instruction` from the schema, and `contextFiles` with only `plan`. A file outside the schema, such as `tasks-preview.md`, is not in `contextFiles`.
- `openspec archive <name> --yes` with no deltas moves the change to `changes/archive/YYYY-MM-DD-<name>/` with no prompt.
- With a delta at `specs/<capability>/spec.md` and no `skip_specs`, `validate` passes and `archive --yes` merges it into `openspec/specs/<capability>/spec.md`.
- Each requirement in a delta must have at least one `#### Scenario:` block. Otherwise `validate` fails.
- After a switch to `schema: spec-driven`, `openspec status` shows `proposal` ready and the rest blocked, in graph order. `openspec instructions <artifact> --change <name> --json` returns `outputPath` and `template`. `plan.md` in the folder causes no error.
