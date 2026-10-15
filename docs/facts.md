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
    template: <string> # required, relative to <schema>/templates/
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
- The docs say a git repo with `skills/<name>/SKILL.md` needs no root `apm.yml`. If `apm.yml` exists, `name` and `version` are required (`reference/package-types.md:14-16`, `reference/manifest-schema.md:47-48`). **But see "Tested Installs" below:** a local folder with only `skills/<name>/` is rejected without `apm.yml`.

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
- `template` resolves relative to `<schema>/templates/`. `template: templates/plan.md` fails with "Template not found: .../templates/templates/plan.md". Use `template: plan.md`. The stock schema uses `template: proposal.md`.
- `openspec instructions plan --change <name> --json` returns the template content in `template`.
- An extra file in the schema folder, for example `plan-hash.mjs`, causes no error.
- `openspec instructions <artifact> --change <name> --schema spec-driven --json` returns the spec-driven `outputPath` for `proposal`, `specs`, `design`, and `tasks` on a plan-lite change. `.openspec.yaml` stays `schema: plan-lite`. Tested 2026-10-15.

---

## Microsoft APM: Versions, Updates, and User Scope

**Source**: https://github.com/microsoft/apm (commit fe39119), files under `docs/src/content/docs/`

- Pin a ref: `apm install owner/repo#v1.0.0`. The ref can be a tag, a branch, or a full commit SHA. A semver range also works, for example `owner/repo#^1.2.0`, resolved against the remote tags (`consumer/manage-dependencies.md:56`, `:269-277`, `:336-357`). `@` is only for marketplace refs (`reference/cli/install.md:20`).
- `apm.lock.yaml` records the resolved commit SHA and file hashes. A plain `apm install` replays the locked commits (`consumer/manage-dependencies.md:398-405`, `consumer/install-packages.md:144-148`).
- `apm update` moves each dependency to the newest ref that its constraint allows. It does not cross the constraint. A literal `#v1.0.0` stays. To move it, edit the ref in `apm.yml` and run `apm install` (`reference/cli/update.md`, `reference/cli/outdated.md:33`, `consumer/manage-dependencies.md:212-221`).
- With no `--skill`, APM installs all skills of a repo: each `skills/<name>/` goes to `<target>/skills/<name>/` (`reference/cli/install.md:100`, `reference/package-types.md:131-132`).
- User scope: `apm install -g` installs to `~/.apm/` (`reference/cli/install.md:59`). User-scope skill paths (`reference/targets-matrix.md`):
  - `~/.agents/skills/` for copilot, cursor, windsurf
  - `~/.claude/skills/` for claude (inferred from "project and user scope"; honors `CLAUDE_CONFIG_DIR`)
  - `~/.config/opencode/skills/` for opencode
  - Unverified: codex and gemini.

---

## Microsoft APM: What a Package Install Downloads

**Source**: https://github.com/microsoft/apm (commit fe39119), read from the source code, not run

- APM always fetches with git. It does not download archives, so `.gitattributes` `export-ignore` has no effect (`src/apm_cli/deps/github_downloader.py:1995-2018`).
- A full-repo install (`owner/repo#ref`) copies the whole working tree, minus `.git`, into `apm_modules/<owner>/<repo>/` (`src/apm_cli/models/dependency/materialization.py:179-180`). The persistent cache keeps a full `git clone --bare` with the blobs of all branches (`src/apm_cli/cache/git_cache.py:507-525`).
- A subdirectory install (`owner/repo/<path>#ref`) uses a partial clone (`--filter=blob:none`) and a sparse checkout. Only the trees and the blobs under `<path>` are downloaded (`git_cache.py:267-272`, `:516-524`). Semver ranges work for subdirectory installs. A `v{version}` tag matches (`docs/.../consumer/manage-dependencies.md:345-358`).
- Deploy: for a package with `skills/<name>/SKILL.md`, APM copies only each `skills/<name>/` folder into the harness folders (`src/apm_cli/integration/skill_integrator.py:602-605`, `:876-883`). Skill detection looks for `<package path>/skills/` (`src/apm_cli/models/format_detection.py:180-190`).
- With `SKILL.md` at the package root, APM copies the whole package folder into the harness, including `tests/` and `docs/` (`skill_integrator.py:1199-1208`).
- A package author has no exclude mechanism. There is no `.apmignore`. `includes:` in `apm.yml` does not filter install (`docs/.../reference/manifest-schema.md:262-285`).
- The lockfile `content_hash` covers the whole fetched package tree. `deployed_file_hashes` covers only the deployed files (`docs/.../reference/lockfile-spec.md:215`, `:221`).

---

## OpenSpec: Project Guidance for apply and archive

**Source**: `dist/core/project-config.js:5`, `:70-80`; `dist/commands/workflow/instructions.js:434`; stock skill `openspec-archive-change/SKILL.md:39`

- `openspec/config.yaml` can hold `operations.<id>.guidance`. The only operation IDs are `apply` and `archive`.
- `openspec instructions archive --change <name> --json` returns this text as `operationGuidance`. The stock archive skill runs this command, so stock `/opsx:archive` sees the guidance.
- The guidance is per project, not per schema.
- `guidance` must be a YAML list of strings (`OperationConfigSchema`, `project-config.js:6-8`). A plain string is ignored, and every CLI command prints: "Guidance for operation 'archive' must be an array of strings, ignoring this operation's guidance". Tested.
- The stock archive skill treats guidance as optional advice: "follow entries that are applicable and compatible with the built-in archive workflow" and "If guidance is inapplicable or conflicts with a controlling input, do not follow it" (`openspec-archive-change/SKILL.md:47-56`). It treats `context` as "a required prompt-level input". `openspec archive` (the CLI) never reads guidance.
- A schema has no `archive` block. `SchemaYamlSchema` defines only `apply` (`dist/core/artifact-graph/types.js:30-46`).

