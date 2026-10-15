# Decisions

Design decisions for this project. Add rationale so future proposals can build on them.

This log is append-only. Do not edit an old entry. Add a `**Status**` line that names the newer decision.

---

## D1: Three-Level Workflow

**Decision**: Adopt a 3-level workflow based on change complexity.

| Level           | Trigger                                                 | Artifacts                                                      |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| 1 — Direct      | Small: bug fix, isolated refactor, obvious feature      | None (prompt → implement → verify)                             |
| 2 — Lightweight | Medium: needs planning, single session or short         | plan.md (goal + non-goals + constraints, grows with decisions) |
| 3 — OpenSpec    | Large: multi-session, team, cross-repo, contract needed | proposal + specs + design + tasks                              |

**Rationale**: OpenSpec overhead is only justified when context persistence matters across sessions, agents, or people. Most work is Level 1 or 2.

**Status**: D54 removes sessions as a trigger. Level 2 can span context clears. Level 3 triggers are handoff, more than one capability or repo, and a contract.

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

**Status**: The promotion heuristic is resolved in D6.

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

**Status**: D55 states that the two filters combine with OR.

---

## D7: Upgradeable Schema (Round 2)

**Decision**: Level 2 and Level 3 are not parallel tracks. A Level-2 change can be upgraded to Level 3 by running a command that scaffolds the missing artifacts (specs, design, tasks) from the existing plan.md.

**Rationale**: Changes often grow in scope mid-flight. Rewriting from scratch is wasteful. Upgrade path avoids the "this got more complex than expected" problem.

**Status**: D13 and D62 make the upgrade a skill, not a command.

---

## D8: Promotion Targets (Round 2)

**Decision**: When plan.md content is promoted to permanent storage:

- Requirements and scenarios → `specs/<capability>/spec.md` (OpenSpec delta format)
- Design decisions → `openspec/adr/NNNN-<slug>.md` (ADR format)
- Per-item: the AI judges which bucket each piece of information belongs to, user approves.

**Rationale**: Requirements and decisions have different lifecycles and audiences. Keeping them separate makes both more useful.

**Status**: D47 defines how requirements reach the main specs. D59 changes the ADR file name.

---

## D9: ADR Format for Permanent Decisions (Round 3)

**Decision**: Permanent decisions are recorded as ADRs in `openspec/adr/NNNN-<slug>.md`.

**Rationale**: ADRs are self-contained, searchable, and linkable. One file per decision scales better than an append-only blob. Standard format means tooling and conventions already exist.

**Status**: D59 changes the file name to `YYYY-MM-DD-<slug>.md` and fixes the template.

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

**Status**: D78: propose gets this template from the CLI. D92 makes "Rejected Z because W" optional.

---

## D11: Upgrade Trigger (Round 3)

**Decision**: Upgrade from Level 2 → Level 3 is triggered two ways:

1. **Explicit** — user says "upgrade this to Level 3", command scaffolds missing artifacts from plan.md
2. **AI-suggested** — AI detects complexity signals (change spans >1 session, involves others, touches multiple capabilities) and suggests upgrading

**Rationale**: Explicit covers intentional upgrades. AI-suggested catches the case where complexity crept in while the user was heads-down.

**Status**: D54 revises the signals.

---

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

**Status**: Revised by D25, then D53. The schema has only the `plan` artifact, plus the `apply` block from D25. The `template` value must be `plan.md`, not `templates/plan.md`: the path is relative to `templates/` (`docs/facts.md`).

---

## D13: Upgrade Mechanism (Round 4)

**Decision**: Upgrade from plan-lite → spec-driven is an AI skill that orchestrates existing CLI primitives. The skill:

1. Reads plan.md to extract goal, non-goals, constraints
2. Changes the change's schema metadata (`.openspec.yaml`) to `spec-driven`
3. Pre-fills proposal.md from plan.md content
4. Leaves specs and design empty for the AI to fill in from plan.md context.

**Rationale**: CLI handles file/metadata mechanics. AI handles content extraction and mapping.

**Status**: Extended by D31 and D46. Revised by D62: upgrade writes all four artifacts and moves the `plan.md` content.

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

**Decision**: openspec-lite ships six skills:

| Skill                         | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `openspec-lite-propose`       | Create a plan-lite change (scaffolds plan.md)                     |
| `openspec-lite-tasks-preview` | Generate or regenerate tasks-preview.md (added by D26)            |
| `openspec-lite-apply`         | Implement from plan.md + optional tasks-preview.md (added by D27) |
| `openspec-lite-upgrade`       | Upgrade plan-lite → spec-driven when complexity grows             |
| `openspec-lite-archive`       | Archive with selective promotion (AI judges, user approves)       |
| `openspec-lite-schema`        | Install and version-check the plan-lite schema (added by D44)     |

`/opsx:explore` is reused as-is — no duplication needed.

**Status**: Revised by D26, D27, D42, and D44. The table shows the current set of skills.

---

## D17: Skill Naming (Round 5)

**Decision**: Skills use the `opsx-lite:` prefix.

**Rationale**: Signals it's an extension of the opsx family, not a standalone tool. Clearer than plain `lite:` when both opsx and opsx-lite are installed.

**Status**: Superseded by D42. A colon is not valid in a skill name.

---

## D18: Archive Promotion UX (Round 5)

**Decision**: The archive promotion interaction is conversational. The AI lists what it would promote, the user responds yes/no/edit inline. No staging files, no extra artifacts.

**Rationale**: Lowest friction. Keeps the workflow fast for the common case.

**Status**: D74: archive drafts the full text of each item before approval.

---

## D19: Tasks Preview Is AI-Generated (Tasks Round 1)

**Decision**: The AI writes the tasks preview. It reads `plan.md` and explores the code first. Then it lists the code changes it intends to make.

**Rationale**: The value is a look at the agent's intent before it writes code. A human-written task list does not give this.

---

## D20: Tasks Preview Is On Demand (Tasks Round 1)

**Decision**: The tasks preview is opt-in. The user asks for it when they want a preview. The default plan-lite flow does not include it.

**Rationale**: A mandatory task list makes plan-lite heavy again. It brings back downside 2 (D2).

---

## D21: Tasks Preview Value Is the Checkpoint (Tasks Round 1)

**Decision**: The value of the tasks preview is the human review before coding. The artifact itself has no long-term value.

