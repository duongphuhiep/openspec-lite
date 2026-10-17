# Facts

Discovered facts about OpenSpec and this project's context.
Add evidence/source so we don't re-discover the same thing.

The OpenSpec facts come from `@fission-ai/openspec` **1.9.0**. On 2026-10-16, we checked them again on **1.14.2**. All `dist/` and `schemas/` line references are for 1.14.2. If a fact is different in the two versions, the entry says so.

---

## OpenSpec: Building Blocks

**Source**: `openspec schemas --json`, package templates

The default `spec-driven` schema has 4 artifacts:

```
proposal → specs + design → tasks
```

| Artifact | File                       | Purpose                                     |
| -------- | -------------------------- | ------------------------------------------- |
| proposal | proposal.md                | WHY (motivation, what changes, impact)      |
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

**New rules in 1.14.2** (`dist/core/artifact-graph/types.js:3-18`, `:21-55`, `schema.js:83-88`, `:102`):

- Each `apply.requires` id must be an existing artifact. If not, the load fails with "Invalid apply.requires reference".
- `apply.requires` must have at least one entry.
- `generates`, `template`, and `apply.tracks` must be relative paths. They must not contain `..`, an absolute path, or a NUL character.
- `version` must be a positive integer. A schema can have 1000 artifacts at most.
- If `apply.tracks` matches no `generates` value, `openspec schema validate` gives a warning (`findApplyTracksWarning`).

**To omit an artifact**: just remove it from the `artifacts` array. No `optional` flag exists.

**Only skip escape hatch**: `skip_specs: true` in a change's `.openspec.yaml` (allows zero spec deltas).

**Unknown keys are dropped**: `SchemaYamlSchema` in `dist/core/artifact-graph/types.js:42` is a plain `z.object`, not `.strict()`. Zod removes unknown keys, so a key such as `openspec-version` causes no error. OpenSpec does not read it.

---

## OpenSpec: Schema Resolution Order

**Source**: `dist/core/artifact-graph/resolver.js:113-116`, `:125-153`

The CLI looks for `<name>/schema.yaml` in this order:

1. Project-local: `<projectRoot>/openspec/schemas/<name>/`
2. User override: `${XDG_DATA_HOME}/openspec/schemas/<name>/`
3. Package built-in: `<package>/schemas/<name>/`

In 1.14.2, a schema name with `/`, `\`, `.`, `..`, a drive letter, or an absolute path resolves to null.

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

**Source**: `schemas/spec-driven/schema.yaml` (`specs` instruction)

`templates/spec.md` has only `## Purpose` and `## ADDED Requirements`. In 1.14.2, it also has a `# Spec Delta` title. The `specs` instruction in `schema.yaml` gives the full delta format:

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

**MODIFIED needs full content** (source: `schemas/spec-driven/schema.yaml:98`, `:126-132`): a MODIFIED requirement must hold the full updated requirement. Copy it from `openspec/specs/<capability>/spec.md`, then edit it. Partial content loses detail at archive time.

**Requirement length** (source: `schemas/spec-driven/schema.yaml:108`, 1.14.2): a requirement description has a limit of 500 characters. Above the limit, `validate` gives a warning and `validate --strict` fails.

**Spec-driven template sections** (source: `schemas/spec-driven/templates/`): `proposal.md` has Why, What Changes, Capabilities, Impact. `design.md` has Context, Goals / Non-Goals, Decisions, Risks / Trade-offs. Neither has a section for constraints or open questions.

**Node requirement** (source: `package.json` `engines`): `@fission-ai/openspec` requires Node `>=20.19.0`.

---

## OpenSpec: Stores

**Source**: README

Stores = standalone OpenSpec repos registered on this machine. Cross-repo planning.
Still in beta. Used when planning spans multiple repos or teams.

---

## OpenSpec: Archive Behavior With No Specs

**Source**: `dist/core/archive.js` lines 1185-1600 (merge skip at `:1361`)

When a change has no `specs/` directory or empty delta, `openspec archive` works fine:

- Skips the entire spec merge/validate/confirm block
- Goes straight to moving the change directory to archive
- No error thrown, no special flag needed

An unmarked zero-delta change archives with only non-blocking proposal warnings (`:1209-1213`).

New in 1.14.2:

- Archive validates a `skip_specs` change that has files under `specs/`, or a marker that is not valid (`:1203-1228`).
- If a change name already starts with a date, archive keeps that name and adds no second date (`:1330-1333`).

---

## OpenSpec: Archive Confirmation Prompts

**Source**: `dist/core/archive.js:1282`, `:1311`, `:1418`

`openspec archive` asks for confirmation in three cases. `--yes` skips each prompt:

- `--no-validate` is set: "Skipping validation may archive invalid specs."
- The tracked tasks file has unchecked tasks: "N incomplete task(s) found."
- The change has spec deltas: "Proceed with spec updates?"

If the CLI cannot read an answer from stdin, it blocks. For incomplete tasks, the code is `archive_tasks_incomplete`. For the other two prompts, the code is `archive_confirmation_required`. This is the same in 1.9.0.

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

No `openspec change upgrade`, `migrate`, or schema-switching subcommand exists. In 1.14.2, the only new top-level command is `version`. To switch the schema, edit `.openspec.yaml` by hand. The CLI does not create the missing artifacts. `docs/design.md` §3 defines what the upgrade skill does (D62, D97, D99).

---

## OpenSpec: apply Without tasks.md

**Source**: read from code, not run. `dist/commands/workflow/instructions.js` lines 380–500, `dist/core/artifact-graph/graph.js:140`, `dist/utils/task-progress.js:87-93`, `dist/core/validation/validator.js:477`, `~/.claude/skills/openspec-apply-change/SKILL.md`.

`openspec instructions apply` works with no `tasks.md` if the schema has `apply.requires: [plan]` and no `apply.tracks`.

```js
const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
const tracksFile = applyConfig?.tracks ?? null;
// no tracksFile → state 'ready', instruction = apply.instruction or default text
```

- Apply is `blocked` only when an artifact in `requires` has no output file.
- With no `tracks`, the state is `ready` with 0/0 tasks. There is no error.
- **Trap 1**: with no `apply` block, `requires` defaults to all artifacts. A missing opt-in artifact then blocks apply.
- **Trap 2**: with `tracks: tasks-preview.md`, apply is `blocked` when the file is missing or has no checkboxes. In 1.14.2, checkboxes with no text also block (`:472`).
- **1.14.2**: an artifact that `skip_specs` skips counts as present for `apply.requires` (`:388-392`).

**Stock apply skill**: it mostly follows the CLI output (`contextFiles`, `state`, `instruction`). But its text assumes tasks: "Mark task complete `- [ ]` → `- [x]`", "Progress: N/M tasks complete". With zero tasks, the agent depends on `apply.instruction`.