---

## OpenSpec: Every Folder in schemas/ Is a Schema

**Source**: `dist/core/artifact-graph/resolver.js:40-41`, `:56-72`

- The project schema folder is exactly `<projectRoot>/openspec/schemas/`.
- `isSchemaDir` treats every folder (or folder symlink) in it as a schema. It skips only the names of its own fork temp folders: `.fork-staging-*` and `*.fork-backup-*`.
- So a backup folder inside `openspec/schemas/` appears as a schema. A folder outside it, for example `openspec/schemas-backup/`, is not scanned.

---

## Microsoft APM: Tested Installs (APM 0.33.0)

**Source**: runs on macOS with `apm` 0.33.0, 2026-10-15. Consumers were empty `git init` folders in `mktemp -d`.

- **A local folder with only `skills/<name>/SKILL.md` is rejected**: "no apm.yml, SKILL.md, or plugin.json found". With a minimal `apm.yml` (`name`, `version`) in that folder, the install works. Not tested for a remote git subdirectory, because that needs a published repo.
- **Deploy paths**: `--target claude,copilot` deployed each skill to `.claude/skills/<name>/` and `.agents/skills/<name>/`. `assets/` stayed next to `SKILL.md`. `LICENSE` and `apm.yml` reached `apm_modules/` but were not deployed.
- **`file://` URLs do not parse**: `file:///…/repo.git/package#^1.0.0` failed with "Invalid shorthand port". Local paths (`./path`, `/abs/path`) work but skip git.
- **Full-repo install** (`anthropics/skills`): `apm_modules/anthropics/skills/` held the whole tree, including `README.md`, `spec/`, and `template/` (887 files).
- **Subdirectory install** (`anthropics/skills/skills/xlsx`):
  - `apm_modules/` held only `skills/xlsx/`.
  - The cache kept a partial database (`db_v1/<id>__p`, `.promisor` packs, 0 blobs) and a sparse checkout with cone `skills/xlsx`.
  - The sparse checkout downloaded 56 blobs: the 53 files under `skills/xlsx/` and the 3 files at the repo root (`.gitignore`, `README.md`, `THIRD_PARTY_NOTICES.md`). Git cone mode always includes root-level files. Other root folders were not downloaded.
- **Cache location on macOS**: `~/Library/Caches/apm/git/`.
- **Remote subdirectory install with a semver range** (`microsoft/apm/packages/apm-guide#^0.33.0`, a published package with `apm.yml`, tested 2026-10-15):
  - The range resolved to tag `v0.33.0`. `apm.lock.yaml` records `constraint: ^0.33.0`, `resolved_ref: v0.33.0`, and the commit SHA.
  - `apm_modules/` held only `packages/apm-guide/`. Its skill deployed to `.claude/skills/`.
  - The sparse checkout (cone `packages/apm-guide`) downloaded 37 of the 3051 files at the tag: the 11 files under the subdirectory and the 26 files at the repo root. The root folders `tests/`, `src/`, and `docs/` were not downloaded.
  - This package uses `.apm/skills/<name>/`, not `skills/<name>/`. The local test above shows that `apm.yml` + `skills/<name>/` also deploys.

---

## Microsoft APM: Package Layouts and Consumer Side Effects (APM 0.33.0)

**Source**: the `microsoft/apm` repo at tag `v0.33.0` (commit fe39119), and the test installs above, 2026-10-15

- **Layouts in APM's own repo**:
  - `packages/*/` (for example `packages/apm-guide/`): `apm.yml` plus `.apm/skills/<name>/` and `.apm/agents/`. This is the native APM package layout.
  - `packages/pr-description-skill/`: `apm.yml` plus `SKILL.md` at the package root, with `assets/`, `scripts/`, and `evals/`. With a root `SKILL.md`, the whole package folder deploys (see "What a Package Install Downloads").
  - Test fixtures with `skills/<name>/` (for example `tests/fixtures/agent_plugins/portable/`) also have a `plugin.json`. They are plugin packages, not plain skill collections.
  - No package in the repo uses the plain form `apm.yml` + `skills/<name>/`. Only the local test above covers it.
- **Release tags**: `microsoft/apm` uses `vMAJOR.MINOR.PATCH` tags, for example `v0.32.0` and `v0.33.0` (`git ls-remote --tags`).
- **Consumer side effects of `apm install`**:
  - It creates `apm.yml` in the consumer if it is missing. It adds the package under `dependencies.apm`, and `--target` values under `targets:`. It also writes `includes: auto`.
  - It adds `apm_modules/` to the consumer's `.gitignore`.
  - It writes `apm.lock.yaml`.
  - If every package fails validation, it removes the `apm.yml` that it created ("Removed apm.yml created by the failed install").
- **Cache layout on macOS**: `~/Library/Caches/apm/git/db_v1/<id>/` (full bare database), `db_v1/<id>__p/` (partial database for sparse installs), and `checkouts_v1/<id>/<commit>/full/` or `.../sparse-<id>/` (checkouts).
- **CLI targets in 0.33.0**: `--target` accepts agent-skills, agents, agy, all, antigravity, claude, codex, copilot, copilot-app, copilot-cowork, cursor, gemini, grok-build, grok-cloud, hermes, intellij, kiro, openclaw, opencode, vscode, and windsurf. `all` excludes agent-skills, antigravity, hermes, intellij, and the experimental targets (`apm install --help`).