**Rationale**: After the AI writes the code, the diff is the truth. The preview is not a contract.

---

## D22: Tasks Preview Is a File, tasks-preview.md (Tasks Round 2)

**Decision**: The tasks preview is an opt-in artifact named `tasks-preview.md`. It is not a chat-only preview.

- It is for the human. The human uses it to check that the AI will not do strange things.
- It is a reference. It is not a list of fixed steps.
- The apply skill can use it as a guide. The apply skill can change the approach during implementation. For example, it can make the implementation simpler.

**Rationale**: A file survives a context clear. It also works in tools that have no native plan mode.

**Status**: D53: the preview is a file, but not a schema artifact.

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

**Rationale**: The file is opt-in and reference-only. The difference from `tasks.md` is its status, not its format.

**Status**: D52 removes the checkboxes.

---

## D25: plan-lite Schema Has Two Artifacts (Tasks Round 2)

**Decision**: `plan-lite` has a required `plan` artifact and an opt-in `tasks-preview` artifact. This revises D12.

The schema has `apply.requires: [plan]` and no `apply.tracks`. This prevents both apply traps in `docs/facts.md`.

**Status**: Superseded by D53. `tasks-preview` is no longer a schema artifact. The `apply` block stays.

---

## D26: openspec-lite-tasks-preview Skill (Tasks Round 3)

**Decision**: Two ways create the tasks preview:

1. `openspec-lite-propose` asks at the end: "Do you want a tasks preview?"
2. A separate skill, `openspec-lite-tasks-preview`, generates the preview at any time.

`openspec-lite-tasks-preview` overwrites the old `tasks-preview.md`.

**Rationale**: Two real workflows need the separate skill:

- The user clears the context and explores more details. Then the user generates the preview with more confidence.
- The user disagrees with the preview. The user adds constraints, non-goals, or decisions to `plan.md`. Then the user regenerates the preview and reads it again. This confirms that the AI understands the plan.

---

## D27: openspec-lite-apply Skill (Tasks Round 3)

**Decision**: Make an `openspec-lite-apply` skill. It implements from `plan.md`. It uses `tasks-preview.md` as a guide if the file exists.

The user starts with stock `/opsx:apply`. The schema `apply.instruction` holds the plan-lite rules. If stock apply does not work as expected, the user changes to `openspec-lite-apply` and compares.

**Rationale**: Stock apply runs without `tasks.md`, but its text assumes checkboxes. It also never gets a done signal (see `docs/facts.md`). The user expects that `openspec-lite-apply` is not redundant. This is an instinct, with no evidence yet.

**Review trigger**: Remove `openspec-lite-apply` if real use shows that stock `/opsx:apply` does the same job.

**Status**: D64 makes the schema `apply.instruction` the only copy of the rules.

---

## D28: New Changes Set skip_specs (Tasks Round 3)

**Decision**: `openspec-lite-propose` sets `skip_specs: true` in `.openspec.yaml` for each new plan-lite change.

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

**Decision**: `openspec-lite-upgrade` uses `tasks-preview.md` as the seed for `tasks.md`. The user reviews `tasks.md` again after the upgrade.

**Rationale**: The format is the same (D24), so the content is reusable. The second review is necessary because `tasks.md` is a contract, not a reference.

**Status**: Revised by D62. Upgrade seeds `tasks.md` last, after `specs` and `design`, then deletes the preview.

---

## D32: Do Not Edit tasks-preview.md (Tasks Round 4)

**Decision**: `tasks-preview.md` is output only. The user puts every correction in `plan.md` and regenerates the preview. The file starts with this notice: "Generated. Edit plan.md, not this file."

**Rationale**: `openspec-lite-tasks-preview` overwrites the file (D26). With one source of truth, a regeneration never loses information.

---

## D33: Apply Warns About a Stale Preview (Tasks Round 4)

**Decision**: If `plan.md` is newer than `tasks-preview.md`, apply tells the user and offers to regenerate the preview. When the two files conflict, `plan.md` wins.

**Rationale**: A cheap check that catches a real mistake: the user changes the plan and forgets to regenerate.

**Status**: D49 replaces the mtime comparison with a content hash.

---

## D34: Delivery via skillpm + Microsoft APM

**Decision**: openspec-lite is published via two complementary package managers:

- **skillpm** (npm-native): `npm install openspec-lite` + `skillpm sync` → copies skills into `.agents/skills/` and links harness folders to it. skillpm delegates harness wiring to the vercel-labs `skills` tool and lists no harnesses itself.
- **Microsoft APM** (git-native): `apm install` + `apm compile -t <harness>` → generates harness-specific config for 9+ harnesses. No central registry; the GitHub repo is the package source.

Both use the same SKILL.md files. No per-harness plugin manifests (`.claude-plugin/`, `.codex-plugin/`, etc.) are shipped — skillpm and APM together cover all install paths.

**Rationale**: skillpm gives npm discoverability and semver versioning. APM gives git-native install and polyglot project support. Dual-publish costs almost nothing — the deliverable files are identical, only the manifests differ.

**Status**: Superseded by D70. skillpm installs only one skill per package, so openspec-lite ships through APM only. Also, APM installs skills in `apm install`; `apm compile` builds only context files (`docs/facts.md`).

---

## D35: No Raw Harness Plugin Manifests

**Decision**: openspec-lite does not ship `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.kimi-plugin/plugin.json`, or `GEMINI.md`.

**Rationale**: skillpm (harness wiring through the `skills` tool) and APM (9+ explicit targets) together cover the expected install paths. Real coverage per harness is not yet tested. Raw manifests only serve a manual clone-and-link path. If that path is needed in the future, it can be added. Removing them keeps the repo minimal.

**Status**: D70 removes skillpm. APM alone covers the install paths.

---

## D36: npm Package Name

**Decision**: The npm package name is `openspec-lite`.

**Rationale**: Matches the repo name and the project identity. A scoped name (`@openspec/lite`) would imply official endorsement from the OpenSpec org, which is not the case.

**Status**: D42 aligns the skill prefix with this name. D70 removes the npm package. The name stays the repo name and the skill prefix.

---

## D37: Schema Path in Repo

**Decision**: The plan-lite schema lives at `openspec/schemas/plan-lite/` in the repo root.