**Done signal**: `all_done` needs `tracksFile && remaining === 0 && total > 0` (`:481-485`). In 1.14.2, it also needs no unreadable tracked files. With no `tracks`, the state stays `ready`. The CLI never reports a plan-lite change as done.

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
- `new change` writes only `.openspec.yaml` (`schema`, `created`). It does not create `plan.md`. In 1.14.2, it also writes `skip_specs: true` for plan-lite (see "OpenSpec 1.14.2: Differences From 1.9.0").
- With `skip_specs: true` and no deltas, `openspec validate <name>` passes.
- `openspec instructions apply --change <name> --json` returns `state: ready`, `progress` 0/0, `instruction` from the schema, and `contextFiles` with only `plan`. A file outside the schema, such as `tasks-preview.md`, is not in `contextFiles`.
- `openspec archive <name> --yes` with no deltas moves the change to `changes/archive/YYYY-MM-DD-<name>/` with no prompt.
- With a delta at `specs/<capability>/spec.md` and no `skip_specs`, `validate` passes and `archive --yes` merges it into `openspec/specs/<capability>/spec.md`.
- Each requirement in a delta must have at least one `#### Scenario:` block. Otherwise `validate` fails.
- After a switch to `schema: spec-driven`, `openspec status` shows `proposal` ready and the rest blocked, in graph order. In 1.14.2, `skip_specs: true` stays in the file after the switch. So `status` shows `[~] specs (skipped: change declares skip_specs)` and "Progress: 0/3 artifacts complete (1 skipped)". Tested 2026-10-16. `openspec instructions <artifact> --change <name> --json` returns `outputPath` and `template`. `plan.md` in the folder causes no error.
- `template` resolves relative to `<schema>/templates/`. `template: templates/plan.md` fails with "Template not found: .../templates/templates/plan.md". Use `template: plan.md`. The stock schema uses `template: proposal.md`.
- `openspec instructions plan --change <name> --json` returns the template content in `template`.
- An extra file in the schema folder, for example `plan-hash.mjs`, causes no error.
- With `skip_specs: true`, `openspec instructions specs` returns `"skipped": true` and warns: "Do not create spec files - they will conflict with that marker." With the flag and a delta file, `validate` fails and `archive` refuses. Tested 2026-10-15.
- `node --test tests/` fails on Node 24.13.0 ("Cannot find module …/tests"). `node --test` with no argument finds `tests/*.test.mjs`. Tested 2026-10-15.
- `openspec list --json` returns `changes[]` with `name`, task counts, `lastModified`, and `status`. It does not give the schema. `openspec new change <name>` on an existing name fails: "Change '<name>' already exists". Tested 2026-10-15.
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

**Source**: `dist/core/project-config.js:6`, `:75`, `:112`; `dist/commands/workflow/instructions.js:672`; stock skill `openspec-archive-change/SKILL.md:50`

- `openspec/config.yaml` can hold `operations.<id>.guidance`. The only operation IDs are `apply` and `archive`.
- `openspec instructions archive --change <name> --json` returns this text as `operationGuidance`. The stock archive skill runs this command, so stock `/opsx:archive` sees the guidance.
- The guidance is per project, not per schema.
- `guidance` must be a YAML list of strings (`OperationConfigSchema`, `project-config.js:7-9`). A plain string is ignored, and the `openspec instructions` commands print: "Guidance for operation 'archive' must be an array of strings, ignoring this operation's guidance". `openspec list` prints no warning, in 1.9.0 and 1.14.2. Tested 2026-10-16.
- The stock archive skill treats guidance as optional advice: "follow entries that are applicable and compatible with the built-in archive workflow" and "If guidance is inapplicable or conflicts with a controlling input, do not follow it" (`openspec-archive-change/SKILL.md:58-67`). It treats `context` as "a required prompt-level input". `openspec archive` (the CLI) never reads guidance.
- A schema has no `archive` block. `SchemaYamlSchema` defines only `apply` (`dist/core/artifact-graph/types.js:42`).

---

## OpenSpec: Every Folder in schemas/ Is a Schema

**Source**: `dist/core/artifact-graph/resolver.js:40-42`, `:55-91`

- The project schema folder is exactly `<projectRoot>/openspec/schemas/`.
- `isSchemaDir` treats every folder (or folder symlink) in it as a schema. It skips only the names of its own temp folders: `.fork-staging-*` and `*.fork-backup-*`. In 1.14.2, it also skips `.init-staging-*` and `*.init-backup-*`, which `openspec schema init` creates.
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
- **The openspec-lite package itself** (local path install of `package/`, `--target claude`, 2026-10-15): APM deployed the six `openspec-lite-*` skills to `.claude/skills/`. `openspec-lite-schema/` kept `scripts/install.mjs` and `assets/plan-lite/`. The deployed `install.mjs` installed the schema (`status: installed`), and a second run printed `status: current`. `openspec new change --schema plan-lite` accepted the installed schema.

---

## OpenSpec: `openspec init`

**Source**: `openspec init --help` and runs in empty `git init` folders, OpenSpec 1.9.0, 2026-10-15

