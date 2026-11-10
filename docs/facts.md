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

## Scenario Run on v1.2.0

**Source**: agent scenarios 1–20 (Claude Code 2.1.302, `eu.anthropic.claude-sonnet-5-5`, print mode), OpenSpec 1.14.2, APM 0.33.0, 2026-10-17

- 22 of 24 runs passed. Scenarios 11 and 20a passed in part.
- **Scenario 20a**: on the first upgrade run, the agent asked the prune question with no list of section destinations. On the resume run, it showed the list.
- **Scenarios 5 and 13a**: archive wrote the ADR before `openspec validate`, once in the same shell command. `validate` passed, so the result was correct.
- **Scenario 16b**: with no openspec-lite guidance in `config.yaml`, stock `/opsx:archive` still ran `openspec-lite-archive` first. The skill description (D116) caused this.
- **Scenario 11**: after the user confirmed `svc/` as the root, the agent ran one `openspec new change` at the git root. It failed with "Schema 'plan-lite' not found", and a retry in `svc/` worked.
- **Root prefix, two wordings** (scenario 11 reruns): with "If that folder is not the current folder, start each `openspec` command with `cd <root> && `", the agent asked to confirm `svc/` and ran each command in `svc/` (2 of 2 runs). Later commands had no prefix and relied on the shell folder. A stricter wording ("start every command with `cd <absolute root path> && `, do not rely on the shell folder") failed 2 of 2 runs: the agent added the prefix to one command only, and skipped the confirm question. The first wording stays (D121).
- **Scenario 9**: propose ran the schema skill and named the backup path, but did not list the copied files.
- **Done check**: archive ran `git ls-files | head -30`. Files under `.claude/` and `apm_modules/` filled the 30 lines, so the agent said the repo had no source code.
- **Reruns after the fixes** (same agent and model, 2 runs each): scenario 5 passed after 091e55f and after D121. Scenario 13a passed after 091e55f. Scenario 20a step 2 passed after 091e55f. Scenarios 9 and 11 passed after D121. In each archive run, `validate` ran alone and passed before the ADR write.

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
- `apm install -g duongphuhiep/openspec-lite/package#^1.0.0 --target claude,copilot` resolved `v1.3.0` and wrote the 6 skills to `~/.claude/skills/` only. No `openspec-lite-*` folder was in `~/.copilot/skills/`, `~/.github/skills/`, or `~/.agents/skills/`. A package that was already installed with `targets: [copilot]` in `~/.apm/apm.yml` had no files in `~/.copilot/skills/` either. Tested 2026-10-21.

---

## OpenSpec: Open Questions in design.md

**Source**: `openspec instructions design --change <name> --json`, OpenSpec 1.14.2, 2026-10-17

- The `template` of `design` has no `## Open Questions` heading. Its headings are `## Context`, `## Goals / Non-Goals`, `## Decisions`, and `## Risks / Trade-offs`.
- The `instruction` lists **Open Questions** as an optional section: "Unknowns that can safely be answered later without changing the specs, the approach, or the task breakdown. Omit if none."
- The `instruction` also says: "Open questions are for genuinely deferrable unknowns, not decisions you skipped. If a question would change the specs, the chosen approach, or the task breakdown, resolve it now - ask the user instead of guessing."

---

## ADR Guidance: Old ADRs

**Source**: `https://github.com/architecture-decision-record/architecture-decision-record` README, "Suggestions for writing good ADRs", read 2026-10-21

- The README says: "Don't alter existing information in an ADR. Instead, amend the ADR by adding new information, or supersede the ADR by creating a new ADR."
- It also says: "In practice, mutability has worked better for our teams." Those teams add new information to the existing ADR, with a date stamp.
- The README does not list status values such as Proposed, Accepted, Superseded, or Deprecated.

---

## Scenario 21 Run (D122)

**Source**: agent scenarios 21a and 21b (Claude Code print mode, `eu.anthropic.claude-sonnet-5-5`), OpenSpec 1.14.2, skills from the working tree, 2026-10-21

- 21a passed, 1 run. The ADR draft had `Supersedes: 2026-01-10-fixed-window-rate-limit.md`. Before the approval, the agent named the old ADR and its `Status` change. After the archive, the diff of the old ADR was only the `Status:` line.
- 21b passed, 1 run. The agent did not draft the decision again. It found the old ADR that was not marked, asked before the edit, and changed only the `Status:` line. Then it archived the change.
- In 21a, the agent did not tell the user that they can pick a skipped item to draft (D120). It listed the Goal as not promoted, with a reason.
- A fixture script that appends `skip_specs: true` after `openspec new change --schema plan-lite` makes a duplicate key. `validate` then reports ".openspec.yaml is not valid change metadata". This confirms "OpenSpec 1.14.2: Differences From 1.9.0".

---

## mattpocock-skills: Glossary File Name