**Rationale**: This mirrors the path where the schema lands in target projects (`openspec/schemas/plan-lite/`). The copy path is a one-liner and the intent is obvious to a reader.

**Status**: Revised by D43 and D44. In this repo, the schema source is `skills/openspec-lite-schema/assets/plan-lite/`. The target path in a user project is still `openspec/schemas/plan-lite/`. D83 moves the source to `package/skills/openspec-lite-schema/assets/plan-lite/`.

---

## D38: One Repo for Design and Deliverable

**Decision**: This repo (`openspec-lite`) holds both design documents (`docs/`, `CONTEXT.md`, `README.md`) and the installable deliverable (skills, schema, package manifests).

**Rationale**: Simpler than a separate dist repo. No sync problem between two repos. The design docs become the project's own documentation.

**Status**: D70 removes the package manifests. D83 puts the deliverable in `package/`.

---

## D39: Schema Install — Fetch From GitHub on First Use

**Decision**: `openspec-lite-propose` checks if `openspec/schemas/plan-lite/schema.yaml` exists in the target project. If not, it fetches the schema files from the GitHub repo and creates them. If the local schema `version` does not match the skill's expected version, the skill warns the user and offers to run `openspec-lite-propose --update-schema`.

`--update-schema` finds the latest schema version whose `openspec-version` range matches the user's installed openspec CLI version, then replaces the local schema files.

The skill embeds only the expected schema version string — not the full schema content. Full schema content is never in the skill's SKILL.md.

**Rationale**: Token-efficient — schema content never travels through the LLM after first install. Handles both "not installed" and "outdated" cases. Version check costs one file read per invocation.

**Status**: Superseded by D43 (copy from skill assets, not fetch from GitHub).

---

## D40: Schema Metadata Fields and Version Range Syntax

**Decision**: `schema.yaml` carries two metadata fields:

```yaml
version: 1                     # integer, the schema's own version
openspec-version: ">=1.9.0"    # semver range of compatible openspec CLI versions
```

Version ranges use semver (npm-style): `>=1.9.0`, `^1.0.0`, `~1.7.0`, `<2.0.0`.

Multi-version resolution (a schema index listing multiple versions) is deferred until a second schema version actually exists. Today there is one version. The skill fetches from the `main` branch. When a breaking change requires a new schema version, add the index then.

**Rationale**: Both fields on one line each. `version` enables the "outdated?" check. `openspec-version` enables compatibility warning. Semver is the natural choice since openspec is an npm package. YAGNI on multi-version index.

**Status**: D43 replaces the fetch from `main` with a copy from skill assets. The two metadata fields stay. D88 closes the range to `>=1.9.0 <2.0.0`.

---

## D41: Installed Schema Is Per Project and Committed to Git

**Decision**: The plan-lite schema installs to `<repo>/openspec/schemas/plan-lite/` in the target project. The team commits it to git. The user-level location (`${XDG_DATA_HOME}/openspec/schemas/`) is not used.

**Rationale**: A change with `schema: plan-lite` is unreadable without the schema. A teammate or a CI job that clones the repo must get both. One committed copy also gives the team one schema version, and git records each schema upgrade as a diff. The version check reads the repo copy only.

---

## D42: Skill Names Use the openspec-lite- Prefix

**Decision**: Skills are named `openspec-lite-<action>`: `openspec-lite-propose`, `openspec-lite-tasks-preview`, `openspec-lite-apply`, `openspec-lite-upgrade`, `openspec-lite-archive`, and `openspec-lite-schema` (D44). The folder name is the same as the skill name. openspec-lite ships skills only. It ships no slash-command files.

This revises D17.

**Rationale**:

- The agentskills.io spec permits only `a-z`, `0-9`, and `-` in a skill name. The name must match its folder. The old colon form (`opsx-lite:propose`) is not valid.
- The prefix matches the repo name and the npm package name (D36).
- The prefix matches the stock OpenSpec skill names, for example `openspec-explore` and `openspec-propose`.
- Skills only: Codex has no command files, and skillpm delivers skills only. One naming form works on every harness.

---

## D43: Schema Ships in Skill Assets and Is Copied at Install

**Decision**: The plan-lite schema files ship inside a skill's `assets/` folder. On install, the skill copies them into `<repo>/openspec/schemas/plan-lite/` with one shell command. The skill does not fetch from GitHub. The LLM does not read the schema content to install it.

This revises D39. The version check from D39 and D40 stays:

- The skill reads `version` and `openspec-version` from the repo copy.
- If the repo copy is older than the shipped copy, the skill offers to copy again.
- If the installed openspec CLI is outside the `openspec-version` range, the skill warns. The user then installs an openspec-lite package version that matches. The package version selects the schema version, so no schema index is necessary.

**Rationale**: No network access, so it works in sandboxed harnesses and behind proxies. No tokens are spent on schema content. The shipped schema always matches the installed skill version, which removes the risk in D39 of fetching a newer schema from `main`. skillpm and APM both keep skill `assets/` on disk next to `SKILL.md`.

**Status**: The asset owner and the check are resolved in D44. D56 and D65 add the mismatch rules and the copy command. D70: the git tag that APM installs selects the schema version, not an npm package version.

---

## D44: openspec-lite-schema Skill Owns the Schema

**Decision**: A sixth skill, `openspec-lite-schema`, holds `assets/plan-lite/`. It installs the schema into the repo and checks its version (D43). The five workflow skills each start with one step: check that `openspec/schemas/plan-lite/schema.yaml` exists, then compare its version. If the file is missing or old, the skill runs `openspec-lite-schema`.

This revises D16 (six skills) and removes the `--update-schema` flag from D39.

**Rationale**: A teammate can clone a repo and run any skill first, so every skill must check. One owner keeps one copy of the assets. No skill depends on the folder path of another skill. Schema update is a separate job, so it is not a flag on propose.

**Status**: D56 adds the mismatch rules. D57 adds the fallback when a skill cannot invoke a skill. Change selection (D61) and the change schema guard (D75) come before the schema check, so a refused change never triggers a schema install.

---

## D45: One Term per Concept — Upgrade vs Promotion

**Decision**:

- **Upgrade** is the switch of an active change from plan-lite to spec-driven.
- **Promotion** is only the archive step that moves information into specs or ADRs.
- "Graduation" is not used.
- A new schema version is a schema **update**, not an upgrade.