- `--tools <tools>` sets the AI tools with no prompt. Values: `all`, `none`, or a comma-separated list, for example `claude`, `codex`, `cursor`, `github-copilot`, `gemini`, `opencode`, `kiro`, `agents`.
- `openspec init --tools none` creates `openspec/config.yaml`, `openspec/changes/`, and `openspec/specs/`. It installs **no** stock skills and no commands.
- `openspec init --tools claude` also installs 8 skills in `.claude/skills/` (`openspec-propose`, `openspec-explore`, `openspec-apply-change`, `openspec-archive-change`, `openspec-continue-change`, `openspec-ff-change`, `openspec-sync-specs`, `openspec-verify-change`). It also installs 8 commands in `.claude/commands/opsx/` (`apply`, `archive`, `continue`, `explore`, `ff`, `propose`, `sync`, `verify`). The `/opsx:*` commands need this step.
- The new `config.yaml` has `schema: spec-driven` and commented examples for `context`, `rules`, and `operations`. `operations` occurs **only in a comment**, so the file has no `operations.archive.guidance` key.

---

## OpenSpec: Apply State Before plan.md Exists

**Source**: run with the shipped plan-lite schema, OpenSpec 1.9.0, 2026-10-15

- Right after `openspec new change <name> --schema plan-lite`, `openspec instructions apply --change <name> --json` returns `state: blocked`, because `plan.md` (the only entry in `apply.requires`) does not exist yet.
- After `plan.md` is written, the state is `ready`.

---

## Tools Used by the Scripts and Skill Files

**Source**: runs on macOS, Node 24.13.0, 2026-10-15

- **Markdown lists**: an unindented line inside a nested numbered list ends the list. markdown-it rendered the bullets after it as a code block (`<pre><code>`), and restarted the outer list with `<ol start="3">`. With the line indented to the content column of its list item, the list renders correctly. This is why the `Shipped schema version` marker is indented in each SKILL.md (D106).
- **Node child processes**: `spawnSync(cmd, [args], { shell: true })` prints `[DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities`. Without `shell: true`, Node does not find a Windows `.cmd` shim such as `openspec.cmd`.
- **`fs.renameSync`** onto an existing non-empty folder fails with `ENOTEMPTY` (D102).
- **`fs.readdirSync(dir, { recursive: true, withFileTypes: true })`** gives entries with `parentPath`. `install.mjs` uses it to list the copied files.

---

## OpenSpec: A Duplicate Key Disables config.yaml

**Source**: `review-commit-range` run, OpenSpec 1.9.0, 2026-10-15

- If `openspec/config.yaml` has two top-level `operations:` keys, the `openspec instructions` commands print "Warning: could not parse .../openspec/config.yaml (Map keys must be unique ...); ignoring it."
- OpenSpec then ignores the whole file, including `context` and `rules`, not only `operations`.
- `openspec list` prints no warning, in 1.9.0 and 1.14.2. Tested 2026-10-16.

---

## OpenSpec: Root Resolution and Delta Formats

**Source**: runs in `mktemp -d` folders, OpenSpec 1.9.0, 2026-10-15

- OpenSpec finds its root by walking up to the nearest `openspec/` folder. Each `--json` result has `root.path` and `root.source: "nearest"`. In a git repo with `svc/openspec/`, `openspec list --json` from `svc/src/deep/` gives `root.path` = `svc/`. From the git root, `root` is `null`.
- `openspec instructions apply` on a change with no `plan.md` returns `state: blocked`. In 1.9.0, its text tells the agent to use the `openspec-continue-change` skill. In 1.14.2, the text is: "Cannot apply this change yet. Missing artifacts: plan. Create it with `openspec instructions plan --change <name>` (`openspec status --change <name>` shows what is left)." The 1.14.2 JSON also has `missingArtifacts`, `missingPrerequisites`, `taskTrackingConfigured`, and `tasks`.
- A RENAMED delta written as `### Requirement: Login → Sign In` fails `validate` ("no requirement entries parsed"). RENAMED needs `FROM:` and `TO:`. The instruction asks for `**Reason**` and `**Migration**` in a REMOVED requirement, but `validate` accepts a REMOVED requirement with neither field (1.9.0 and 1.14.2, tested 2026-10-16). `openspec instructions specs --change <name> --schema spec-driven --json` gives these formats in `instruction`.
- `apm update --help`: `-g, --global` refreshes user-scope dependencies in `~/.apm/`.