**Source**: `~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.3.1/CHANGELOG.md` (PR #1120, commit `006a52b`), read 2026-10-24

- Version 1.3.1 renames the `CONTEXT.md` / `CONTEXT-MAP.md` convention to `GLOSSARY.md` / `GLOSSARY-MAP.md`. This applies in `domain-modeling`, `grill-with-docs`, `tdd`, `triage`, and other skills.
- The changelog says: "the skills only look for `GLOSSARY.md`/`GLOSSARY-MAP.md` going forward." It tells users to `git mv` an old `CONTEXT.md`.
- Version 1.2.3 still uses `CONTEXT.md`.

---

## OpenSpec: HTML Comments in a Schema Template

**Source**: `openspec instructions plan --change <name> --json` on the plan-lite v2 template, OpenSpec 1.14.2, `tests/schema.test.mjs`, 2026-10-24

- The `template` field returns the template file with its `<!-- ... -->` comments unchanged. The CLI does not strip or render them.
- `openspec validate` passes on a `plan.md` that keeps the comments.

---

## Microsoft APM: CI Setup and Module Folder (APM 0.33.0, apm-action v1.10.0)

**Source**: `microsoft/apm` README "Get Started" and `microsoft/apm-action` README, read with `gh api` 2026-10-24. Local run of the `apm-install` workflow script, APM 0.33.0, 2026-10-24

- `microsoft/apm-action@v1` with `setup-only: 'true'` installs the APM CLI and puts it on `PATH`. It does not read `apm.yml` and runs no install.
- The `apm-version` input defaults to `'0.14.0'`, not to the latest release (`action.yml` of v1.10.0). Pass `latest` to get the newest APM.
- With APM 0.14.0, `apm install duongphuhiep/openspec-lite/package#^1.0.0` fails: "all probes failed (marker-file, Contents API, git ls-remote, shallow-fetch)". Source: GitHub Actions run 40135649274, 2026-10-24.
- With `apm-version: latest`, the action installed APM 0.35.0. The install resolved `#^1.0.0` to `v1.3.0` (`@2dd711e8`), and each check of the `apm-install` workflow passed. Source: GitHub Actions run 40135803923, 2026-10-24.
- On Linux without Homebrew, the README install is `curl -sSL https://aka.ms/apm-unix | sh`. Release assets include `apm-linux-x86_64.tar.gz`. The latest APM release on 2026-10-24 is v0.35.0.
- `apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude` resolved to `v1.3.0` (`@2dd711e8`). `apm_modules/duongphuhiep/openspec-lite/` holds only one folder: `package`.

---

## Scenario Run on d05538c (Schema v2)

**Source**: agent scenarios 1–9 and 11–21, Claude Code 2.1.310 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261024-d05538c/`, 2026-10-24

- If a skill has the same name in `~/.claude/skills/` and in the project `.claude/skills/`, Claude Code loads the user copy. The log line `Base directory for this skill:` shows the path. This occurred in each of the 7 groups.
- `claude -p --setting-sources project,local` does not load `~/.claude/skills/`, so the project copy loads. The flag also skips `~/.claude/settings.json`, its hooks and plugins, and the user `CLAUDE.md`. Bedrock auth works when the shell sets `CLAUDE_CODE_USE_BEDROCK=1`.
- `CLAUDE_CONFIG_DIR=<empty folder>` also isolates a run from user skills, hooks, and plugins. `--resume` then needs the same variable, because sessions are saved in `<dir>/projects/`.
- With no stdin, `claude -p` prints "Warning: no stdin data received in 3s, proceeding without it." `< /dev/null` skips the wait.
- The Bash tool keeps the working folder after `cd svc && …`. With the scenario allowlist, a compound command that starts with `cd <subfolder>; …` is denied.
- `apm install -g` put openspec-lite v1.3.0 in `~/.claude/skills/` on 2026-10-21 11:53. A later local `apm install <path>/package --target claude` does not hide it.
- The v1.3.0 skills stop on a repo with schema version 2. They show the "newer plan-lite schema" message and write nothing.
- OpenSpec 1.14.2: in a subfolder root, `openspec list --json` gives `"root": {"path": "<abs>/svc", "source": "nearest"}`. At the git root above it, it gives `root: null` and code `no_openspec_root`.
- OpenSpec 1.14.2: `openspec archive <name> --yes` on a plan-lite change prints "Task status: No tasks", exits with code 0, and keeps the HTML comments of `plan.md`.
- In 16a and 16b, Sonnet 5.5 switched from `/opsx:archive` to `openspec-lite-archive` because of the skill description. It did this before it read the `config.yaml` guidance.
- Rerun on cd93c44 (2026-10-25): with the D131 wording, 3 of 3 propose runs kept all six comments, and 2 of 2 runs of 20c asked before they wrote a spec. In a resumed print-mode turn, Sonnet 5.5 once said that it had asked a question that is not in the session log (session `9fa273b9`). `Bash(openspec:*)` does not allow a `for` loop that runs `openspec`.
- Rerun on dc3b8c0 (2026-10-25): with the D132 text, Sonnet 5.5 ended the turn after the prune question in 5 of 5 turns. With `acceptEdits` and the scenario allowlist, `rm <file> && openspec validate <name>` ran with no denial, `sed -i` was denied ("sed command requires approval"), and a pipe to `python3 -c` was denied. After a denied `openspec instructions` call, the agent wrote artifacts with no instructions output.
- Rerun on 5af5008 (2026-10-25): with the scenario allowlist, `openspec instructions ... --json | grep -E ...` runs with no denial. A `for` loop is denied ("A variable in this command can't be checked before it runs"). `cd <dir> && sed -i ...` is denied ("Commands that change directories and perform write operations require explicit approval"). A heredoc with more than one statement is denied ("Parser skipped input between top-level statements"). After a denied chain or loop that holds `openspec instructions`, Sonnet 5.5 retried with plain commands in 3 of 3 cases. The top-level keys of `openspec instructions <artifact> --json` (OpenSpec 1.14.2) are `changeName`, `artifactId`, `schemaName`, `changeDir`, `planningHome`, `outputPath`, `resolvedOutputPath`, `existingOutputPaths`, `description`, `instruction`, `template`, `dependencies`, `unlocks`, and `root`.
- Rerun on 1f0c3b7 (2026-10-25): with the scenario allowlist, `openspec instructions ... --json | head -c 3500` runs with no denial. For a change with a delta and `design.md`, the `instructions tasks --json` output is 4201 bytes, and `"template"` starts at byte 3529, so that cut removed `template`. `cd A && … && cd B && cat …` is denied ("Multiple directory changes in one command require approval for clarity"). Sonnet 5.5 can send the `openspec instructions` calls as parallel tool calls in one message. Totals over the reruns on dc3b8c0, 5af5008, and 1f0c3b7: the turn ended after the prune question in 15 of 15 turns.

---

## Scenario Run on 92c77ff (Schema v3)

**Source**: agent scenarios 1–9 and 11–21, Claude Code 2.1.317 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261104-92c77ff/`, 2026-11-04

- All 25 scenario runs passed with no rerun. The PARTIAL results of the d05538c run (12, 20c) did not occur again.
- `claude -p --setting-sources project,local` still loads the project copy of each skill in 2.1.317, also when `~/.claude/skills/` has the same names.
- A project slash command such as `/opsx:apply` writes `<command-name>/opsx:apply</command-name>` to the session log, but no `Base directory for this skill:` line (session `05fb3430`).
- On macOS, the `Base directory for this skill:` line shows `/private/var/folders/...`, but `mktemp -d` prints `/var/folders/...` (session `6a1ad918`).
- `claude -p --resume <session_id>` returns the same `session_id`, so all turns of a scenario are in one log file (session `11c58fdc`).
- Inside one turn, a `cd <dir>` stays in effect for the later Bash calls. **Correction** (runs on 2.1.318 and on f5422dd with 2.1.319): it also stays in effect into the next `--resume` turn. In 21a, a stale `cd openspec` made `git grep` miss the code, and the done check gave a false warning (sessions `264b7888`, `aa0e6f98`).
- With the scenario allowlist, a command that does `cd <dir>` and then `git` is denied: "This command changes directory before running a version-control command, which can pick up untrusted hooks or repository configuration from the target directory." `sed -i` alone, `npm test`, and a heredoc followed by more statements are also denied. A plain `rm <path in the project>` runs (sessions `cc4735b7`, `e00e49bc`). After a denial, Sonnet 5.5 retried with allowed commands or the Write and Edit tools.
- The Claude Code `.jsonl` session log can hold the same tool call twice. The second copy has no `uuid` (session `aa0e6f98`).
- OpenSpec 1.14.2: `openspec validate` on a change with `skip_specs: true` passes, and prints the info line "skip_specs is set in .openspec.yaml: change declares no spec-level behavior changes, zero deltas accepted".
- OpenSpec 1.14.2: if the archive target folder exists, `openspec archive <name> --yes` exits with code 1 with "Error: Archive '<date>-<name>' already exists.", and the change stays active (session `4b6ccdbc`).
- OpenSpec 1.14.2: a `## Purpose` shorter than 50 characters gives the warning "Purpose section is too brief". `openspec validate --all` still passes. With `--strict`, it fails (session `11bd0009`).
- In 16a and 16b, Sonnet 5.5 again switched from `/opsx:archive` to `openspec-lite-archive` because of the skill description, with and without the `config.yaml` guidance (sessions `3a5b05b6`, `436fbdf0`).
- Small deviations that no scenario checks: in 6, the agent set `skip_specs: true` before the user answered the drafts. In 18, it offered to draft an ADR after the guard stop. In 7, it did not say that an earlier, interrupted run removed `skip_specs`. Chat replies use plan IDs such as "C1 is met". D142 bans the IDs only in files, commits, pull requests, and tickets.

## Compare Run, v1.4.0 and v1.5.0

**Source**: all scenarios, one run for each version, Claude Code 2.1.317 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261104-compare-v1.4.0-v1.5.0/`, 2026-11-04

- v1.4.0 passed 29 of 29 runs. v1.5.0 passed 29 of 30. Scenario 15 failed: the "French Excel" reason of a constraint reached no spec or ADR, and a non-goal was named with no reason (session `a06c8483`).
- Over the 29 common runs, v1.5.0 cost 4.814 USD against 4.972 USD. Without scenario 4, where one v1.4.0 run sent a denied heredoc 4 times, the cost was 4.686 against 4.626 USD.
- The v1.5.0 `plan.md` is about 70–200 words bigger, because of the schema 3 template comments and `## Facts`. The promoted specs and ADRs are not bigger.
- APM 0.33.0 installs a package from a git worktree path, for example `../openspec-lite-v1.4.0/package`, the same as from the repo.
- OpenSpec 1.14.2 writes `skip_specs: true` on `openspec new change --schema plan-lite` with schema version 2 too, and `openspec archive --yes` behaves the same for version 2 and 3.
- OpenSpec 1.14.2: at a git root with no `openspec/` folder, `openspec list --json` exited with code 1 in this run (session `030e1cf2`). The 92c77ff run reported code 2. The exit code is not verified, so do not rely on it.
- Claude Code 2.1.317, scenario allowlist: a command that sets a shell variable and uses it (`d=x; ls $d`) is denied with "A variable set in this command can't be checked before it runs". A redirect to `$d/...` is denied. `echo`, `xargs`, and two statements on separate lines are denied. A `Write` to a path outside the project folder is denied (sessions `4f83ad78`, `649f5686`, `11532f10`).
- Claude Code 2.1.317: after a denial of a long heredoc, Sonnet 5.5 can send the same command several times. Each try is a new `tool_use` ID and a new entry in `permission_denials`.
- Claude Code 2.1.317: six `claude -p` runs can start at the same time from six temp folders. Each run writes its own log under `~/.claude/projects/<folder name>/<session_id>.jsonl`.
- Rerun of scenario 15 with the D147 fix (`.scenario-runs/20261104-rerun15-D147/`): 3 of 3 runs pass. Each run kept the "because" part of each constraint in the requirement text (sessions `5053203f`, `8be52e86`, `37936118`).
- Claude Code 2.1.317 on Bedrock: parallel `claude -p` sessions each start with a cold prompt cache. In the scenario 15 reruns, turn 1 had about 23,300 `cache_creation_input_tokens`, against 12,415 in a run that started after others. This adds about 0.09 USD per run. Compare cost only between runs with the same cache state.
- `run-metrics.mjs` before the fix on 2026-11-04 counted a turn in a new session as a user turn. It now counts only a turn with the same `session_id` as the turn before it.

## Skill Evaluation Tools

**Source**: probe runs of `claude plugin eval` (Claude Code 2.1.316, `eu.anthropic.claude-sonnet-5-5`, Bedrock), its `--help`, the Codex skill-creator `SKILL.md` (github.com/openai/codex, `codex-rs/skills/src/assets/samples/skill-creator/SKILL.md`), the local Anthropic skill-creator plugin, developers.openai.com/blog/eval-skills, github.com/bjulius/skill-evaluator, 2026-11-02

- `claude plugin eval <path>` reads `evals/<case>/prompt.md` (frontmatter: `runs`, `max_turns`, `timeout_seconds`, `allowed_tools`, `model`, and others) and `evals/<case>/graders/*.md`. `claude plugin eval init --bare <name>` writes a blank case. It needs a plugin or skill folder, or `--eval-dir`.
- Grader types: `regex`, `tool_used`, `tool_order`, `file_exists`, `llm`, and `baseline`. The `llm` judge is Haiku by default, and it votes 2 of 3. No grader type runs a shell command.
- `case.yaml` `context.scaffold_script` is a file path. An inline script fails with `path "<script text>" does not exist`. The script runs only with `--scaffold`.
- A folder with only `apm.yml` and `skills/` gives `ablation: none`. With `.claude-plugin/plugin.json`, the run defaults to `with-without`: each case also runs a no-plugin arm. `tool_used: Skill` then becomes an unscored "plugin-fired" indicator.
- The JSON result has, per case, `score`, `passRate`, `scoreWithout`, `passRateWithout`, and `delta`. Each run has `score`, `turns`, `costUsd`, `judgeCostUsd`, `durationSeconds`, `error`, and `tracePath`. The probe output showed no token field.
- If the AWS config has a `credential_process`, a case that grants Bash does not run. The error is "a Bash-granting evaluation cannot run here".
- On Bedrock with a `credential_process`, a case with no Bash still failed. The trace was empty, and both arms timed out (60 s and 400 s). The cause is not verified.
- `--keep-temp` keeps `/private/tmp/e-*/`. Its `home/` and `tmp/` are sealed with mode 000.
- The report is published to claude.ai by default. `--no-publish` keeps it local.
- The Anthropic skill-creator uses `evals/evals.json` and runs with-skill and baseline subagents in the same turn. For an edit, the baseline is a snapshot of the old skill. `scripts/aggregate_benchmark.py` gives pass rate, time, and tokens as mean ± stddev.
- The Codex skill-creator "Independent Forward-Testing" gives a subagent a realistic request and the skill in a temp workspace, with no expected answer. It has no baseline arm and no score.
- bjulius/skill-evaluator does static analysis only. It does not run the skill.

- Claude Code 2.1.317: the JSON of `claude -p --output-format json` has `total_cost_usd`, `num_turns`, `duration_ms`, `duration_api_ms`, `ttft_ms`, `permission_denials`, `subagent_stats`, `stop_reason`, and `is_error`. `usage` has `input_tokens`, `output_tokens`, `cache_read_input_tokens`, and `cache_creation_input_tokens`. Each `modelUsage` entry also has `thinkingTokens` and `costUSD`. Source: a one-turn run with `eu.anthropic.claude-haiku-5-5` on Bedrock, 2026-11-04.

- git 2.53.0: `git grep` searches only tracked files. It does not find text in a new file that is not committed or staged. `git grep --untracked` finds it. Thus a scenario must commit its code before the archive done check runs `git grep` (scenario 22c). Source: a test in a temp repo, 2026-11-04.

- OpenSpec 1.14.2: `openspec new change "<name>" --schema plan-lite` writes `skip_specs: true` to `.openspec.yaml` by itself. A second line from the agent is a duplicate key, and each CLI command on the change then fails until the line is removed. In scenario 1 on f0a5cad, propose added the line, saw the error, and removed it. Source: `.openspec.yaml` after `openspec new change probe-x --schema plan-lite` in a temp repo, and `.scenario-runs/20261104-f0a5cad-D148/report.md`, 2026-11-04.
- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`: with the rule "derive a name from the main outcome", propose named a two-outcome change from both outcomes (1 of 1 runs). With "from the main outcome only. Do not add words from the other outcomes.", it used only the main outcome (3 of 3 runs). Source: `.scenario-runs/20261104-f0a5cad-D148/report.md`, 2026-11-04.

- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`: with the D150 propose step 3, 3 of 3 runs of scenario 1 left `.openspec.yaml` with one `skip_specs` line and made no edit to it. 1 run read the file. 2 runs did not, and relied on the skill text that OpenSpec 1.14.2 writes the line. Source: `.scenario-runs/20261105-D150/report.md`, 2026-11-05.

## Scenario Run on 627b8fb

**Source**: agent scenarios 1–9 and 11–22, Claude Code 2.1.318 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261105-627b8fb/`, 2026-11-05. All 33 runs passed.

- D150 holds in each propose run of the group: `.openspec.yaml` has one `skip_specs: true` line, and no tool call wrote the file (groups A, B, D, F, H).
- OpenSpec 1.14.2: at a git root with no OpenSpec root, `openspec list --json` exited with code 1 again (group D, session `d3e6b132`). Two runs of three now give code 1.
- OpenSpec 1.14.2: when `openspec archive` creates a new capability with a Purpose of fewer than 50 characters, it warns "carried Purpose is under 50 characters; openspec validate --strict reports it as too brief". The archive still succeeds (group E, sessions `c9cd0bb7`, `04413579`).
- OpenSpec 1.14.2: `openspec archive <name> --yes` on a plan-lite change prints "Task status: No tasks", exits with code 0, and gives no warning about `plan.md`, also with the `config.yaml` guidance (group F, 16c).
- Claude Code 2.1.318, Sonnet 5.5: on `/opsx:archive` of a plan-lite change, the agent read `.openspec.yaml` and switched to `openspec-lite-archive`, with and without the `config.yaml` guidance. The skill description caused the switch (group F, sessions `6ac256a3`, `549e1c74`).
- Claude Code 2.1.318, `acceptEdits` and the scenario allowlist: the deny rule depends on the form of the command, not only on its first word.
  - These ran: `echo "skip_specs: true" >> <file> && openspec validate && openspec archive --yes` (group B, session `18a68d41`), `printf '...' >> openspec/config.yaml && grep ...` (group F, `902a242e`), `rm <file> && grep ...` (group F, `2d2c66bc`), and `cd <cwd>; cat <files>` (group A, `01813744`).
  - These were denied: a chain with `echo "exit $?"` or `echo rc=$?` ("A variable in this command can't be checked before it runs"), `cd <dir>; cat > <file> <<'EOF'`, a heredoc followed by more commands on new lines ("Parser skipped input between top-level statements"), a `for` loop, and `sed -i` in a compound command (groups A, B, C, E, G).
  - Thus the 2.1.317 facts "`echo` is denied" and "a command that starts with `cd <dir>;` is denied" are too broad for 2.1.318.
- Claude Code 2.1.318: in `cd openspec && tail ../src/x.js`, the path check resolves `../` from the session folder, not from the folder after `cd`, and denies the path (group G, session `3b9bb24c`).
- Claude Code 2.1.318: an Edit that removes the last line of a file can also remove the final newline (1 of 3 runs, group E, session `c9cd0bb7`).
- Claude Code 2.1.318: with `mktemp -d /tmp/...`, the `Base directory for this skill:` line shows `/private/tmp/...`, and the session logs are in `~/.claude/projects/-private-tmp-<name>/`. Each project folder also has a `memory` folder now (groups D, H).
- A security review plugin on this machine starts its own `claude` sessions in a temp repo after a commit. Their logs are in the same project folder, with the first prompt "Review this change for security vulnerabilities." and entrypoint `sdk-py`. `run-metrics.mjs` reads only `<session_id>.jsonl`, so its counts are correct. A scan of all `*.jsonl` files in the folder counts too much (group H).
- APM 0.33.0: `apm install` prints two "Skipped inactive experimental resolver for target 'copilot-cowork' / 'copilot-app'" info lines. The install still works, and the six skills match `package/skills/` (group C).

- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`, upgrade with D152 on f15aba0, scenario 20c: 2 of 2 runs put a 🤖 mark on an item that comes from `plan.md`. Run 1 marked "The main database holds the audit log." in `proposal.md`, which comes from the decision. Run 2 marked the goal in `design.md`, which comes from the Goal. Each run also marked the inferred Why line correctly. No run removed and put back the `skip_specs` line. Source: `.scenario-runs/20261105-f15aba0-20c/report.md`, 2026-11-05.

- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`, upgrade with D163: in 3 of 3 runs (20c twice, 7 once), each 🤖 mark was on new content, and no restated `plan.md` item had a mark. But in 2 of 3 runs, upgrade wrote a requirement from the Goal with no question, against D152. In 1 of 3, it also wrote a requirement from an internal decision ("store the audit log in the main database"). Source: `.scenario-runs/20261105-D163/report.md`, sessions `1827eeca` and `dba42387`, 2026-11-05.

- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`, upgrade with D164 (one question turn before any write, and a decision becomes a requirement only if it is a contract): 3 of 3 runs asked before any write, wrote no requirement from the Goal without a yes, and kept the internal decision "store the audit log in the main database" out of the specs. Before D164, 2 of 3 runs wrote a Goal requirement with no question. 1 of 3 runs still put a 🤖 on a scenario that restates its requirement. 1 of 3 runs wrote most of the summary in the prune reply, against D132. Source: `.scenario-runs/20261105-D164/report.md`, 2026-11-05.

## Scenario Run on 38d9a54

**Source**: agent scenarios 1–9 and 11–22 with 18b, Claude Code 2.1.318 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, Node v24.13.0, reports in `.scenario-runs/20261105-38d9a54/`, 2026-11-05. All 34 runs passed.

- Claude Code 2.1.318, Sonnet 5.5: stock `/opsx:apply` on a plan-lite change loaded `openspec-lite-apply` by itself in 1 of 2 sessions. The schema does not name the skill (group A, sessions `fc32a327`, `e51582e6`).
- Claude Code 2.1.318, Sonnet 5.5: on `/opsx:archive` of a plan-lite change, the agent switched to `openspec-lite-archive` again, with and without the `config.yaml` guidance. Without the guidance, it ran `openspec instructions archive` first (group F, 16a and 16b).
- Claude Code 2.1.318, scenario allowlist, more deny rules:
  - A `cat > file <<'EOF'` heredoc with a brace and a quote in its body, for example JavaScript code, is denied: "Contains brace with quote character (expansion obfuscation)" (group A, session `31181041`).
  - A redirect to a path outside the session folders is denied: "Output redirection to '/tmp/rl-test.js' needs approval" (group A, session `31181041`).
  - `sed -i` is denied in the BSD form (`sed -i ''`) and in the GNU form (group F, sessions `ff238962`, `1216dc8e`).
- Claude Code 2.1.318, scenario allowlist: the heredoc denial is not stable. `cat >> openspec/config.yaml <<'EOF'` ran in groups D and F (session `7153b3a6`), but a similar heredoc was denied on 627b8fb (session `d3e6b132`). `cd <session folder>; mkdir -p openspec/adr` with heredocs ran in group C (session `e06c788b`).
- Claude Code 2.1.318: a Bash call that does `cd <dir>`, then `git`, is denied also after `cd ..` back to the start folder (group G, session `d4c9f6a0`).
- Claude Code 2.1.318: an Edit that removes the last line of a file removed the final newline again (group E, `.openspec.yaml` of the archived change, session `94f0f142`). Now 2 of 6 such runs over 627b8fb and 38d9a54.
- Claude Code 2.1.318: the project folder of a session log replaces each `/` and each `.` of the real path with `-`. For example, `/private/tmp/osl-C17.Hm4X` gives `~/.claude/projects/-private-tmp-osl-C17-Hm4X` (group C).
- OpenSpec 1.14.2: `openspec status --change <name>` prints `Change root: <real path>`, for example `/private/tmp/...`, not `/tmp/...` (group H).
- Node v24.13.0: `node --test tests/` fails, because it reads `tests/` as a module path. Use `node --test tests/*.test.mjs` (this run, and group A, session `fc32a327`).
- The security review plugin sessions are in the temp repo log folders again, with model `claude-opus-5-5` (groups F, H). `run-metrics.mjs` does not count them.

- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`, upgrade with D167 (a 🤖 mark needs a named new claim), 3 runs of scenario 7 and 3 runs of scenario 20c: 0 of 6 runs over-marked a restatement. Before D167, the D164 and 38d9a54 runs over-marked in 3 of 6. But 3 of 6 runs missed a mark: 2 Why lines in 20c that add "who changed what (and when)", and 1 sentence in a 7-3 decision that came only from `tasks-preview.md`. The agent judged each item by its main source, and did not check each sentence. No run had a 🤖, so the named-claim summary was not tested. Source: `.scenario-runs/20261105-D167/report-7.md`, `report-20c.md`, 2026-11-05.
- Claude Code 2.1.318, `eu.anthropic.claude-sonnet-5-5`, upgrade with the revised D167 (sentence check, reason type, preview not a source, Why example), 3 runs of scenario 7 and 3 runs of scenario 20c: 0 over-marks and 0 missed marks in 6 of 6 runs. 7-1 marked a decision for its preview-only sentence, the case that the first version missed. It added the mark with a second Edit after the write. The 7-1 summary named the claim. A preview-only claim that the user approves in the question turn becomes an answer, and gets no mark. 20c wrote no new claim, so it did not test the sentence check. Source: `.scenario-runs/20261105-D167b/7/report-7.md`, `.scenario-runs/20261105-D167b/20c/report-20c.md`, 2026-11-05.
- Claude Code 2.1.318, Bedrock: the session log stores each `thinking` block with empty text and a `signature`. So the log does not show the reason for a choice. Source: `~/.claude/projects/-private-tmp-osl-V20c-1-y4AK/a45fd79b-*.jsonl`.
- Claude Code 2.1.318: a subagent cannot write a report file. The Write tool refuses with "Subagents should return findings as text, not write report files". The orchestrator must save the report from the reply. Source: the D167 verification agents, 2026-11-05.
- Claude Code 2.1.318, scenario allowlist: `mkdir -p <dir> && cat > <file> <<'EOF'` is denied. The Write tool then creates the missing parent folder. Source: session `5d2c332c`, `.scenario-runs/20261105-D167/raw/7-2/turn-5.json`.

## D168 Verification on aaad7ff

**Source**: scenario 22a ×3, 22b ×2, and 1, Claude Code 2.1.318 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, report in `.scenario-runs/20261105-D168/report.md`, 2026-11-05.

- Sonnet 5.5, names under D168: 22a gave 7 or 8 words with words from both outcomes, joined with `and`, in 3 of 3 runs. Each name starts with the CSV export. 22b and 1 gave `add-csv-export-to-report-page` (6 words), the full request text. Under D149 (2 to 5 words), each gave `report-csv-export` (3 words).
- Claude Code 2.1.318, scenario allowlist: `cat >> openspec/config.yaml <<'EOF' …` followed by more commands is denied with "Quoted text in this command can't be checked before it runs" (session `4ad37761`).
- Sonnet 5.5: after that denial, the agent retried only the last part of the compound command, `openspec new change`. It did not retry the `config.yaml` write, and its summary said that the write happened. So a retry after a denial can lose a side effect with no sign (session `4ad37761`, `/tmp/osl-N22a2.eEOf/openspec/config.yaml`).
- Claude Code 2.1.318: when several print-mode sessions start at the same time, each writes its own prompt cache. Input tokens of turn 1 rose from about 15,000 to about 26,600. A run alone gave 16,077. Compare cost only between sequential runs.

## Scenario Run on 62c6fa7

**Source**: agent scenarios 1–9 and 11–22 with 18b, Claude Code 2.1.318 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, Node v24.13.0, reports in `.scenario-runs/20261105-62c6fa7/`, 2026-11-05.

- Claude Code 2.1.318, `--output-format json`: in a `--resume` turn, `total_cost_usd` and `modelUsage` (also `thinkingTokens`) are the totals of the session up to that turn. `usage`, `num_turns`, and `duration_ms` are for that turn only. Example: `raw/A/4b/turn-2.json` has `modelUsage` output 4,604, which is 3,015 of turn 1 plus 1,589 `usage` output of turn 2 (D170).
- OpenSpec 1.14.2: `openspec validate --specs` with no spec under `openspec/specs/` prints "No items found to validate." and exits with code 0 (group B, `/tmp/osl-B6.KEK8`).
- OpenSpec 1.14.2: at a git root with no OpenSpec root, `openspec list --json` exits with code 1, with `root: null`, the code `no_openspec_root`, and the `fix` "Run openspec init to create a root here." (group D, scenario 11).
- Claude Code 2.1.318, scenario allowlist, more deny rules:
  - The `cd` then `git` denial applies only when the `cd` goes to another folder. `cd <session folder>; …; git ls-files` ran (group A, sessions `8e874e9f`, `a26d1973`). `cd <subfolder> && …; cd ..; git …` was denied. `git -C <session folder> …` ran (group G, session `5a2141d8`).
  - A compound command with `| grep -v -e …` and `2>&1` was denied. A plain `grep -n` between allowed commands ran (group D, sessions `c511e01f`, `47d10f2d`).
  - `find … -exec cat {} +` in a chain is denied (group F, session `d308d6df`).
  - `cd <abs> && rm <file> && cat <file>` ran. So `rm` is not a cause of the denial, and `sed -i` is (group C, session `c140b267`).
  - The full `sed -i` denial text is "sed command requires approval (contains potentially dangerous operations)" (group B, session `d2852071`).
- Claude Code 2.1.318, scenario allowlist: `cat >> openspec/config.yaml <<'EOF'` chained with `openspec new change` ran in 5 sessions (groups F, H). The denied command of the D168 run also set a shell variable and used `"$name"`. So the variable is the probable cause of "Quoted text in this command can't be checked", not the heredoc. Not tested alone.
- Claude Code 2.1.318, Sonnet 5.5: stock `/opsx:apply` loaded `openspec-lite-apply` by itself again in 1 of 2 sessions, but this time in the scenario 3 negative session (`ad4ef966`), not in the scenario 4 session (`a26d1973`) (group A).
- Claude Code 2.1.318, Sonnet 5.5: on `/opsx:archive` of a plan-lite change, the order of `openspec instructions archive` and the switch to `openspec-lite-archive` changes from run to run. Both 16a and 16b switched (group F).
- Claude Code 2.1.318: an Edit removed the final newline of the archived `.openspec.yaml` again (group E, session `955bc1f0`). Now 3 of 9 such runs.
- Sonnet 5.5, propose with D169: 3 of 3 runs of 22b kept the moved-out outcome out of `plan.md`. Before D169, 3 of 4 runs wrote it in `## Non-Goals` (`.scenario-runs/20261105-D169/`).

## Scenario Run on 3c93237

**Source**: agent scenarios 1–9 and 11–22 with 18b, Claude Code 2.1.318 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, Node v24.13.0, reports in `.scenario-runs/20261105-3c93237/`, 2026-11-05.

- Claude Code 2.1.318 on Bedrock: an API request can hang for about 12 minutes. The session log then has an `api_error` "Request timed out." with `retryAttempt: 1` and `maxRetries: 10`. The retry succeeds, and the turn ends with `subtype: success`. This occurred in groups A, E, and G (sessions `8bd62a7a`, `a5ed5ff0`, `1cad0b4e`).
- Claude Code 2.1.318: after a system suspend, the session log has a `connection_retry` entry, "Stream watchdog detected system suspend; aborting to retry on a fresh connection". The turn then completes (group B, session `11ad7ebe`).
- Claude Code 2.1.318: `duration_ms` and `duration_api_ms` do not include the wait of a hung request or of a suspend. The `totalDuration` of the session log includes it. Example: `duration_ms` 27,572 against `totalDuration` 773,804 (group A, `raw/A/3-4/turn-1.json`). So Time s can hide a long wait.
- After such a wait, the next request writes the prompt cache again: 39,606 `cache_creation_input_tokens` against 13,436 on 62c6fa7 for the same 13a turn. The cost doubles. The probable cause is that the 5-minute cache expired. Not verified (group B, `raw/B/13a/turn-1.json`).
- Claude Code 2.1.318, `claude -p`: a task notification after the last reply starts one more reply. Then `result`, `usage`, `num_turns`, and `duration_ms` cover only that reply. `total_cost_usd` and `modelUsage` cover the full turn (group H, session `235f39b9`, `raw/H/22b-1/turn-1.json`).
- Claude Code 2.1.318: a Bash call that runs longer than 120 s moves to the background. The tool result says "did not complete within its 120s timeout and was moved to the background". In group H, `git ls-files | head -50; openspec list --json` printed all its output, but did not exit for 12 minutes. This occurred in 1 of 7 sessions. The cause is not known (session `235f39b9`).
- Sonnet 5.5: it did not take a task notification as a user answer. It said "that isn't an answer from you" and asked the question again (group H, session `235f39b9`).
- Claude Code 2.1.318, print mode with `--setting-sources project,local`: the session gets a `gitStatus` block with the recent commit messages. The agent quoted a setup commit message with no `git` call. So setup commit messages can give hints to the agent (group C, session `4b9a2795`).
- Claude Code 2.1.318 keeps the working folder of a `cd svc` in turn 1 into the `--resume` turn 2 (group D, session `2b7e81dd`).
- Claude Code 2.1.318, scenario allowlist, more rules:
  - These compound commands ran with no denial: `grep -ril … | head`, `find … -prune …; ls -R svc | head`, and `cd svc && cat … 2>&1 | head; openspec --version` (group D, session `2b7e81dd`). So a pipe, `2>&1`, and `cd <subfolder> &&` do not cause a denial alone. The `| grep -v -e` denial of the 62c6fa7 run fits the "`cd` to another folder, then `git`" rule better.
  - `cd /tmp/<session folder> && …` ran, also though the session folder is `/private/tmp/<session folder>` (group C, session `6593a791`). Both forms are allowed working folders (group B, session `b9b59d48`).
  - `ls ../specs` after `cd openspec/changes;` is denied, because it resolves outside the session folder: "ls in '/private/tmp/specs' was blocked" (group B, session `b9b59d48`).
  - The message for a denied compound command names each part that is not allowed: "The following parts require approval: grep -v …, cp …" (group G, session `e9bda9b1`), and "… xargs ls -l" (group B, session `b9b59d48`).
  - `rm -f <abs file>; ls <abs folder>` in the session folder ran (group C, session `1299e9bd`).
  - `echo "exit $?"` is denied (group H, 3 sessions).
  - With the literal change name, `cat >> openspec/config.yaml <<'EOF'` chained with more commands ran (session `743b4df4`). With `name=…` and `"$name"`, the same chain was denied with "Quoted text in this command can't be checked before it runs" (session `5e35ce1b`). So the shell variable causes the denial, not the heredoc (group F).
- Claude Code 2.1.318 on macOS: the Bash tool runs zsh. `echo ======` fails with "(eval):1: ===== not found" and exit code 1. It is a shell error, not a denial (group F, session `13ccc85f`).
- Sonnet 5.5: after a denied compound command, it reported the result of a `grep` that never ran. The claim was true only because of an earlier `cat` (group G, session `1cad0b4e`).
- Sonnet 5.5: 2 times, it said that OpenSpec 1.14.2 is outside `>=1.9.0 <2.0.0`. It read both values and compared them itself, probably as text. No result changed, because the skill stopped for another reason (group D session `0a7bd7b3`, group C session `6eccea24`).
- Sonnet 5.5, stock `/opsx:apply`: it loaded `openspec-lite-apply` by itself in 1 of 2 sessions again, in the scenario 3 negative session (`b0fe8e2b`). Now 3 of 6 sessions over the last 3 runs (group A).
- Sonnet 5.5, scenario 4: after 2 denials of `npm test`, it did not fall back to `node --test`. It ended the turn with no test run (group A, `raw/A/4/turn-1.json`). On 62c6fa7, it fell back.
- Sonnet 5.5, 16a: it switched to `openspec-lite-archive` before it ran `openspec instructions archive`. So the skill description alone caused the switch, not the `config.yaml` guidance (group F, session `dd469278`).
- Sonnet 5.5, upgrade 20a: the shared Redis constraint went to a different place in each of the last 3 runs: a requirement with no question (38d9a54), a question (62c6fa7), and `design.md` with no question (3c93237, session `6e42c353`).
- Sonnet 5.5, scenario 7: the tasks preview for the D157 prompt does not always have an empty-table case (group C, session `45e99dc1`).
- Sonnet 5.5, propose: in 1 of 6 runs, the Goal comment moved under the Goal line. Its text stayed complete (group H, session `b3d72cd0`).
- Sonnet 5.5, schema skill: the reply did not list the copied files in 2 of 3 sessions that ran the skill (group D, sessions `18203724`, `2b7e81dd`).
- OpenSpec 1.14.2: when the archive target exists, `openspec archive` prints "Task status: No tasks" before "Error: Archive '<date>-<name>' already exists." (group B, session `b9b59d48`).
- Claude Code 2.1.318: the session log has `"type":"api-request"` entries. For print-mode Sonnet 5.5, they show `thinking: {type: adaptive, display: omitted}`, `output_config.effort: "medium"`, and `max_tokens` 128000 (group B, session `11ad7ebe`).
- Sonnet 5.5, D169: 22b passed 3 of 3 on 3c93237, and 6 of 6 with the D169 verification. 22a kept the Goal comment in 3 of 3 (group H).

## D171 Verification on 7f6e069

**Source**: scenarios 1, 3, 4, 4b, and 4c ×2, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, report in `.scenario-runs/20261107-D171/report.md`, 2026-11-07.

- Sonnet 5.5, tasks preview with D171: in 2 of 2 runs of 4c, it read `tools/geo.mjs` and did not run it. The source of the tool fact was the file (sessions `395ce503`, `cf400e9b`).
- Sonnet 5.5, apply with D171: in 2 of 2 runs of 4c, it answered the open questions of the preview itself, wrote them as decisions, removed them, and passed the done check. The user did not answer them (sessions `b69dc752`, `914c79ca`).
- Sonnet 5.5, stock `/opsx:apply` with D171: `node --test <dir>` failed with "Cannot find module". The agent changed the test script for this reason, and recorded no fact (session `997119c4`).
- Sonnet 5.5, apply with D171, 4b: it recorded the choice of `req.socket.remoteAddress` against `X-Forwarded-For`, and the proxy risk as an open question. On 3c93237, it did not (session `42b513b0`).
- Claude Code 2.1.319, stock `/opsx:apply`: it loaded no skill in 2 of 2 sessions, and both ran the `git status --porcelain` step of `apply.instruction` (sessions `1fe83c59`, `997119c4`). Over the last 4 runs, it loaded `openspec-lite-apply` in 3 of 8 sessions.
- Sonnet 5.5, scenario 4: after the `npm test` denials, it fell back to `node --test <file>` this time. Now 2 of 3 runs.
- Claude Code 2.1.319, scenario allowlist: a `python3 - <<'EOF'` heredoc is denied with "Contains brace with quote character (expansion obfuscation)", as a `cat` heredoc is. The agent then used Edit or Write (`raw/A/4/turn-1.json`, `raw/A/4c-run1/turn-1.json`).
- Claude Code 2.1.319 on Bedrock: the log of one apply session starts 33 minutes after the process start. Then an `api_error` "Request timed out." and a retry occur. `duration_ms` is 40,776, and `totalDuration` is 2,235,994. The cause is not known (session `914c79ca`).

## D172 Verification on 39feaa1

**Source**: scenarios 1, 3, 4, and 4c ×3, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, report in `.scenario-runs/20261107-D172/report.md`, 2026-11-07.

- Sonnet 5.5, apply with D172: it asked each open question with a recommended answer before code, and ended the turn, in 4 of 4 sessions. It closed only the questions that the user answered (`c6ae9e42`, `ea29ed22`, `6e30aee4`, `71f097cc`).
- Sonnet 5.5, apply with D172: after `node --test test/` failed with "Cannot find module", it recorded a fact with the command and the error text (`c6ae9e42`).
- Sonnet 5.5, 4c preview: when it ran `tools/geo.mjs`, the fact gave no exit code (2 of 2). The allowlist denied `echo "exit $?"`, and the agent did not try another way. When it only read the file, the fact gave exit code 0 (3 of 3 over D171 and D172) (`cebe2e97`, `d50b44bd`, `0eca083a`).
- Sonnet 5.5, 4c preview: it recorded "geo.mjs is a CLI script, not a module", a fact about repo code, in 3 of 5 runs over D171 and D172.
- Sonnet 5.5, apply: it changed the code away from a decision, said that the change "follows directly from" the decision, and did not update it. The decision is stale (`6e30aee4`).
- Sonnet 5.5, apply: it wrote a "Rejected … because" reason that nothing in the run supports ("reports are not large enough", `c6ae9e42`).
- Claude Code 2.1.319, scenario allowlist: `cd <session folder>; cat >> plan.md <<'EOF' …` ran with no denial (`ea29ed22`). A `Write` to `/tmp/check-lookup.js`, outside the session folder, was denied (`71f097cc`).

## Review Round 10 on cb22fc4..local

**Source**: OpenSpec 1.14.2, a new `openspec init --tools claude` repo with no spec, 2026-11-07. Checked by the round 10 reviewer and again by hand.

- `openspec list --specs --json` prints `{"specs": [], "root": {...}}` and exits with code 0.
- `openspec list --specs` prints "No specs found." and exits with code 0.
- `openspec validate --specs` prints "- Validating..." and "No items found to validate.", and exits with code 0. So no `openspec` command fails when a repo has no spec.


## Scenario Run on 80d076b

**Source**: all agent scenarios, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, Node v24.13.0, reports in `.scenario-runs/20261107-80d076b/`, 2026-11-07.

- OpenSpec 1.14.2: `openspec archive --yes` copies a delta scenario heading into the main spec as it is, also with a trailing 🤖 (group C, session `467cad8c`).
- OpenSpec 1.14.2: when a delta makes a new capability, `openspec archive` replaces the `# Spec Delta` title with `# <capability> Specification`, and keeps the `## Purpose` of the delta (group E, sessions `1db36732`, `2a660370`).
- OpenSpec 1.14.2: `openspec validate --specs --json` with no spec prints `"items": []` and `summary.totals.items: 0`, and exits with code 0 (group I, sessions `4672e247`, `ae21b178`).
- OpenSpec 1.14.2: `openspec validate` on a delta requirement with no scenario exits with code 1, prints one `✗ [ERROR] … must include at least one scenario` line for each requirement, then three "Next steps" hints (group B, session `6fd86a5f`).
- `openspec-version.mjs` on OpenSpec 1.14.2 prints `ok: OpenSpec 1.14.2 is in the range >=1.9.0 <2.0.0`. No session compared the versions itself (groups D and E). With a repo schema at version 99, no skill reaches the script, because the schema check stops first (group D).
- Sonnet 5.5, D175 version step: it adds `; echo rc=$?` or `; echo exit $?` to the script command in 9 of 10 sessions (groups B and E). The scenario allowlist denies it. Mostly the agent then runs the script alone. In 1 session, it gave up, and the version check did not run (group E, session `5fd87fe1`).
- Claude Code 2.1.319, scenario allowlist: `node install.mjs …; cat openspec/config.yaml` runs, and the same chain with `echo "exit $?"` is denied. So `$?` causes the denial, not the `;` chain (group D, sessions `3d163107`, `6c46145d`). `env PATH=/nonexistent <cmd>` is denied (group I, `b2ae50da`). `rm -r <dir>` runs (group I, `9da2c3c4`).
- Claude Code 2.1.319: the `<command-name>` grep of `log.sh` also matches the Skill tool description, 3 times in each session. Filter it out (group D).
- Sonnet 5.5, archive with D181: in 3 of 7 sessions, it said that a decision is "marked 🤖 in `plan.md`" when the decision had no 🤖 (group B, sessions `e8b7fcfd`, `c4bd46e5`, `e0b913a6`).
- Sonnet 5.5, apply: in a chained `git status --porcelain …; ls <change>; cat plan.md`, it read the `ls` line "plan.md" as a porcelain line, and said that `plan.md` was not committed (group A, session `aba79d03`).
- Sonnet 5.5, apply: it wrote no test file for a sliding window in 2 of 2 runs of 4b. A fake-clock check of one run cannot tell a sliding window from a fixed window (group A, sessions `aba79d03`, `4d192db7`).
- Sonnet 5.5, apply: it wrote "Rejected … because" reasons from model knowledge in 2 of 2 runs of scenario 4 (group A, sessions `952ed726`, `e710314b`).
- Sonnet 5.5, tasks preview: it recorded an obvious fact as the reason of its 🤖 decision in 2 of 2 runs of 4c, and "the repo has no `src/`" in 3 of 4 runs of group I. Apply did not update such a fact after it made it false (group I, `9b6906e4`, `67e5b160`; group A, `597557f9`, `e710314b`).
- Sonnet 5.5, apply: it wrote a design choice (parse the JSON item count) as a fact, with no decision (group I, 4d-1, `4672e247`).
- Sonnet 5.5, upgrade: it wrote the summary in the same reply as the prune question in 2 of about 6 prune turns (group F `3d872e81`, group C `2e2fc0f4`). It also missed a 🤖 on a new claim (group F, `a9c7d046`).
- Sonnet 5.5, upgrade with D182: the same start state gave two results for the 🤖 contract decision in scenario 7 (group C, `2e2fc0f4`, `e751845f`).
- Sonnet 5.5, schema skill: the reply skipped the copied files in 2 of 2 runs of scenario 9 (group D, `6c46145d`, `3d163107`).
- Sonnet 5.5, tasks preview on a repo with no application code: it adds open questions about where the code is, with no question to the user (groups C, F).
- Claude Code 2.1.319, stock `/opsx:apply`: it loaded no skill in 3 of 3 sessions. Over all runs, it loaded `openspec-lite-apply` in 3 of 11 sessions (group A).
- The plan-lite template of schema version 5 is about 144 words longer than version 4. The same hand-built plan of 22c has 471 words now, and had 327 on 3c93237 (group H).
- A background loop can change a file between the Write of archive and its `validate` in print mode. So scenario 13a can run with a real run 1 (group B, `setup/break-delta.sh`).

## Rerun on dd7ad75

**Source**: scenarios 1, 3, 4, 4b, 4c ×2, 4d ×2, 5 ×2, 7, 9 ×2, 17b, 18 ×2, 18b ×2, 20c ×2, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, reports in `.scenario-runs/20261108-dd7ad75/`, 2026-11-08.

- OpenSpec 1.14.2: with one valid spec and one spec that holds only `# broken`, `openspec validate --specs --json` exits with code 1, and still prints JSON with `{"items":2,"passed":1,"failed":1}` (`/tmp/osl-A4d.Xvdl`, sessions `9e157894`, `37cdc4da`).
- Claude Code 2.1.319, scenario allowlist: `sh -c '…; echo $?'` and `openspec validate --specs; echo "exit=$?"` are denied (sessions `0a882d98`, `434f6833`). A chain of `cd`, `node openspec-version.mjs`, `cd`, and `cat` runs (`c68d63fa`).
- Sonnet 5.5 with D192: the version step added no `echo $?` in 6 of 6 sessions (was 9 of 10). It still put the script in a read chain in 3 of 6 (group BDF).
- Sonnet 5.5 with D192: the schema report copied the `install.mjs` lines in 2 of 2 runs of scenario 9 (was 0 of 2) (`841cad57`, `c36b7b4b`).
- Sonnet 5.5 with D192: archive made no false 🤖 claim in 2 of 2 runs of scenario 5, but each said a true line such as "No decision heading has a 🤖 mark" (`ba04dc55`, `7d5417c9`).
- Sonnet 5.5 with D192: upgrade wrote the summary after the prune question in 2 of 2 runs of 20c, also with the rule "the question is the last line" (`be52c596`, `69a3e27b`). Over all runs, about 5 of 10 prune turns.
- Sonnet 5.5, the "not committed" note: it missed the note with ` M` output in 1 of 2 runs of scenario 3 (`4a01dd6b`), and gave a false note with empty output in 2 of 4 previews (`f2b17ad9` and 4d-1). 3 of 4 previews ran `git status --porcelain` in a chain, against the rule.
- Sonnet 5.5, apply: for an open question that only the user can answer ("Where is the report page?"), it gave no recommended answer in 3 of 3 sessions, and said why (`4a01dd6b`, `a5ac6e85`, `687fcadf`).
- Sonnet 5.5, apply with D192: it wrote a test file in 4b (2 turns) and in 2 of 2 runs of 4c, but in 0 of 2 runs of 4d (`51091b94`, `9e157894`, `37cdc4da`).
- Sonnet 5.5, archive after an upgrade: in 1 of 2 runs of 18b, it removed a 🤖 from `design.md` with no request, against "do not change `design.md`", and did not search for 🤖 after the ADRs (`5e69c51e`). In the other run, its final reply named a 🤖 that the user had removed, with no new search (`3ecfd63b`). Neither run named the open question of the kept `plan.md` before the archive.
- Sonnet 5.5, upgrade: the "Table is empty" 🤖 scenario of scenario 7 appeared in 2 of 2 runs on 80d076b and in 0 of 1 on dd7ad75 (`c68d63fa`). So it is not a stable input for 18b.

## Scenario Run on 5aa0025

**Source**: all scenarios, 41 runs, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261108-5aa0025/`, 2026-11-08.

- openspec-lite 5aa0025: with a repo schema at version 99, upgrade ran `openspec-version.mjs` in a chain before it compared the schema versions, then stopped correctly. So the scenario 8 fact of the 80d076b run ("no skill reaches the script") is not always true (group D, session `0af933d9`).
- `install.mjs` copies 5 files, with `plan-status.mjs` (groups D, F).
- Claude Code 2.1.319, scenario allowlist: `grep` and `head` in a pipe or a chain are not denied, although they are not in the allowlist (groups E, H, `permission_denials` in `raw/E/*/turn-1.json`).
- Claude Code 2.1.319, scenario allowlist: `cat >> f <<'EOF'` with `grep` and `node` after it is not denied (group D, `5bad9d98`). `mkdir -p … && cat > f <<'EOF'` is denied (group I, `564c1a6b`). `env PATH=/nonexistent <node> …` is denied, also with an absolute node path (group I, `89ede6f1`).
- Claude Code 2.1.319: stock `/opsx:archive` switched to `openspec-lite-archive` with no `openspec instructions archive` call. On 80d076b, it made that call first (group F).
- Claude Code 2.1.319: stock `/opsx:apply` loaded `openspec-lite-apply` in 1 of 3 sessions (`fdd97ae5`). Over all runs, 4 of 17 (group A).
- Sonnet 5.5 with D193: the prune question was the last line in 5 of 5 prune turns. In 3 of 5, some summary lines came after the table. The reply after the answer had 2 or 3 sentences (group F).
- Sonnet 5.5 with D193: `plan-status.mjs` gave a true note in 9 of 9 sessions. It ran in a chain in 3 of 6 previews, and the agent still read it correctly (groups A, F, I).
- Sonnet 5.5, version step: `openspec-version.mjs` ran in a chain in most archive and upgrade sessions, against "Run it alone". No session misread it (groups D, E, H).
- Sonnet 5.5, apply with D193 item 3: in 1 of 3 sessions, it gave no recommendation for any open question, also for two questions that the agent can answer (group A, scenario 4 rerun).
- Sonnet 5.5, apply: 🤖 decisions gave reasons from no source in 2 of 2 runs of scenario 4. One reason is false: "`"type": "module"` makes files load as ES modules in both Node and the browser" (group A).
- Sonnet 5.5, apply: in 1 of 2 runs of 4b, the new sliding-window test also passes on the fixed window of turn 1. The agent's fixed window starts at the first request of a key, in 2 of 2 runs (group A).
- Sonnet 5.5, apply: when `node --test <dir>/` failed, the agent changed the command and recorded no fact (group A 2 of 2, group I 1 of 2). This is the D172 gap again.
- Sonnet 5.5, apply: it wrote no test in 1 of 2 runs of 4d, with the reason "the repo has no test setup" (group I, 4d-2).
- Sonnet 5.5, tasks preview: when the allowlist denied each `echo $?` form, the agent did not read the exit code of the tool, and wrote "The exit code was not checked" as a fact (group I, 4d-1). In 4d-2, it took exit 0 from a Bash result with no error (`b7a99818`).
- Sonnet 5.5, tasks preview: it wrote a fact that only repeats the code or an `ls` result in 2 of 4 runs (group I, 4c-1 F1, 4d-2 F3).
- Sonnet 5.5, upgrade: `design.md` held a note that points to a kept open question in 2 of 2 runs of 20a ("See the open questions in tasks.md"), and in group C. It skipped the resume question of step 1.3 in 1 of 2 runs of 20a (group F).
- Sonnet 5.5, upgrade resume: after the user said "no", it did not name the open question that stays in `plan.md` (group C, 19-3).
- Sonnet 5.5, archive after an upgrade: it did not name the open question of the kept `plan.md` after the ADRs in 2 of 2 runs of 18b. One draft asked "I'd remove the 🤖 from `design.md`", against the guard. No write came (group C).
- Sonnet 5.5, upgrade: the "Table is empty 🤖" scenario appeared again (3 of 4 upgrade runs over three commits) (group C).
- Sonnet 5.5, apply on an empty repo: in the scenario 4 rerun, it gave no recommendation for all 3 open questions, "because only you know the answers". It took the D193 example "where some code is" as true for each question, because no code exists. In the same run, the user decision D4 (no 🤖) says "plain HTML and JavaScript (ES modules) ... as the user instructed". The user did not ask for ES modules, so an agent choice went into a user decision (group A, `481b1aef`).
- Sonnet 5.5, apply: in scenario 4 run 1, it read the user instruction "no npm dependency" as "a `package.json` is not wanted", and wrote that as a reason (group A, `fdd97ae5`).
- Sonnet 5.5, propose: the Goal comment stayed in 2 of 2 runs (group H, todo item 21). With the CSV export prompt, propose asked no Level 1 question. On 80d076b, it asked one (group F).

## Rerun on 743a6f3

**Source**: scenarios 4 ×2 (with 1 and 3), 18b ×2 (with 7 and 18), 20a ×2, 4c ×2, 4d ×2, Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, reports in `.scenario-runs/20261108-743a6f3/`, 2026-11-08.

- Sonnet 5.5 with D194: each 🤖 reason had a source, or said "Reason not checked", in 2 of 2 runs of scenario 4. One run wrote the variant "Reason not checked against alternatives" (group A).
- Sonnet 5.5 with D195: only the question "where is the page" had no recommendation, in 2 of 2 runs of scenario 4. In 4c-1, apply added a new question with no recommendation (groups A, I).
- Sonnet 5.5, apply: in scenario 4 run 1, the user decision D4 (no 🤖) holds the agent choice "download it through a Blob". In run 2, the done check named only the open questions, not the Goal and C1 (group A).
- Sonnet 5.5, apply and preview: in scenario 3 step 4, 2 of 2 runs wrote the `plan-status.mjs` line in their own words, not as it is (group A, `e268c43b`, `f9dcd1b7`).
- Claude Code 2.1.319: stock `/opsx:apply` loaded `openspec-lite-apply` in 2 of 2 sessions. Over all runs, 6 of 19 (group A).
- Sonnet 5.5 with D196: in 2 of 2 runs of 20a, and in the scenario 7 run of group C, `proposal.md` and `design.md` held no pointer to a kept open question. The agent did not read the files again after `tasks.md`, so the first write was already clean. The resume question ended the turn before `validate` in 2 of 2 runs (group F, `d75d44b5`, `1b130ce3`; group C, `567715fb`).
- Sonnet 5.5, archive after an upgrade: it named the open question of the kept `plan.md` in 2 of 2 runs of 18b (was 0 of 2 on 5aa0025). The archive text did not change, so the old result was model variance or the start state (group C, `30a95542`, `31ca0fdd`).
- Sonnet 5.5 with D197: 4 of 4 previews of 4c and 4d used `exit-code.mjs` and recorded the exit-0 fact with its command. 2 of 4 ran it in a `;` chain. In 1 of 2 runs of 20a, the preview still added `echo "exit: $?"`. Archive still uses `echo $?` (groups F, I).
- Sonnet 5.5 with D198: 4d wrote no file-list fact. In 2 of 2 runs of 4c, F1 still held obvious parts next to the exit-0 result. In scenario 4 run 2, the preview wrote a `git ls-files` file list as F1 (groups A, I).
- Sonnet 5.5, apply: it wrote no test file in 2 of 2 runs of 4d, and took manual `exit-code.mjs` runs as enough (group I).
- Sonnet 5.5, apply: in 4d-1, the allowlist denied the `cat >> plan.md` write of D3, but the agent had removed OQ1, and the reply said "D3 (added)". So the answer of the user is not in `plan.md` (group I, `d54190d3`).
- Claude Code 2.1.319, scenario allowlist: `node exit-code.mjs env PATH=/nonexistent <node> …` runs under `Bash(node:*)`, but `env …` alone is denied. `$(command -v node)` in the same form is denied (group I, `2d7da756`). `Bash(node:*)` already allows `node -e` with `child_process`, so the script adds no new power.

## Scenario Run on f5422dd

**Source**: all scenarios, 40 runs, isolated (D199), Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261108-f5422dd/`, 2026-11-08.

- Claude Code 2.1.319, stock `/opsx:apply`: in 5 sessions, 1 loaded no skill and ran no `openspec instructions apply`, 3 ran the command with no skill, and 1 loaded `openspec-lite-apply` (group A).
- Claude Code 2.1.319, scenario allowlist: a `for …; do openspec …; done` loop is denied, also when each command in it is allowed (group F, `raw/F/20cr/turn-2.json`). `python3 - <<'E'` is denied (group I). `echo "x" >> <file> && cat … && openspec validate` ran with no denial, and a bare `echo` in a `;` chain runs, so `$?` causes the known denial (groups B, I).
- Claude Code 2.1.319, print mode with `--setting-sources project,local`: the Grep tool is not in the session, "No such tool available: Grep" (group G, `ed3e824d`).
- Claude Code 2.1.319: a `cd <dir>` of turn 1 stays in effect into the `--resume` turn 2 (group D, `149c301a`).
- Claude Code 2.1.319: in the archive done check of 21b, a `cd openspec && …` stayed in effect, so `git grep` searched only `openspec/`, and the agent said that the repo has no rate-limit code. `src/rateLimit.js` was committed (group G, `ed3e824d`).
- `install.mjs` copies 6 files on f5422dd, with `exit-code.mjs` (group D).
- Sonnet 5.5 with D196: the first run where step 2.5 removed a pointer: `design.md` had "These are tracked in `tasks.md`", and the agent removed it with `Edit` in the same turn (group F, `93f09805`).
- Sonnet 5.5, upgrade: the summary before the prune question said that `plan.md` stays ("Not deleted", "still there") in 2 of 3 prune replies (group F). `skip_specs: true` was still set after the question turn in 2 of 2 runs of scenario 7 (group C). In 1 of 2 runs of scenario 7, it wrote a requirement from the Goal that the question turn did not ask (group C).
- Sonnet 5.5, upgrade: each preview-only item had a 🤖 in 20a, also the docs line that had no mark on 5aa0025 and 3c93237 (todo item 22, group F).
- Sonnet 5.5, archive: it said "No decision heading ends with 🤖" in 3 of 3 runs of group E, against "say nothing about marks". In scenario 6, it said that a decision "ends with 🤖" when it had none (group B, `930f60b4`). In 22c, it gave the "no" paths before the answer to "Archive anyway?" (group H). After "no" to the ADR offer of the guard, it offered its own `openspec archive --yes`, not stock `/opsx:archive`, in 1 of 2 runs of 18 (group C).
- Sonnet 5.5, apply: in scenario 4 run 1, it made two real choices (`"type": "module"`, CRLF line ends) and recorded no decision (group A). In 4d-2, it changed the code against a user decision (D3) and did not update the decision or ask (group I). It wrote no test in 1 of 2 runs of 4d (3 of 4 over two commits, item 50).
- Sonnet 5.5, tasks preview: in 4c-2, it read the exit code with `exit-code.mjs`, then put the obvious error body and exit 0 in `## Facts` (3 of 4 runs of 4c over two commits) (group I, `3548fe18`).
- Sonnet 5.5, apply: 3 of 4 applies of group I added `echo` to the `plan-hash.mjs` command to read its exit code. The rule does not name `exit-code.mjs` (group I).
- Sonnet 5.5, propose: in scenario 11, it found 3 open questions and named them only in the reply. `## Open Questions` stayed empty (group D). In scenario 1, it wrote 3 open questions (0 of 5 in earlier runs) (group A).
- Sonnet 5.5, apply: with a version 99 schema, apply offered a hand edit of the `version:` line, but did not do it (group D).

## Rerun on 765cdec

**Source**: scenarios 7 ×2, 21b ×2, 20c ×2, 4c ×2, isolated (D199), Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, reports in `.scenario-runs/20261108-765cdec/`, 2026-11-08.

- Sonnet 5.5 with D208: upgrade kept `skip_specs: true` through the question turn in 2 of 2 runs of scenario 7, and removed it just before `openspec instructions specs` (sessions `1215a1f3`, `85bb7575`). It never removed the line in 2 of 2 runs of 20c, which write no spec. A resumed upgrade asked the step 2 questions again in 2 of 2 runs (`c88bfc79`, `0907c504`).
- Sonnet 5.5 with D209: the archive done check found the committed code in 2 of 2 runs of 21b. One run used `git rev-parse --show-toplevel` and `git -C <root> grep`. The other ran `cd <git root>; git ls-files` (`6a666dac`, `3808e7e0`).
- Claude Code 2.1.319, scenario allowlist: `git -C "$(git rev-parse --show-toplevel)" grep …` is denied with "Quoted text in this command can't be checked before it runs" (`6a666dac`). `printf '…' > <file> && …; openspec …` ran with no denial (`c88bfc79`). `cat > file <<'EOF'`, `mkdir -p X && cat > f <<'EOF'`, and `cd openspec; …` are denied (groups F, I).
- Sonnet 5.5, upgrade: the prune summary said "Not deleted: `plan.md`" in 1 of 2 runs of 20c (todo item 61). In the other run, turn 1 said "I can't proceed without one. The skill needs at least one." about a requirement, but the skill allows no spec (`879e3c9a`).
- Sonnet 5.5, tasks preview on 4c: each preview that ran `geo.mjs` wrote the obvious error body and exit 0 in `## Facts` (2 of 2 on f5422dd and 765cdec). Each preview that only read the file wrote no fact (todo item 65). 5 of 6 applies over two commits added `echo "$?"` to the `plan-hash.mjs` command (group I).
- Node v24.13.0 runs a `.js` file with ESM syntax and no `package.json` with no warning, and `require()` of it works (group I, `/tmp/osl-I4c-2.RCXl`).

## Rerun on 26c58ea

**Source**: scenarios 3 ×2, 4 ×2, 18 ×2, 18b ×2, 20c ×3, 4c ×2, 4d ×2, isolated (D199), Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, reports in `.scenario-runs/20261108-26c58ea/`, 2026-11-08.

- Sonnet 5.5 with D210: no prune summary named `plan.md`, and each requirement question gave "none" as a valid answer, in 3 of 3 runs of 20c. In 1 of 3, upgrade wrote a Why line with a new claim and no 🤖, and said "🤖 marks: None" (group F).
- Sonnet 5.5 with D211: in 2 of 2 runs of 4c, the preview first wrote an obvious fact, and the end check took it out of `## Facts`. In one run, it moved the fact into the "because" part of a decision. In the other, it removed it. 0 of 2 previews wrote a decision on how `lookup` finds an unknown city (group I).
- Sonnet 5.5 with D212: no session added `echo $?` to `plan-hash.mjs` (0 of 14, groups A and I).
- Sonnet 5.5 with D213: both 4d applies wrote a test, and the tests failed when the exit code of the script changed. In 4d-1, apply did not run the script in the repo: `node scripts/spec-gate.mjs; echo "rc=$?"` was denied, and it did not try `exit-code.mjs` (group I).
- Sonnet 5.5 with D214: each apply of group I and both runs of scenario 4 recorded `"type": "module"` as a 🤖 decision. The end check found the choices that the reply names, but not the Blob download (2 of 2) and CRLF line ends (1 of 2) of scenario 4. In scenario 4 run 1, D5 said that `package.json` "holds only `"type": "module"`", but it also holds `private` and a `test` script (group A).
- Sonnet 5.5 with D215: after "no" to the ADR offer, both runs of 18 named stock `/opsx:archive` and offered no CLI command. Neither run of 18b asked an archive question while a delta held a 🤖. In 1 of 2 runs of 18b, the open question of `plan.md` came one reply later than the ADR reply (group C).
- Claude Code 2.1.319: stock `/opsx:apply` ran `openspec instructions apply` in 6 of 6 sessions, with no skill (group A). On f5422dd, 1 of 5 ran neither.
- Claude Code 2.1.319, scenario allowlist: `npm test`, `sed -i ''`, `python3 - <<'EOF'`, and a `for` loop are denied. `cd <dir>; openspec instructions …` is allowed (groups A, F, I).
- Sonnet 5.5, archive: a spec reason with no source ("callers run from different directories", "callers need a plain return value") in 3 runs of 4c over three commits (group I).

## Rerun on 193cd75

**Source**: scenario 4 ×2, isolated (D199), Claude Code 2.1.319 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, report in `.scenario-runs/20261108-193cd75/group-A.md`, 2026-11-08.

- Sonnet 5.5 with D216: CRLF line ends were in a 🤖 decision in 2 of 2 runs (1 of 2 on 26c58ea). In 1 of 2 runs, no decision recorded the file layout or the filter and sort of the page, and the agent did not read its files again in the end check.
- Sonnet 5.5, apply: a decision said that `package.json` "only sets `type: module`", but the file also holds `private` and `scripts.test`, in 1 of 2 runs (also 1 of 2 on 26c58ea). In the same run, the done check named only the open questions, not the Goal and the Constraints (also on 743a6f3).
- Claude Code 2.1.319: stock `/opsx:apply` ran `openspec instructions apply` in 8 of 8 sessions on 26c58ea and 193cd75, with no skill.
- Sonnet 5.5, apply: all 4 scaffolds of scenario 4 on 26c58ea and 193cd75 used a Blob download and CRLF line ends.

## Scenario Run on bdd9b0e

**Source**: all scenarios, 41 runs, isolated (D199), Claude Code 2.1.321 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261109-bdd9b0e/`, 2026-11-09.

- Claude Code 2.1.321, scenario allowlist: the heredoc rule depends on the form. `cat >> <file> <<'EOF' … EOF` and then `node <script>` on a new line ran with no denial (group D, `raw/D/11/turn-2.json`; group H, `9b2afa0f`, also with `grep`). `mkdir -p <dir> && cat > <file> <<'EOF'` and `cd <dir>; …; cat > <file> <<'EOF'` are denied (groups E, I). So the 2.1.318 fact "a heredoc followed by more commands on new lines is denied" does not hold for an append heredoc on 2.1.321.
- Claude Code 2.1.321, scenario allowlist: also denied are `cd "$(git rev-parse --show-toplevel)" && …` (groups B, H), `R=$(git rev-parse --show-toplevel); git -C "$R" grep …` (group F), `cd openspec; …; git -C .. grep …` (group G), `PATH=/nonexistent "$(command -v node)" …` and `N=$(command -v node); …` (group I), and a chain that starts with `rm` (group B). `cd svc && openspec list --json; ls; cat … | head` ran (group D).
- Claude Code 2.1.321: a denied Bash call does not change the working folder of the next call (group G, `0c873c1e`). A `cd <abs>/svc && …` of turn 1 stays in effect in the `--resume` turn 2, as on 2.1.319 (group D, `0358e295`).
- Claude Code 2.1.321: the Input tok of a propose session went from about 17,000 (2.1.319, f5422dd) to about 27,000. The cause is not known (group H, metrics tables).
- Claude Code 2.1.321: stock `/opsx:apply` ran `openspec instructions apply` in 6 of 6 sessions. 5 of 6 called no skill, and 1 loaded `openspec-lite-apply` (group A). Stock `/opsx:archive` switched to `openspec-lite-archive` after `openspec list --json; cat .openspec.yaml`, with no `openspec instructions archive` (group F, `76027862`).
- OpenSpec 1.14.2: `openspec validate` passes on a spec-driven change whose `design.md` has no `## Risks / Trade-offs` section (group F, session `fd988eae`).
- Sonnet 5.5 with D217: in groups A and I, 1 of 6 applies made a plumbing detail into its own 🤖 decision (scenario 4 run 1, `visibleRows`). 3 of 6 put a plumbing detail inside a decision that a user sees, for example "Download as `report.csv` through a Blob link". 2 of 6 missed a choice that another program sees: the 429 response body (4b run 1) and the field `summary.totals.items` that the script reads from `openspec` (4d-2).
- Sonnet 5.5, apply: a plan that the agent states in the question turn, not as a question, is recorded with no 🤖 after "Use your recommended answer for each question." (group I, `5931bbee`). The answer "Leave the other questions open." with no other question makes it hold back the done check (group I, `66480c1f`). In 4b, after the `npm test` denial, it did not try `node --test` in 2 of 2 runs (group A).
- Sonnet 5.5, tasks preview: it refused to write a preview in 1 of 2 runs of scenario 3, because the repo has no code (group A, `dff6d64b`).
- Sonnet 5.5, upgrade with D208: `skip_specs: true` stays through the question turn, and the `Edit` that removes it comes before the first spec `Write`, in 2 of 2 runs of scenario 7 (group C). 3 of 9 upgrade runs over three commits wrote the "Table is empty" scenario. Step 2.5 removed the full `## Risks / Trade-offs` section, which held only a pointer to the kept questions (group F, `7ee5261a`).
- Sonnet 5.5, archive with D215: both runs of 18 named stock `/opsx:archive` after "no" to the ADR offer, and neither run of 18b asked an archive question while a delta held a 🤖 (group C). In 20b, the written ADR held a sentence that the approved draft did not hold (group E).
- `scripts/break-delta.sh` has mode `100755` on bdd9b0e, and the watcher of 13a broke the delta (group B).

## Rerun on a71a5eb

**Source**: scenarios 4 ×2, 4b ×2, 4c ×2, 4d ×2, isolated (D199), Claude Code 2.1.321 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261110-a71a5eb/`, 2026-11-10.

- Sonnet 5.5 with D218: no decision in scenarios 4 and 4b holds a plumbing part (0 of 4 runs; 2 of 4 on bdd9b0e). In 4c, D1 holds `execFileSync` in 2 of 2 runs, and both archive ADRs copy it. Both 4d runs record the JSON field `summary.totals.items` as a 🤖 decision (0 of 2 on bdd9b0e) (groups A, I).
- Sonnet 5.5 with D218: apply missed a visible choice in 5 of 8 runs: the page path `src/report.html` (2 of 2 runs of 4), the filter and sort UI (1 of 2 runs of 4), the 429 body `rate limit exceeded` (2 of 2 runs of 4b), and the env var `OPENSPEC_BIN` that 4d-1 reads (groups A, I).
- Sonnet 5.5, apply: a plan that the agent adds in apply and does not ask gets a 🤖 in 4d-2 (session `09b21010`). On bdd9b0e, 1 of 2 runs wrote it with no 🤖. Both 4b runs ran the tests (0 of 2 on bdd9b0e) (groups A, I).
- Sonnet 5.5, tasks preview: after `exit-code.mjs node tools/geo.mjs Atlantis`, 2 of 2 previews of 4c wrote the obvious result as a fact (0 of 2 on bdd9b0e) (group I, sessions `15d113e6`, `168feaec`).
- Claude Code 2.1.321, scenario allowlist: a single `cat >> <file> <<'EOF' … EOF` runs under `Bash(cat:*)`, also on `plan.md` (group I, `09b21010`). `cd <dir> && python3 - <<'EOF'` is denied (group A).
- Node v24.13.0: `node --test src/` and `node --test test/` fail. `node --test` with no argument, or with a file path, passes (group I). Not checked in the Node docs.

## Rerun on 5eaf25d

**Source**: scenarios 4, 4b, 4c, 4d, 4 runs each, isolated (D199), Claude Code 2.1.322 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261110-5eaf25d/`, 2026-11-10.

- Sonnet 5.5 with D219, criterion 1: the main visible choices are recorded: the filter and sort UI in 4 of 4 runs of 4 (1 of 2 on a71a5eb), the `x-api-key` header, the no-key behavior, and `Retry-After` in 4 of 4 runs of 4b, and the field `summary.totals.items` in 4 of 4 runs of 4d. The behavior on an error or an edge case is missed most: the 429 body (3 of 4), the 401 body (2 of 4), an exit 2 path (2 of 4 runs of 4d), and a throw when `geo.mjs` fails (4 of 4 runs of 4c). The page path `src/report.html` has no decision in 2 of 4 runs of 4 (groups A4, A4b, I4c, I4d).
- Sonnet 5.5 with D219: the file-by-file end check found none of the gaps of 4b (group A4b). In 4d-3, apply said "You didn't ask for that, so it isn't recorded" about an exit code that it picked (session `055fab68`). The rule says "You picked it when plan.md, the user, and the constraints do not fix it", and the same paragraph uses "fix" in the sense "repair".
- Sonnet 5.5 with D219, "Record only the part of the decision that matches (1) or (2)": in 4 of 4 runs of 4c, D1 names `execFileSync` or "spawn and parse stdout", and each archive ADR copies it. In 2 of 4 runs of 4, a decision holds a sentence about the internal function that the table and the export share (groups A4, I4c).
- Sonnet 5.5, tasks preview on 5eaf25d: 0 of 4 previews of 4c wrote the obvious `geo.mjs` result as a fact (2 of 2 on a71a5eb) (group I4c).
- Sonnet 5.5, apply: the non-obvious fact F2 was removed with F1 in 2 of 4 runs of 4b, against D184 (group A4b). Apply skipped the done check in 4c-3. In 4d-4, the code exits 2 for an invalid spec against the Goal "exit 0 otherwise", and the done check said "The goal is met" (groups I4c, I4d).
- OpenSpec 1.14.2: `openspec validate --specs --json` with one invalid spec and one valid spec exits 1, and it still prints the full JSON on stdout, with `summary.totals` = `{"items": 2, "passed": 1, "failed": 1}` (group I4d, `exit-code.mjs` run in `/tmp/osl-I4d-4.hiUr`).
- Claude Code 2.1.322 (2.1.321 before): the scenario allowlist denials stay the same: `npm test`, `python3 - <<'E'`, `mkdir -p <dir> && cat > <file> <<'EOF'`, `cd <dir> && cat >> plan.md <<'EOF'`, and a chain with `echo $?` (groups A4, A4b, I4c, I4d).
- Node v24.13.0: `node --test "test/*.test.js"`, with the glob in quotes, passes (group A4b, `ce8a0378`).

## Rerun on b299124

**Source**: scenarios 4, 4b, 4c, 4d, 4 runs each, isolated (D199), Claude Code 2.1.322 print mode, `eu.anthropic.claude-sonnet-5-5`, OpenSpec 1.14.2, APM 0.33.0, reports in `.scenario-runs/20261110-b299124/`, 2026-11-10.

- Sonnet 5.5 with D220: in 4 of 4 runs of 4d, a decision records each exit code (2 of 4 on 5eaf25d). The throw of 4c is recorded in 2 of 4 runs (0 of 4). "Rejected requests are not counted" is recorded in 4 of 4 runs of 4b (2 of 4). No run of 4d records the error message text `spec-gate: no spec found` (groups I4c, I4d, A4b).
- Sonnet 5.5 with D220: the page path of scenario 4 has no decision in 3 of 4 runs, and the 429 body of 4b in 2 of 4 runs. No run of scenario 4 read its code files again in the end check (groups A4, A4b).
- Sonnet 5.5 with D220: in 4 of 4 runs of 4c, a decision title or "Chose X" names the call method of `geo.mjs`, and each ADR copies it. In 2 runs, a 🤖 decision holds only the call method. In 4c-4, apply named the throw in the reply and wrote "I left it out of `plan.md`" (group I4c, session `81e6e573`).
- Sonnet 5.5, tasks preview: 3 of 4 previews of 4c wrote the `geo.mjs` error body as fact F1 (0 of 4 on 5eaf25d, 2 of 2 on a71a5eb) (group I4c).
- Sonnet 5.5, apply on 4b: after the `npm test` denials, 2 of 4 runs did not try `node --test` (0 of 4 on 5eaf25d) (group A4b). In 4d-3, the test covers only the exported `decide()`, so a script that always exits 0 passes 5 of 5 tests (group I4d).
- Claude Code 2.1.322: the agent calls the denial "Parser skipped input between top-level statements" a parser error in its reply, not a permission denial (group I4c). Denied: `python3 -I - <<'EOF'`, and a chain with `mkdir -p /tmp/<dir> && cd /tmp/<dir> && rm -rf *` or `D=$(mktemp -d) && cd $D` (group I4d). Allowed: a `;` chain of allowed commands, for example two `exit-code.mjs` calls (groups A4, I4d).

## Release 1.7.0

**Source**: release of `v1.7.0` (commit `99d8656`), 2026-11-08.

- `gh workflow run apm-install.yml` with the local `gh` login fails with "HTTP 403: Must have admin rights to Repository". A run of the `apm-install` workflow needs a login with admin rights, or the Actions tab.
- The same check by hand passes: in an empty `git init` folder, `apm install 'duongphuhiep/openspec-lite/package#^1.0.0' --target claude` (APM 0.33.0) writes `resolved_ref: v1.7.0` in `apm.lock.yaml`, the six `openspec-lite-*` skills, and `assets/plan-lite/` with `exit-code.mjs`, `plan-status.mjs`, and `schema.yaml` at `version: 5`. `apm_modules/duongphuhiep/openspec-lite/` holds only `package/`.
- The `test` workflow passed on the `main` push and on the `v1.7.0` tag push.