`CONTEXT.md` defines both terms. D7, D11, D13, D16, and the README use them.

**Rationale**: Three words for one concept caused confusion. "Promote" also collided with the archive meaning.

---

## D46: Upgrade Removes skip_specs

**Decision**: `openspec-lite-upgrade` removes `skip_specs: true` from `.openspec.yaml`. The end-of-upgrade summary tells the user that it did this.

This completes D13 and D28.

**Rationale**: With the flag set, the CLI marks `specs` as skipped and forbids spec files, so an upgraded change could never get specs. A spec-driven change without specs is rare. The user can put the flag back with one edit.

---

## D47: Archive Promotes Requirements Through the CLI Merge

**Decision**: For each approved requirement, `openspec-lite-archive` writes a delta file at `<change>/specs/<capability>/spec.md` in the standard format (ADDED / MODIFIED). It removes `skip_specs` from `.openspec.yaml`, then runs `openspec archive`. The CLI validates the deltas and merges them into the main specs.

Approved decisions go directly to `openspec/adr/NNNN-<slug>.md` (D9).

This makes D8 more precise.

**Rationale**: `openspec archive` merges any delta files under `<change>/specs/`, whatever the schema (`dist/core/archive.js:1127`). But it blocks when `skip_specs` is set and `specs/` has files (`archive.js:969`). Reusing the CLI merge avoids a second, untested merge that could corrupt the main specs. The CLI has no ADR concept, so ADRs are written directly.

**Status**: D58 changes the order: validate and archive first, ADRs last. D59 changes the ADR name to `YYYY-MM-DD-<slug>.md`.

---

## D48: OpenSpec Compatibility Is Declared Only in schema.yaml

**Decision**: The `openspec-version` field in `schema.yaml` (D40) is the only declaration of compatible OpenSpec versions. `package.json` has no `peerDependencies` on `@fission-ai/openspec`. The skills compare the range with the output of `openspec --version`.

**Rationale**: One source of truth. It works for skillpm and APM installs the same way. A peer dependency does not help when the openspec CLI is installed globally.

**Status**: D70 removes `package.json`. `schema.yaml` stays the only declaration.

---

## D49: Stale Preview Detection Uses a Content Hash

**Decision**: `openspec-lite-tasks-preview` writes the SHA-256 of `plan.md` in the preview header, after the notice from D32:

```markdown
<!-- Generated. Edit plan.md, not this file. -->
<!-- plan-sha256: <hash> -->
```

Apply computes the hash of the current `plan.md` and compares. A different hash means the preview is stale.

This replaces the mtime check in D33.

**Rationale**: `git clone`, `checkout`, and `pull` reset file mtimes, so mtime gives wrong results. A hash is exact and costs one shell call.

**Status**: D51 changes the hash scope. D65 defines the command.

---

## D50: Propose and Apply Suggest an Upgrade

**Decision**: Two skills watch for the upgrade signals from D11:

- `openspec-lite-propose` checks the size of the request when it creates the change.
- `openspec-lite-apply` checks for signals during implementation: more than one capability, a new contract, or work across sessions.

The other skills do not suggest an upgrade.

**Rationale**: Scope becomes visible at these two points. Checks in the other skills would only add noise.

**Status**: D54 revises the signals. D68 adds a Level 1 signal to propose.

---

## D51: The Preview Hash Excludes the Decisions Section

**Decision**: The `plan-sha256` hash (D49) covers `plan.md` without its `## Decisions` section. Before hashing, the command changes CRLF to LF and collapses each run of whitespace to one space.

This revises D49.

**Rationale**: Apply writes deviations into `## Decisions` (D29). A full-file hash then marks the preview as stale after the first deviation. Line endings and blank lines change between OS checkouts but do not change the meaning. `## Open Questions` stays in the hash, because an answer to an open question can change the preview.

**Status**: Revised by D72. The hash covers only Goal, Non-Goals, and Constraints. A script in the schema computes it.

---

## D52: The Tasks Preview Has No Checkboxes

**Decision**: `tasks-preview.md` uses the layout of `tasks.md` (D24), but its items are plain bullets, not `- [ ]` checkboxes. When upgrade seeds `tasks.md` from the preview, it adds the checkboxes.

This revises D24.

**Rationale**: Stock `/opsx:apply` ticks checkboxes. That edits a file that nobody must edit (D32). With no checkboxes, stock apply has nothing to tick.

---

## D53: tasks-preview Is Not a Schema Artifact

**Decision**: The plan-lite schema has one artifact again: `plan`. `tasks-preview.md` is a file that only `openspec-lite-tasks-preview` writes. Its template is inline in that skill's `SKILL.md`.

This revises D25. D12 is current again, with the `apply` block from D25.

**Rationale**: Stock `/opsx:continue` and `/opsx:ff` generate every artifact in the graph. They would create a preview that nobody asked for (D20), with no header and no hash. Outside the graph, the CLI does not know the file. The template is a few lines, so a separate asset file adds a file and a read for no benefit.

**Status**: D76 defines the template text.

---

## D54: Upgrade Signals Use Handoff and Repos, Not Sessions

**Decision**: The upgrade signals are:

- Another person or agent must continue the work.
- The change touches more than one capability.
- The change touches more than one repo.
- A contract (spec) becomes necessary.

"The work spans more than one session" is removed.

This revises D11 and D50.

**Rationale**: plan-lite expects context clears (D22, D26), so a new session is normal. No skill can detect a session. A session count was a proxy for handoff, and handoff is the real reason for a contract. Cross-repo was a Level 3 trigger in D1 but was missing from the signals.

---

## D55: The Promotion Filters Combine With OR

**Decision**: An item is a promotion candidate if it is non-obvious OR surprising (D6).

**Rationale**: This matches the wording of D6. The user approves each item (D18), so the user removes the noise.

---

## D56: Schema Version Mismatch Stops the Skill

**Decision**: Each workflow skill compares the repo schema with the shipped schema:

- The repo copy is missing or older: run `openspec-lite-schema`. If the user declines the copy, stop.
- The repo copy is newer: stop. Tell the user to update the openspec-lite package.
- After a copy, show `git diff openspec/schemas/plan-lite/`, so the user sees overwritten local edits and can revert them.

Each workflow skill also runs `openspec --version` and compares it with `openspec-version`. If it is outside the range, the skill warns and links to the compatibility table (D67).