---

## OpenSpec: skip_specs on a Spec-Driven Change

**Source**: runs in `mktemp -d` folders, OpenSpec 1.9.0, 2026-10-15 (found in review rounds 1 and 2, then re-run)

- A `spec-driven` change with `proposal.md`, `design.md`, and `tasks.md`, but no `specs/` and no `skip_specs`, fails `validate`: "Change must have at least one delta … If this change intentionally modifies no specs … set "skip_specs: true"".
- With `skip_specs: true` and no `specs/`, the same change passes `validate`. `openspec status` shows `[~] specs (skipped: change declares skip_specs)`. `openspec archive --yes` succeeds.
- So an upgraded change with no spec delta needs `skip_specs: true` back (D108).

---

## OpenSpec: init Keeps an Existing config.yaml

**Source**: run in a `mktemp -d` folder, OpenSpec 1.9.0, 2026-10-15

- `openspec init --tools none` in a folder whose `openspec/config.yaml` holds only an `operations:` block keeps that file as it is. It does not add `schema:` or the commented examples.
- `openspec new change` also keeps such a file.

---

## Microsoft APM: Skill Paths for More Targets

**Source**: review round 3 install runs, APM 0.33.0, 2026-10-15

- `--target codex`, `opencode`, `gemini`, `cursor`, and `windsurf` each deploy skills to `.agents/skills/<name>/` at project scope. The `openspec-lite-schema` search (D71, D111) checks `.agents/skills/` first, so it finds the skill for these targets.

---

## OpenSpec: Duplicate Keys and Skipped Spec Instructions

**Source**: runs in `mktemp -d` folders, OpenSpec 1.9.0, 2026-10-15 (review round 4, then re-run)

- Two `skip_specs: true` lines in a change's `.openspec.yaml` make each command on that change fail, for example `instructions plan`: "Invalid YAML in metadata file: Map keys must be unique".
- With `skip_specs: true`, `openspec instructions specs --change <name> --schema spec-driven --json` returns `skipped: true`, a warning ("Do not create spec files - they will conflict with that marker"), and still the full `instruction` with the delta formats.
- That `instruction` says to use SHALL or MUST for normative requirements. `validate` also accepts SHOULD and MAY.
- An `openspec/` folder marks an OpenSpec root only if it holds `config.yaml`, `changes/`, or `specs/`. A folder with only `schemas/` does not: `openspec list --json` gives `root: null` and `no_openspec_root`. `openspec init` creates `config.yaml`, so an initialized repo always has a root. Tested 2026-10-15.
- `openspec list --json` searches only up from the current folder, never down. From the git root of a repo whose only root is `svc/openspec/`, it gives `root: null` with code `no_openspec_root` and the fix text "Run openspec init to create a root here". Tested 2026-10-15.
- `openspec archive <name> --yes` fails (exit code 1) when `openspec/changes/archive/<YYYY-MM-DD>-<name>/` already exists: "Archive '<YYYY-MM-DD>-<name>' already exists." The change stays in `openspec/changes/`. Tested 2026-10-15.

---

## OpenSpec 1.14.2: Differences From 1.9.0

**Source**: CI run 38712388632 (`latest` = 1.14.2), then runs with `npm install --prefix <tmp> @fission-ai/openspec@1.14.2`, 2026-10-15

- `openspec new change <name> --schema plan-lite` writes `skip_specs: true` into `.openspec.yaml` by itself. 1.9.0 does not. A spec-driven change gets no flag in either version. So a skill that appends the flag makes a duplicate key on 1.14.2. The rule "set it only if the line is missing" (D112) works on both.
- `openspec new change` in a folder with no OpenSpec root creates `openspec/` and prints: "Note: no OpenSpec root was found here, so one was created at openspec/. Run `openspec init` to finish setting this project up, or delete that directory if you meant a different project."
- `openspec instructions <artifact> --json` adds `planningHome`, `resolvedOutputPath`, and `existingOutputPaths`. `outputPath`, `template`, `changeDir`, and `root` are unchanged.
- With the fixed tests, the full `node --test` suite passes on 1.9.0 and on 1.14.2.