This makes D43 and D44 more precise.

**Rationale**: An old skill on a new schema, or a new skill on an old schema, can write files that the schema rejects. The fix is one command. A CLI update is silent, so a check only at install misses it. The CLI check costs one fast shell call. `git diff` replaces any custom merge logic for local edits.

**Status**: D81 changes the "newer schema" message to "Run `apm update`". D90 replaces the `git diff` step with a backup folder and a report of written files.

---

## D57: Skill Chaining Has a Fallback

**Decision**: When a skill must run another skill (schema install, propose → tasks preview), it invokes the skill if the harness can. If the harness cannot, it tells the user which skill to run and stops.

**Rationale**: Not every harness lets a skill invoke a skill. The fallback keeps one owner of the schema assets (D44) and works everywhere.

---

## D58: Archive Writes ADRs Last

**Decision**: `openspec-lite-archive` runs in this order after approval:

1. Write the approved delta files. For a MODIFIED requirement, copy the full requirement from the main spec, then edit it.
2. Remove `skip_specs` if step 1 wrote files.
3. Run `openspec validate <change>`. If it fails, stop and report.
4. Run `openspec archive <change> --yes`.
5. Write the approved ADRs.

This revises the order in D47.

**Rationale**: If validation or archive fails, no orphan ADR exists. `--yes` is safe because the user approved each item in the conversation. OpenSpec requires full content for MODIFIED, and partial content loses detail at archive time (`docs/facts.md`).

**Status**: Revised by D74 (scenarios, all four delta headers, draft before approval).

---

## D59: ADR Files Use a Date Prefix and a Fixed Template

**Decision**: An ADR file is `openspec/adr/YYYY-MM-DD-<slug>.md`. Its sections are Title, Status, Context, Decision, and Consequences.

This revises the `NNNN-<slug>.md` name in D8 and D9.

**Rationale**: Two branches that each add an ADR cannot get the same name. The CLI does not read ADRs, so the name has no other constraint.

---

## D60: Apply Ends With a Done Checklist

**Decision**: The end-of-apply summary checks: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty? `openspec-lite-archive` asks the same questions before it promotes, and warns on each "no".

**Rationale**: The CLI never reports a plan-lite change as done, and archive does not check (`docs/facts.md`). Open questions that are still open are the real "not done" marker.

**Status**: D73 moves the checklist into `apply.instruction`. D77 adds "Archive anyway?" to archive.

---

## D61: Change Selection

**Decision**: A skill acts on the change named in the prompt. If no name is given and only one active change exists, it uses that change. Otherwise it asks.

**Rationale**: The stock OpenSpec skills behave this way.

**Status**: D80 adds the rule for the change name.

---

## D62: Upgrade Writes All Artifacts and Moves plan.md Content

**Decision**: `openspec-lite-upgrade` writes the four spec-driven artifacts in dependency order. It gets each template from `openspec instructions <artifact>`.

1. `proposal.md`: from Goal and Non-Goals.
2. `specs/` and `design.md`: from `plan.md`. Decisions go to `design.md` → `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit.
3. `tasks.md`: seeded from `tasks-preview.md` if it exists, with checkboxes added (D52). Then delete `tasks-preview.md`.
4. Delete each `plan.md` section whose content moved. Keep a section that has no slot, for example open questions that are still open. If no section is left, delete `plan.md`.

The user reviews all artifacts at the end. `tasks.md` gets an extra review, because it is a contract.

This revises D13 and D31.

**Rationale**: The spec-driven graph requires `specs` and `design` before `tasks`. Upgrade is the only step that knows both `plan.md` and the preview, so a split would lose context. `design.md` is where stock tools look for decisions. A preview or a plan next to the new artifacts is a stale second source of truth.

**Status**: D79 adds `openspec validate` at the end. D97 switches the schema last.

---

## D63: openspec-lite-archive Is for plan-lite Changes Only

**Decision**: `openspec-lite-archive` refuses a change whose schema is not `plan-lite`. It tells the user to run stock `/opsx:archive`.

**Rationale**: One job per skill. After upgrade, the decisions are in `design.md` (D62), and the stock flow handles spec-driven changes.

**Status**: Superseded by D75, a common guard for four skills.

---

## D64: The Schema Holds the Only Copy of the Apply Rules

**Decision**: The plan-lite apply rules live only in `apply.instruction` in `schema.yaml`. `openspec-lite-apply` runs `openspec instructions apply --change <name> --json` and follows that output. The skill adds only what stock apply does wrong for plan-lite: it ignores the checkbox text, and it ends with the done checklist (D60).

This makes D27 more precise.

**Rationale**: One source of truth. Stock `/opsx:apply` gets the same rules. The difference between the two apply paths becomes small and explicit, so the D27 review trigger is easy to test.

**Status**: Revised by D73. The skill now adds only one rule: ignore checkbox text.

---

## D65: Shell Steps Use Node One-Liners

**Decision**: The hash (D51) and the schema copy (D43) use `node -e` one-liners. The copy uses `fs.cpSync`.

To find its own `assets/` folder, `openspec-lite-schema` uses the base directory from the harness if it gets one. Otherwise it searches these paths in order: `.agents/skills/openspec-lite-schema/`, `.claude/skills/openspec-lite-schema/`, `~/.claude/skills/openspec-lite-schema/`, then the APM output paths. If it finds nothing, it stops and tells the user.

**Rationale**: OpenSpec is an npm package and requires Node `>=20.19.0`, so `node` is always present. One command works on macOS, Linux, and Windows. `sha256sum`, `shasum`, and `cp -r` do not. Not every harness gives a skill its base directory.

**Status**: D71 sets the fallback search paths. D72 replaces the hash one-liner with `plan-hash.mjs`. D98 replaces the copy one-liner with `install.mjs`.

---

## D66: A Script Checks the Version Constant

**Decision**: `scripts/check-version.mjs` compares the shipped-version constant in the five workflow skills with `version` in `assets/plan-lite/schema.yaml`. `package.json` runs it in `prepublishOnly`.

**Rationale**: Six copies of one number drift. The script blocks a broken npm release. APM installs from git, so add a CI step on push when CI exists.

**Status**: D70 removes `package.json` and `prepublishOnly`. Run the script by hand before each release tag. D85 adds the CI step. D87 defines the version marker line.

---

## D67: README Has a Compatibility Table

**Decision**: README lists each openspec-lite version with its `openspec-version` range. The CLI version warning (D56) points to this table.

**Rationale**: The user needs one lookup to find the package version that matches the installed CLI.

**Status**: D70: the table lists git tags, not npm versions. D81: the table lists major tags.

---

## D68: Propose Suggests Level 1 for Small Requests

**Decision**: If the request is small (one obvious fix, no constraints or open questions worth recording), `openspec-lite-propose` asks: "This looks small. Implement directly with no change?"

**Rationale**: It applies D1 at the point where the user selects a level.

---

## D69: Skills Are Tested by Hand Scenarios

**Decision**: `docs/test-scenarios.md` lists about eight scenarios. Run them by hand before each release. Examples: fresh clone, newer repo schema, stale preview, upgrade with a preview, archive with a failing delta.

**Rationale**: The scenarios also give the evidence for the D27 review trigger. Add automated evals when a regression happens.

**Status**: D66 adds the version script, and D85 runs it in CI. D83 adds a real-install check. D84 adds automated tests for the scripts.

---

## D70: Ship Through APM Only

**Decision**: openspec-lite ships through Microsoft APM only. The git repo is the package. Users install with `apm install <owner>/openspec-lite`. A release is a git tag. The repo has no `package.json` and no `apm.yml`.

This supersedes D34 and revises D35, D36, D43, D48, D66, and D67.

**Rationale**: skillpm installs only one skill per package. `publish` rejects a package with more than one skill, and the scanner reads only the first skill (`docs/facts.md`). The fix is seven npm packages that must change version together. APM installs all skills from one repo, covers 13 targets, and keeps `assets/`. A repo with `skills/<name>/SKILL.md` needs no `apm.yml`. The only loss is npm discovery. Add per-skill npm packages when a user asks for npm.

**Status**: D81 sets the install ref and the tag rule. D83 moves the deliverable to `package/` and changes the install path. D94 adds `package/apm.yml`.

---

## D71: Fallback Search Paths for the Schema Assets

**Decision**: When the harness gives no base directory, `openspec-lite-schema` searches for `openspec-lite-schema/assets/plan-lite/` under these folders, in order: `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, `~/.claude/skills/`.

This makes D65 more precise.

**Rationale**: These are the APM project skill paths and the Claude Code user path (`docs/facts.md`). Claude Code, Codex, Copilot, and Gemini CLI give the base directory. Cursor is unverified, and APM installs Cursor skills in `.agents/skills/`.

**Status**: D82 adds the user-scope paths.

---

## D72: A Schema Script Computes the Plan Hash

**Decision**: The schema assets include `plan-hash.mjs`. It lands at `openspec/schemas/plan-lite/plan-hash.mjs` in the user repo. Both `openspec-lite-tasks-preview` and `apply.instruction` run `node openspec/schemas/plan-lite/plan-hash.mjs <change>/plan.md` from the repo root.

The hash covers only `## Goal`, `## Non-Goals`, and `## Constraints`. It ignores line endings, whitespace, and section order.

This revises D51 and D65.

**Rationale**: Stock `/opsx:apply` reads only `apply.instruction`, so the hash command had to exist in two places. A script in the schema gives one copy, versioned and committed with the schema. The schema is always at this path, so no search is needed. OpenSpec accepts extra files in the schema folder (`docs/facts.md`). Open Questions left the hash because D60 empties that section. With it in the hash, each resumed apply shows a false stale warning. Each answer goes to `## Decisions`, and an answer that changes the approach is a recorded deviation.

**Status**: D91 makes the script fail when a heading is missing.

---

## D73: The Done Checklist Is in apply.instruction

**Decision**: The done checklist (D60) is in `apply.instruction`, so stock `/opsx:apply` uses it too. `openspec-lite-apply` adds one rule to the CLI output: ignore checkbox and task-count text.

This revises D60 and D64.

**Rationale**: Stock apply is the default path (D27). The checklist is not a fix for a stock bug, so it belongs with the shared rules. If stock apply then works well, the D27 review trigger removes `openspec-lite-apply`.

---

## D74: Archive Drafts Full Deltas Before Approval

**Decision**: For each promotion candidate, archive drafts the full text first. Then the user approves, rejects, or edits it.

- A requirement becomes a delta under one of the four headers: ADDED, MODIFIED, REMOVED, or RENAMED. Each ADDED or MODIFIED requirement has at least one `#### Scenario:`, derived from `plan.md` and the code.
- A decision becomes the full ADR text.

This revises D58 and D18.

**Rationale**: `openspec validate` rejects a requirement with no scenario (`docs/facts.md`), and `plan.md` rarely has scenarios. The user must approve the scenarios, so the list shows the full text. The CLI merges all four headers, and a Level 2 change that removes a feature is common.

---

## D75: A Common Guard on the Change Schema

**Decision**: `openspec-lite-tasks-preview`, `openspec-lite-apply`, `openspec-lite-upgrade`, and `openspec-lite-archive` refuse a change whose schema is not `plan-lite`. Each one points to the matching stock skill, for example `/opsx:archive`.

This supersedes D63.

**Rationale**: A preview or an upgrade on a spec-driven change would damage it. One common rule replaces four separate rules.

---

## D76: The Tasks Preview Template

**Decision**: The template inline in `openspec-lite-tasks-preview` is:

```markdown
<!-- Generated. Edit plan.md, not this file. -->
<!-- plan-sha256: <hash> -->

## 1. <group title>

- 1.1 <task: a verifiable outcome>
  - Verify: <criteria>
  - Files: <paths, optional>

## 2. <next group, depends on 1>
```

This makes D53 precise.

**Rationale**: It follows the group and number layout of `tasks.md`, with no checkboxes (D52). Upgrade only adds `[ ]` to each task line.

---

## D77: Archive Asks Before It Archives Unfinished Work

**Decision**: If an answer in the done checklist is "no", archive shows the warnings and asks: "Archive anyway?" On no, it stops.

This revises D60.

**Rationale**: It prevents an archive of an unfinished change by mistake. The cost is one question.

---

## D78: Propose Gets the plan.md Template From the CLI

**Decision**: `openspec-lite-propose` gets the template from `openspec instructions plan --change <name> --json` → `template`.