---

## OpenSpec: Archive Paths for a plan-lite Change

**Source**: agent scenarios 14–16 (Claude Code, Sonnet 5.5) and CLI runs, OpenSpec 1.9.0, 2026-10-15

- **Stock `/opsx:archive` with the openspec-lite guidance** in `operations.archive.guidance`: in one run, the stock archive skill followed the guidance. It ran the openspec-lite promotion flow, drafted a spec delta and an ADR, asked for approval, and then archived. The guidance is still optional advice for the stock skill (see "Project Guidance for apply and archive").
- **Stock `/opsx:archive` with no guidance**, and the old `openspec-lite-archive` description: the agent archived first. Only then did it say that stock archive does not promote `plan.md`. With the D116 description ("use this skill instead of /opsx:archive for a plan-lite change"), a rerun with no guidance drafted the promotion before any archive.
- **`openspec archive <name> --yes` (the CLI)** on a plan-lite change with requirements and decisions in `plan.md`: it archives with exit code 0, prints no warning, and promotes nothing. `plan.md` stays only in `openspec/changes/archive/<date>-<name>/`.
- **New capability from a delta**: when archive applies a delta for a capability that does not exist yet, the CLI creates `openspec/specs/<capability>/spec.md` with the heading `# <capability> Specification`. If the delta has a `## Purpose` section, the CLI uses it. If not, it writes "TBD - created by archiving change <name>. Update Purpose after archive."

---

## Install Flow on the Published v1.0.0 Tag

**Source**: scenario 10, run 2026-10-15 in empty `git init` folders, OpenSpec 1.9.0 and 1.14.2, APM 0.33.0

- `apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude` deployed the six skills to `.claude/skills/`. `apm.lock.yaml` has `constraint: ^1.0.0`, `resolved_ref: v1.0.0`, and commit `39c7517`. `apm_modules/duongphuhiep/openspec-lite/` holds only `package/` content.
- The APM cache sparse checkout holds `package/` (12 files) and the 4 root files (`.gitignore`, `CLAUDE.md`, `CONTEXT.md`, `README.md`). It has no `tests/`, `scripts/`, or `docs/`.
- With no `--target`, `apm install` auto-detects the harness from marker folders. After `openspec init --tools claude`, it prints "Targets: claude (source: auto-detect from .claude/)". After `--tools github-copilot`, it detects `copilot` from `.github/prompts/`. After `--tools codex`, OpenSpec writes only `.agents/skills/` (no `.codex/`), so APM prints "found none in this project" and deploys nothing.
- `openspec init --tools copilot` fails (exit code 1). The OpenSpec name is `github-copilot`. The APM name is `copilot`, which deploys to `.agents/skills/`. The names `claude`, `codex`, `cursor`, `gemini`, `opencode`, and `kiro` are the same in both tools.
- `npm view @fission-ai/openspec@1 version` lists every 1.x version, one line each. The highest is 1.14.2. Tested 2026-10-16.

---

## Microsoft APM: Refs for "Latest" (APM 0.33.0)

**Source**: runs in `mktemp -d` + `git init` folders, APM 0.33.0, 2026-10-17

- With no ref, `apm install duongphuhiep/openspec-lite/package --target claude` installs the HEAD of the default branch, not a release tag. The lockfile has only `resolved_commit` (here `33a8070`, the pushed `main`).
- `#^1` and `#^1.0` fail: "Invalid semver range in ref". A range needs a full `MAJOR.MINOR.PATCH`.
- `#*` and `#latest` fail: "all probes failed". APM has no `latest` keyword.
- `#>=1.0.0` is accepted (`--dry-run`). It has no upper limit, so it can install a future 2.x.
- `#^1.0.0` resolves to the highest `v1.x.y` tag. The `1.0.0` is only the floor.