**Rationale**: The CLI owns how the template path resolves (`docs/facts.md`). The skill keeps working if that resolution changes.

---

## D79: Upgrade Validates at the End

**Decision**: `openspec-lite-upgrade` runs `openspec validate <name>` as its last step. It reports each error and does not fix errors silently.

This extends D62.

**Rationale**: It costs one call. The user sees missing scenarios before the archive.

---

## D80: Change Names

**Decision**: Use the name from the prompt, if it has one. Otherwise, propose derives a kebab-case name of 2 to 5 words from the goal and shows it in the summary.

This extends D61.

**Rationale**: This matches the stock propose skill. The user can rename the folder.

---

## D81: Install With a Semver Range; a Schema Version Change Is a Major Tag

**Decision**:

- README tells users to install with a range: `apm install <owner>/openspec-lite#^1.0.0`.
- A change to the schema `version` is a new major tag.
- When the repo schema is newer than the shipped schema, the skill says: "Run `apm update`." To cross a major tag, the user edits the ref in `apm.yml` and runs `apm install`.
- The compatibility table (D67) lists major tags.

This revises D56, D67, and D70.

**Rationale**: `apm update` moves inside the range with one command (`docs/facts.md`). Major tags carry the breaking signal, so one schema version maps to one major tag.

**Status**: D93: `apm update` cannot cross a major tag, so the "newer schema" message tells the user to edit the ref instead.

**Status**: D83 changes the install path to `<owner>/openspec-lite/package#^1.0.0`.

---

## D82: User-Scope Paths in the Asset Search

**Decision**: The fallback list (D71) ends with `~/.agents/skills/` and `~/.config/opencode/skills/`.

This extends D71.

**Rationale**: `apm install -g` puts skills there for Copilot, Cursor, Windsurf, and OpenCode (`docs/facts.md`). `~/.claude/skills/` is already in the list.

---

## D83: The Deliverable Lives in package/

**Decision**: The skills live in `package/skills/<name>/`. Users install with `apm install <owner>/openspec-lite/package#^1.0.0`. `scripts/`, `tests/`, and `docs/` stay at the repo root, outside `package/`.

Before each release tag, install from the tag in a temp repo. Check that `apm_modules/` holds only `package/` content.

This revises D70 and D81.

**Rationale**: A full-repo install clones the whole repo into `apm_modules/`, and APM has no exclude mechanism (`docs/facts.md`). A subdirectory install uses a sparse partial clone, so APM downloads only the files under `package/`. Users then never download tests, scripts, or design docs. The name `package/` is used because `dist/` suggests generated output. The real-install check exists because this fact comes from code reading, not from a run.

**Status**: A test with APM 0.33.0 confirms the subdirectory install (`docs/facts.md`). One correction: git cone mode also downloads the files at the repo root, for example `README.md`, into the APM cache. Root folders such as `tests/` are not downloaded. Also, a local folder with only `skills/` needs an `apm.yml` (see D94).

---

## D84: Script Tests Use the Node Built-In Runner

**Decision**: Tests live in `tests/` at the repo root and run with `node --test tests/`. They have no dependencies and no `package.json`.

- `tests/plan-hash.test.mjs`: CRLF, section order, Open Questions, and Decisions do not change the hash. A changed Constraint does.
- `tests/check-version.test.mjs`: a match passes, and a mismatch fails.
- `tests/schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It skips itself if `openspec` is not installed.

**Rationale**: OpenSpec already requires Node `>=20.19.0`, which has a stable `node --test`. A framework would bring back the `package.json` that D70 removed. The schema test catches errors such as the wrong `template` path, which only a real CLI run shows (`docs/facts.md`).

**Status**: D91 adds a missing-heading test. D93 adds missing-marker and CRLF tests for `check-version.mjs`.

---

## D85: CI Runs the Tests on Push

**Decision**: `.github/workflows/test.yml` runs on push and pull request. It installs `@fission-ai/openspec` at the lowest version in `openspec-version`. Then it runs `node scripts/check-version.mjs` and `node --test tests/`.

This revises D66, which deferred CI.

**Rationale**: One small workflow catches a broken `plan-hash.mjs` or schema before a user installs it. The lowest supported OpenSpec version tests the bottom of the declared range.

**Status**: D88 adds `latest` to CI and closes the range.

---

## D86: The Schema Skill Adds Archive Guidance for Stock Archive

**Decision**: `openspec-lite-schema` adds this to `openspec/config.yaml` in the user's repo, only if `operations.archive.guidance` is empty:

```yaml
operations:
  archive:
    guidance: "If the change schema is plan-lite, stop. Run openspec-lite-archive instead."
```

If the field already has text, the skill shows the line and asks the user to add it by hand. The skill reports the line that it added.

**Rationale**: Stock `/opsx:archive` on a plan-lite change skips promotion, so the `plan.md` decisions never become ADRs. The stock archive skill runs `openspec instructions archive`, which returns this guidance (`docs/facts.md`). It is the only way to reach the stock skill. The skill never overwrites existing guidance, so it does not damage the user's config.

**Status**: Revised by D95. `guidance` must be a list, and the stock skill treats it as advice.

---

## D87: The Version Marker Line

**Decision**: Each workflow SKILL.md has this exact line in its schema-check step: `Shipped schema version: <n>`. `scripts/check-version.mjs` matches `^Shipped schema version: (\d+)$` in each workflow skill and compares the number with `version` in `schema.yaml`.

This makes D66 precise.

**Rationale**: The agent reads the same line that the script checks, so the marker and the rule are in one place. Frontmatter rules differ between harnesses, and the Agent Skills spec does not define such a field.

---

## D88: CI Tests the Lowest and the Latest OpenSpec; the Range Is Closed

**Decision**: CI runs a matrix of two OpenSpec versions: the lowest version in `openspec-version`, and `latest`. The range is `>=1.9.0 <2.0.0`. When a new major version passes CI, widen the range.

This revises D40 and D85.

**Rationale**: `latest` finds a breaking OpenSpec release early. The upper limit stops a user on an untested major version from getting silent breakage.

---

## D89: MIT License Inside package/

**Decision**: openspec-lite uses the MIT license. The one `LICENSE` file is `package/LICENSE`. The root README links to it.

**Rationale**: A subdirectory install downloads only `package/` (D83), so the license must be there to reach users. One file cannot drift. OpenSpec is MIT too. GitHub detects a license only at the root. Add a root copy if the badge becomes important.

---

## D90: Schema Re-Copy Uses a Backup Folder, Not git

**Decision**: When `openspec-lite-schema` replaces an older repo schema:

1. It tells the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/plan-lite-v<old>/`." If the user declines, it stops.
2. It moves the old folder to the backup path, then copies the shipped folder.
3. It reports the copied files and the backup path. It tells the user to compare and delete the backup.

On the first install, it only copies. No skill uses `git diff` or `git status` to report changes. Each skill reports the files it wrote.

This revises D56 and D86.

**Rationale**: `openspec/` may be untracked, and git may not be present. A delete-then-copy without git would lose local edits for good. The backup must be outside `openspec/schemas/`, because OpenSpec treats every folder there as a schema (`docs/facts.md`). The repo copy then always equals the shipped copy, with no stale files.

**Status**: D96 adds a timestamp to the backup name. D98 moves the backup and copy into `install.mjs`.

---

## D91: plan-hash.mjs Fails on a Missing Heading

**Decision**: `plan-hash.mjs` exits with code 1 if `## Goal`, `## Non-Goals`, or `## Constraints` is missing. The message names each missing heading. An empty section is fine.

This extends D72.

**Rationale**: A misspelled heading, for example `## Non-goals`, drops out of the hash. An edit there would then never mark the preview as stale. The template creates all three headings, so a correct plan never fails.

---

## D92: "Rejected" Is Optional in a Decision Entry

**Decision**: A decision entry is `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative.

This revises D10.

**Rationale**: Apply records each answer to an open question as a decision (D73). Many answers have no rejected alternative. One form with an optional part stays simple for the agent and for archive.

---

## D93: Failure Cases and Order Fixes From the Fourth Review

**Decision**:

- Release tags are `vMAJOR.MINOR.PATCH`.
- When the repo schema is newer, the message says: "Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`." This replaces "Run `apm update`" from D81.
- propose asks the Level 1 question before the schema check.
- After `openspec-lite-schema` runs, the calling skill reads the version again. If it still differs, it stops and reports both versions.
- Run directly, `openspec-lite-schema` stops on a higher repo version. On an equal version, it says "already current", unless the user asks for a re-copy.
- If `openspec --version` fails, the skill stops and tells the user to install OpenSpec.
- If `plan-hash.mjs` exits with code 1, the skill or `apply.instruction` shows the message and stops.
- `check-version.mjs` normalizes CRLF and fails when a skill has no marker line.
- Archive sets `skip_specs: true` when it writes no delta.
- Archive picks `<capability>` from `openspec/specs/` first, and names a new one only when none matches.
- ADRs use the archive date and Status `Accepted`.
- `apply.instruction` is exact text that ships in the user's repo. It lists the upgrade signals inline, with no reference to `design.md`.

**Rationale**: A fresh-context review found each case. Each one has a single clear fix:

- `apm update` does not cross the constraint (`docs/facts.md`), and a schema change is always a major tag (D81).
- `validate` fails on a plan-lite change with no deltas and no `skip_specs`. A change created without propose has no flag.
- The other items define a failure path or an input that was undefined.

---

## D94: package/apm.yml Holds the Name and Version

**Decision**: `package/apm.yml` has two fields: `name: openspec-lite` and `version: <semver>`. On a tag push, CI fails if the tag is not `v` + `version`.

This revises D70, which said the repo has no `apm.yml`.

**Rationale**: APM 0.33.0 rejects a folder with only `skills/<name>/SKILL.md` and no `apm.yml` (`docs/facts.md`). With the two fields, the install works. The CI check stops the version from drifting from the tag.

---

## D95: Archive Guidance Is a List Item and a Best-Effort Guard

**Decision**: `openspec-lite-schema` appends one item to `operations.archive.guidance` in `openspec/config.yaml`, if the list does not have it yet:

"For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."

README warns users not to run stock `/opsx:archive` on a plan-lite change.

This revises D86.

**Rationale**: `guidance` must be a list of strings. OpenSpec ignores a string and prints a warning on every command (`docs/facts.md`). The stock archive skill follows only guidance that is compatible with its own steps. A "stop" can conflict with them, but advice to run a step first does not. The guard is still best effort, so README covers users who bypass it. `context` was rejected, because it holds the user's project description and goes to every operation.

---

## D96: Backup Folders Have a Timestamp

**Decision**: The backup path is `openspec/schemas-backup/plan-lite-v<old>-<YYYYMMDD-HHMMSS>/`.

This revises D90.

**Rationale**: A fixed name fails when an old backup is still there. With a timestamp, the move never fails, and each backup stays until the user deletes it.

---

## D97: Upgrade Switches the Schema Last

**Decision**: `openspec-lite-upgrade` writes all artifacts while the change is still plan-lite. It gets each template with `openspec instructions <artifact> --change <name> --schema spec-driven --json`. Then it switches `schema` to `spec-driven` and removes `skip_specs`. Then it deletes the moved `plan.md` sections and validates.

This revises D62.

**Rationale**: If the schema switches first and a later step fails, the guard (D75) refuses the half-upgraded change, and nothing can resume it. With the switch last, a failure leaves a plan-lite change, so a new upgrade run resumes it. The `--schema` override gives spec-driven templates for a plan-lite change (`docs/facts.md`).

---

## D98: install.mjs Does the Backup and the Copy

**Decision**: `openspec-lite-schema` ships `scripts/install.mjs`, outside `assets/plan-lite/`, so it is not copied into the user repo. The agent runs `node "<skillDir>/scripts/install.mjs" .` from the repo root. The script:

- compares the repo and shipped versions,
- exits with code 2 if the repo version is higher,
- reports "already current" on an equal version,
- moves an old repo copy to the timestamped backup (D96),
- copies `assets/plan-lite/` to `openspec/schemas/plan-lite/`,
- prints the copied files and the backup path.

The agent still edits `openspec/config.yaml` (D95), because a script would need a YAML library. `tests/install.test.mjs` covers the script.

This revises D65 and D90.

**Rationale**: `node -e '...'` with inner double quotes breaks in cmd.exe and in Windows PowerShell 5.1. A script file needs no shell quoting and can be tested, as with `plan-hash.mjs` (D72).
