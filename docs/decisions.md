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

**Status**: D55 states that the two filters combine with OR. Revised by D119, which adds a third filter, Contract, for requirements.

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

**Status**: D78: propose gets this template from the CLI. D92 makes "Rejected Z because W" optional. D124 adds a guidance comment under each heading. D125 adds `## Background`. D134 adds IDs to constraints, open questions, and decisions. D135 adds `## Facts`. D137 writes the decision heading as `### Decision D<n>:`. D140 adds the ID comment before `## Goal`. D142 adds the rule that the IDs stay in `plan.md` and `tasks-preview.md`. D144 changes the ID rule, and adds the fact rule to the `## Decisions` comment. D136: the section is no longer append-only. It holds only the current decisions.

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

**Status**: D74: archive drafts the full text of each item before approval. Revised by D120: the user can also pick a skipped item to draft.

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

**Status**: Revised by D171.

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

**Status**: Revised by D43 and D44. In this repo, the schema source is `skills/openspec-lite-schema/assets/plan-lite/`. The target path in a user project is still `openspec/schemas/plan-lite/`. D83 moves the source to `package/skills/openspec-lite-schema/assets/plan-lite/`. D98 replaces the copy command with `install.mjs`.

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

**Status**: D56 adds the mismatch rules. D57 adds the fallback when a skill cannot invoke a skill. Change selection (D61) and the change schema guard (D75) come before the schema check, so a refused change never triggers a schema install. D93 moves the propose Level 1 question before the schema check.

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

**Status**: D99 moves the removal to the first upgrade step. D108 puts the flag back when the plan has no requirement.

---

## D47: Archive Promotes Requirements Through the CLI Merge

**Decision**: For each approved requirement, `openspec-lite-archive` writes a delta file at `<change>/specs/<capability>/spec.md` in the standard format (ADDED / MODIFIED). It removes `skip_specs` from `.openspec.yaml`, then runs `openspec archive`. The CLI validates the deltas and merges them into the main specs.

Approved decisions go directly to `openspec/adr/NNNN-<slug>.md` (D9).

This makes D8 more precise.

**Rationale**: `openspec archive` merges any delta files under `<change>/specs/`, whatever the schema (`dist/core/archive.js:1127`). But it blocks when `skip_specs` is set and `specs/` has files (`archive.js:969`). Reusing the CLI merge avoids a second, untested merge that could corrupt the main specs. The CLI has no ADR concept, so ADRs are written directly.

**Status**: D58 changes the order: validate and archive first, ADRs last. D59 changes the ADR name to `YYYY-MM-DD-<slug>.md`. D93 sets `skip_specs: true` when archive writes no delta. D105 writes ADRs after validate and before archive.

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

**Status**: Revised by D119. The OR rule now covers three filters.

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

**Status**: Revised by D74 (scenarios, all four delta headers, draft before approval). D93 sets `skip_specs: true` when no delta is written. D105 changes the order: validate, ADRs, archive.

---

## D59: ADR Files Use a Date Prefix and a Fixed Template

**Decision**: An ADR file is `openspec/adr/YYYY-MM-DD-<slug>.md`. Its sections are Title, Status, Context, Decision, and Consequences.

This revises the `NNNN-<slug>.md` name in D8 and D9.

**Rationale**: Two branches that each add an ADR cannot get the same name. The CLI does not read ADRs, so the name has no other constraint.

---

## D60: Apply Ends With a Done Checklist

**Decision**: The end-of-apply summary checks: Is the Goal met? Is each Constraint met? Is `## Open Questions` empty? `openspec-lite-archive` asks the same questions before it promotes, and warns on each "no".

**Rationale**: The CLI never reports a plan-lite change as done, and archive does not check (`docs/facts.md`). Open questions that are still open are the real "not done" marker.

**Status**: D73 moves the checklist into `apply.instruction`. D77 adds "Archive anyway?" to archive. D126 says that an HTML comment in `## Open Questions` does not count. D148 asks if each outcome of the Goal is met.

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

**Status**: D79 adds `openspec validate` at the end. D97 switches the schema last. Revised by D120: upgrade lists the destination of each section and asks before step 4. Upgrade asks the user to answer an open question that changes the specs, the approach, or the tasks. If the user cannot answer, it stays in `plan.md`.

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

**Status**: Revised by D202: on yes, the agent makes the fix directly, with no file under `openspec/`.

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

**Status**: D91 makes the script fail when a heading is missing. D124 and D126 make it ignore HTML comments. D125 adds the optional `## Background` to the hash.

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

**Status**: D106 lets upgrade resume a spec-driven change that still has `plan.md`. D107 asks the user first. D154 lets archive offer to copy the `design.md` decisions to ADRs after the guard.

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

**Status**: D155: archive asks only this question, with no other options, and on no it tells the user how to keep an item that is not in `plan.md`.

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

**Status**: D148: the name comes from the main outcome, the first outcome of the request. D168: the name has 2 to 10 words, as a soft limit.

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

**Status**: D109 lets any tag bump the schema version. Only a breaking schema change needs a new major tag.

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

**Status**: A test with APM 0.33.0 confirms the subdirectory install (`docs/facts.md`). One correction: git cone mode also downloads the files at the repo root, for example `README.md`, into the APM cache. Root folders such as `tests/` are not downloaded. Also, a local folder with only `skills/` needs an `apm.yml` (see D94). A remote subdirectory install with a semver range is also confirmed on `microsoft/apm/packages/apm-guide#^0.33.0`: only the subdirectory and the root files were downloaded.

---

## D84: Script Tests Use the Node Built-In Runner

**Decision**: Tests live in `tests/` at the repo root and run with `node --test tests/`. They have no dependencies and no `package.json`.

- `tests/plan-hash.test.mjs`: CRLF, section order, Open Questions, and Decisions do not change the hash. A changed Constraint does.
- `tests/check-version.test.mjs`: a match passes, and a mismatch fails.
- `tests/schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It skips itself if `openspec` is not installed.

**Rationale**: OpenSpec already requires Node `>=20.19.0`, which has a stable `node --test`. A framework would bring back the `package.json` that D70 removed. The schema test catches errors such as the wrong `template` path, which only a real CLI run shows (`docs/facts.md`).

**Status**: D91 adds a missing-heading test. D93 adds missing-marker and CRLF tests for `check-version.mjs`. D96 and D98 add `install.test.mjs`. D99 changes the command to `node --test`.

---

## D85: CI Runs the Tests on Push

**Decision**: `.github/workflows/test.yml` runs on push and pull request. It installs `@fission-ai/openspec` at the lowest version in `openspec-version`. Then it runs `node scripts/check-version.mjs` and `node --test tests/`.

This revises D66, which deferred CI.

**Rationale**: One small workflow catches a broken `plan-hash.mjs` or schema before a user installs it. The lowest supported OpenSpec version tests the bottom of the declared range.

**Status**: D88 adds `latest` to CI and closes the range. D94 adds the tag check. D99 sets Node 20.19 and reads the lower bound from `schema.yaml`.

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

**Status**: Revised by D95. `guidance` must be a list, and the stock skill treats it as advice. D90 removes the reporting through git.

---

## D87: The Version Marker Line

**Decision**: Each workflow SKILL.md has this exact line in its schema-check step: `Shipped schema version: <n>`. `scripts/check-version.mjs` matches `^Shipped schema version: (\d+)$` in each workflow skill and compares the number with `version` in `schema.yaml`.

This makes D66 precise.

**Rationale**: The agent reads the same line that the script checks, so the marker and the rule are in one place. Frontmatter rules differ between harnesses, and the Agent Skills spec does not define such a field.

**Status**: D106 allows an indented marker, checks every marker in a file, and compares numbers.

---

## D88: CI Tests the Lowest and the Latest OpenSpec; the Range Is Closed

**Decision**: CI runs a matrix of two OpenSpec versions: the lowest version in `openspec-version`, and `latest`. The range is `>=1.9.0 <2.0.0`. When a new major version passes CI, widen the range.

This revises D40 and D85.

**Rationale**: `latest` finds a breaking OpenSpec release early. The upper limit stops a user on an untested major version from getting silent breakage.

---

## D89: MIT License Inside package/

**Decision**: openspec-lite uses the MIT license. The one `LICENSE` file is `package/LICENSE`. The root README links to it.

**Rationale**: A subdirectory install downloads only `package/` (D83), so the license must be there to reach users. One file cannot drift. OpenSpec is MIT too. GitHub detects a license only at the root. Add a root copy if the badge becomes important.

**Status**: D100 sets the copyright holder.

---

## D90: Schema Re-Copy Uses a Backup Folder, Not git

**Decision**: When `openspec-lite-schema` replaces an older repo schema:

1. It tells the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/plan-lite-v<old>/`." If the user declines, it stops.
2. It moves the old folder to the backup path, then copies the shipped folder.
3. It reports the copied files and the backup path. It tells the user to compare and delete the backup.

On the first install, it only copies. No skill uses `git diff` or `git status` to report changes. Each skill reports the files it wrote.

This revises D56 and D86.

**Rationale**: `openspec/` may be untracked, and git may not be present. A delete-then-copy without git would lose local edits for good. The backup must be outside `openspec/schemas/`, because OpenSpec treats every folder there as a schema (`docs/facts.md`). The repo copy then always equals the shipped copy, with no stale files.

**Status**: D96 adds a timestamp to the backup name. D98 moves the backup and copy into `install.mjs`. D102 adds a suffix on a name collision.

---

## D91: plan-hash.mjs Fails on a Missing Heading

**Decision**: `plan-hash.mjs` exits with code 1 if `## Goal`, `## Non-Goals`, or `## Constraints` is missing. The message names each missing heading. An empty section is fine.

This extends D72.

**Rationale**: A misspelled heading, for example `## Non-goals`, drops out of the hash. An edit there would then never mark the preview as stale. The template creates all three headings, so a correct plan never fails.

---

## D92: "Rejected" Is Optional in a Decision Entry

**Decision**: A decision entry is `### Decision: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative.

This revises D10.

**Status**: D134 adds an ID to the heading: `### Decision D<n>: <title>`.

**Rationale**: Apply records each answer to an open question as a decision (D73). Many answers have no rejected alternative. One form with an optional part stays simple for the agent and for archive.

---

## D93: Failure Cases and Order Fixes From the Fourth Review

**Decision**:

- Release tags are `vMAJOR.MINOR.PATCH`.
- When the repo schema is newer, the message says: "Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`." This replaces "Run `apm update`" from D81.
- propose asks the Level 1 question before the schema check.
- After `openspec-lite-schema` runs, the calling skill reads the version again. If it still differs, it stops and reports both versions.
- Run directly, `openspec-lite-schema` stops on a higher repo version. On an equal version, it says "already current", unless the user asks for a re-copy. (D101 drops the re-copy.)
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

**Status**: D109 revises the "newer schema" message and lets any tag bump the schema. D110 revises the archive `skip_specs` rule: it decides from the files on disk. D111 adds `apm update -g` to the message. Revised by D175: a script compares the OpenSpec version.

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

**Status**: D102: two backups in the same second collide, so a suffix is added.

---

## D97: Upgrade Switches the Schema Last

**Decision**: `openspec-lite-upgrade` writes all artifacts while the change is still plan-lite. It gets each template with `openspec instructions <artifact> --change <name> --schema spec-driven --json`. Then it switches `schema` to `spec-driven` and removes `skip_specs`. Then it deletes the moved `plan.md` sections and validates.

This revises D62.

**Rationale**: If the schema switches first and a later step fails, the guard (D75) refuses the half-upgraded change, and nothing can resume it. With the switch last, a failure leaves a plan-lite change, so a new upgrade run resumes it. The `--schema` override gives spec-driven templates for a plan-lite change (`docs/facts.md`).

**Status**: D99 moves the `skip_specs` removal to the first step, before the artifacts. D108 adds the three-case guard and puts `skip_specs` back when the plan has no requirement. Revised by D120: upgrade lists the destination of each `plan.md` section and asks before it deletes the moved sections.

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

**Status**: D101 defines the full contract and drops the re-copy on an equal version. D102 adds the collision suffix. D106 adds exit code 1 and allows a quoted version.

---

## D99: Fixes From the Fifth Review

**Decision**:

- Upgrade removes `skip_specs` first, then writes the artifacts, then switches the schema. This revises D97.
- Upgrade writes specs with the archive delta rules, and follows the `instruction` field of each `openspec instructions` result. Non-Goals go to `design.md` → `## Goals / Non-Goals`.
- Tests run with `node --test` from the repo root. This revises D84.
- CI uses Node 20.19. It reads the lower bound of `openspec-version` from `schema.yaml`. `schema.test.mjs` fails instead of skipping when `CI` is set.
- `check-version.mjs` takes an optional root folder, checks the five workflow skills by name, and prints one line per skill.
- `openspec-lite-schema` finds `<skillDir>` first, then reads the shipped version from its assets. The search ends with `apm_modules/`. It creates a missing `config.yaml`, and does not edit a plain-string `guidance`.
- Change selection uses `openspec list --json` and reads each schema from `.openspec.yaml`.
- propose reports a failed `openspec new change`. tasks-preview stops when `plan.md` is missing.
- `plan-hash.mjs` strips a UTF-8 BOM and reports a file it cannot read.
- `apply.instruction` names `openspec-lite-upgrade` and `openspec-lite-archive`, and tells the agent to ignore built-in text that suggests `/opsx:archive`.
- "Done check" is the glossary term.
- `docs/test-scenarios.md` has ten scenarios, listed in `design.md` §2.

**Rationale**: A fresh-context review found each case, and I verified the main ones by test:

- With `skip_specs` set, the CLI marks specs as skipped and refuses to validate or archive a change with spec files (`docs/facts.md`).
- `node --test tests/` fails on Node 24.
- The stock apply template suggests `/opsx:archive` when the work is done.
- The other items each define an input, an output, or a failure path that was undefined.

---

## D100: Repo Owner and Copyright Holder

**Decision**: The repo is `github.com/duongphuhiep/openspec-lite`. `package/LICENSE` has the line "Copyright (c) 2026 DUONG Phu-Hiep".

**Rationale**: The install command, the compatibility URL inside each shipped skill, and the LICENSE all need these values. The URL ships inside the skills, so it must be fixed before the first release. Move to an org later if others join.

---

## D101: No Re-Copy on an Equal Version; the install.mjs Contract

**Decision**: On an equal version, `openspec-lite-schema` says "already current" and stops. To repair a damaged schema, the user deletes `openspec/schemas/plan-lite/` and runs the skill again. `install.mjs` has no `--force` flag.

The `install.mjs` contract is in `design.md` §3: usage, version parsing, the action for each version case, the exit codes (0, 2, 3), and the output lines (`status:`, `backup:`, `copied:`).

This revises D93 and D98.

**Rationale**: A repair is rare, and a delete is clear. One less flag means one less test. The contract was undefined, so the script and its test could not be written.

---

## D102: A Suffix on a Backup Name Collision

**Decision**: If `openspec/schemas-backup/plan-lite-v<old>-<YYYYMMDD-HHMMSS>/` exists, `install.mjs` adds `-2`, `-3`, and so on.

This revises D96.

**Rationale**: The timestamp has 1-second resolution, and `fs.renameSync` onto a non-empty folder fails with `ENOTEMPTY`. A test runs two backups inside one second. The suffix keeps the names readable.

---

## D103: README Install Command Has a Target and Requirements

**Decision**: README shows `apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude` and tells the user to replace `claude` with their harness. It lists the requirements: the OpenSpec CLI in the `openspec-version` range, and `openspec init`.

This revises D81 and D83.

**Status**: Revised by D118. README installs OpenSpec with `@1`, lists the APM CLI, and has a table of harness names.

**Rationale**: With no `--target` and no harness folder in the repo, APM 0.33.0 deploys nothing. `openspec init` installs the stock `/opsx:*` skills that README tells users to run.

---

## D104: When the Skills Trigger

**Decision**: `openspec-lite-propose` triggers on its name, on "plan-lite", and on "lightweight plan" or "medium change". The other five skills trigger only on their name or on "plan-lite".

**Rationale**: propose is the entry point, so it must be easy to find. The other skills act on a plan-lite change, and the guard (D75) refuses other changes. The stock OpenSpec skills compete for general wording. For archive, the README warning and D95 handle that competition.

---

## D105: Archive Writes ADRs After Validate and Before Archive

**Decision**: The archive order is: validate, write the ADRs to `openspec/adr/`, then run `openspec archive --yes`. If archive fails after the ADRs exist, the skill reports it and keeps the ADRs.

This revises D58.

**Rationale**: With ADRs last, a session that ends after `openspec archive` loses the approved ADRs, because they exist only in the conversation. Validation is the step that usually fails, so it still runs first. An orphan ADR is possible only if archive fails after `validate` passed, and the ADR is still a correct decision.

---

## D106: Fixes From the Implementation Review

**Decision**:

- The `Shipped schema version: <n>` marker is indented, so that it stays inside its Markdown list. `check-version.mjs` accepts an indented marker, checks every marker in a file, and compares numbers. If `schema.yaml` has no readable version, it prints one `FAIL schema.yaml` line.
- `install.mjs` and `check-version.mjs` read `version` with optional quotes and an optional trailing comment.
- `install.mjs` exits with code 1 on a file system error. It prints `install: <message>` with no stack trace. If the old schema already moved, it names the backup folder.
- `openspec-lite-schema` adds the archive guidance when `config.yaml` has no `operations.archive.guidance` key. A repo copy with no readable version counts as lower in the skill too, so the user confirms the replace.
- Upgrade resumes a `spec-driven` change that still has `plan.md`, at the step after the schema switch. This is the one exception to the guard (D75).
- `apply.instruction` in `design.md` §4 is now a copy of the shipped text. The shipped text adds the decision entry format and the skill name for a preview regeneration.
- Change selection in each skill reads `schema` from each `.openspec.yaml`.
- CI uses `actions/checkout@v5` and `actions/setup-node@v5`, and strips CR before it parses `schema.yaml` and `apm.yml`.
- `schema.test.mjs` runs `openspec` with no shell, and its `plan-hash.mjs` test never skips.

**Rationale**: A fresh-context review of the implementation found each case, and I reproduced the main ones:

- An unindented marker ends the nested list. markdown-it rendered the next two bullets as a code block.
- A fresh `openspec init` writes `operations` only in a comment, so the skill had no rule for the usual case.
- A file as repo root crashed `install.mjs` with a stack trace.
- `version: "3"` was read as no version, so a newer repo copy was replaced instead of refused.

---

## D107: Fixes From the Commit-Range Review

**Decision**:

- `openspec-lite-schema` adds only the missing part of `operations.archive.guidance` under an existing key. It never adds a second `operations:` key.
- On an equal schema version, `openspec-lite-schema` skips the install but still does the archive guidance step.
- On the upgrade resume path, the skill asks the user before step 4. A finished upgrade can also keep `plan.md`.
- On a resumed upgrade, a leftover `tasks-preview.md` next to an existing `tasks.md` is deleted. A kept artifact that looks incomplete is reported.
- `plan-hash.mjs` treats a `## ` line inside a ``` or ~~~ fence as content. `design.md` describes its behavior and no longer holds a copy of the code.
- CI runs a Node matrix of 20.19 and 24. It runs on a push to `main`, on a `v*` tag push, and on each pull request.
- Scenario 10 and the real-install check run right after the tag push. The README compatibility row is `v1`.
- Each test file deletes its temp folders after the run. A new test covers a copy failure after the move.

**Rationale**: A fresh-context `review-commit-range` review found each case. Two were verified by test:

- A second `operations:` key makes OpenSpec 1.9.0 ignore the whole `config.yaml`: "Map keys must be unique".
- A fenced `## Constraints` passed the heading check.

Node 20 reached end of life on 2026-04-30, and development uses Node 24.

**Status**: Revised by D191: the resume question says what is left to do.

---

## D108: Fixes From Review Round 1

**Status**: Revised by D208: upgrade keeps the `skip_specs` line until the first spec write, so with no requirement it never removes it.

**Decision**:

- The upgrade guard has three explicit cases: `plan-lite` continues; `spec-driven` with `plan.md` asks to resume; any other case stops, including `spec-driven` with no `plan.md`.
- When `plan.md` has no requirement, upgrade asks the user for one. If the user has none, upgrade puts `skip_specs: true` back and says so.
- `plan-hash.mjs` closes a fence only as CommonMark does: the same character, at least the same length, and no info string.
- `schema.test.mjs` covers the upgrade CLI path, an archive that merges a delta, and a `validate` failure with no delta and no `skip_specs`.

This revises D46, D97, and D99 for upgrade.

**Status**: D153: the upgrade summary reports the `skip_specs` state at the end, not what the run did.

**Rationale**: A fresh `review-commit-range` round found each case:

- `validate` fails on a spec-driven change with no delta and no `skip_specs` ("Change must have at least one delta"). Some upgrade signals, for example a handoff, give no requirement.
- "Any other schema" could be read to let a finished upgrade continue.
- A nested fence or a fence with an info string closed the block early. A `## Constraints` line inside the block then counted as a heading. Verified by test.
- CI runs `latest` OpenSpec, so the upgrade and merge paths need automated tests, not only a manual scenario.

---

## D109: Each Schema Asset Change Bumps the Schema Version, in Any Tag

**Decision**:

- Each change to a file under `assets/plan-lite/` bumps the schema `version` by 1. This includes `plan-hash.mjs`, `apply.instruction`, and `templates/plan.md`.
- Any tag can ship the bump: major, minor, or patch. Only a breaking schema change needs a new major tag.
- The "newer schema" message says: "Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`."
- On a tag push, CI fails if a file under `assets/plan-lite/` changed since the previous tag but `version` did not.

This revises D81 and D93.

**Rationale**: The repo schema updates only when the shipped `version` is higher. Under D81, a fix in a patch tag had to keep the version, so it never reached `openspec/schemas/plan-lite/` in user repos. Stock `/opsx:apply` then kept the old `apply.instruction`, with no warning. With the bump in any tag, `apm update` delivers the new skills, and the workflow skills replace the old repo copy. A teammate with older skills sees "newer" and runs `apm update` inside the same range. A content hash was rejected, because each skill would then hold a hash instead of a number.

**Status**: D110 runs the bump check on each pull request and push to `main`, not only on a tag push. D111 compares with the tag before HEAD when a tag points at HEAD.

---

## D110: Fixes From Review Round 2

**Decision**:

- Archive decides `skip_specs` from the files under `<change>/specs/`, not from the work of this run. It shows each delta file from an earlier run, and the user keeps or deletes it.
- In the workflow-skill schema check, a repo `schema.yaml` with no readable `version` line counts as lower, as in `openspec-lite-schema` (D106).
- The schema bump check (D109) is its own CI job. It runs on each pull request, on a push to `main`, and on a tag push. It reads `version` with the same rule as `install.mjs`.
- Scenario 9 also checks a `config.yaml` that already has `operations.archive.guidance`.

This revises D93 and D109.

**Rationale**: A fresh `review-commit-range` round found each case:

- After a failed validate, a rerun with no new delta set `skip_specs: true` while the old delta stayed. `validate` then fails: "skip_specs is set in .openspec.yaml but spec files exist under specs/" (`docs/facts.md`).
- A check that runs only on a tag push finds the missing bump after the tag is public, so `apm update` already resolves the bad release.
- The CI `sed` did not accept `version: "2"`, so a correct bump could fail.
- A second `operations:` key disables the whole `config.yaml` (D107). The rule existed only in skill prose.

---

## D111: Fixes From Review Round 3

**Decision**:

- Each skill finds the OpenSpec root with `openspec list --json` → `root.path`. It runs each command from that folder. `install.mjs` gets that folder as its argument. The plan hash command runs from it. If `root` is `null`, the skill stops and tells the user to run `openspec init`.
- The search for the schema skill folder looks in the OpenSpec root, then in each parent folder.
- propose resumes a plan-lite change that exists with no `plan.md`. apply stops on `state: blocked` and points to propose.
- Each ADR has a `Change: <name>` line. On a rerun, archive skips a decision that already has an ADR for this change.
- Archive gets the delta format from `openspec instructions specs --change <name> --schema spec-driven --json`, as upgrade does.
- The "newer schema" message also names `apm update -g` and `~/.apm/apm.yml` for a user-scope install.
- The CI bump check compares with the tag before HEAD when a `v*` tag points at HEAD. The tag check reads `apm.yml` `version` with optional quotes and a comment.

This revises D58, D61, D74, D98, D105, and D110. `apply.instruction` changed, but no tag exists yet, so the schema `version` stays 1 (D109).

**Rationale**: A fresh `review-commit-range` round found each case:

- OpenSpec walks up to the nearest `openspec/` folder (`root.source: "nearest"`). In a monorepo, "the repo root" put the schema where OpenSpec does not look. Verified: from `svc/src/deep/` the root is `svc/`, and from the git root `root` is `null`.
- An interrupted propose left a change that no skill could resume. On `state: blocked`, the CLI text names the stock continue skill, which does not set `skip_specs`.
- ADRs stay after a failed archive (D105), so a rerun wrote them again.
- A plausible RENAMED delta failed `validate` ("no requirement entries parsed").
- After `git push origin main v1.1.0`, `git describe HEAD` returned the new tag, so the check compared HEAD with itself.

---

## D112: Fixes From Review Round 4

**Decision**:

- propose sets `skip_specs: true` only if the line is missing. It never adds a second one. D150: propose reads the file first.
- Archive ignores `skipped: true` and the warning of `instructions specs`, because `skip_specs` is still set at that step. It uses SHALL or MUST, as the CLI instruction says.
- An ADR has an exact form: `# <Title>`, then the plain lines `Status: Accepted` and `Change: <name>`, then `## Context`, `## Decision`, and `## Consequences`. The rerun check searches for the line `Change: <name>`.
- Archive lists the deltas from an earlier run before it writes the new ones. It merges into a kept file with the same path.
- An ADR file name that exists for another change gets `-2`, `-3`, and so on. Archive never overwrites an ADR.
- The skill-folder search checks all project folders (the OpenSpec root and its parents, with `apm_modules/`) before the user folders.
- `schema.test.mjs` covers `state: blocked`, `root.path` and `root: null`, `skipped: true`, and the duplicate-key failure.
- Scenarios 11–13 cover a subfolder root, a propose resume, and an archive rerun.

This revises D59, D74, D110, and D111.

**Rationale**: A fresh `review-commit-range` round found each case. I reproduced two with OpenSpec 1.9.0:

- Two `skip_specs` lines make each command on the change fail: "Map keys must be unique".
- With `skip_specs` set, `instructions specs` returns `skipped: true` and "Do not create spec files", next to the format instruction.

The other cases are text gaps. "Change" as a section did not match a `Change:` line search. The earlier-run check came after the write, so "delete" could remove an approved delta. A same-day slug overwrote another ADR. A user-scope copy could win over the project copy in a parent folder. The CI `latest` cell needs tests for the CLI behavior that the skills rely on.

---

## D113: Fixes From Review Round 5

**Decision**:

- When `openspec list --json` gives `root: null`, each skill searches the subfolders for an initialized `openspec/` folder, and skips `.git/`, `node_modules/`, and `apm_modules/`. It asks the user to confirm one match, or to pick one of several. Only with no match does it tell the user to run `openspec init`, in the folder that must hold `openspec/`.
- Scenario 13 has two cases: (a) a failed validate, where no ADR exists yet and the decision is drafted again; (b) a failed `openspec archive`, where the existing ADR is skipped.
- Scenarios 1–9 and 11–13 run before each release tag. Scenario 10 runs after the tag push.

This revises D111.

**Rationale**: A fresh `review-commit-range` round found each case. OpenSpec searches only up from the current folder. An agent that starts at the git root of a monorepo got `root: null`. The old stop message then sent the user to `openspec init` at the git root, which makes a second, wrong root. In scenario 13, the ADRs are written after validate (D105), so a failed validate can not leave an ADR. Creating the archive target folder first makes `openspec archive` fail after the ADRs exist (verified).

---

## D114: Fixes From the First Agent Scenario Run

**Decision**:

- `openspec-lite-schema` asks before it replaces an older repo schema, ends its turn, and waits for the answer. It does not run `install.mjs` before a yes.
- After `openspec-lite-schema` finishes, each workflow skill continues with its next step in the same turn.
- `apply.instruction` runs the stale-preview check before any code. On a stale preview, the agent stops and asks: regenerate the preview, or continue from `plan.md`.
- propose does not invent non-goals, constraints, or decisions.
- `docs/test-scenarios.md` describes how to run the scenarios headless with `claude -p`.

`apply.instruction` changed, but no tag exists yet, so the schema `version` stays 1 (D109).

**Rationale**: The first headless run of the agent scenarios (Claude Code, Sonnet 5.5, 2026-10-15) passed 11 of 13 and found these gaps:

- Scenario 9: the agent replaced schema v0 with v1 without asking. It read "tell the user … If the user declines, stop" as information, not as a question.
- A Sonnet 4.6 run stopped after the schema install and never created the change.
- Scenario 3: stock `/opsx:apply` found the stale preview, but reported it after it wrote the code.
- A Sonnet 4.6 run of scenario 1 added two non-goals that the prompt did not state.

---

## D115: Warn About Decisions in design.md After an Upgrade; More Promotion Scenarios

**Decision**:

- When `openspec-lite-archive` refuses a change whose `design.md` has `### Decision` entries, it warns: stock `/opsx:archive` does not turn them into ADRs. To keep them, copy them to `openspec/adr/` before the archive.
- The upgrade summary gives the same warning.
- Scenarios 14–19 test promotion (14–16) and the openspec-lite skills after an upgrade (17–19).
- In scenario 14, the delta form is free (ADDED or MODIFIED). The scenario passes when the main spec ends up correct.

This revises D63.

**Status**: D154: archive can offer to copy the decisions of `design.md` to ADRs after its guard, and does so on a yes.

**Rationale**: Upgrade moves the `plan.md` decisions to `design.md` (D62). Stock archive keeps `design.md` only in the archive folder, so a team that expects ADRs loses them with no word. The user asked for a warning in this case, as for stock `/opsx:archive` on a plan-lite change. A check for `### Decision` entries needs no record of the upgrade. For promotion, the user cares about the result in the main spec, not about the delta form.

---

## D116: Archive Names Each Skipped Item, and Claims /opsx:archive for plan-lite

**Decision**:

- Archive lists each `plan.md` item that it does not draft, including each non-goal, with a one-line reason.
- The `openspec-lite-archive` description tells the agent to use it instead of stock `/opsx:archive` for a change whose `.openspec.yaml` has `schema: plan-lite`, before the change is archived.

This revises D104 for archive.

**Rationale**: In scenarios 14 and 15, archive dropped a non-goal with no word. In scenario 16b, without the `config.yaml` guidance, stock `/opsx:archive` archived first and only then said that it did not promote. The agent knew the risk from the old description, but read it as a note. Skill descriptions are always in the agent context, so a direct instruction there can reach the agent before the archive, also when `config.yaml` has no guidance. The `openspec archive` CLI stays a known gap (scenario 16c).

---

## D117: A Delta for a New Capability Starts With a Purpose

**Decision**: When archive or upgrade writes a delta for a capability that does not exist in `openspec/specs/`, the delta starts with a `## Purpose` section of one or two sentences.

**Rationale**: For a new capability, the CLI creates the main spec from the delta. It uses the delta `## Purpose` if there is one. Otherwise it writes "TBD - created by archiving change <name>. Update Purpose after archive." (`docs/facts.md`). A TBD Purpose is a task that nobody does, so the spec starts incomplete.

---

## D118: README Install Steps Checked Against the v1.0.0 Release

**Decision**:

- README installs OpenSpec with `npm install -g @fission-ai/openspec@1`, so that npm stays inside `>=1.9.0 <2.0.0`.
- README lists the APM CLI as a requirement.
- README shows `openspec init` and `apm install` together, with the same harness, and says to always pass `--target`.
- README has a table of harness names. They are the same in both tools, except GitHub Copilot: `openspec init --tools github-copilot` and `apm install --target copilot`.

This revises D103.

**Rationale**: Scenario 10 ran the README steps word for word on the published `v1.0.0` tag:

- The install worked, and APM downloaded only `package/` and the root files.
- `openspec init --tools copilot` failed with exit code 1, but README suggested "copilot" for both tools.
- With no `--target`, APM auto-detected `.claude/` after `openspec init --tools claude`, and `.github/prompts/` after `--tools github-copilot`. After `--tools codex`, it found no harness marker and deployed nothing, because OpenSpec writes only `.agents/skills/` for Codex.
- A plain `npm install -g @fission-ai/openspec` installs `latest`, which a future 2.x can put outside the range. `@1` resolved to 1.14.2.

---

## D119: A Contract Goes to a Spec Even If It Is Obvious

**Decision**: At archive, a third filter selects requirements:

- **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts.

An item that passes this filter goes to a spec, even if a reader can deduce it from the code. The non-obvious and surprising filters stay as they are, for requirements and decisions. One filter is still sufficient (D55). If a `### Decision:` entry is also a contract, the contract becomes a requirement. Its rationale can also go to an ADR.

This revises D6 and D55.

The upgrade signal "a contract (spec) becomes necessary" stays. It means a contract that others must agree on before the work. The Contract filter writes a contract to a spec only at archive.

**Rationale**: A review of the promotion rules found this gap. The non-obvious filter assumes that the reader has the code. A client or another team reads the spec, not the code. With only D6, an obvious contract never gets into `openspec/specs/`. Then the main specs are incomplete, and a later spec-driven change has no requirement to copy for a MODIFIED delta. An upgraded change already writes a delta for each requirement, so this also makes the two paths more alike. The user still approves each item (D18), so the user removes the noise.

---

## D120: Upgrade Asks Before It Prunes plan.md, and Archive Lets the User Add an Item

**Decision**:

- Before upgrade deletes a `plan.md` section, it lists each section with its destination: the artifact and the heading that now hold its content, or "kept". It asks the user before the delete. On no, it keeps `plan.md` as it is, and the summary says that the moved sections in `plan.md` are old copies.
- Before upgrade writes an artifact, it asks the user to answer each open question that changes the specs, the approach, or the tasks. The answer goes to the specs, to `design.md` → `## Decisions`, or to `tasks.md`. If the user cannot answer now, the question stays in `plan.md`. An open question that is safe to answer later goes to `design.md` → `## Open Questions`.
- At archive, the user can pick an item from the list of items that are not drafted. The agent then drafts that item, and the user approves it like the other drafts.

This revises D62 and D97 for upgrade, and D18 for archive.

**Status**: D153: the upgrade summary reports the `skip_specs` state at the end, not what the run did.

**Rationale**: A review of the promotion and upgrade rules found two gaps. Archive names each item that it does not promote (D116), but upgrade deleted `plan.md` sections with no check. If the agent dropped a detail when it wrote `design.md`, the delete removed the only copy, and `validate` checks structure, not content. At archive, the user could approve, reject, or edit a draft, but the skill gave no step to promote an item that the filters skipped. The filters stay the default. The user only adds to them. In scenario 20a, the agent moved an open question that changes the specs to `design.md` → `## Open Questions`. The old example "open questions that are still open" did not stop it, because the OpenSpec `design` instruction has that section. The same instruction tells the agent to ask the user about such a question (`docs/facts.md`), so upgrade asks first.

---

## D121: Skill Wording From the v1.2.0 Scenario Run

**Decision**:

- If the OpenSpec root is not the current folder, each `openspec` command starts with `cd <root> && `. This also applies to the first command after the user confirms a root.
- When a workflow skill runs `openspec-lite-schema`, its end summary includes the schema report: the status, the copied files, and the backup path.
- The archive done check finds the code with a search for what the Goal names, for example `git grep`. It does not judge from the first lines of `git ls-files`.
- Archive writes an ADR only after `validate` passes, never in the same command as `validate`.
- Upgrade shows the list of `plan.md` destinations in the same reply as the prune question.

This extends D111, D93, D114, D105, and D120.

**Status**: D148: the archive search looks for what each outcome of the Goal names.

**Rationale**: The v1.2.0 scenario run found five gaps (`docs/facts.md`). In scenario 11, the agent ran `openspec new change` at the git root after the user confirmed `svc/`, and the command failed. In scenario 9, propose ran the schema skill but did not pass on its list of copied files. In archive runs, `git ls-files | head -30` showed only `.claude/` and `apm_modules/` files, so the agent said that the repo had no source code. In scenarios 5 and 13a, archive wrote the ADR before `validate`, once in the same command. In scenario 20a, upgrade asked the prune question with no list. A stricter root wording was tested and reverted: "start every command with `cd <absolute root path> && `". It failed 2 of 2 scenario 11 runs: the agent added the prefix to one command only, and skipped the confirm question.

---

## D122: Archive Marks a Replaced ADR as Superseded

**Decision**:

- Archive keeps each old ADR. It never deletes one.
- When archive drafts a decision, it compares it with each `Status: Accepted` ADR in `openspec/adr/`. If the new decision fully replaces an old one, the draft gets the line `Supersedes: <old file name>` after `Change:`. The user approves it with the draft.
- After archive writes the new ADR, it changes only the `Status:` line of the old ADR to `Status: Superseded by <new file name>`. It changes no other line.
- If a new decision changes only part of an old decision, archive adds no link. It tells the user that both ADRs stay `Accepted`.
- A rerun checks each ADR with `Change: <name>` and a `Supersedes:` line. If its old ADR is not marked yet, the rerun marks it.

This extends D105, D111, and D112.

**Rationale**: An exploration of business rules in changes found this gap. Archive wrote each ADR with `Status: Accepted` (D112). If a later change reversed a decision, both ADRs showed `Accepted`, and a reader could not tell which one applies. The ADR guidance (`docs/facts.md`) says to keep the old text and to supersede with a new ADR. The `Status:` line is metadata, not decision text, so archive edits only that line. The new ADR is written first, so the `Superseded by` link never names a missing file. The rerun check covers a run that stops between the two writes. A partial change gets no link, because a reader of a `Superseded` ADR skips it, and the part that still applies would be lost. Rejected: an `Amends:` link for a partial change, because no real archive needs it yet.

---

## D123: The Glossary File Is GLOSSARY.md

**Decision**: The glossary of project terms is `GLOSSARY.md` at the repo root. It was `CONTEXT.md`. Older entries that name `CONTEXT.md` mean this file.

**Rationale**: The file holds only a glossary, so the name `CONTEXT.md` did not tell its purpose. It also collides with the `## Context` section of a spec-driven `design.md`. mattpocock-skills 1.3.1 reads and writes only `GLOSSARY.md` (`docs/facts.md`). With the old name, `grill-with-docs` and `domain-modeling` would not find the glossary and would start a new file.

---

## D124: Template Guidance Comments and Comment Stripping in plan-hash.mjs

**Decision**:

- `templates/plan.md` gets a one-line `<!-- ... -->` guidance comment under each heading. The comment tells an agent or a person what content belongs in that section.
- `plan-hash.mjs` strips all `<!-- ... -->` blocks before hashing. Stripping happens after BOM and CRLF normalization, before section parsing.
- This keeps all six sections safe for comments. A user who deletes a comment in `## Goal`, `## Non-Goals`, or `## Constraints` does not change the hash.

This revises D10 (template structure) and D72 (hash behavior). It requires a schema `version` bump per D109.

**Status**: D126 moves the strip into each section body, after section parsing. D148 replaces the "One sentence" rule of the Goal comment.

**Rationale**: The decision format (`### Decision: <title>`, then "Chose X because Y.") lives only in `openspec-lite-propose` and `apply.instruction`. If an agent or a person edits `plan.md` without those skills, they do not see the format. Option (a) puts comments only in the sections that are not hashed. Then `## Constraints` has no guidance, and people often edit it by hand. Option (b) strips comments before it hashes, so each section can have a comment. D109 bumps the version for each change under `assets/plan-lite/`. So both options need a bump, and option (b) has no extra release cost.

---

## D125: Optional ## Background Section in plan.md

**Decision**:

- `templates/plan.md` adds a `## Background` section after `## Goal` and before `## Non-Goals`.
- The section is optional. `plan-hash.mjs` adds `Background` to `KEEP` but does not exit with code 1 when the heading is absent.
- `openspec-lite-upgrade` reads the scope and source links from `## Background` when writing `proposal.md`.
- `openspec-lite-propose` leaves the section empty. The user or agent fills it when needed.

This extends D10 (template structure). It requires a schema `version` bump per D109.

**Status**: D129 revises the fourth bullet: propose fills `## Background` when the prompt gives scope items or sources. D148 replaces the one-sentence Goal with one or more related outcomes.

**Rationale**: In a large change, the scope list and links to source documents had no home except `## Goal`. Goal then grew long and stopped being one outcome sentence. A dedicated section keeps Goal one sentence. The name `## Background` covers both scope items and source links. No section in `design.md` has this name. A scope change is the most common reason for a stale tasks preview, so `Background` is in `KEEP`. The section is optional, so `plan-hash.mjs` does not fail on an old `plan.md` with no `## Background`. Rejected: `## Context`, because `design.md` has a section with this name. Rejected: `## Scope` and `## References`, because each name covers only half the content.

---

## D126: Review Fixes for D124 and D125

**Decision**:

- `plan-hash.mjs` strips HTML comments inside each section body, after it splits the sections. It does not strip them from the whole file first.
- An empty `## Background` hashes the same as a missing one.
- The done check says: "Is `## Open Questions` empty? An HTML comment does not count." This applies in `apply.instruction` and in the archive skill.
- The five workflow skills say `Shipped schema version: 2`.

This revises D124 and the done check of D60.

**Rationale**: A review of D124 and D125 found these gaps. With a strip on the whole file, a stray `<!--` in prose and a later `-->` removed the headings between them, so the script exited with code 1. The template has an empty `## Background`. If a user deleted it, the hash changed and the tasks preview became stale, which D124 wanted to prevent. The template also puts a comment under `## Open Questions`, so the done check could read the section as not empty. The skills held version 1, so `check-version.mjs` failed in CI, and each skill would stop on a "repo version higher" message. A plan with no HTML comments keeps its v1 hash, so an update does not mark old previews as stale.

---

## D127: Keep the Guidance Comments in plan.md

**Decision**:

- Propose keeps each guidance comment of the template in `plan.md`. It writes the content under the comment.
- When upgrade prunes `plan.md`, a section with only an HTML comment counts as no section. If only such sections are left, upgrade deletes `plan.md`.
- The `## Decisions` comment says that "Rejected Z because W." is optional, as D92 says.

This extends D124 and D120.

**Rationale**: A review of D126 found these gaps. With no rule, each agent could keep or remove the comments, so plans would differ. A kept comment helps a later person who edits `plan.md` by hand. `plan-hash.mjs` ignores comments, so they do not change the hash. Without the prune rule, a section with only a comment would keep `plan.md` after an upgrade. A test now pins the v1 hash of a plan with no comments, so the D126 claim cannot break silently.

---

## D128: plan-hash.mjs Fails on a Hashed Heading With the Wrong Letter Case

**Decision**:

- `plan-hash.mjs` exits with code 1 if a heading differs from a hashed title only in letter case, for example `## background`. The message names the heading.
- It checks the missing required headings first, so the D91 message does not change.
- The `## Decisions` template comment is one line, as D124 says.
- The artifact `description` in `schema.yaml` and the "Plan" entry in `GLOSSARY.md` name the optional background.

This extends D91 and D125.

**Rationale**: A review of D127 found that `## Background` is optional. A heading such as `## background` then dropped out of the hash with no error, so a scope change did not make the tasks preview stale. D91 closed this gap for the required headings. A check on letter case only is simple and catches the usual typo. Rejected: a fuzzy match on other spellings, because it adds code for rare cases. The `GLOSSARY.md` "Done check" entry does not get the comment rule, because the glossary holds no implementation details.

---

## D129: Fenced Comments Stay in the Hash, and Propose Fills Background

**Decision**:

- `plan-hash.mjs` strips an HTML comment only outside a ``` or ~~~ fence. A comment inside a fence is content, and it stays in the hash.
- Propose fills `## Background` when the prompt gives scope items or sources. Otherwise it leaves the section empty. This revises the fourth bullet of D125.

This revises D126 and D125.

**Rationale**: A review found that the strip ignored fences, but D108 treats fenced text as content. So an edit to a comment in a code example under a hashed section did not make the tasks preview stale. Round 1 accepted this gap, but the stale check is the purpose of the hash. For propose, the D125 text "leaves the section empty" conflicted with "Fill only what is known". If the prompt gave a scope list, the rule sent it back into `## Goal`, which is the problem of issue #1.

---

## D130: Scenario 10 Is a Manual CI Workflow, Run Only When It Applies

**Decision**:

- `.github/workflows/apm-install.yml` runs scenario 10. Its only trigger is `workflow_dispatch`, so a person starts it from the Actions tab or with `gh workflow run apm-install.yml`.
- It installs the latest APM with `microsoft/apm-action@v1` in `setup-only` mode. It does not pin the APM version, so it also catches a change in a new APM.
- It installs from the latest `v*` tag with the range `^<major>.0.0`, as a user does. It checks the six skills, the schema assets, a module folder with only `package/`, and `resolved_ref` in `apm.lock.yaml`.
- Run it after a tag push that adds, moves, or deletes a file in `package/`, or changes `package/apm.yml`. Also run it after an APM update. Skip it for a release that changes only the text of existing files.
- The header of `docs/test-scenarios.md` now lists scenarios 1–9 and 11–21. Scenario 21 (D122) was missing.

This revises D107 for scenario 10.

**Status**: Scenario 10 is removed from `docs/test-scenarios.md`. The number 10 stays unused, because other entries refer to scenarios 11–21 by number. The workflow is the only description of the check.

**Status**: The workflow sets `apm-version: latest`. Without it, the action installs its pinned default APM 0.14.0, and the first run failed (`docs/facts.md`).

**Rationale**: Several published releases installed with no fault. Scenario 10 checks the package layout and the APM resolution, not the skill text. So a text-only release cannot break it. A manual run each time cost a step for little value. A workflow removes the manual steps, and a manual trigger keeps it out of each push. Rejected: a run on each tag push, because the user wants it optional. Rejected: an input for the tag, because the `^<major>.0.0` range always resolves to the latest tag of that major.

---

## D131: Fixes From the Scenario Run on d05538c

**Decision**:

- Propose step 5 says: "Keep each `<!-- ... -->` guidance comment, also in a section that you fill. Write the content on the lines under the comment."
- Upgrade says: "The Goal alone is not a requirement. You can suggest one from it, but ask before you write it."
- A headless scenario run uses `claude -p --setting-sources project,local`, with `< /dev/null`. On Bedrock, the shell sets `CLAUDE_CODE_USE_BEDROCK=1`. The tester checks that the skill base folder is the temp folder.
- Scenario 9 expects "(v0 → v2, the shipped version)".

This extends D127, D108, and D114.

**Status**: D152 applies the Goal rule to each requirement, also when `plan.md` has one, and adds `tasks-preview.md` to it. D151 removes the version number from scenario 9.

**Rationale**: In 6 of 6 propose runs, the agent removed the comment of each section that it filled. "Keep each guidance comment" did not say that a filled section keeps its comment. In 1 of 2 runs of scenario 20c, upgrade turned a Goal that names a behavior into a requirement in its own words. It did not ask, which D114 forbids. A global v1.3.0 install in `~/.claude/skills/` hid the release candidate in each group, until the runs used the flag (`docs/facts.md`).

---

## D132: Upgrade Ends the Turn After the Prune Question

**Decision**:

- Upgrade step 4.3 shows the list of `plan.md` sections and asks "Delete the moved sections from `plan.md`?" in one reply. Then it ends the turn. It does not run `openspec validate` or write the summary before the answer.
- Scenario 20c expects the list and the question, with nothing after them. Its summary can say that `skip_specs` "stays" or "was put back".

This extends D120.

**Rationale**: In the rerun on cd93c44, both runs of scenario 20c ran step 5 and the summary in the same turn as the prune step. One run showed no list and no question, but its summary said "I'm waiting for your answer to the question above". The other run asked with no list. The step said "in the same reply", but it did not say to stop. `apply.instruction` uses "End your turn, and wait for the answer" for the same case. When propose sets `skip_specs: true` and the upgrade writes no delta, the flag never leaves the file, so "stays" is also correct.

**Status**: Revised by D191: upgrade validates before the prune question. Revised by D193: the summary comes before the question, and the question is the last line.

---

## D133: Upgrade Runs Each Instructions Command Alone, and Writes No Pointer to a Kept Question

**Decision**:

- Upgrade runs `openspec instructions <artifact> --change "<name>" --schema spec-driven --json` as one plain command for each artifact, with no loop and no pipe. If the command fails or is denied, upgrade stops and shows the error. It does not write the artifact without the output.
- An open question that changes the specs, the approach, or the tasks stays in `plan.md`. Upgrade writes neither the question nor a note that points to it in `design.md`.

This extends D120 and D132.

**Status**: After the rerun on 5af5008, the first bullet is revised. Upgrade does not put the command in a loop or a chain, and does not filter it with `grep`. It reads the full JSON and does not write an artifact without its `template` and `instruction`. After the rerun on 1f0c3b7, "do not filter it with `grep`" becomes "do not pipe it to another command", because a pipe to `head -c 3500` cut off the `template` key. The "stop if denied" rule is removed: in 3 of 3 denials, the agent retried with a plain command, which is correct. In 2 of 4 runs, a pipe to `grep` ran, because the allowlist does not deny it, and one run lost the `instruction` field. Revised by D191: an unanswered open question is also the first task of tasks.md.

**Rationale**: In the rerun on dc3b8c0, the scenario allowlist denied `openspec instructions` calls in a `for` loop or in a pipe to `python3`. The agent then wrote the artifacts with no `template` and no `instruction`. In the same 20a run, `design.md` got a pointer to the kept open question under `## Open Questions`. Step 2.3 forbade the question there, but not a pointer to it. The d05538c run passed this check, so the pointer is model variance that the text did not close.

---

## D134: IDs for Constraints, Open Questions, and Decisions in plan.md

**Decision**:

- In `plan.md`, each constraint is `- C1: <rule>`, each open question is `- OQ1: <question>`, and each decision is `### Decision D1: <title>`. An agent gives each new item an ID that is not used yet in the file.
- An ID is unique in its `plan.md` only. Gaps and any order are OK.
- The template comments, `apply.instruction`, propose, and upgrade use the new format. The schema version goes from 2 to 3 (D109).

This revises the entry format of D92.

**Status**: D137 writes the heading as `### Decision D<n>: <title>`. D140 moves the ID comment to the top of the template. D144: a new item gets a number higher than each ID of its kind in the file.

**Rationale**: A reviewer can point to one item with a short ID, for example "D3 relies on F2" or "D3 breaks C1". A unique ID in the file is sufficient for this. Strict numbers would make the agent renumber items after each removal, which adds noise to the diff.

---

## D135: A Facts Section in plan.md

**Decision**:

- `plan.md` gets a `## Facts` section between `## Open Questions` and `## Decisions`. Each fact is `- F1: <fact>`, with the ID rules of D134.
- It holds only non-obvious facts found during exploration or grilling, for example with `/opsx:explore` or the grill-me skill. Each fact must justify a decision or a constraint of the change.
- The plan hash does not cover `## Facts`, as for `## Decisions`.
- At archive, a fact goes to the `## Context` of each ADR whose decision it justifies. A fact that justifies no promoted decision is listed as not drafted, with a reason (D116).
- At upgrade, facts go to `design.md` → `## Context`.
- The schema stays at version 3, because version 3 (D134) is not released yet.

**Rationale**: Exploration and grilling find facts, for example how a library or an API behaves. Without a slot, the facts are lost, or they mix with the decisions and the constraints. The filter "justifies a decision or a constraint" keeps the section short. Facts change when exploration continues, so a new fact must not make the preview stale.

**Status**: Revised by D171. Revised by D179 (archive keeps a tool fact in an ADR). Revised by D184: one category, the non-obvious fact, replaces the external tool fact.

---

## D136: plan.md Keeps the Current Decisions, and Facts Have No Statistics That Soon Go Out of Date

**Decision**:

- `## Decisions` in `plan.md` holds the current decisions, not a history of past decisions. When an agent adds a decision, it checks the existing ones. It removes each superseded decision, and it updates each stale decision.
- The rule is in the `## Decisions` guidance comment of the template, in `openspec-lite-propose`, and in `apply.instruction`.
- A fact in `## Facts` must not hold statistics that soon go out of date. A number as an example or a reference is OK. The rule is in the `## Facts` guidance comment and in `openspec-lite-propose`.
- The schema stays at version 3, because version 3 is not released yet (D134).

This revises the "append-only" rule of D10 and of `design.md` §4. It extends D135.

**Rationale**: Archive promotes each decision of `plan.md` to an ADR. A superseded or stale decision would become a wrong ADR, and a reviewer must read the full history to find the current choice. The ADR folder, not `plan.md`, keeps the history. A statistic such as "the table has 1.2M rows" is true only for a short time, and a wrong fact can justify a wrong decision.

---

## D137: Fixes From Review Round 1 on bad18ec

**Decision**:

- The skills and `apply.instruction` write a decision heading as `### Decision D<n>: <title>`, not `D1`. The template comment says that each C, OQ, F, and D ID is unique in the file, and that a new item gets an ID that is not used yet.
- An upgrade is an option at any time, not only when the scope grows. `GLOSSARY.md` and `README.md` say so. The upgrade signals of `design.md` §5 stay: they tell the agent when to suggest an upgrade.
- A fact that justifies only a requirement or a constraint is not promoted. Archive lists it as not drafted, with a reason (D116, D135).

This extends D134, D135, and D136.

**Status**: D144 replaces "an ID that is not used yet" with "a number higher than each ID of its kind in the file". Revised by D191: a fact that justifies a requirement goes into the requirement text.

**Rationale**: With the literal `D1` in the instruction, apply could write a second `D1` in a file that already has one. The README said "at any time", but the glossary said "when its scope grows". A spec states behavior, not the facts behind it, so a fact has no slot in a spec.

---

## D138: Fixes From Review Round 2 on 0e4bb40

**Decision**:

- Archive and upgrade do not copy the `plan.md` IDs (`C1`, `OQ1`, `F1`, `D1`) to a spec, an ADR, or `design.md`. They write each reference to an ID in words.
- `apply.instruction` says: "Do not add an ID to an existing item that has none."
- The template shows the IDs as `C<n>`, `OQ<n>`, `F<n>`, and `D<n>`.
- Archive step 4 states the D137 rule: a fact that justifies no drafted decision is listed as not drafted.
- `GLOSSARY.md` adds **Fact** and **Item ID**.

This extends D134, D135, and D137.

**Status**: D142 widens the first bullet to each text outside `plan.md` and `tasks-preview.md`. It names the item by its title, with the change name.

**Rationale**: An ID is unique only in its `plan.md`. After archive or prune, a spec or an ADR that says "D3" points to nothing, or to a decision of another log. A change that started with schema version 2 has constraints with no ID. If apply adds an ID to a constraint, the plan hash changes, and the preview becomes stale with no real change. A fact that is not promoted is not lost: it stays in the archived `plan.md` in `openspec/changes/archive/`.

---

## D139: Fixes From Review Round 3 on 5b089bb

**Decision**:

- `apply.instruction` records the answer to an open question as a `### Decision D<n>:` entry.
- Archive lists a fact that justifies no drafted decision with a one-line reason, as for each other item that it does not draft (D116).
- A scenario names a fact in words, not by its ID, because D138 forbids the IDs in specs and ADRs.

This extends D137 and D138.

**Status**: D143 narrows the third bullet to the expected results about specs and ADRs.

**Rationale**: Without the format, apply can write an answer with no ID. Without the reason, a skipped fact looks like a lost fact.

---

## D140: Fixes From Review Round 4 on 840cc2a

**Decision**:

- The template comment on ID rules moves to the top of `plan.md`, before `## Goal`. It applies to the C, OQ, F, and D IDs, so it must not sit under `## Decisions`.
- When apply removes or updates a decision, it also removes each fact that justifies no current decision or constraint.
- Scenario 4b checks D136, D138, and this rule in a live apply run.
- If the user rejects an ADR draft at archive, the facts of that draft need no extra report. The user saw them in the draft.

This extends D135, D136, and D138.

**Rationale**: An agent that fills `## Constraints` first does not read the `## Decisions` comment. The plan hash ignores the text before the first `##` heading, so the top comment does not change the hash. A fact that justifies only a removed decision breaks the `## Facts` filter of D135.

**Status**: Revised by D171.

---

## D141: Fixes From Review Round 5 on f86e3cc

**Decision**:

- Propose also removes each fact that justifies no current decision or constraint, as apply does (D140).
- A test checks that the text before the first `##` heading does not change the plan hash. D140 relies on this.
- The schema `description` lists facts.
- D134 and D10 get `**Status**` lines for D137 and D140.

This extends D140.

**Rationale**: Propose can also supersede a decision when the user edits the plan, so the same orphan fact can stay. Without a test, a change to `plan-hash.mjs` could hash the top comment, and each preview would become stale after a template update.

---

## D142: The plan.md IDs Stay in plan.md and tasks-preview.md

**Decision**:

- The IDs `C<n>`, `OQ<n>`, `F<n>`, and `D<n>` appear only in `plan.md` and `tasks-preview.md`. The preview extends `plan.md`, so it can refer to the IDs.
- No other text holds them. This includes specs, ADRs, the upgrade artifacts, code comments, commit messages, pull requests, and tickets such as Jira issues.
- To refer to an item from outside these two files, use the item title, or a short form of its text, with the change name. Example: "the decision 'Count failures per account' of the change `lockout`".
- When upgrade seeds `tasks.md` from the preview, it replaces each ID with the item title.
- The rule is in the top comment of the template, in `apply.instruction`, and in the archive and upgrade skills.
- `openspec-lite-apply` does not repeat the rule. It follows `apply.instruction`, which already holds it, and D64 keeps one copy of the apply rules.

This revises D138.

**Rationale**: An ID is unique only in one `plan.md`, and archive or upgrade can remove the file. Outside it, "D3" points to nothing, or to a decision of another log, such as `docs/decisions.md` or an ADR folder. A title with the change name stays clear after the plan is gone. The preview lives and dies with `plan.md`, so an ID in it stays correct. `tasks.md` outlives `plan.md` after an upgrade, so it gets titles.

---

## D143: Fixes From Review Rounds 1 and 2 on c488067

**Decision**:

- Upgrade states the ID rule (D142) at the start of step 2, before the agent writes `proposal.md`.
- Upgrade moves each `### Decision` entry to `design.md`, also an old entry with no ID (D138).
- Archive lists a fact as not drafted when it justifies no drafted ADR. This includes the fact of a decision that archive drafts only as a requirement (D119).
- An expected result about a spec or an ADR names a fact in words. A check on `plan.md` itself can use the IDs, as scenario 4b does.
- `design.md` §4 says that the plan hash ignores the text before the first `##` heading.

This extends D138, D139, and D142.

**Rationale**: The agent writes the artifacts in order, so a rule in step 2.3 comes too late for `proposal.md` and the specs. A version 2 plan has `### Decision:` entries, and the pattern `### Decision D<n>:` does not match them. "No drafted decision" was not clear for a decision that becomes a requirement with no ADR.

---

## D144: Fixes From Review Round 3 on 51159d0

**Decision**:

- A new item gets a number higher than each ID of its kind in `plan.md`. This replaces "an ID that is not used yet".
- The `## Decisions` guidance comment also says to remove each fact that justifies no current decision or constraint (D140).
- The upgrade skill names an item by its title, with the change name, as the other texts do (D142).
- The README says that the items have IDs, and that the IDs stay in `plan.md` and `tasks-preview.md`.
- Scenario 4 checks code, test names, and test strings for leaked IDs. Scenario 20a also checks `proposal.md` and `specs/`.

This extends D134, D140, and D142.

**Rationale**: An agent does not see the IDs of removed items, so "not used yet" lets it reuse an ID. Then a preview that cites the old ID points to a new item, with no stale warning. "Higher than each ID of its kind" is a best-effort rule: it reuses an ID only when the item with the highest number was removed. A test often maps to a constraint, so an agent can put `C1` in a test name.

---

## D145: Fixes From Review Round 5 on f956aec

**Decision**:

- `apply.instruction` says how to pick `<n>` for a new decision: higher than each decision ID in `plan.md` (D144).
- Scenario 4b uses a `plan.md` with no template comments, so the run checks `apply.instruction` alone. Its ID check applies only when the agent adds a new decision.
- The release scenario list in `design.md` §2 names the fact and ID checks of scenarios 14, 15, and 20.

This extends D144.

**Rationale**: A plan from schema version 2, or a plan written by hand, has no top comment of the template. Without the rule in `apply.instruction`, apply has no numbering rule for such a plan. If apply updates the old decision in place, no new ID exists, so the ID check cannot apply.

---

## D146: Metrics in the Scenario Reports

**Status**: Revised by D170. Cost USD and Thinking tok come from the last turn of each session.

**Decision**:

- Each scenario report has a metrics table: one row for each run, and one total row for the group.
- The columns are Pass, Checks, Cost USD, Output tok, Thinking tok, Input tok, Cache read tok, Turns, Tools, Denials, User turns, and Time s. A file table gives the lines and words of each `.md` file under `openspec/`, except `openspec/schemas/`.
- `scripts/run-metrics.mjs` makes the row from the JSON of each `claude -p` turn and the session log. Pass and Checks need a judgment, so the script prints `?` for them.
- The script counts tool calls by `tool_use` ID. It does not add the cache reads to the other input tokens.
- No LLM-judged quality score, and no time-to-first-token number.

**Rationale**: `docs/evaluation-orignial-idea.md` step 1 needs numbers to compare a run with the skill against a run with stock OpenSpec, and an old tag against a new commit. The JSON of `claude -p` already has the numbers (`docs/facts.md`). A script makes each group count in the same way. Cache reads are most of the input, but they cost about 10% of new input, so one total would hide a cost change. The file table gives a source for the claim that `plan.md` is smaller than the spec-driven artifacts. An LLM score costs money and varies, and the disk checks already measure the outcome.

---

## D147: Archive Keeps the Reason of a Constraint

**Decision**:

- When archive drafts a requirement from an item that gives a reason, for example the "because" part of a constraint, it keeps the reason in the requirement text. A scenario title alone does not keep it.
- Archive step 4 is a list of sub-bullets. The rule "list each item that you do not draft, including each non-goal, with a one-line reason" comes second, right after the sort rule.
- Scenario 15 expects the French Excel reason in the requirement text or in the ADR, not only in a scenario title.

This extends D116 and D119.

**Rationale**: In the compare run of 2026-11-04, scenario 15 failed on v1.5.0. The agent turned the semicolon constraint into a scenario and dropped "because the users open it in a French Excel". It also named the non-goal with no reason. In the 92c77ff run, the reason survived only in a scenario title. No version of the skill said to keep the reason. In v1.5.0, step 4 grew by about 100 words, and the non-goal rule became its last sentence.

---

## D148: Goal Can Hold More Than One Related Outcome

**Decision**:

- `## Goal` holds one outcome by preference. It can hold more than one outcome if they are related.
- Write one outcome per bullet, in one or two sentences each.
- Propose asks the split question before the Level 1 question. The Level 1 question then applies to the outcomes that stay. On a "yes" to the Level 1 question, propose still names each outcome that the user moved out.
- The first outcome of the request is the main outcome. If another outcome touches the same code as the main outcome, it stays in this change, with no question. This check comes first.
- Otherwise, if the outcome can ship alone, propose asks: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?" It asks before it picks the change name. On yes, the outcome stays out of this change. The summary names it, and tells the user to run `openspec-lite-propose` for it. On no, it stays as an outcome.
- The template comment says to ask the user, not to split with no question.
- A task in `tasks-preview.md` is a "verifiable result", not a "verifiable outcome", because "Outcome" now has one meaning in `GLOSSARY.md`.
- The done check asks "Is each outcome of the Goal met?". Archive searches the code for what each outcome names, and names each outcome that is not met.
- Propose derives the change name from the main outcome.
- Upgrade gives each outcome its own item in the What Changes section of `proposal.md`.
- `GLOSSARY.md` defines "Outcome", "main outcome", and "split question".
- The Goal comment in `templates/plan.md` states these rules. The schema `version` goes to 4, per D109.
- Scenario 22 checks the rules: related outcomes stay in one change, an outcome that can ship alone goes to a separate change, and archive checks each outcome.

This replaces the "One sentence" rule of the Goal comment from D124, and the "keeps Goal one sentence" text in the rationale of D125.

**Status**: D149 makes the name come from the main outcome only.

**Rationale**: No decision gave a reason for the one-sentence rule. The skills use Goal for the done check, the change name, and the archive search. Each use needs a clear outcome, not one sentence. A real change can add a feature and fix an old bug in the same code, so it has two outcomes. A change archives as one unit. If one outcome is blocked, the other outcome waits too, so an outcome that can ship alone goes to its own change. Propose asks before it moves an outcome out, because the user asked for it, and a silent removal can lose it. The question comes before the change name, so the name never comes from an outcome that moves out. Scope items and source links still go to `## Background` (D125). The hash does not change, because the hash ignores HTML comments (D124).

---

## D149: Change Name From the Main Outcome Only

**Decision**: Propose derives the change name from the main outcome only. It does not add words from the other outcomes.

This extends D148.

**Status**: Superseded by D168. The name starts with the main outcome, and words from the other outcomes can follow.

**Rationale**: In the f0a5cad scenario run, 22a failed. The skill said "from the main outcome", but the agent named the change `report-csv-export-user-timezone`, from both outcomes. With "only" and the explicit ban, 3 of 3 reruns named it `report-csv-export` (`docs/facts.md`). A name from all outcomes grows past 5 words when a change has three outcomes.

---

## D150: Propose Reads .openspec.yaml Before It Sets skip_specs

**Decision**:

- Propose step 3 reads `.openspec.yaml` before the edit. If `skip_specs: true` exists, propose does not edit the file. If it is missing, propose adds it.
- The step says that OpenSpec 1.14.2 already writes the line.
- Scenario 1 expects one `skip_specs` line, with no add-and-remove in the run.
- Scenario 12 step 1 adds `skip_specs: true` only if the line is missing. Before, the step made a duplicate key with OpenSpec 1.14.2.

This extends D112.

**Rationale**: In scenario 1 on f0a5cad, propose added a second `skip_specs: true` line, saw that the CLI failed, and removed the line. The D112 rule "If the line exists, do not add a second one" did not tell the agent to look first. OpenSpec 1.14.2 writes the line in `openspec new change --schema plan-lite` (`docs/facts.md`), so with that version the line always exists. The add-if-missing part stays for the older OpenSpec versions in the `openspec-version` range, because the facts do not show when OpenSpec started to write the line.

---

## D151: Scenario Text Fixes From the 627b8fb Run

**Decision**:

- The setup of `docs/test-scenarios.md` says: install the schema before a hand-built plan-lite change, add no second `skip_specs` line, and commit code before an archive run.
- Scenario 3 step 3 says "Add or edit a line under `## Constraints`".
- Scenario 9 says "v0 → the shipped version", with no version number.
- Scenario 21b step 1 names step 10 of `openspec-lite-archive`.
- "Running the Scenarios Headless" names the `/private/tmp/...` path and its session log folder.
- The open items of the run stay open. They are listed in `.scenario-runs/20261105-627b8fb/summary.md`. The skill gaps need an owner decision.

**Status**: D165 moves the open items to `docs/todo.md`.

**Rationale**: All 33 runs passed, but 5 groups found scenario text that misled the tester. After scenario 1, `## Constraints` is empty, so "Edit a line" had no target. Scenario 9 named v3 after the bump to v4, and a version number in the text goes stale at each bump. "Step 10 of 21a" pointed to a step that 21a does not have. Three groups built a plan-lite change by hand, and each had to find the schema install and the `skip_specs` rule (D150) alone.

---

## D152: Upgrade Asks Before a Requirement That Is Not in plan.md, and Marks Inferred Items

**Decision**:

- Upgrade writes a requirement only from a constraint, a decision, or a fact of `plan.md`, or from an answer of the user. The Goal and `tasks-preview.md` alone are not requirements. Upgrade can suggest a requirement from them, but asks before it writes it. Before, this rule was only in the branch for a `plan.md` with no requirement.
- In `proposal.md`, `specs/`, and `design.md`, upgrade puts 🤖 at the end of the line or the heading of each inferred item. An inferred item comes from no section of `plan.md` and from no answer of the user in the upgrade. The Goal and `## Background` count as sources. One mark per item.
- `tasks.md` gets no mark.
- A requirement that the user accepts after the question gets no mark, because the user is its source.
- The upgrade summary lists each 🤖 item. The user removes the mark to accept the item, or deletes the item. No skill removes the mark.
- `GLOSSARY.md` defines "Inferred item". Scenario 7 checks the rule.

This revises D131 and extends D114.

**Status**: D163: an item that restates a part of `plan.md` in other words is not inferred, and gets no mark. D164 moves the requirement question to one question turn before any write, and lets a decision become a requirement only if it is a contract. D166: a fact is not a source of a requirement. Revised by D182: an agent decision of plan.md keeps its 🤖 in design.md, also with no new claim.

**Rationale**: In scenario 7 of the 627b8fb run, `plan.md` had two constraints. Upgrade wrote 4 distinct requirements with no question: 2 from the constraints, 1 from the Goal, and 1 (RFC 4180 escaping) from the tasks preview. It also wrote scenarios from the tasks preview, for example "Table is empty". A spec is a contract that others depend on after the archive, and the tasks preview is a reference, not a contract. A list of sources in the summary was rejected, because it points to `plan.md` items, and the user usually deletes `plan.md` after the upgrade. A mark in the artifact stays where the reviewer reads. `tasks.md` gets no mark, because the agent writes almost each task from its own preview, so a mark on each line tells the reviewer nothing. If the user forgets a mark, stock `/opsx:archive` merges it into `openspec/specs/`. This is a visible signal, not a silent error, so no skill removes it.

---

## D153: Upgrade Reports the skip_specs State at the End

**Decision**: the upgrade summary says the `skip_specs` state at the end: absent, because the change has spec deltas, or set, because it has none. It does not say what this run did to the line. The step that puts the line back no longer has its own "say so in the summary", because the summary rule covers it. Scenario 20c expects "set at the end".

This revises D108 and D120.

**Rationale**: In scenario 7 of the 627b8fb run, the first upgrade run stopped after `proposal.md`, but it had already removed the line. The second run found no line, and its summary said "`skip_specs` was not set". This was true for that run, but the user could read it as "the change never had the flag". The 92c77ff run gave the same report. A state is true after any number of interrupted runs, and the agent does not need the history. Rejected: make the second run find out what the first run did, because the agent cannot know it with certainty, and the user gets nothing from it.

---

## D154: Archive Can Copy the Decisions to ADRs After Its Guard

**Status**: Revised by D191 item 5 and D192: after the ADRs, archive lists each 🤖 line, and offers the archive when no delta holds a 🤖.

**Decision**:

- When the archive guard stops on a change that is not plan-lite, archive can offer to copy each `### Decision` of `design.md` to an ADR. It writes nothing before the user says yes.
- On yes, archive drafts each ADR with the form and the two checks of section 2, step 5: the earlier ADRs with `Change: <name>`, and `Supersedes:`. It shows the drafts as in step 6. It writes each approved ADR with the file rules and the `Supersedes:` edits of step 10.
- It does not run steps 7 to 9 or step 11. It writes no spec, does not change `design.md`, and does not archive the change. Stock `/opsx:archive` archives the change.
- Scenario 18 accepts the offer. Scenario 18b checks the yes path.

This extends D75 and D115.

**Rationale**: In 4 of 4 runs of scenario 18, the agent offered "I can draft both ADRs in the format this skill uses", but no rule covered the offer or the yes path. D115 names the gap: after an upgrade, the decisions are in `design.md`, and stock `/opsx:archive` does not turn them into ADRs. The rule closes the gap with the ADR form and file rules that archive already has. Rejected: forbid the offer, because the user must then copy the decisions by hand, and the agent made the offer in each run anyway.

**Status**: Revised by D191: after the ADR copy, archive offers to run openspec archive.

---

## D155: Archive Asks Only "Archive anyway?"

**Decision**:

- If an answer of the archive done check is "no", archive shows the warnings and asks only "Archive anyway?". It gives no other options.
- On no, it stops, and tells the user: to keep an item that is not in `plan.md`, add it to `plan.md`, then run `openspec-lite-archive` again.
- Scenario 22c expects the exact question and this hint.

This extends D77.

**Rationale**: In scenario 22c, 2 of 2 runs changed the question. On 627b8fb, the agent showed a menu: "1. Archive anyway", "2. Stop", "3. Record first". Option 3 asked the user for new content from memory, for example the CSV column format, to write as a spec or an ADR before the archive. On f0a5cad, the agent asked "Archive anyway, or finish the time-zone work first?". The done check is a gate, and a gate needs one yes or no answer, also in a headless run. Option 3 also skips `plan.md`, the source of each promotion, and the step 6 rule that lets the user pick only an item that archive skipped. The need behind option 3 is real: a user can see at the last moment that a decision is worth keeping. The hint gives that need a correct path, through `plan.md` and the normal filter and approval. Rejected: accept a menu in the scenario, because each run can invent new options, and the scenario cannot check them.

**Status**: Revised by D191: on no, archive gives the paths for each item that is not met.

---

## D156: Scenario 4 Gives a Fixed Answer to the Questions of Apply

**Decision**: Scenario 4 has a second step. The tester answers the questions of apply in one reply: continue from `plan.md`, do not regenerate the preview, one real answer for each open question, and a fixed stack (plain HTML and JavaScript under `src/`, `node:test`, no npm dependency, a minimal report page). The step forbids "use the defaults".

**Rationale**: Scenario 4 runs on the change of scenarios 1 and 3. Apply then asks up to three questions before it codes: the stale preview from scenario 3, the open questions from scenario 1, and the stack of an empty repo. The scenario gave no answer, so each tester improvised. In the 627b8fb run, the tester wrote "I accept your defaults", but apply gave no defaults, so the agent chose the answers itself. A fixed answer makes two runs test the same thing. The open questions differ in each run, so the tester writes their answers. Rejected: a fixed `plan.md` with no open questions, because scenario 4 then no longer tests the change that scenarios 1 and 3 build.

---

## D157: Scenario 7 Has a Fixed Prompt and a Fixed Answer

**Decision**:

- Scenario 7 step 1 holds the full propose prompt: the Goal, the scope, two sources, one requirement, one decision with its reason, one constraint, and one open question that changes the tasks. The tester then answers yes to the tasks preview.
- Step 3 gives the answer to the open question: "No, the export does not include hidden columns."
- Scenarios 17, 18, 18b, and 19 start from the end of scenario 7, so they get the same start.

**Rationale**: Step 1 pointed to scenario 3 steps 1–2, which use the scenario 1 prompt. That prompt names no open question, but step 3 said "Answer each open question". The 92c77ff and 627b8fb runs used a longer prompt that was not in the scenario text. Scenario 7 is also the test of D152, and D152 needs a known start, so that the tester can tell the requirements from `plan.md` from the inferred items. Rejected: keep the pointer to scenario 3 and add the open question to `plan.md` by hand, because the tester then writes the question, and two runs can differ.

---

## D158: Upgrade Keeps the ID Comment While a Section Is Left

**Decision**:

- When upgrade prunes `plan.md`, it keeps the ID comment at the top while a section is left. If no section is left, it deletes `plan.md`, with the comment.
- Scenario 20a expects the ID comment and `## Open Questions` after the prune.
- Scenario 20a accepts a task that names an item by its title, or by a short form of its text, as upgrade step 2.4 and D142 say.

This extends D120, D140, and D142.

**Rationale**: The prune rule covered sections and items only. The ID comment comes before the first heading, so no rule covered it, and the runs differed: on 92c77ff the agent deleted it, on 627b8fb it kept it. A kept open question has an ID, and the comment holds the ID rules for a new item, so it is still needed. It does not change the hash (D141). In 20a, the scenario said "by its title", but the skill allows a short form, so the 627b8fb run passed only because the tester read the skill.

---

## D159: Scenario 20b Picks the Item After the Skipped List

**Decision**: Scenario 20b names the moment of the pick by its content: "In the first reply after the agent lists the skipped items, pick the toolbar item." If the agent asks "Archive anyway?", the tester answers yes in the same reply.

**Rationale**: The step said "In the reply to the drafts". In the 627b8fb run and the run before it, the done check failed first. The agent listed the skipped items with "Archive anyway?" in turn 1, and showed the full drafts only in turn 2. So the tester picked the item before the drafts. Archive step 6 allows a pick in any reply after the skipped list, so the new wording is true for both orders.

---

## D160: Scenario 20c Checks Only the End State of skip_specs

**Status**: Revised by D208: upgrade does not remove the line when it writes no spec.

**Decision**: Scenario 20c checks only the end state of `skip_specs`. It says that the agent can skip the remove (upgrade step 1) and the add-back (step 2.2) of the line, because no spec file is written. Upgrade does not change.

**Rationale**: In the 627b8fb run and in 2 of 2 reruns on f15aba0, the agent never removed the line and put it back. Its only edit to `.openspec.yaml` changed the `schema:` line. The end state was correct each time. Step 1 exists because the CLI refuses a spec file while the flag is set, so with no requirement the remove and the add-back have no effect. The user sees no difference, and since D153 the summary reports only the end state. A check on the order needs the tool calls of the session log, for no result that a user can see. Rejected: change step 1 to "remove the line only before the first spec file", because each interrupted run must then find out if a spec file exists, the type of history check that D153 avoids.

---

## D161: Scenario 22a States the Name Check

**Status**: Revised by D168. `report-csv-export-user-timezone` now passes. A name that starts with the time zone fix fails.

**Decision**: Scenario 22a expects a name from the main outcome only, with no word from the time zone fix. It gives two correct examples, `add-csv-export` and `report-csv-export`, and the wrong name `report-csv-export-user-timezone`.

**Rationale**: The scenario gave one example, `add-csv-export`. In 4 of 4 runs, the agent chose `report-csv-export`, which follows the rule, but a strict tester could read the example as the expected name. The check of D149 is that no word comes from the other outcomes, so the scenario now names the failure that D149 fixed.

---

## D162: Metrics Rules for Shared Sessions, Backups, and Subfolder Roots

**Status**: Revised by D170. Cost USD and Thinking tok come from the last turn of each session.

**Decision**:

- The metrics table has one row for each session. If scenarios share a session, the label names each of them, for example `1+3`.
- `run-metrics.mjs --dir` skips `openspec/schemas-backup/`, as it skips `openspec/schemas/`. `tests/run-metrics.test.mjs` checks it.
- `--dir` is the OpenSpec root of the scenario: the temp folder, except in scenario 11, where it is `<temp>/svc`.
- The script gets no `--help` and no total row. The usage line is the first comment of the script, and the tester adds the total by hand.

This extends D146.

**Rationale**: In the 627b8fb run, group A could not make one row for each scenario, because scenarios 1, 3, and 4 share sessions, and the script counts a whole session log. In scenario 9, the table counted the template in `openspec/schemas-backup/` as an artifact. In scenario 11, `--dir <temp>` found no `openspec/` folder. All 8 groups made the total row by hand with no error, so a total mode is not worth a new code path and its tests yet. Add it when a run gets the total wrong.

---

## D163: A Restated plan.md Item Is Not Inferred

**Decision**: An item that restates a part of `plan.md` or an answer of the user is not inferred, also in other words, or in another artifact or section. Upgrade marks only an item that adds something that `plan.md` and the answers do not say, also a detail that it adds to a `plan.md` item.

**Status**: Revised by D167.

This revises D152.

**Rationale**: In 2 of 2 reruns of scenario 20c on f15aba0, upgrade put 🤖 on an item that restated `plan.md`: the decision, reworded in the Impact list of `proposal.md`, and the Goal, reworded in the Goals of `design.md`. Each run also marked its own Why line correctly. A mark is useful only if it is precise, because a user who sees many wrong marks learns to ignore them. Rejected: mark only in `specs/` and `design.md` → `## Decisions`, because the inferred Why line of `proposal.md` is new content that a reviewer must see.

---

## D164: Upgrade Asks One Question Turn Before Any Write, and Filters Decisions

**Decision**:

- Upgrade step 2 plans the requirements before any artifact. A requirement comes only from a constraint or a fact of `plan.md`, a decision that is also a contract (a behavior that a user or another system can see), or an answer of the user. A decision that is not a contract goes only to `design.md` → `## Decisions`. The Goal and `tasks-preview.md` alone are not sources.
- In one reply, before any write, upgrade asks: each open question that changes the specs, the approach, or the tasks; each planned requirement from the Goal or the preview, with its text; and, if no requirement is planned, a request for one. It ends the turn. If all three lists are empty, it does not ask.
- The spec step writes only the requirements of step 2. Its header no longer says "the requirements in `plan.md`".
- Scenario 7 expects the one question turn.

This revises D152 and extends D119.

**Status**: D166 removes the fact from the sources of a requirement, applies the "no requirement" rule when no requirement is left after step 2, and uses the contract definition of `GLOSSARY.md`.

**Rationale**: In the D163 verification, 2 of 3 runs wrote a requirement from the Goal with no question, and 1 of 3 wrote one from the internal decision "store the audit log in the main database". The D152 rule was the 5th sub-bullet of the spec step, the step header said "the requirements in `plan.md`", and `plan.md` has no such section. The only question turn before a write was for the open questions, so in scenario 7 the agent asked that question and then wrote everything. Archive drafts a decision as a requirement only if it is a contract (D119), but upgrade had no such filter. In the D164 verification, 3 of 3 runs asked before any write, and 0 of 3 wrote a Goal requirement without a yes or a requirement from the internal decision (`docs/facts.md`).

---

## D165: docs/todo.md Holds the Open Items

**Decision**:

- `docs/todo.md` holds each open item: the problem, the evidence, and a recommendation, but no decision yet. It copies the key evidence, because `.scenario-runs/` is git-ignored.
- To close an item, record the decision in `docs/decisions.md`, update `docs/design.md` in the same commit, and remove the item from `docs/todo.md`.
- The file table of `CLAUDE.md` and the layout of `docs/design.md` name the file.

This revises the last bullet of D151.

**Rationale**: The open items of the 627b8fb run were only in `.scenario-runs/20261105-627b8fb/summary.md`. That folder exists only on the machine that ran the scenarios, so a new session or another person could not continue the work.

---

## D166: A Fact Is Not a Source of a Requirement

**Decision**:

- Upgrade writes a requirement only from a constraint of `plan.md`, a decision that is also a contract, or an answer of the user. A fact is not a source. It is only the reason for a decision or a constraint, and it goes to `design.md` → `## Context`.
- The "no requirement" rule of the spec step applies if no requirement is left after step 2: none is planned from a source, and the user accepts none.
- Upgrade uses the contract definition of `GLOSSARY.md` and archive: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts.
- Scenario 20c uses a decision that is not a contract.

This revises D152 and D164.

**Rationale**: A review of D164 found three gaps. The template, upgrade step 2.3, and archive treat a fact only as the reason for a decision or a constraint, and archive never drafts a fact as a requirement (D135). With a fact as a source, upgrade and archive could promote the same `plan.md` in two ways. The rule "If the user gives no requirement in step 2, write no spec" had lost its old condition, so a literal agent could drop a requirement from a constraint when the user said no to a Goal requirement. Scenario 20c asked for any decision and no requirement, but since D164 a decision that is a contract is a source, so the expected "no spec" could fail. A second review found two more gaps. Upgrade defined a contract as "a behavior that a user or another system can see", so a UI layout could become a requirement in upgrade but not in archive. And "step 2 plans no requirement" was false when step 2 planned only a Goal requirement that the user then refused, so the flag was not put back, and `validate` failed.

---

## D167: A 🤖 Mark Needs a Named New Claim

**Decision**:

- Upgrade marks an item with 🤖 only if it holds a new claim: a case, a value, a behavior, a risk, a dependency, or a choice that `plan.md` and the answers of the user do not state.
- Before it marks an item, the agent names the new claim in a few words. If it cannot name one, it does not mark the item.
- A reason is also a claim type. `tasks-preview.md` is not a source, so a claim that only the preview states is new.
- The agent checks each sentence of an item, not only its main source. If one sentence holds a new claim, the item gets the mark.
- These are not new claims: other words, another form (for example a `#### Scenario:` that only restates its requirement), another artifact or section, and the code, file, or module that a `plan.md` item clearly touches.
- The skill gives examples of each side: "Table is empty" and the Why line "no trace of who changed what" get a mark, and "Columns follow the on-screen order" gets none.
- The summary lists each 🤖 item with its new claim.

This revises D163.

**Rationale**: D163 said "mark … also when it adds a detail to a `plan.md` item". Almost each restatement adds some detail, for example a WHEN/THEN form, a code location, or an effect. So the agent always found a reason to mark it. In the D164 verification and the run on 38d9a54, upgrade marked a scenario that restated its requirement, an Impact line that restated the Goal with the name of the code, and a reworded decision (todo item 14). A closed list of claim types replaces the open "adds a detail" test, so the agent checks a type and does not judge each case. The named claim in the summary makes the check visible to the user and to a scenario run. Rejected: repeat "do not mark a restatement" more strongly, because the rule was already there, and the agent read each case as an added detail. A first version had no sentence check, no reason type, and no Why example. In 6 verification runs, it removed each over-mark, but 3 of 6 runs missed a mark: two Why lines that add who and when, and a preview-only sentence inside a decision from an answer. The agent judged each item by its main source. The sentence check and the Why example close these gaps.

**Status**: Revised by D182: the one exception is an agent decision of plan.md, which keeps its 🤖.

---

## D168: Change Names of 2 to 10 Words

**Decision**:

- Propose derives a kebab-case change name of 2 to 10 words, not 2 to 5. 10 words is a soft limit: the agent goes over it only if a shorter name is not clear.
- The name starts with the main outcome. Words from the other outcomes can follow. If the name is too long, the agent removes the words of the other outcomes first.
- Scenario 22a passes `report-csv-export-user-timezone`, and fails a name that starts with the time zone fix.

This revises D80 and D161, and supersedes D149.

**Rationale**: 5 words was too short. To stay under the limit, the agent had to drop words that make the name clear. A name with words from each outcome tells more about the change. D149 banned those words, because a name from all outcomes grows past 5 words, and because it can hide the main outcome. The 10-word limit removes the first reason. The "start with the main outcome" rule and the cut order remove the second.

---

## D169: A Moved-Out Outcome Stays Out of plan.md

**Decision**: if the user moves an outcome to a separate change, propose does not write it in `plan.md`, also not in `## Non-Goals`. The summary names it, and tells the user to run `openspec-lite-propose` for it.

**Rationale**: scenario 22b failed in 3 of 4 runs on the D168 skill text. Each failed run wrote the moved-out outcome in `## Non-Goals`, for example "Upgrading the logging library in the billing service (moved to a separate change)." The skill said "leave it out of this change", and "Do not invent non-goals". The line is not invented, because it comes from the answer of the user, and it fits the Non-Goals comment "What this change will not do". So no rule stopped it. D168 changed only the name rule, so the cause is model variance that the skill did not stop. A `plan.md` holds one change only. Upgrade copies Non-Goals to `design.md`, so the line would also go to the artifacts of the wrong change. The summary already tells the user about the other outcome. Rejected: accept one Non-Goals line in scenario 22b. In 3 verification runs with the rule, 3 of 3 passed, and no `plan.md` mentions the moved-out outcome.

---

## D170: Run Metrics Read Session Totals Once

**Decision**: `scripts/run-metrics.mjs` takes Cost USD and Thinking tok from the last turn of each session. It still sums the other numbers over all turns.

This revises D146 and D162.

**Rationale**: in a `--resume` turn, `total_cost_usd` and `modelUsage` give the totals of the session up to that turn. `usage`, `num_turns`, and `duration_ms` give the values of that turn only. The script summed each turn, so it counted the earlier turns again. Each report with a `--resume` turn showed too high a cost. With the fix, the run on 38d9a54 costs 3.445 USD, not 5.643 USD. The comparisons between runs stay valid in direction, because each run had the same error, but not in size.

---

## D171: Tasks Preview and Apply Record Facts, Decisions, and Open Questions in plan.md

**Decision**:

- `openspec-lite-tasks-preview` and apply (the schema `apply.instruction`, so also stock `/opsx:apply`) write to `plan.md` during the work:
  - **Facts**: each behavior of an external service or tool that the change uses and that the agent saw in this run, with its source: a command, a doc URL, or an error text. Also each other non-obvious fact that justifies a new decision. No guess, and no fact that a reader finds in the code of the repo. The agent writes each fact when it finds it.
  - **Decisions**: each choice between real alternatives that another person could make in a different way, as "Chose X because Y. Rejected Z because W." A deviation from the preview is also such a choice. No choice that follows directly from the code or from a constraint. The agent writes each decision when it makes it.
  - **Open questions**: at the end, each point that the agent is unsure or worried about and cannot resolve, as `- OQ<n>: <question>`. In apply, an open question makes the done check fail. That is the intent: the user answers it, or moves it to Non-Goals.
- The D140 prune ("remove each fact that justifies no current decision or constraint") does not remove a fact about an external service or tool.
- Tasks preview writes to `plan.md` with no question.
- Review: at the start, the agent runs `git status --porcelain` on `plan.md`. If it prints a line, the agent says in one line that `plan.md` is not committed, and that a commit lets the user see the diff of this run. It does not stop. With no git repo, it says nothing. The end summary lists each fact, decision, and open question that the run added, changed, or removed.
- The schema version goes to 5, because `apply.instruction` and the template change (D109).

This revises D29 (apply records only the deviations), D135 (each fact justifies a decision or a constraint), and D140 (the fact prune).

**Status**: Revised by D172 (open questions, tool errors, and the fact source). Also revised by D174 (a fact about a repo file) and D177 (decisions against the code, reasons). Also revised by D178 (ask once, the note, the decisions of this run), D179 (archive), and D180 (the term, the decisions of this run). Revised by D184: one category, the non-obvious fact, replaces the external tool fact. Revised by D193: a script gives the git note.

**Rationale**: a fact about an external tool that the agent finds during the preview or apply was lost at the end of the session. The same is true for the reason of a choice that is not a deviation, and for a worry of the agent. `plan.md` is the living record of the change, and archive promotes its decisions. The plan hash covers only Goal, Background, Non-Goals, and Constraints, so these writes do not make the preview stale. Rejected: ask the user to commit or back up `plan.md` before each run, because it adds a question turn to each run, and question turns were the least stable part of the scenario runs. Rejected: mark each new item with ✨, because a mark does not show an update or a removal, and it needs rules for when it goes away and for archive to remove it. A one-line git note, the summary list, and `git diff` show the full change with no new turn.

---

## D172: Only the User Closes an Open Question, and a Tool Error Is a Fact

**Decision**:

- Before apply writes code, it asks each open question of `plan.md` in one reply, with its recommended answer, and ends the turn. If the preview is also stale, it asks both in the same reply. It does not answer an open question itself. Only an answer of the user closes a question.
- When a command, a tool, or a service gives an error or an output that makes the agent change what it does, the agent records it as a fact, with the command and the error text. This applies to the tasks preview and to apply.
- The source of a fact can be a command that the agent ran, a file that it read, a doc URL, or an error text.
- The schema stays at version 5, because version 5 is not released yet.

This revises D171.

**Rationale**: in the D171 verification, apply answered the open questions of the preview itself in 2 of 2 runs of scenario 4c. It wrote them as decisions, removed them, and passed the done check, so the user never saw them. A question in `plan.md` is a question for the user. Rejected: let apply answer and mark each answer in the summary, because the user can miss it in a long summary. In scenario 4, `node --test <dir>` failed with "Cannot find module". The agent changed the test script for this reason, but recorded no fact. The D171 rule named the examples, but not the trigger "an error that changes the work". In 2 of 2 previews, the agent read the tool file and did not run it. A file that the agent read is an honest source. Rejected: require the agent to run each tool, because the preview could then run a tool with side effects. Two facts were over-recorded (one about repo code, one from general knowledge). No rule change for them now. Check them in the next run.

**Status**: Revised by D174 (a fact about a repo file). Also revised by D178: apply asks each open question once per session, and continues. Revised by D193: no recommendation for a question that only the user can answer.

---

## D173: A Scenario Expects the Best Result for the End User

**Decision**: when we write a new scenario in `docs/test-scenarios.md`, or refine an existing one, the expected result is the most logical and useful result for the end user. It is not a copy of the current skill behavior. The author questions the skill. A scenario can fail on the current skills. Then the gap goes to `docs/todo.md`, or a new decision fixes the skill. `CLAUDE.md` holds this rule.

**Rationale**: a scenario that copies the skill behavior passes also when the skill is wrong, so it finds no defect. Examples: the D171 verification found that apply closed open questions itself, and that a tool error gave no fact. The checks passed, because they followed the skill text, not the intent for the user.

---

## D174: A Fact About a Repo File States a Behavior That the Code Does Not Show at a Glance

**Decision**: the tasks preview and apply record a fact about a file in the repo only if it states a behavior that the code does not show at a glance, for example an error that comes with exit code 0. The `## Facts` template comment says the same. The schema stays at version 5, because version 5 is not released yet.

This revises D171 and D172 ("do not record a fact that a reader finds in the code of this repo").

**Rationale**: in 3 of 5 runs of scenario 4c, the preview recorded "geo.mjs is a CLI script, not a module". The old rule banned each fact about repo code, but the tool rule allowed each fact about a tool that the change uses. The tool was in the repo, so the two rules overlapped, and the agent recorded both kinds. The new rule keeps the useful part: a behavior that a reader can miss, such as an error with a success exit. It drops the part that a reader sees in a few seconds. This closes todo item 29.

**Status**: Revised by D184: one category, the non-obvious fact, replaces the external tool fact.

---

## D175: A Script Compares the OpenSpec Version

**Decision**:

- The schema ships `openspec-version.mjs` next to `plan-hash.mjs`. Each workflow skill runs `node openspec/schemas/plan-lite/openspec-version.mjs` from the OpenSpec root, and does not compare the versions itself.
- The script reads `openspec-version` from the `schema.yaml` next to it, runs `openspec --version`, and compares the numbers. It prints one line, and exits with code 0 (in the range), 2 (outside the range, or no readable version: warn and continue), or 1 (the command fails, or no range: stop).
- The schema stays at version 5, because version 5 is not released yet.

This revises D93 (the version step of each workflow skill).

**Rationale**: in the run on 3c93237, Sonnet 5.5 said 2 times that OpenSpec 1.14.2 is outside `>=1.9.0 <2.0.0`. It probably compared the versions as text. A script gives the same result each time. Todo item 25 proposed a script next to `install.mjs`. Rejected, because the workflow skills invoke the schema skill by name and do not know its folder, which is different in each harness. The schema assets have a fixed path in the repo, as `plan-hash.mjs` does (D72). The schema check runs before the version step, so the script exists when the skill needs it. This closes todo item 25.

**Status**: Revised by D192: the skill reads the first word of the line, not the exit code.

---

## D176: Scenario 4 Runs the Tests With `node --test`

**Decision**: the step 2 answer of scenario 4 tells the agent to run the tests with `node --test`. A new check expects that the agent runs the tests before the done check, that they pass, and that the summary gives the result. The scenario allowlist does not change.

**Rationale**: the allowlist has `Bash(node:*)`, but not `npm test`. In the run on 3c93237, the agent tried `npm test` 2 times, was denied, and ended with no test run. No check caught it. For the user, a change with tests that did not run is not done (D173). Rejected: add `Bash(npm test:*)` to the allowlist, because `npm test` runs the `test` script of `package.json`, which the agent writes itself, so the allowlist would then allow any command. This closes todo item 27.

---

## D177: Apply Checks Each Decision Against the Code, and a Reason Is Not a Guess

**Decision**:

- At the end, before the done check, apply compares each decision in `## Decisions` with the code. It updates each decision that the code no longer matches. The end summary lists each changed decision, as D171 says.
- In apply and in the tasks preview, each "because" reason of a decision comes from this run, the user, or `plan.md`. The agent does not guess a reason.
- The schema stays at version 5, because version 5 is not released yet.

This revises D171.

**Rationale**: in the D172 verification, the code of 4c run 2 moved away from a decision, and the agent did not update it. It said that the change "follows directly from" the decision. The rule "update each decision that it makes stale" runs only when the agent adds a decision, so a code change alone did not trigger it. In scenario 4, a "Rejected … because" reason was a guess: "reports are not large enough to need it". A stale decision or a guessed reason goes to an ADR at archive, and misleads the next reader. This closes todo item 30.

**Status**: Revised by D178: apply updates only the decisions of this run, and plan.md wins over an older decision. Also revised by D192: a reason can come from the code or a well-known fact, and facts are checked against the code too.

---

## D178: Fixes From Review Round 1 on cb22fc4..local

**Decision**:

- Apply asks each open question only once in a session. If the user leaves a question open, apply keeps it in `## Open Questions` and continues. Without this rule, a literal agent asks again on each turn and never writes code.
- The `git status` note is the first apply rule, before the stale stop, so that the note comes in the same reply as the stale warning.
- At the end, apply updates only a decision that it made in this run. If the code does not match a decision from before this run, `plan.md` wins, and apply fixes the code. If the code cannot follow that decision, apply asks the user. This revises D177, which let the code overwrite a decision of the user.
- The tasks preview does not answer or remove an existing open question. Only an answer of the user closes a question, as in apply (D172).
- The note says: "plan.md is not committed, so git diff cannot show the changes of this run alone. Commit plan.md before the next run." The old text asked for a commit in the same turn, which the user cannot do.
- `openspec-version.mjs` exits with code 1 if the range has a part that is not `<op>X.Y.Z`, for example `^1.9.0`. Before, it read `^1.9.0` as `=1.9.0`.
- Scenarios 3, 4, and 4c: scenario 3 commits after scenario 1 and after the preview, so that only the step 3 edit is not committed. The open question checks of 4 and 4c apply only when a question exists.
- `GLOSSARY.md` and the upgrade skill use the D171 meaning of a fact. D93, D171, and D172 get Status lines.

**Rationale**: review round 1 found these gaps in the D171 to D177 text. Each fix has one logical choice.

**Status**: Revised by D181: the owner of a decision is its 🤖 mark, not the run.

---

## D179: Archive Keeps a Fact About an External Tool in an ADR

**Decision**: at archive, a fact about an external service or tool goes to the `## Context` of each drafted ADR whose decision uses that service or tool. If no drafted ADR uses it, archive drafts an ADR for the fact. Its `## Context` holds the fact and its source. Its `## Decision` says how the change handles the behavior, as the code shows. Its `## Consequences` says what a later change must keep. If the code does not handle the behavior, archive lists the fact as not drafted. The user approves each draft, as for each other ADR. Scenario 4c gets an archive step.

This revises D135 and D171.

**Rationale**: review round 1 (remark 11) found that D171 keeps a tool fact also when no decision uses it, but archive listed such a fact as "not drafted". So the fact stayed only in `openspec/changes/archive/`, and the next change did not find it. Rejected: keep it as now, because the fact is lost to a later reader. Rejected: put it in a spec, because a spec describes our system, not an external tool. The user chose the ADR.

**Status**: Revised by D184: one category, the non-obvious fact, replaces the external tool fact.

---

## D180: Fixes From Review Round 2 on cb22fc4..local

**Decision**:

- Apply removes or updates only a decision of this run when it adds a decision. It changes a decision from before this run only when the user tells it to, for example "Use a sliding window instead" in scenario 4b. On another conflict, it asks the user. The tasks preview never changes a decision from before its run. On a conflict, it records an open question. This completes D178, because the supersede rule could still remove an older decision.
- "External service or tool" is a service, a program, or a library that the change uses but does not change, also if it is in the repo. The apply rules, the tasks preview, the template, archive, and `GLOSSARY.md` give this meaning. The prune exception and the archive ADR of D179 depend on it.
- The `## Open Questions` template comment says: "Only an answer of the user closes a question."
- On a rerun, archive skips a decision or a fact that already has an ADR with `Change: <name>`, so a D179 fact ADR is not written twice.
- Scenario 3 checks that the preview summary lists the added, changed, and removed items, and that Background did not change.
- The tasks preview rules in `design.md` are sub-bullets, as in the skill.
- D135, D171, D172, and D177 get Status lines.

**Rationale**: review round 2 found these gaps. Each fix has one logical choice. The D178 fix of the decision check was incomplete. The term was used in four rules with no meaning, and scenario 4c puts its tool in the repo.

**Status**: Revised by D181: the owner of a decision is its 🤖 mark, not the run. Revised by D184: one category, the non-obvious fact, replaces the external tool fact.

---

## D181: A 🤖 Mark Shows an Agent Decision, and Fixes From Review Round 3

**Decision**:

- When apply or the tasks preview records a decision with a reason of its own, it ends the heading with 🤖. A decision that records an answer or an instruction of the user gets no 🤖. A decision with no 🤖 belongs to the user, also one that the user wrote by hand. The user removes the 🤖 to accept a decision.
- The agent updates or removes only a 🤖 decision with no question. This includes a 🤖 decision that conflicts with a constraint or with a decision with no 🤖, for example after the user corrected `plan.md`. Apply changes a decision with no 🤖 only when the user tells it to. On another conflict, it asks and ends the turn. The tasks preview records an open question instead. At the end check, apply updates a 🤖 decision that the code no longer matches, and fixes the code for a decision with no 🤖.
- Upgrade keeps the 🤖 of a decision when it moves the decision to `design.md`, because the user did not confirm it yet (D152). Archive names each draft that comes from a 🤖 decision. No spec or ADR holds a 🤖.
- The template, `GLOSSARY.md` ("Agent decision"), README, and scenarios 4, 4b, and 4c give the rule.
- Also from review round 3: the two "ask the user" rules of apply end the turn. The 4c ADR check of `## Decision` applies only to an ADR for the fact. The scenario 3 open question check applies only when a question exists.

This revises D178 and D180, which used "a decision of this run".

**Rationale**: review round 3 found that "a decision of this run" fails in two ways. Apply writes the answer of the user as a decision of this run, so it could change that answer later with no question. And after the user corrects `plan.md`, a new preview run could not replace the old preview decision. `plan.md` does not show who wrote a decision, and git cannot tell, because the user and the agent commit as the same git user. A visible mark can. The mark goes on the agent decisions, not on the user decisions, so that a decision that the user writes by hand is safe by default. A missed mark also fails safe: the agent asks. 🤖 already means "the agent wrote this, and a person did not confirm it" in upgrade (D152). Rejected: the owner from the words of the reason ("because the user answered"), because a decision that the user writes by hand has no such words. Rejected: the strict rule (never change an older decision), because each user correction then costs one more question turn. The user chose the mark.

**Status**: Revised by D182: 🤖 unless the decision records the user, the mark goes away when the agent follows the user, and propose writes no 🤖.

---

## D182: Fixes From Review Round 4 on cb22fc4..local

**Decision**:

- A decision ends with 🤖, unless it records an answer or an instruction of the user. The old words "when the reason is your own" conflicted with "each reason comes from this run, the user, or plan.md", so an agent could skip the mark.
- When the agent updates a 🤖 decision to follow an answer or an instruction of the user, it removes the 🤖. Without this, a later run could change the choice of the user with no question.
- The tasks preview, as apply, changes a decision with no 🤖 when the user tells it to in this session.
- Propose writes no 🤖, because its decisions record choices of the user.
- Upgrade: a `### Decision` from a 🤖 decision of `plan.md` keeps its 🤖, also with no new claim. This is the one exception to the D167 rule. The summary lists it as an agent decision. A requirement from a 🤖 contract decision is asked in the question turn, as a requirement from the Goal or the preview is.
- The first template `## Decisions` comment and README limit the change of a decision with no 🤖 to an answer or an instruction of the user.
- `GLOSSARY.md` ("Agent decision", "Inferred item") and scenario 7 give the upgrade rule. D152, D167, and D181 get Status lines.

This revises D152, D167, and D181.

**Rationale**: review round 4 found these gaps in the D181 text. Each fix has one logical choice. The upgrade rule keeps one meaning of 🤖 in both places: an item that the agent wrote and that a person did not confirm.

---

## D183: Fixes From Review Round 5 on cb22fc4..local

**Decision**:

- The decision rule of apply and of the tasks preview is split into three parts: record a decision, mark it with 🤖, and keep `## Decisions` current. The text does not change. The stop rule ("ask the user, and end your turn") is now in a short part, where an agent does not miss it.
- In `apply.instruction`, the rule that records the answer of the user comes directly after the rule that asks the open questions.
- The tasks preview records an answer that the user gives in this session as a decision with no 🤖, and removes the question. Before, it could not close the question, so apply asked it again.
- The tasks preview has a step 6: record the open questions in `plan.md`.
- Scenario 3 says "Do not commit this edit" in step 3, not in Expected.
- Scenario 7 adds a 🤖 contract decision by hand after the preview, so that the D182 checks can fail.
- `GLOSSARY.md`: archive keeps a tool fact in an ADR only if the code handles the behavior.

**Rationale**: review round 5 found these gaps. Each fix has one logical choice. After 4 rounds, the decision rule had 22 sentences in one bullet.

---

## D184: A Plan Records Facts That Back a Decision, and Non-Obvious Facts

**Decision**:

- `## Facts` records a fact that backs a decision or a constraint, and each non-obvious fact. Each fact gives its source: a command or a test that the agent ran, the files that it analyzed, a doc URL, a log, or an error text.
- A non-obvious fact needs one of these to find: a run or a test result; research of remote sources, for example documentation on the internet, another repo, logs, or a remote database; a long analysis of the code; or other work that is worth an agent to find it.
- `## Facts` does not record a guess, a fact that a reader can easily deduce from the code, or numbers and statistics that soon go out of date. A number as a reference or an example is OK.
- The prune keeps a non-obvious fact, also when no decision uses it. Archive puts a non-obvious fact into the `## Context` of each drafted ADR that it relates to, or drafts an ADR for it. If the change does not depend on the fact, archive lists it as not drafted.
- The term "external service or tool" leaves the rules and `GLOSSARY.md`. `GLOSSARY.md` gets "Non-obvious fact", with "Tool fact" in its _Avoid_ list.
- Scenario 4b has two facts that justify only the old decision: an obvious one, which the prune removes, and a non-obvious one, which stays.
- The schema stays at version 5, because version 5 is not released yet.

This revises D135, D171, D174, D179, and D180.

**Rationale**: the user defined the content of `## Facts`. The old rules had three special cases: a behavior of an external tool, a tool error, and a fact about a repo file that the code does not show at a glance. Each one is a kind of fact that costs work to find again. One category with one definition gives one rule in each skill, and also covers a test result, a log study, and a long code analysis. The user agreed that the prune and archive keep each non-obvious fact, and that each fact keeps its source.

**Status**: Revised by D192: `## Facts` holds only non-obvious facts. An obvious or well-known fact goes into the because part.

---

## D185: Fixes From Review Round 6 on cb22fc4..local

**Decision**:

- Scenario 4c checks the error-body fact only when the rules of D184 ask for it: when a decision of the preview says how `lookup` finds an unknown city, or when the agent ran the tool. A fact that a reader can easily deduce from the short `tools/geo.mjs` is not a non-obvious fact, so a correct run can record no fact. The rule does not change.
- The archive filter list gets a fourth filter, "Non-obvious fact", with the D184 meaning. Before, the filter "Non-obvious" meant "a reader cannot deduce it from the code in 5 minutes", so a D184 fact could fail step 3, and the step 4 rule never kept it.
- `design.md`: the upgrade text says "A fact is not a source of a requirement", as the skill does. The propose, tasks preview, and archive headings list their newer decisions.
- README: "a decision or a constraint", as in each other place.

**Rationale**: review round 6 found these gaps after D184. Each fix has one logical choice. For the 4c check, D184 is the rule of the user, and D173 says that a scenario expects the best result for the user. Here the best result is the D184 result.

**Status**: Revised by D186: a run of the tool alone does not make the 4c fact non-obvious.

---

## D186: Fixes From Review Round 7 on cb22fc4..local

**Decision**:

- A fact that a reader can easily deduce from the code is not recorded, also if the agent found it with a run. The fact rule of apply and of the tasks preview says so. Scenario 4c checks the error-body fact only when a decision of the preview uses it.
- Scenario 4 checks the D182 rule: each decision that the agent wrote ends with 🤖, unless it records an answer or an instruction of the user, also when its reason comes from `plan.md`.
- `design.md` headings and lists name D178 to D186 where their text cites them.

This revises D185.

**Rationale**: review round 7 found that D185 let a run make a fact non-obvious, but the shipped rule says not to record a fact that a reader can easily deduce from the code. The user defined a non-obvious fact as one that "requires" a run or a test result. A fact that the code shows does not require a run, so the code rule wins. The other two fixes have one choice each.

---

## D187: Fixes From Review Round 8 on cb22fc4..local

**Decision**:

- Scenario 4c step 4 expects the error-body fact in the `## Context` of the ADR of the decision that calls `tools/geo.mjs`, only when archive drafts that ADR. Otherwise, archive lists the fact as not drafted. After D186, the fact is not a non-obvious fact, so archive drafts no ADR for the fact itself.
- README describes the D184 facts of `plan.md`, and the four archive filters of D185.

**Rationale**: review round 8 found that the 4c check could fail on a correct archive, and that README did not follow D184 and D185. Each fix has one logical choice.

---

## D188: Fixes From Review Round 9 on cb22fc4..local

**Decision**:

- The definition of a non-obvious fact says: "A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found it." It is in each copy of the definition: apply, the tasks preview, archive (step 3 and step 4), the template, `GLOSSARY.md`, README, and `design.md`. Before, only the "Do not record" sentence had it, so archive and the prune could still keep such a fact as non-obvious.
- Scenario 4c uses one name for the decision that the error-body fact backs: the decision on how `lookup` finds an unknown city. Its title is now "Preview and apply record a fact that backs a decision".
- New scenario 4d checks a real non-obvious fact: with no spec, `openspec validate --specs` exits with code 0. Only a run shows it.

This completes D186.

**Rationale**: review round 9 found that D186 changed the record rule but not the definition, that 4c named its decision in three ways, and that no scenario tested a real non-obvious fact after D186. The 4d fact is in `docs/facts.md`, so the answer key is known. Each fix has one logical choice.

---

## D189: Fix From Review Round 10 on cb22fc4..local

**Decision**: the constraint of scenario 4d names the command: "Use `openspec validate --specs` to check the specs."

**Rationale**: review round 10 found that "use the `openspec` CLI to find the specs" allows `openspec list --specs --json`, which prints `"specs": []`. A correct run with that command never meets the validate fact, so the 4d fact checks fail. With the command named, the agent must learn its exit code with no spec, which only a run shows (`docs/facts.md`).

---

## D190: The Scenarios Check the Results That the User Needs

**Decision**: an audit of `docs/test-scenarios.md` against D173 found checks that copy a skill mechanic, checks that cannot fail, and user results that no check covers. The scenario text changes, and no skill changes:

- Checks of the user result: 2 checks that the typo is fixed. 4, 4b, 4c, and 4d check that the code works. 7 checks that the content of `plan.md` arrives in `specs/` and `design.md`. 5 and 13a check the content of the drafts and of the end state. 12 checks that the agent does not invent a Goal. 21a checks that an unrelated ADR does not change.
- Fixes: 14 accepts both delta forms in its end state. 3 has a negative step that can fail. 1 and 6 lose their process checks, and gain the user results: no invented content, a note on the `config.yaml` change, and a warning that rejected decisions stay only in the archive folder. 17b checks a warning about the open question.
- 16b and 16c are removed. They could not fail. The gap that they recorded is todo item 31.

Some new checks can fail on the current skills. D173 says that this is correct when the skill is wrong.

**Rationale**: the audit found that the scenarios check the plan-lite mechanics well, but rarely check that the code works or that the content of `plan.md` arrives in the artifacts. These are the main results for the user. The audit also found six expected results that follow a skill rule that hurts the user (scenarios 15, 22c, 20a, 20c, 18, and 19). Each one changes a skill, so the user decides each one separately.

---

## D191: Six Skill Rules Change for the Result of the User

**Status**: Item 4 revised by D193: the summary comes before the prune question, in the same reply.

**Decision**:

1. Archive puts a fact that justifies a requirement into the requirement text, as its reason. Example: "… a header row of the column names, because the finance import reads the columns by name." Before, it listed such a fact as not drafted.
2. When the archive done check says "no" and the user answers no to "Archive anyway?", archive gives two paths for each outcome or constraint that is not met: implement it with `openspec-lite-apply`, or remove it from `plan.md` and propose it as a separate change. It tells the user to answer each open question that is left. The hint "to keep an item that is not in `plan.md`, add it to `plan.md` first" stays as an extra line. The question is still only "Archive anyway?" (D155).
3. Upgrade puts each open question that the user cannot answer also into `tasks.md`, as a `## 0. Open questions` group before the first group. The question also stays in `plan.md`.
4. Upgrade runs `openspec validate` before the prune question. It shows the result with the prune list in one reply. If `validate` failed, it recommends to keep `plan.md`. The turn still ends at the question, and the summary comes after the answer (D132).
5. After the ADR copy of a spec-driven change, archive asks: "Archive the change now with `openspec archive <name> --yes`?" It names the unchecked tasks of `tasks.md` in the same question, because `--yes` skips the CLI prompt for them (`docs/facts.md`). On yes, it runs the command.
6. The upgrade resume question says what is left to do, with no step number: "The upgrade of <name> wrote the artifacts, and `plan.md` still exists. Finish the upgrade now: validate the artifacts, then decide what to delete from `plan.md`?"

The scenarios 15, 18, 18b, 19, 20a, 20c, and 22c, `design.md`, and README follow.

This revises D107, D132, D133, D137, D154, and D155.

**Rationale**: the scenario audit of D190 found six expected results that follow a skill rule that hurts the user. The user decided each one. (1) The finance fact is the real contract of the header row: a rename breaks the import, a new order does not. (2) The old hint answered only the need to add an item, but in scenario 22c the item is in `plan.md` and is not done. (3) The stock skills do not read `plan.md`, so after the upgrade, stock apply never saw the question. (4) With the old order, the user deleted `plan.md` before anyone knew if the artifacts passed. Then a new upgrade run could not help, because upgrade refuses a spec-driven change with no `plan.md`. D132 fixed a summary that came too early, not the place of `validate`. (5) The user asked to archive, and had to start a second skill. (6) The user does not know the step numbers of the skill.

**Status**: Revised by D192: the archive offer does not run while a delta holds a 🤖.

---

## D192: Fixes From the Scenario Run on 80d076b

**Decision**:

1. `## Facts` holds only non-obvious facts. An obvious fact (one that a reader can easily deduce from the code) or a well-known fact is not recorded. If it is the reason of a decision, a constraint, or a non-goal, the agent writes it in the "because" part of that item. The user chose this (todo item 36).
2. A reason can come from this run, the user, `plan.md`, the code, or a well-known fact. A guess is still not a reason. The user chose this (todo item 39).
3. A sentence that states a choice, for example "the script must read the item count", is a decision, not a fact (item 37).
4. At the end, apply compares each fact with the code, and updates or removes each fact that is no longer true (item 38).
5. When apply changes a behavior, it writes or updates a test that fails if the behavior breaks, and runs the tests before the done check (item 40).
6. After the ADR copy of a spec-driven change, archive lists each 🤖 line of `specs/` and `design.md`. It does not offer the archive while a delta in `specs/` holds a 🤖, because `openspec archive` copies the mark into the main spec (item 32).
7. Archive names only the drafts of decisions whose heading ends with 🤖. If no decision has 🤖, it says nothing about marks (item 33).
8. The version step runs `openspec-version.mjs` alone, and reads the first word of the line (`ok:`, `warn:`, `fail:`), not the exit code (item 34).
9. The end summary copies the `status:`, `backup:`, and `copied:` lines of `install.mjs` as they are (item 28).
10. The upgrade prune question is the last line of its reply (item 35).
11. The apply guard names each open question of a `plan.md` that still exists on a spec-driven change (item 41).
12. `git status --porcelain` runs alone, not in a chain (item 42). The archive example of a reason in a requirement is from another domain than scenario 15, so that the scenario can test the rule.

The scenarios 4, 4b, 4c, 5, 18b, and 20a, the headless notes, `design.md`, `GLOSSARY.md`, and README follow. The schema stays at version 5, because version 5 is not released yet.

This revises D175, D177, D184, and D191.

**Rationale**: the scenario run on 80d076b found these gaps (todo items 28 and 32 to 42). The user decided items 36 and 39. Each other fix has one logical choice. Item 32 was caused by D191: the offer ran the CLI archive, and an unconfirmed claim reached the main spec.

**Status**: Revised by D193 (item 10: the prune reply holds the summary).

---

## D193: The Prune Reply Holds the Summary, a Script Gives the Git Note, and Fixes From the Rerun on dd7ad75

**Status**: Item 5 revised by D200: scenario 4c puts the error-body reason in the "because" part, also if a run showed it.

**Decision**:

1. Upgrade writes one reply in this order: the `validate` result, the summary, the list of `plan.md` destinations, and last the prune question. The summary does not say that `plan.md` is deleted or kept. The turn ends at the question. After the answer, upgrade says in one line what it deleted or kept, and does not write the summary again. The user chose this.
2. The schema ships `plan-status.mjs`. It runs `git status --porcelain` on `plan.md`, and prints the "not committed" note, or nothing. Apply and the tasks preview run it alone, and copy its line. The user chose this.
3. For an open question that only the user can answer, for example where some code is, apply gives no recommendation, and says why. The user chose this.
4. Archive after an upgrade: it does not remove a 🤖 itself, it names each open question of a kept `plan.md`, and it searches again before each reply that says what holds a 🤖.
5. Scenarios: 5 accepts a true "no 🤖" line. 4c accepts the error-body reason in the "because" part of the decision, if no run showed it. 4d checks that apply writes a test. 18b adds a 🤖 scenario to the delta by hand, so that the 🤖 block is always tested. 3, 7, 20a, and 20c check the new rules.

The schema stays at version 5, because version 5 is not released yet.

This revises D132, D171, D172, and D192.

**Rationale**: the rerun on dd7ad75 found these gaps (todo items 43 to 47). (1) The summary came after the prune question in about 5 of 10 prune turns, and no wording fixed it. D132 was made to stop a question that got lost or never came. With the question as the last line, it does not get lost, and the user sees the review list before the delete. (2) The agent read the `git status` output wrong 3 times in one rerun: a missed change and two false notes. A script gives the same result each time, as `openspec-version.mjs` does for the version (D175). (3) A recommendation for a question that only the user can answer is a guess, which D177 forbids. (4) and (5) have one logical choice each.


## D194: A Reason With No Source Says "Reason Not Checked"

**Decision**: apply and the tasks preview give a reason only from this run, the user, `plan.md`, the code, or a well-known fact. A claim about how a tool, a runtime, or a platform behaves is not a well-known fact. It needs a run or a doc as its source. If no source supports a reason, the agent writes "Reason not checked." in its place. A guessed wish of the user is also a guess. A 🤖 mark does not excuse a guess or a false reason. Scenario 4 checks this.

This revises D177 and D192.

**Rationale**: in the run on 5aa0025, 2 of 2 runs of scenario 4 gave 🤖 decisions a reason with no source: "a `package.json` is not wanted", and the false "`"type": "module"` makes files load as ES modules in both Node and the browser" (todo item 48). The agent treated a claim about a runtime as a well-known fact. A claim of this kind is easy to get wrong, and a run or a doc can check it. "Reason not checked." tells the reviewer what to check, and a guess hides it.

## D195: Only the Question That Only the User Can Answer Has No Recommendation

**Decision**: when apply asks the open questions, it gives no recommendation only for a question that only the user can answer, and says why. It gives a recommendation for each other question. Scenario 4 checks this.

This revises D193 item 3.

**Rationale**: in the scenario 4 rerun on 5aa0025, apply gave no recommendation for any of three open questions. Only one of them (where the page is) needs the user. The other two had a clear recommendation, which run 1 gave (todo item 49). The D193 rule did not say that it applies to one question, not to the reply.

## D196: Upgrade Checks the Pointers to a Kept Open Question, and the Resume Question Ends the Turn

**Status**: Wording of item 1 revised by D200: the task is the only place of a kept question in the artifacts. The question also stays in `plan.md`.

**Decision**:

1. After upgrade writes `tasks.md`, it reads `proposal.md` and `design.md` again. It removes each sentence that restates a kept open question, or points to it, for example "See the open questions in tasks.md" or "See task 0.2". This also applies to a question that the tasks preview added. The task in `## 0. Open questions` is the only place of a kept question.
2. The resume question of the upgrade guard ends the turn. `validate` waits for the answer. On no, upgrade names each open question that stays in `plan.md`, and stops.

Scenarios 19 and 20a check this.

This revises D133 and D191.

**Rationale**: in the run on 5aa0025, `design.md` held a note that points to a kept open question in 2 of 2 runs of 20a, and in group C. `proposal.md` → Impact held one too. The D133 rule is one sentence in the `design.md` step, and the stock `design` instruction asks for risks, so the agent puts an open risk there. A separate check after all artifacts finds the pointer in each file. In 1 of 2 runs of 20a, upgrade skipped the resume question and ran `validate`. In 19-3, after "no", it did not name the open question that stays in `plan.md`, which the stock skills do not read (todo item 52).

## D197: A Script Gives the Exit Code of a Command

**Decision**: the schema ships `exit-code.mjs`. `node exit-code.mjs <command> [args...]` runs the command with no shell, shows its output, and prints `exit: <code>` as the last line. It always exits with code 0. Apply and the tasks preview use it to know the exit code of a command, alone, not in a chain. They do not add `echo $?`. If the agent did not get an exit code, it records nothing about it. Scenarios 4c and 4d check this. The schema stays at version 5, because version 5 is not released yet.

**Rationale**: in the run on 5aa0025, the allowlist denied each `echo $?` form. In 4d-1, the preview then wrote the fact "The exit code was not checked". In 4c-2, a decision relied on an error body with no exit code fact (todo item 53). The allowlist allows `node`, and many user setups allow it too. A script gives the code in the same form each time, as `plan-status.mjs` does for the git note (D193).

## D198: A Run Alone Does Not Make a Fact Non-Obvious

**Decision**: a run is necessary for a non-obvious fact of this kind, but not enough. If a reader can see the result in the code or in the file list, the fact is obvious, also if a run found it. For example, what a script prints when its code shows it, or which files exist, is obvious. `apply.instruction`, the tasks preview, the `## Facts` template comment, and `GLOSSARY.md` say this. Scenario 4c checks it.

This revises D184 and D186.

**Rationale**: in the run on 5aa0025, 2 of 4 runs of group I wrote a fact that only repeats the code or an `ls` result: 4c-1 "a CLI script with no exports ... prints JSON", and 4d-2 a file list (todo item 54). The template comment begins with "A non-obvious fact needs a run", and the agent read it as "each run result is a non-obvious fact". The rule "also if a run found it" was in the skill text, but not in the template, which the agent reads with `plan.md`.

## D199: Each Scenario Run Is Isolated, and a Chained Scenario Starts From a Fixture

**Decision**:

1. Each scenario run starts in a new temp folder and a new agent session. It does not start from the output of another scenario, and it does not copy or clone the folder of an earlier run. `--resume` is only for the answers inside one scenario.
2. A scenario that needs an earlier state starts from a fixed fixture in `tests/fixtures/scenarios/`: `after-propose` (scenarios 3 and 16a), `after-preview` (scenario 4), and `after-upgrade` with `kept-plan.md` (scenarios 17, 17b, 18, 18b, and 19). The fixtures come from real runs on 743a6f3, cleaned by hand: the obvious fact of the preview is removed (D198), and the delta holds the 🤖 scenario "Table is empty".
3. `scripts/scenario-setup.sh <label> [fixture]` builds the start state. It commits with the neutral message "setup". A run never writes to `tests/fixtures/`. A test checks that the preview of `after-preview` is current.
4. Scenario 4 now gives a fixed answer to each of the three open questions of the fixture. Scenario 18b runs archive in its own session, not as the next turn of scenario 18.

The user chose this.

**Rationale**: scenarios 3, 4, 16a, 17, 18, 18b, and 19 ran on the output of scenario 1 or 7, and scenario 4 shared a session with scenario 3. So the start state of each run differed: on 5aa0025 and 743a6f3, propose and the preview wrote two or three open questions, with or without a fact, and upgrade wrote two or three decisions, with or without a 🤖. The 18b failure on 5aa0025 and its pass on 743a6f3 came with no change to the archive skill, so the start state can explain it. One rerun of scenario 4 on 5aa0025 was a `git clone` of the first run, so the two runs were not independent. On 5aa0025, one group overwrote a shared start state with its own output. With a fixed fixture, each scenario tests only its own skill, and two runs start from the same files. Scenarios 4c, 4d, and 20a already used fixed start states, and they gave the most stable results.

## D200: Fixes From Review Round 11 on cb22fc4..local

**Decision**:

1. The rule "record an error or an output that makes you change what you do" yields to the code rule. If a reader can see the same output in the code, it is an obvious fact, and goes into the "because" part of the item that it justifies. `apply.instruction` and the tasks preview say this.
2. Scenario 4c checks this obvious path. The error body and the exit 0 of the 3-line `tools/geo.mjs` go into the "because" part of the decision, not into `## Facts`, also if a run showed them. Its title is now "Preview and apply put an obvious reason in the decision". Scenario 4d covers a fact that only a run shows. The user chose this.
3. Scenario 18b checks that `design.md`, the specs, and `.openspec.yaml` did not change after step 3, not at the end. Step 4 removes the 🤖 marks, and the archive moves the change.
4. Scenario 3, step 5 starts from the fixture `after-preview` in a new folder and a new session (D199).
5. Scenario 4c, step 3 expects the "not committed" note only if step 2 changed `plan.md`.
6. Upgrade step 2.4: the `## 0. Open questions` group applies with and without a preview.
7. Upgrade step 2.5: the `## 0. Open questions` task is the only place of a kept question in the artifacts. The question also stays in `plan.md`.

This revises D172, D193, D196, and D198.

**Rationale**: review round 11 found these gaps. (1) Two fact rules disagreed on code-visible output. D185 and D198 already chose the code rule. (2) With the old 4c text, a run that put an obvious fact in `## Facts` passed. The user chose the obvious path over a new fixture, because 4d already tests a non-obvious fact. (3) to (7) each have one logical fix: a check that a correct run fails, a step that conflicts with D199, a check that ignores a case, and two upgrade sentences that an agent can misread.

## D201: Fixes From Review Round 12 on cb22fc4..local

**Decision**:

1. The D198 rule says "A run alone is not enough" in each place. "A run is necessary" was wrong: research, a long analysis, or other work can also find a non-obvious fact.
2. The first rule of `apply.instruction` defines the OpenSpec root as the folder that holds `openspec/`. Stock `/opsx:apply` reads only this text.
3. Archive step 1: on no to "Archive anyway?", archive gives the paths, then stops. "No other options" applies only to the question.
4. Scenario 4: the tool-error check has the D200 exception for output that the code shows.
5. Scenario 3: the Expected bullets name their step, in step order. Step 5 checks only that there is no stale warning, because no rule asks the agent to say that the preview is current.
6. Scenario 4c works also when the preview writes no open question.

This revises D191, D198, and D200.

**Rationale**: review round 12 found these gaps. Each has one logical fix: a rule that contradicts the definition before it, a term that the first rule uses before it is defined, two sentences that an agent can read in two ways, and three checks that a correct run fails.

## D202: Fixes From Review Round 13 on cb22fc4..local

**Decision**:

1. Propose, Level 1: on yes, the agent makes the fix directly, with no change and no file under `openspec/`. "Do not write code" has this one exception. D190 already made scenario 2 check that the typo is fixed.
2. The skills that run `openspec-lite-schema` copy the `config.yaml` line of its report too, not only the lines of `install.mjs`.
3. Archive and `README.md` use the D198 and D200 wording: a run alone is not enough, and code-visible output is not a non-obvious fact.
4. `exit-code.mjs` uses a shell on Windows only, as `openspec-version.mjs` does, so that it can start `.cmd` shims such as `openspec.cmd`.
5. Scenario 4b starts from the new fixture `rate-limit`, the start state of the earlier runs. `scripts/scenario-setup.sh` copies the whole fixture folder, not only `openspec/`.
6. Scenarios 3 and 4c accept no recommendation for a question that only the user can answer (D195). Scenarios 4 and 4c do not answer a stale-preview question that the fixtures do not cause. Scenario 4d works when apply asks no question. Scenario 5 has a decision with no 🤖.

This revises D68, D197, D199, and D201.

**Rationale**: review round 13 found these gaps. Each has one logical fix. The Level 1 rule "Write no files" contradicted the question "Implement directly?" and the scenario 2 check that the user approved in D190. The other items are a list that an agent can read as complete, two places with an old wording, a script that cannot start the main command on Windows, an under-specified start state, and checks that a correct run fails.

## D203: Fixes From Review Round 14 on cb22fc4..local

**Decision**:

1. The propose section of `docs/design.md` has the D202 exception to "Do not write code".
2. Archive drafts an ADR for a non-obvious fact only if no drafted ADR holds it, and no drafted requirement holds it as its reason. D191 already puts such a fact in the requirement text, as scenario 15 expects for F2.
3. Scenario 18b step 4 gives the message "I removed the marks.", because archive asks the archive question only after a new user message.
4. Scenarios 5, 6, 13a, and 13b start from the new fixture `finished-rate-limit`, the start state of the earlier runs. The 13a helper is now `scripts/break-delta.sh`, in the repo.
5. The headless notes name 7 and 21b as the scenarios that need an interrupt. 13b needs none.

This revises D191, D199, and D202.

**Rationale**: review round 14 found these gaps. Each has one logical fix: a design bullet that round 13 did not update, an archive rule that asks for an ADR that scenario 15 does not expect, a step that skips a user turn, four scenarios with no defined start state under D199, and a wrong list. The start state and the helper were only in the git-ignored `.scenario-runs/` folder.

## D204: Fixes From Review Round 15 on cb22fc4..local

**Decision**:

1. Archive step 6 names each draft from a 🤖 decision, in `plan.md` or, on the guard path, in `design.md`. Scenario 18b checks that the draft reply names "Quote each cell".
2. Scenario 4 expects the `openspec-lite-archive` hint only if the done check passes, as `apply.instruction` says.
3. The archive end summary says that a rejected decision now exists only in `openspec/changes/archive/`. Scenario 6 already expected this, but no rule asked for it.
4. If archive asks "Archive anyway?" and the scenario gives no answer for it, the tester answers yes. This is one isolation rule at the top of `docs/test-scenarios.md`.
5. Scenario 13a starts `<path-to-this-repo>/scripts/break-delta.sh` from the temp folder, and answers "Delete it." when run 2 asks about the broken delta of run 1.

This revises D181, D191, D199, and D203.

**Rationale**: review round 15 found these gaps. Each has one logical fix: a rule with two wordings that skips the 🤖 decisions of the guard path, a check that a correct run fails, a scenario result with no rule behind it, archive scenarios with no answer for a question that their code state always causes, and a helper that cannot start from the temp folder.

## D205: Fixes From Review Round 16 on cb22fc4..local

**Decision**:

1. The upgrade summary in `docs/design.md` follows the skill. It names each `plan.md` item that has no slot. It does not say what happens after a "no" to the delete, because the summary comes before the prune question (D193).
2. In `apply.instruction`, the exit-code-1 check of `plan-hash.mjs` comes directly after the command, before the stale check, as in the tasks preview. On exit 1, the output is empty, so the stale check would ask a wrong question.
3. Scenario 20b answers yes to "Archive anyway?" first, then picks the toolbar item, in the order of the archive turns.
4. Scenarios 4c and 4d write `plan.md` from the template, because `plan-hash.mjs` exits with code 1 when a heading is missing.
5. The fixture `finished-rate-limit` has the guidance comments of the current template.

This revises D193, D199, and D203.

**Rationale**: review round 16 found these gaps. Each has one logical fix: two design sentences that contradict the order of D193, two rules in the wrong order, a step in an order that cannot happen, a start state that makes a correct run fail, and a fixture with comments of an old rule.

## D206: Fixes From Review Round 17 on cb22fc4..local

**Decision**:

1. Upgrade keeps each `plan.md` content that is in no artifact. It lists the content as "kept, in no artifact", and a yes to the prune question does not delete it. The summary names it, and says that the user can ask to add it to an artifact. The prune reply has one question. The user chose this.
2. `docs/design.md` follows the current rules: 18b offers the archive after the ADRs (D191, D192), and the release list names only 16a, with the other stock-archive cases as known gaps (D190). D154 and D191 have **Status** lines.
3. Archive step 4 has the full non-obvious fact rule of step 3: "the code or the file list", and "a run alone is not enough". `docs/design.md` follows.
4. Scenario 20a gives the answer "I do not know yet" for each open question in step 2, where upgrade asks them.
5. The repo layout tree of `docs/design.md` lists each test file and `scripts/break-delta.sh`.
6. The 4b check on the reason of a user decision stays as it is, and depends on todo item 57. The item now names this check.

This revises D120, D154, D191, D193, and D198.

**Rationale**: review round 17 found these gaps. In upgrade, the offer to add content came in the same reply as the prune question, which must be the last line (D193). The user chose to keep the content: no data is lost, and the reply has one question. The other items have one logical fix each, or wait for item 57.

## D207: Fixes From Review Round 18 on cb22fc4..local

**Decision**:

1. Scenario 4c checks the error-body reason only if `plan.md` has a decision on how `lookup` finds an unknown city.
2. Upgrade step 2.4 puts in `## 0. Open questions` only each question that step 2 asked and that the user could not answer. A question that is safe to answer later goes to `design.md` only.
3. Scenarios 13a and 13b give the draft approval of run 2.
4. Scenario 7 step 3 starts from the new fixture `interrupted-upgrade`, in a new folder and a new session. It is the state after an upgrade stopped right after `proposal.md`, from the run on 743a6f3. In a headless run, step 2 ends after the question turn.

This revises D191, D199, D203, and D206.

**Rationale**: review round 18 found these gaps. Each has one logical fix: a check that is required in one line and optional in two others, a rule that also matches a question that step 2 never asks, two reruns with no answer for a question that always comes, and a start state that the tester had to guess. The fixture follows D199.

## D208: Upgrade Removes `skip_specs` Just Before the First Spec Write, and a Resumed Run Asks Again

**Decision**:

1. Upgrade keeps the `skip_specs: true` line until it writes the first delta. Just before it runs `openspec instructions specs` for the first delta, it removes the line. With no requirement, it never removes the line. The step numbers of the skill stay the same.
2. A resumed upgrade run asks the step 2 questions again before it writes a missing artifact, because the answers of the earlier session are not on disk.
3. Scenario 7 checks that `skip_specs: true` is still set after the question turn, and that step 3 asks the question turn again. The fixture `interrupted-upgrade` has the line. Step 3 answers the fixture question about the report page. Scenario 20c checks that upgrade keeps the line.

The user chose item 1.

This revises D99, D108, D160, and D207.

**Rationale**: in the run on f5422dd, scenario 7 failed in 2 of 2 runs: the agent kept the flag through the question turn, against step 2.1 (todo item 60). The agent order is better for the user: if the user stops at the question turn with no flag and no delta, `validate` fails with `CHANGE_NO_DELTAS`. In 1 of 2 runs, step 3 wrote a requirement from the Goal with no question. Step 3 is a new session, so the answers of step 2 exist only in the old session. To ask again is the only way to keep the D164 rule on a resumed run.

## D209: The Archive Done Check Searches From the Git Root

**Decision**: the archive done check gets the git root with `git rev-parse --show-toplevel` as its own command. Then it searches with `git -C <git root> grep <word>`. A command substitution such as `$(...)` is not used, because it causes a permission prompt. Scenario 21b checks that the done check passes when the repo holds committed code that meets the Goal.

**Rationale**: in 21b on f5422dd, a `cd openspec && …` stayed in effect, so `git grep` searched only `openspec/`. The agent told the user that the repo has no rate-limit code, but `src/rateLimit.js` was committed (todo item 62). A `cd` stays in effect inside a turn and into the next `--resume` turn (`docs/facts.md`). The default "yes" to "Archive anyway?" hid the false warning, so 21b needs its own check.

## D210: The Upgrade Summary Lists Only the Files That It Wrote, and "None" Is a Valid Requirement Answer

**Decision**:

1. The upgrade summary lists the files that upgrade wrote, and `tasks-preview.md` if it deleted it. It does not name `plan.md` in this list, as deleted or as kept. Step 5.4 says what happens to `plan.md` after the answer.
2. If upgrade plans no requirement, it asks if the change has one. "None" is a valid answer, and then upgrade writes no spec. Scenario 20c checks that the question does not say that upgrade cannot go on.

This revises D164 and D193.

**Rationale**: the rule "the summary does not say that `plan.md` is deleted or kept" was only in step 5.3. Section 3 said "List the files that you wrote and deleted", which pushed the agent to write "Not deleted: `plan.md`" in 3 of 5 prune replies on f5422dd and 765cdec (todo item 61). The words "ask the user for at least one" made the agent say "I can't proceed without one", but step 2.2 allows no spec. Each item has one logical fix.

## D211: Preview and Apply Check Each New Fact at the End

**Decision**: at the end, the tasks preview and apply check each fact that they added in the run. They read the code or the file list that the fact is about. If a reader can see the fact there, it is obvious, also after a run. They move it to the "because" part of the item that it justifies, or remove it. The fact rules stay as they are.

This revises D198 and D200.

**Rationale**: on f5422dd and 765cdec, each preview of 4c that ran `tools/geo.mjs` wrote its error body and exit 0 in `## Facts`, and each preview that only read the file wrote none (todo item 65). The rule "A run alone is not enough" was there in both cases. At the time of the run, the agent sees the run as the source. A check at the end looks at the fact again, next to the code, after the run. Apply already compares each fact with the code at the end, so the check adds one question to an existing step.

## D212: Apply and the Preview Read the Output of `plan-hash.mjs`, Not Its Exit Code

**Decision**: if `plan-hash.mjs` prints a message that starts with `plan-hash:` and no hash, apply and the tasks preview show the message and stop. They do not need the exit code. The script does not change: on an error, it prints only the message on stderr and exits with code 1.

This revises D93 and D205.

**Rationale**: the rule "if it exits with code 1" made the agent add `echo "$?"` to the command in 5 of 6 applies over f5422dd and 765cdec, and the allowlist denied it. The output alone tells the two cases apart: a 64-character hash, or a `plan-hash:` message. So the rule needs no exit code and no `exit-code.mjs`.

## D213: A Manual Run Is Not a Test, and a Test of a Replaced Behavior Fails on the Old One

**Decision**: in `apply.instruction`, a manual run is not a test. Apply writes the test in a file that the test command of the repo runs. If the repo has no test setup, apply adds the smallest one that needs no new dependency, for example `node:test` for JavaScript. If the change replaces an old behavior, the test must also fail on the old behavior. Scenarios 4b and 4d already check both.

This revises D192.

**Rationale**: 4d wrote no test in 3 of 4 runs over 743a6f3 and f5422dd, with "the repo has no test setup" or "I checked it by hand". In 4b on 5aa0025, the sliding-window test also passed on the fixed window that it replaced (todo item 50). The D192 rule did not name these two cases.

## D214: Apply Records Each Choice of the Code, and a User Decision Holds Only What the User Said

**Decision**: in the end check of `apply.instruction`, apply also looks for each choice between real alternatives that the code makes and that no decision records, for example a module system, a file format, or a line ending. It records each one as a 🤖 decision. It also checks each decision with no 🤖: such a decision holds only what the user said. Apply moves each choice that it added to it into its own 🤖 decision. Scenarios 4 and 4b check this.

This revises D181 and D182.

**Rationale**: in scenario 4 on 5aa0025 and 743a6f3, apply put its own choices ("ES modules", "download it through a Blob") into a user decision, where the 🤖 rule cannot flag them (todo item 57). On f5422dd, it chose `"type": "module"` and CRLF line ends and recorded no decision (todo item 64). A decision with no 🤖 belongs to the user (D181), so an agent choice in it hides from the review. The 4b check already expected this. The other part of item 64, a code change against a user decision in 4d-2, already has a rule: ask the user, and end the turn. It stays in item 66 as an observation.

## D215: The Archive Guard Path Has a Rule for "No" to the ADR Offer, and No Question With a Condition

**Decision**:

1. On the guard path, if the user says no to the ADR offer, archive tells the user to run stock `/opsx:archive`, and stops. It does not offer the `openspec archive` command itself.
2. While a delta holds a 🤖, archive asks no archive question, also not with a condition, such as "Do you want me to archive after you remove the marks?". It asks the user to remove the marks, and ends the turn.
3. Scenario 18 counts an offer to copy as "says to copy them". Scenario 18b checks item 2.

This revises D154, D191, and D192.

**Rationale**: in the run on f5422dd, scenario 18 run 1 offered its own `openspec archive --yes` after "no" to the ADR offer, but the skill had a rule only for "no" to the archive question. Scenario 18b run 1 asked "Do you want me to run it then?" while a delta held a 🤖 (todo item 66). The CLI copies a 🤖 into the main spec, so a yes there loses the review. Each item has one logical fix.

## D216: The End Check Records Only the Choices That a User or Another Program Sees

**Decision**: the D214 end check of `apply.instruction` reads the code that apply wrote. It records as a 🤖 decision each choice that changes what a user or another program sees, and that no decision records: the output format (a line ending, the quoting), the file layout, a public interface, or the module system. An internal detail, for example how a browser downloads a file, needs no decision. Scenario 4 follows: it no longer names the download method. The user chose this.

This revises D214.

**Rationale**: on 26c58ea, scenario 4 failed 2 of 2 runs, because apply did not record the Blob download, and in one run the CRLF line ends (todo item 67). The D214 text "each choice between real alternatives" and the scenario example "a download method" made each internal detail a decision. That makes `plan.md` long, and a reviewer cannot find the choices that matter. A line ending changes the file that a spreadsheet reads, so it stays in scope. The end check also now reads the code, not only the reply, because the missed choices were only in the code.

## D217: A Decision Is a Choice That a Consumer Sees, or a Close Call, and Never a Plumbing Detail

**Decision**: one rule defines a decision in `apply.instruction` and in the tasks-preview skill. The agent makes a decision when it weighs two or more options and picks one. It records the decision in `## Decisions` when one of these is true:

1. A user or another program sees the result, for example a UI, a public interface, a function signature, a data format, a file name or path, a config key, an error message, or a new dependency.
2. The options are close, and no option is a clear winner.

It does not record a plumbing detail: an internal detail that it can change later with no effect outside its module. A close call on a plumbing detail is also not recorded. The user chose this.

The end check of apply no longer has its own list. It reads the code, finds each decision of this rule that `## Decisions` does not hold, and records it as a 🤖 decision. The rule "a decision with no 🤖 holds only what the user said" moves to the 🤖 rule, and the end check keeps a short reminder. The schema `version` goes from 5 to 6.

This revises D214 and D216.

**Rationale**: the D216 examples (a line ending, the quoting, the module system, how a browser downloads a file) all came from the CSV export of scenario 4. They taught the agent to look for things like a CSV file, not to ask whether a consumer sees the choice. Also, the rule during the run still used the wide D214 text "each choice between real alternatives", so it disagreed with the end check. Now both use one rule, with examples that apply to each project. A scenario cannot see the hesitation of the model, only `plan.md`. So scenario 4 checks criterion 1 with confidence, and criterion 2 only as a soft check.

## D218: A Decision Is Recorded When It Changes a Visible Result, and It Holds Only That Part

**Decision**: in the decision rule of `apply.instruction` and of the tasks-preview skill:

1. The first criterion is: "Record a decision when it changes a visible result: a UI, a public interface, the input or output of a program, a function signature, a data format, a file name or path, a config key, an error message, or a new dependency." The user wrote this text.
2. "The input or output of a program" covers both directions: what the code gives to others, and what it reads from another program, for example a field of the JSON output of `openspec`.
3. A recorded decision holds only the part that changes the visible result, or that makes the options close. A plumbing part stays in the code.

The text says "result", not "outcome", because the glossary gives "outcome" another meaning. The schema stays at version 6, because version 6 is not yet released. The user chose this.

This revises D217. It closes todo item 69.

**Rationale**: "a user or another program sees the result" was not clear. In the run on bdd9b0e, 4d-2 picked the field `summary.totals.items` of `openspec validate --specs --json` and recorded no decision. No user sees that field, but a new OpenSpec version can break the script. Also, 3 of 6 applies put a plumbing part into a visible decision, for example "Download as `report.csv` through a Blob link", so the reviewer still read plumbing.

## D219: Two Criteria for a Decision: a Visible Result That the Agent Picked, or a Close Call

**Decision**: the decision rule of `apply.instruction` and of the tasks-preview skill records a decision when one of these is true:

1. The agent picked something that changes a visible result. The list of D218 stays, and the path item becomes "a file name or path that a user or another program uses". The agent picked it when `plan.md`, the user, and the constraints do not fix it. This test uses the source of the thing, not the thinking of the agent.
2. The agent weighed two or more close options, and no option was a clear winner, also for an internal choice.

The agent records no other choice. A decision holds only the part that matches 1 or 2. The plumbing rule and "Do not record a choice that follows directly from the code or from a constraint" are removed: plumbing is hard to tell apart from other internal choices, and the source test of 1 covers the second sentence. The end check of apply reads each file that apply added or changed, and finds each thing that matches 1 and that no decision holds. It does not check 2, because the code does not show which options were close. The user chose this.

This revises D217 and D218. It closes todo item 72.

**Rationale**: in the rerun on a71a5eb, apply missed a visible choice in 5 of 8 runs: a page path, a filter and sort UI, a 429 body, and an env var. The D218 rule started with "You make a decision when you weigh two or more options". The agent picks a page path with no thought of other options, so by the letter of the rule it made no decision, and the end check found nothing. Only the agent at the moment of a choice knows that it weighed options, so criterion 2 can be checked only then, and a scenario can check it only as a soft check.

## D220: Criterion 1 Says "and plan.md and the User Did Not Say It", and Names the Result on an Error

**Decision**: in the decision rule of `apply.instruction` and of the tasks-preview skill:

1. Criterion 1 reads: "you put something in the code that changes a visible result, and plan.md and the user did not say it: …". The separate sentence "You picked it when plan.md, the user, and the constraints do not fix it." is removed.
2. The list of criterion 1 ends with "or the result on an error or an edge case, for example a status code, an exit code, an error message, or a thrown error".
3. After "Record only the part of the decision that matches (1) or (2).", the rule adds: "If you need an internal detail to explain the reason, write it in the "because" part, not in the title or in "Chose X"."

Scenarios 4b and 4d now check the results on an error. The user chose this.

This revises D219. It closes todo item 74.

**Rationale**: in the rerun on 5eaf25d, the separate sentence read like a third criterion. In 4d-3, apply read it in reverse: "You didn't ask for that, so it isn't recorded". "Fix" also meant "set" there and "repair" in the end check. Apply missed the result on an error in each scenario: the 429 and 401 bodies, an exit 2 path, and a throw. "An error message" alone did not make the agent check the other error results. In 4 of 4 runs of 4c, D1 named `execFileSync`, but the agent often needs such a detail to explain the reason.

## D221: The End Summary Shows a Table of Each Added 🤖 Decision and Its Criterion

**Decision**: at the end of apply and of the tasks preview, after the list of changed items, the agent shows a table of each 🤖 decision that it added: `| Decision | Criterion | Why |`. Criterion is (1) or (2) of the decision rule. Why is the visible result for (1), or the close options for (2). If a 🤖 decision matches neither, the agent removes it from `plan.md`, and does not list it. Scenario 4 checks the table. The user chose this.

This revises D171. It closes todo item 76.

**Rationale**: in the rerun on b299124, no run of scenario 4 read its files again in the end check, and 4 of 4 runs of 4c kept a decision about the call method. A step that only says "read" or "record only the part" is easy to skip. A table that the user sees makes the agent check each decision against the two criteria, and it shows the reviewer why each 🤖 decision is there. The user asked for a table of decisions, not of files.

## D222: A File Name Is a Decision Only When Something Refers to It, and a Choice That plan.md Does Not Say Is Recorded

**Decision**: in criterion 1 of the decision rule of `apply.instruction` and of the tasks-preview skill:

1. The item "a file name or path that a user or another program uses" becomes "a file name or path that another program, a config, or a doc refers to".
2. After the list, the rule adds: "If plan.md and the user did not say it, it is your choice: record it."

Scenario 4 no longer expects a decision for the file name of the new page. The user chose this.

This revises D220. It closes todo items 78 and 79.

**Rationale**: in the rerun on 98e421c, scenario 4 failed in 4 of 4 runs only on the page file name. The user answer gives the folder `src/`, the reviewer sees the file name in the diff, and nothing refers to a new scaffold page. Such a decision makes `plan.md` long and hides the choices that matter. A file name that another program, a config, or a doc refers to is a contract, so it stays. In 4d-2 on 98e421c and in 4d-3 on 5eaf25d, apply said "That fallback isn't in the plan." and "You didn't ask for that", and recorded no decision. The positive sentence gives the direction of the rule.

## D223: A Question Is Open Only While the Agent Cannot Decide It or Find Its Answer

**Decision**: in apply and in the tasks preview:

1. A question is open only while the agent cannot decide it and cannot find its answer, for example because only the user has the information.
2. If the agent can decide a point, also when no option is a clear winner, it records a 🤖 decision, and does not also record the point as a question.
3. Before apply writes code, it tries to resolve each open question from the code, the docs, or a run. It records each answer that it finds as a fact with its source, or as a 🤖 decision, and removes the question. It asks only the questions that are still open. The tasks preview does the same for an existing question.
4. The agent keeps a question that the user said to keep open, also if it can decide it later.
5. The answer of the user to a question is a decision with no 🤖, as before.

The sentences "Only an answer of the user closes a question." and "Do not answer an open question yourself." are removed. The `plan.md` template comment of `## Open Questions` changes, also in the scenario fixtures. The user chose this.

This revises D172 and D183.

**Rationale**: in the 4d-3 preview on 98e421c, the agent wrote OQ1 and also D2 🤖 about the same point, so `plan.md` said both "the user must decide" and "decided". The user said that a question exists only because the agent cannot decide it or lacks the information. When the agent can decide, the question is no longer open. D172 forbade this, because in its verification the user did not see the answers of the agent. Since then, D181 marks each agent decision with 🤖, which the user must accept, and D221 lists each added 🤖 decision in a table of the end summary. So the user still sees each answer.

## D224: The Tasks Preview Records What It Plans for the Code

**Decision**: in the decision rule of the tasks-preview skill, criterion 1 starts with "you plan something for the code that changes a visible result", not "you put something in the code". The apply rule keeps "put something in the code". The preview has no rule to look for each edge case: apply records each one that the preview misses. The user chose this.

This revises D220 for the tasks preview.

**Rationale**: the preview writes no code, so "put something in the code" did not apply to it by the letter. On 98e421c, 2 of 4 previews of 4d did not plan the exit code for a tool failure (4 of 4 on b299124). In 4d-3, apply recorded it as a 🤖 decision, so apply is the safety net.

## D225: Fixes From Review Round 1 on 99d8656..local

**Decision**:

1. A deviation from the preview is a decision only when it matches criterion (1) or (2). The sentence "A meaningful deviation from the preview … is also a decision." is removed. The user chose this.
2. "You cannot decide a question when its answer depends on information that only the user has, for example an intent, a priority, or where some code is." Apply asks such a question with a recommended answer. It gives no recommendation only when the answer is a fact that only the user knows. This keeps D193 and D195 with D223.
3. A 🤖 decision that answers an open question stays in the end table, with "open question" as its criterion.
4. The stale-preview question goes in the same reply as the open questions, and then apply ends the turn.
5. The end step keeps each question that the user said to keep open. "Resolve" is replaced by "decide or find the answer".
6. The tasks preview tries to answer each existing open question before it writes the tasks, and records each new question after it writes the preview.
7. "A function signature" becomes "the signature of an exported function". "Do not record other choices" becomes "Do not record your other choices".
8. The hash sentence of the end summary comes right after the list that it refers to.
9. Scenario 4: the download file name is an output of the program. Step 2 gives only the answers to the questions that apply asks. A later user answer replaces a 🤖 decision on the same point. OQ2 depends on an intent of the user.
10. `GLOSSARY.md` has entries for Decision, Visible result, and Open question. README describes the decision table and the closed questions.

This revises D219, D221, D223, and D224.

**Rationale**: review round 1 found 15 remarks. Remark 2 had two options, and the user chose. Each other remark had one logical fix. Item 2 follows the split that the user agreed to for D223: a close call is a 🤖 decision, and a point that needs information of the user is a question.

## D226: Fixes From Review Round 2 on 99d8656..local, a Split of User Answers, and Source Emojis for Facts

**Decision**:

1. When the user answers a question, the agent splits the answer as well as it can. Each fact goes to `## Facts`, with 👤 and "Source: the user". Each choice or instruction goes to `## Decisions`, with no 🤖. A wrong split is acceptable, as long as the answer is recorded. An answer of the user is now a valid source of a non-obvious fact. The user chose this.
2. Each fact text starts with one source emoji: 👤 the user, 📖 documentation, 🎫 a ticket, 📊 an external report, 🌐 online research or a community, 🔬 a test run or a probe, 🔍 a long analysis of the code. The source in words stays. No scenario checks the emoji. `## Facts` still holds no guess and no well-known fact, so no fact gets 🤖, and 🤖 keeps one meaning. The user chose this, also 🔍.
3. The stale-preview step does the open-question step first, then asks both in one reply.
4. A non-obvious answer to a question is a fact. An obvious answer goes into the end summary, where the agent lists the removed question.
5. "A priority" is removed from the examples of "information that only the user has", because a close call is a 🤖 decision (D223).
6. "If you can decide a point" records a 🤖 decision only when the decision rule records it.
7. Before the end summary, the agent removes each added 🤖 decision that answers no question and matches no criterion, and each fact that justified only it. Then it lists and shows the table.
8. Criterion 1 is a sub-list. The file-name item says "in the repo".
9. "Resolve" is gone from the template, README, and scenarios. The GLOSSARY entries name the exceptions of D225. The README sentence about the table is in the Decisions bullet.
10. Scenario 4 step 2 always gives the stack. Scenario 4d uses "plan.md and the user did not say".
11. Remark 15 is not applied: propose writes no agent decision (scenario 1), and the tasks preview answers the existing questions before it writes the tasks (D225).

This revises D172, D184, D219, D223, and D225.

**Rationale**: review round 2 found 15 remarks. Remark 11 asked where a fact in a user answer goes, and the user chose the split and the emojis. Each other remark had one logical fix, or no fix, as for remark 15.

**Status**: Revised by D262 item 8. Scenario 4 no longer accepts a constraint for a build choice.

## D227: Fixes From Review Round 3 on 99d8656..local

**Decision**:

1. A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to it. Archive, GLOSSARY, `docs/design.md`, and README list "an answer of the user" as a source of a non-obvious fact.
2. The agent writes a fact so that it stays true after the change, for example "Before this change, the report page did not exist."
3. The agent does not change an existing fact only to add an emoji. The user chose this.
4. Archive keeps the source emoji when it copies a fact into an ADR. Upgrade keeps it in `design.md`. The user chose this.
5. Apply first checks the preview hash, then tries to answer the open questions, and then asks the stale question and the open questions in one reply.
6. "Where some code is" is information of the user only when a search of the repo does not find it.
7. The end summary gives the answer of each removed question. The removal step before the summary no longer removes facts, because each fact left there is non-obvious.
8. The Mark rule puts an added choice in its own 🤖 decision only when the decision rule records it.
9. The emoji labels are the same in the skills, the template, and GLOSSARY. The template comment of `## Open Questions` names the kept questions and the obvious answers.
10. Propose names the source emoji and the split of a user answer.
11. Scenario 4 gives the expected result for OQ1, OQ2, and OQ3, and a user fact that stays true.

This revises D184, D223, D225, and D226.

**Rationale**: review round 3 found 17 remarks. Remarks 8 and 10 had two options each, and the user chose. Each other remark had one logical fix.

## D228: Fixes From Review Round 4 on 99d8656..local

**Decision**:

1. A stale preview stops the code only until the user answers. If the user says to continue from `plan.md`, apply writes the code. If the user says to regenerate, apply tells the user to run `openspec-lite-tasks-preview`, and ends its turn.
2. A question that the user said to keep open ends with "(kept open by the user)" in `plan.md`. A later session of apply, the preview, or upgrade keeps such a question. The template comment names the marker.
3. Archive step 4 lists "an answer of the user" as a source of a non-obvious fact, and says that a 👤 fact is always non-obvious.
4. The end check of apply and step 4 of the preview skip a 👤 fact by name.
5. The file-name item of criterion 1 says "outside this change", so a test import or a `<script src>` of the same change makes no decision.
6. Upgrade tries to decide or find the answer to each open question before its question turn, as apply does. A found answer goes to `design.md` → `## Context`, and a decided point is a decision with 🤖 in `design.md`. It asks only the questions that are still open.
7. `docs/design.md` and GLOSSARY match the fact rules of D227 and the emoji labels.

This revises D164, D223, D225, and D227.

**Rationale**: review round 4 found 8 remarks. Each remark had one logical fix. Item 2 makes the keep-open rule of D223 work across sessions, because a session cannot see an answer of an earlier session. Item 6 applies the rule of D223 to the last skill that asked each question with no try first.

## D229: Fixes From Review Round 5 on 99d8656..local

**Decision**:

1. When the user says to keep a question open, the agent also adds "(kept open by the user)" to it. A later session does not ask such a question again, and continues.
2. On "regenerate", apply first records the answers of the user to the open questions, gives the end summary of its edits to `plan.md`, and then tells the user to run the tasks preview.
3. If upgrade decides an open question and the decided point is a contract, upgrade asks its requirement, as for a 🤖 decision of `plan.md`.
4. In propose, a rule in an answer of the user that the change must follow is a constraint, not a decision.
5. Criterion 1 says that a name that the program gives to its output, for example a download file name, is an output of the program.
6. The end table and scenario 4 allow the criterion "open question".
7. Scenario 4b accepts a 🤖 decision or an open question for the API-key header, because only the user knows how the existing clients send the key. Step 2 gives an answer for that question. The user chose this.
8. GLOSSARY "Visible result" and the tasks-preview section of `docs/design.md` match the text of D228.

This revises D221, D222, D226, and D228.

**Rationale**: review round 5 found 9 remarks. Remark 7 had two options, and the user chose. Each other remark had one logical fix.

## D230: Fixes From Review Loop 2, Round 1, on 99d8656..local

**Decision**:

1. If apply finds a new point during the work that it cannot decide and cannot find the answer to, it records an open question before it writes the code that depends on it, asks it with a recommended answer, and ends its turn. The user chose this.
2. Apply does not count a question with the "(kept open by the user)" marker when it decides to ask and end its turn.
3. If a kept question is left at the done check, apply tells the user to answer it in the next message. Archive says the same.
4. Upgrade keeps a kept question also if it can decide it, and puts it in `## 0. Open questions` of `tasks.md`. Upgrade splits an answer of the user as apply does: a fact goes to `design.md` → `## Context` with 👤.
5. The tasks preview does the fact check and the 🤖 decision check before it writes `tasks-preview.md`.
6. Criterion 1 says "a key in a config file that a program or a user reads, for example a field of `package.json` or an env var", in place of "a config key".
7. Scenario 4c accepts a fact with 👤 or a decision with no 🤖 for an answer.

This revises D223, D226, D228, and D229.

**Rationale**: review loop 2, round 1 found 8 remarks. Remark 4 had two options, and the user chose. Each other remark had one logical fix.

## D231: Fixes From Review Loop 2, Round 2, on 99d8656..local

**Decision**:

1. An obvious fact goes into the "because" part of the decision that it justifies. If it justifies only a constraint or a non-goal, the agent does not record it, because an edit of those sections makes the preview stale.
2. The item "the input or output of a program" also names "the output of another tool that the code reads, for example a field of its JSON output" (D218).
3. A new point found during the work gets no recommendation when its answer is a fact that only the user knows.
4. When apply ends its turn to ask, the same reply gives the answer of each question that it closed.
5. In upgrade, a question with the marker goes to `## 0. Open questions` only when it changes the specs, the approach, or the tasks. Step 2.5 names "a question of `## 0. Open questions`", not "a kept question".
6. The fact rule of the preview names "the fact check of "4. End"". The tasks-preview section of `docs/design.md` runs both checks before the preview file.
7. Scenario 4c accepts a 👤 fact for an answer. Scenario 4d accepts only a 🤖 decision for the output that the script reads.
8. Remark 9 needs no change: archive drafts an ADR for a 👤 fact only if the change depends on it.

This revises D184, D218, D228, and D230.

**Rationale**: review loop 2, round 2 found 10 remarks. Each one had one logical fix, or no fix.

## D232: Fixes From Review Loop 2, Round 3, on 99d8656..local

**Decision**:

1. The `## Facts` template comment, GLOSSARY, README, and `docs/design.md` put an obvious fact only in the "because" part of a decision (D231 item 1).
2. `docs/design.md` matches the skills for propose (source emoji, split of a user answer), upgrade (source emoji, split, marked questions in `## 0`), and archive (source emoji in an ADR, a 👤 fact is non-obvious, the left-question path).
3. Apply and the preview handle a question with "(kept open by the user)" first, before they try to decide the other questions. In apply, the recommendation rule comes before "End your turn".
4. A 👤 fact skips only the obvious-fact check. The other checks still apply, for example the check of a fact that is no longer true.
5. The preview names its "Fact check" and "🤖 decision check". Step 5 runs them before the preview file, and section 4 runs them again for each item that the run added after step 5.
6. Propose records a user fact with 👤 and "Source: the user".
7. For a question that is left at its done check, archive tells the user to run `openspec-lite-apply` with the answer.

This revises D227, D230, and D231.

**Rationale**: review loop 2, round 3 found 7 remarks. Each one had one logical fix. Remarks 1 and 2 were text that the fixes of D226 to D231 did not reach.

## D233: Fixes From Review Loop 2, Round 4, on 99d8656..local

**Decision**:

1. If apply records a new open question at the end, it asks it in the end reply, with its recommended answer, except when the answer is a fact that only the user knows. The done check tells the user to answer each open question that is left, not only a marked one.
2. Apply and the preview keep a marked question, unless the user answers it now.
3. Upgrade step 2.5 names "each question of `## 0`" as the question whose only place is the task.
4. Upgrade puts a found answer in `design.md` → `## Context` only when it is a non-obvious fact. An obvious answer goes only to the summary.
5. Propose decides no open point, because it does not explore the code: it records each one as an open question, and the tasks preview tries to decide it. Propose writes a fact so that it stays true after the change.
6. Scenarios 4c and 4d give the tester an answer for a question that has no recommendation: keep it open.

This revises D223, D227, D228, D230, and D231.

**Rationale**: review loop 2, round 4 found 7 remarks. Each one had one logical fix.

## D234: Fixes From Review Loop 2, Round 5, on 99d8656..local

**Decision**:

1. Apply does not write the code that depends on a question with "(kept open by the user)". The done check names the part of the Goal that waits for its answer. In the tasks preview, a task that depends on a kept question says that it waits for the answer. The user chose this.
2. When apply, the preview, or upgrade decides an open question, it records a 🤖 decision only when the decision rule records it. If not, it records no decision, and gives the answer in the end summary. So the 🤖 decision check has no exception for an answer to a question, and the table criterion is (1) or (2) only. The user chose this. This revises D225 item 3 and D229 item 6.
3. The template comment of `## Open Questions` and GLOSSARY say that propose records each open point, and that apply, the preview, and upgrade keep only a point that they cannot decide. The answer of a question goes to another section of the plan, or only to the summary.
4. The upgrade question turn gives a recommended answer for each open question, except when the answer is a fact that only the user knows. The same reply gives the answer of each question that it closed.
5. Scenario 4c checks the branch where the user keeps the first question open. Scenario 4b accepts a question about the API-key header before apply writes the code that reads the key.
6. `docs/design.md` names "a question of `## 0. Open questions`" in the upgrade pointer check (D231 item 5).

This revises D221, D225, D229, D231, and D233.

**Rationale**: review loop 2, round 5 found 7 remarks. Remarks 1 and 2 had two or more options each, and the user chose. Each other remark had one logical fix.

## D235: `apply.instruction` Is Six Ordered Steps and Separate Rules

**Decision**: `apply.instruction` in `schema.yaml` is split like a program into small functions:

1. Six steps, in the order of the work: Start, Check the preview, Close the open questions before you write code, Write the code, Check plan.md against the code, End.
2. Separate rules that the steps name: question rule, answer rule, decision rule, decision format, mark rule, current-decisions rule, fact rule, fact format, exit-code rule, test rule, ID rule.
3. Each bullet holds one instruction or one short group of related sentences. A list of items is a sub-list.

The rules do not change. Each rule of D217 to D234 is still in the text. The text is longer (about 2,600 words in place of 2,400), but its longest line has 57 words in place of 511. The user chose this.

This revises the form of the text of D171 to D234. It does not revise their content.

**Rationale**: many bullets had become walls of text, and an agent or a reader could miss a rule in them. Review rounds found order errors, for example the stale question that ended the turn before the open-question step. A fixed order of steps makes the flow clear, and a named rule can be used by more than one step, for example the question rule in steps 3, 4, and 5.

## D236: The Tasks-Preview Skill Is Eight Ordered Steps and Separate Rules

**Decision**: sections 2 to 4 of `openspec-lite-tasks-preview/SKILL.md` follow the form of D235:

1. Eight steps, in the order of the work: Check plan.md, Start, Explore and close the open questions, Get the plan hash, Check plan.md, Write the preview, Record the new open questions, End.
2. Separate rules that the steps name: plan.md rule, preview rule, question rule, answer rule, decision rule, decision format, mark rule, current-decisions rule, fact rule, fact format, exit-code rule, ID rule. The rule names are the same as in `apply.instruction`.
3. Each bullet holds one instruction or one short group of related sentences.

The rules do not change. The longest line has 47 words in place of 486. Section 1, "Common checks", does not change, because four skills hold the same text, and a change in one skill only makes them drift. The user chose this.

This revises the form of the text of D171 to D234. It does not revise their content.

**Rationale**: the same as for D235. The preview and apply now use the same rule names, so a reader can compare the two skills rule by rule.

## D237: The Common Checks Are Shared Blocks With Small Bullets, and a Test Keeps Them Equal

**Decision**:

1. Section 1, "Common checks", of apply, archive, tasks-preview, and upgrade has four blocks in this order: `### OpenSpec root`, `### Change selection`, `### Guard`, `### Schema check`. Propose has `### OpenSpec root` and `### Schema check` in its section 2.
2. The OpenSpec root, Change selection, and Schema check blocks are the same text in each skill that has them. Each bullet holds one instruction, and each case is a sub-bullet.
3. The Guard block is different in each skill, as before, and now uses small bullets too. The archive guard path is a numbered list of six steps.
4. `tests/skills.test.mjs` fails if one copy of a shared block differs from the others.

The rules do not change. The user chose this.

This revises the form of the text of D93, D99, D110, D131, D162, and later decisions on the common checks. It does not revise their content.

**Rationale**: the four copies were long bullets of up to 200 words, and no test kept them equal, so a fix in one skill could miss the others. A shared block with a test is like one function that each skill calls.

## D238: The Archive and Upgrade Bodies Use Small Bullets, With the Same Step Numbers

**Decision**:

1. Section 2 of `openspec-lite-archive` and of `openspec-lite-upgrade` keeps each step number, because the guard path, `docs/design.md`, and the scenarios refer to them, for example "step 10" or "step 2.4".
2. Each long step is split into small bullets and sub-bullets. Each bullet holds one instruction, and each case is a sub-bullet.
3. Upgrade step 2 has named parts in bold, in the order of the work: requirement sources, open questions, question turn, IDs, inferred items, write the artifacts. Then the artifact list 2.1 to 2.5 follows.
4. Archive step 3 holds the only copy of the list of sources of a non-obvious fact. Step 4 no longer repeats it.

The rules do not change. The longest line of archive has 50 words in place of 208, and the longest line of upgrade has 60 in place of 171. The user chose this.

This revises the form of the text of the archive and upgrade decisions. It does not revise their content.

**Rationale**: the same as for D235 and D237.

## D239: Fixes From Review Loop 3, Round 1, on 99d8656..local

**Decision**:

1. Apply and the tasks preview say that each rule applies in each step where its topic comes up, also when the step does not name it. Each answer of the user to an open question uses the answer rule, in each step. Step 4 of apply and step 3 of the preview name the decision format, the mark rule, the current-decisions rule, the fact format, and the exit-code rule. Apply step 4 names the ID rule.
2. The archive guard path names "section 2, step 6", "section 2, step 10", and "section 2, steps 7 to 9", because the guard path has its own step 6.
3. Upgrade plans a decided open question as a 🤖 decision only when it changes a visible result or was a close call. Otherwise, the answer goes only to the summary (D234). `docs/design.md` says the same for upgrade and the tasks preview.
4. Apply step 5 checks the open questions before it checks each added 🤖 decision, so the 🤖 check also covers a decision that the open-question check added.
5. The ID rule of apply gives a new item a number higher than each ID of its kind in the file, as the preview does.
6. Scenarios 4 and 4c accept an answer that is only in the end summary. Scenario 4c says that apply writes the code that depends on no kept question.

This revises D234, D235, D236, and D237.

**Rationale**: review loop 3, round 1 found 7 remarks. Each one had one logical fix. Remarks 1, 2, and 6 came from the refactor of D235 to D237.

## D240: Fixes From Review Loop 3, Round 2, on 99d8656..local

**Decision**:

1. In apply, a rule in an answer of the user that the change must follow goes to `## Constraints`, as in propose. The end summary says that this edit makes the preview stale. The tasks preview cannot edit `## Constraints`, so it records such a rule as a decision with no 🤖, and says in the summary that the user can move it. The user chose this. This revises D226 and D229.
2. In upgrade, a fact with a source, for example a run, a doc, or an analysis of the code, is not inferred. It gets no 🤖 in `design.md`, and it keeps its source emoji. The user chose this. This revises D152 for facts.
3. Upgrade names where the question rule, the decision rule, and the answer rule are: in `apply.instruction` of `openspec/schemas/plan-lite/schema.yaml`. At the prune, a question that step 2 closed has the destination "closed", and a yes deletes it.
4. In apply step 3, a question that the user did not answer stays open, and apply writes no code that depends on it. If the preview is not stale, and no question is left to ask, apply goes to step 4.
5. Apply step 5 checks the facts last, because the decision check and the open-question check can add facts.
6. In the tasks preview, a task that depends on any open question says that it waits for the answer. Step 7 adds this note for a new question. Step 8 asks each new question with a recommended answer.
7. `docs/design.md` names `tests/skills.test.mjs` in section 2a.

This revises D226, D229, D234, D235, D236, D237, and D239.

**Rationale**: review loop 3, round 2 found 8 remarks. Remarks 3 and 7 had two options each, and the user chose. Each other remark had one logical fix.

## D241: The Glossary Defines a Constraint, and the Template Tells It From a Decision

**Decision**:

1. `GLOSSARY.md` has a **Constraint** entry. A constraint is a rule that the implementation must follow, from the user, a ticket, or the platform. It is not a choice.
2. The `## Constraints` comment of the `plan.md` template gives the test: if the result breaks the rule, the change is not done. A choice of how to meet the goal is a decision.
3. Schema version 6 is not released yet, so this template edit needs no new bump.

**Rationale**: the user asked how a constraint differs from a decision. The glossary defined only a decision, and the template comment did not show the difference. An agent can then record a rule of the user as a decision, or a choice as a constraint.

## D242: Fixes From Review Loop 3, Round 3, on 99d8656..local

**Decision**:

1. The answer rule of apply and of the tasks preview applies to each reply of the user that answers an open question or gives a fact, a rule, or a choice for the change. Apply gives a test: a rule is a limit that each part of the code must obey, for example "add no npm dependency". A choice picks one option for one part, for example "use a sliding window". The other option of the review, to let scenario 4 accept a decision for a rule, was rejected, because it undoes D240.
2. The answer rule of apply holds the "(kept open by the user)" marker, so it works for a question of each step, not only of step 3.
3. Upgrade writes each part of a split answer to an artifact, not to `plan.md`. A rule that the change must follow goes to the specs as a requirement, because an answer of the user is a requirement source.
4. In upgrade, a kept question that is safe to answer later goes to `design.md` → `## Open Questions`, like each other such question, and it stays in `plan.md`.
5. Propose removes a question that the user answered.
6. If the late check of tasks-preview step 8 moves or removes an item that a task names, the preview updates that task.
7. Scenario 4b accepts a constraint for an answer.

This revises D226, D229, D230, D236, and D240.

**Rationale**: review loop 3, round 3 found 7 remarks. Each one had one logical fix. For remarks 1 and 4, the review gave two options, but one option of each undid an earlier choice of the user.

## D243: Fixes From Review Loop 3, Round 4, on 99d8656..local

**Decision**:

1. The decision of review loop 3, round 3 is D242, because another session wrote D241 (the Constraint entry of GLOSSARY) in the meantime.
2. Apply, the tasks preview, propose, and upgrade use the one test of D241 to tell a rule from a choice: if the result breaks it, the change is not done. A choice of how to meet the goal is a decision.
3. If apply adds a constraint, the end summary lists it with its ID. Only if a preview exists, the summary says that the edit makes it stale, and that the next run of apply asks to regenerate it.
4. Upgrade sends a rule from an answer to the specs only when it is a contract. Otherwise, the rule goes to `design.md` → `## Context`, like a constraint.
5. In step 2, upgrade edits `plan.md` only to add the "(kept open by the user)" marker. A closed question stays in `plan.md` until the prune.
6. When the user answers a question that a task of the preview waits for, the preview removes the note from that task.
7. Propose adds the "(kept open by the user)" marker when the user keeps a question open.
8. Scenario 4c accepts a constraint for an answer. `docs/design.md` matches the preview and upgrade rules of D240 and D242.

This revises D240 and D242.

**Rationale**: review loop 3, round 4 found 9 remarks. Each one had one logical fix. For remark 2, the test of D241 from the user's other session is the one test.

## D244: Fixes From Review Loop 3, Round 5, on 99d8656..local

**Decision**:

1. Apply step 4 applies the ID rule to each file other than `plan.md` and `tasks-preview.md`, and to a commit message, not to a reply. The end summary keeps the IDs (D142 covers files only).
2. In upgrade, a rule from an answer of the user is a requirement source, like a constraint of `plan.md` (D164, D166). This revises D243 item 4. A choice from an answer goes to the specs only when it is a contract, else to `## Decisions`.
3. Apply step 3 goes to step 4 after it records the answers when the preview is not stale. If the preview is stale and the user does not answer the stale question, apply asks it again.
4. The done check of apply names the part of the Goal that waits for each open question, not only for a kept one.
5. When the user answers a question that a task of the preview waits for, the preview also changes the task to follow the answer. If the user moves a rule to `## Constraints`, the preview tells the user that it is stale.
6. Step 8 of the preview asks each open question that is still open, also an existing one, but not a kept question.
7. Archive keeps the source emoji when a fact goes into a requirement text, as the user chose for D227.
8. Scenario 4 accepts a decision or a constraint for "create it in this repo", because both readings pass the test of D241, and the user said that a wrong split is acceptable while the answer is recorded (D226). Scenario 4c accepts a constraint in each bullet.

This revises D226, D227, D239, D240, D242, and D243.

**Rationale**: review loop 3, round 5 found 10 remarks. Each one had one logical fix, or an earlier choice of the user decided it.

**Status**: Revised by D262 item 8. Scenario 4 no longer accepts a constraint for a build choice.

## D245: The Propose Skill Uses Small Bullets and Named Rules

**Decision**:

1. Section 1 of `openspec-lite-propose` has three blocks: `### Main outcome`, `### Split check`, and `### Level 1 question`. Each case is a sub-bullet.
2. Section 3 keeps its five numbered steps, with sub-bullets. Step 5 names five rules after it: goal rule, question rule, answer rule, fact rule, and decision rule. The names match the rules of apply and of the tasks preview.
3. Section 5 has sub-bullets.
4. Section 2 holds the shared blocks of D237, and section 4 is a short list, so both do not change.

The rules do not change. The longest line of the skill outside the shared blocks has 40 words or fewer, in place of 212. The user chose this.

This revises the form of the text of the propose decisions. It does not revise their content.

**Rationale**: the same as for D235 to D238. Propose was the last skill with long paragraphs.

## D246: Scenario 3 Accepts the Plan-Status Note in Other Words

**Decision**: scenario 3, step 4, passes when apply tells the user the two facts of the `plan-status.mjs` line: `plan.md` is not committed, so a diff cannot show the changes of this run alone, and the user must commit it before the next run. The exact line or the same facts in other words both pass. The skill keeps "copy the line to the user as it is" as the preferred behavior. The user chose this.

This revises the scenario check of D171 and D193. It closes todo item 89.

**Rationale**: in the run on a98437d, 2 of 2 runs of scenario 3 gave both facts in other words, and failed only for that. The rule text did not change in the refactor of D235, so this is variance of the model. A word-for-word copy helps the user only when the exact text matters, and here it does not. The expected result must be the best one for the user, not a copy of the skill text (CLAUDE.md).

## D247: Only an Explicit "Keep It Open" Adds the Kept-Open Marker

**Decision**: apply, the tasks preview, propose, and upgrade add "(kept open by the user)" to a question only when the user says to keep it open, for example "keep it open" or "leave it open". An answer such as "I do not know yet" leaves the question open with no marker. In upgrade, a question that the user cannot answer now stays in `plan.md` with no marker. GLOSSARY and scenario 20a say the same. The user chose this.

This revises D228, D230, D241, and D243. It closes todo item 84.

**Rationale**: in the run on a98437d, upgrade added the marker to OQ1 after "I do not know yet", and 20a failed. A kept question blocks the code that depends on it, and the agent does not ask it again. So a marker that the user did not ask for hides the question from later sessions.

## D248: `apply.instruction` Follows the Rules of "Write Instructions as Code"

**Decision**: `apply.instruction` in `schema.yaml` follows the ten rules of the section "Write Instructions as Code" of `CLAUDE.md`:

1. A short "How to read this instruction" part defines the order of the steps, the scope of the rules, the OpenSpec root, and `<changeDir>`.
2. A "General rules" list holds each rule that applies at all times: plan.md wins, do not edit the preview, the triggers of the answer rule, the decision rules, the fact rules, the exit-code rule, the test rule, the ID rule, and the upgrade hint. Step 4 no longer holds them.
3. Each step names its input, and its output where it has one. Each step ends with the next step.
4. Each bullet names its subject. No bullet uses "it", "this", "then", or "above" for a subject in another bullet.
5. Each bullet does one job. The marker bullet of the answer rule, the constraint bullet, and the end-summary bullets are split.
6. No bullet has more than one sub-level. The decision rule lists criterion (1), the visible results, and criterion (2) at the same level.
7. Each branch is written: step 2 says what to do when no preview exists and when the hash matches. Step 5 says to fix the code and run the tests again when a test fails. Step 6 says to name each outcome or constraint that is not met.

The rules do not change, except for the new branches of item 7. The user chose this.

This revises the form of D235. It adds the branches of item 7.

**Rationale**: `CLAUDE.md` now says that an instruction is code that an agent runs with no human to fix a misread. A unit that depends on another unit, a bullet with two jobs, and a missing branch are the bugs of such code.

## D249: The Shared Blocks Follow the Rules of "Write Instructions as Code"

**Decision**: the shared blocks `### OpenSpec root`, `### Change selection`, and `### Schema check` follow the rules of the section "Write Instructions as Code" of `CLAUDE.md`, in each skill that holds them:

1. Each block names its input and its output.
2. Each bullet names its subject, and does one job. The sub-bullets of a case are flat bullets.
3. Each branch is written. Change selection says what to do when no active change exists: stop, and tell the user. The schema check says what to do when the version equals the shipped version, and on `ok:`.
4. The schema check names "item 3 of the schema check", so that an agent does not read it as step 3 of the skill.

The other rules do not change. `tests/skills.test.mjs` still checks that the copies are equal. The user chose this.

This revises the form of D237. It adds the branches of item 3.

**Rationale**: the same as for D248.

## D250: Each Skill Body Follows the Rules of "Write Instructions as Code"

**Decision**: the bodies of all six skills follow the rules of the section "Write Instructions as Code" of `CLAUDE.md`, as `apply.instruction` does (D248):

1. Each skill has a "How to read this skill" part and a "General rules" list. A rule that applies at all times is in the list, not in a step.
2. Each step names its input and its output, and ends with its next step. The step numbers that other files refer to stay the same: archive 1 to 11 and the guard path 1 to 6, upgrade 1 to 5, 2.1 to 2.5, and 5.1 to 5.4, the preview 1 to 8.
3. Each bullet names its subject, and does one job. The nesting is flat.
4. Each branch is written. The new branches are listed in the four reports of this change, for example: the archive guard path does not run section 3; archive step 11 lists the written ADRs when `openspec archive` fails; propose ends its turn on no to the preview question; the preview shows no table when it added no 🤖 decision; upgrade does not ask the question turn when each artifact exists.
5. Four fixes from the rewrite: the apply skill names its three added rules, not "only one rule". In upgrade, a rule from an answer is written as a requirement with no new question, because the answer of the user is its source. The preview fact rule gives its own reason: the preview cannot edit `## Constraints` or `## Non-Goals`. `tests/skills.test.mjs` also checks the `### OpenSpec root` copy of the schema skill.

Each command, each code span, each quoted text, and each decision ID of the old text is still in the new text, except the pointer "newer schema" of the schema skill, which now holds the full message. The user chose this.

This revises the form of D236 to D238 and D245. It adds the branches of item 4 and the fixes of item 5.

**Rationale**: the same as for D248. The user asked to review all skills with the new rules.

## D251: `defects.md` of Each Scenario Run Replaces `docs/todo.md`

**Decision**:

1. After each scenario run, the agent writes `.scenario-runs/<run>/defects.md`. It lists each verified defect with its scenario, its description, its cause (test scenario, skill rules or wording, LLM mistake, or other), its action (need decision, need investigation, or need fix), and its priority (must-fix or acceptable).
2. `docs/todo.md` is removed from the repo. Its last version is archived in `.scenario-runs/archive/todo-2026-11-12.md`, which git does not track.
3. `CLAUDE.md` names `defects.md` in place of `docs/todo.md`, in the table of project files and in the rule of a failing scenario. `docs/design.md` and `docs/test-scenarios.md` no longer refer to `docs/todo.md`.

The user chose this.

This revises the role of `docs/todo.md` in D173 and the later decisions that added todo items.

**Rationale**: `docs/todo.md` and `defects.md` held the same items. `defects.md` gives a cause, an action, and a priority for each defect of a run, so one triaged list per run is enough.

## D252: Fixes for the Must-Fix Defects D08 to D13 of the Run on 3fb090c

**Decision**:

1. Archive writes no source emoji in a spec. A fact in a requirement text gives its source in words. An ADR keeps the source emoji of a fact (D227). The user chose this. This revises D244 item 7. (D09)
2. If a fact of `plan.md` has no source emoji, archive adds no emoji, and does not guess its source. (D09, D11)
3. A 🤖 in an HTML comment, for example in a template comment, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖. The archive general rules and the mark rules of apply and of the tasks preview say this. (D10)
4. Archive step 6 names each draft, a spec draft or an ADR draft, that holds content from a 🤖 decision, and names that 🤖 decision. (D08)
5. The answer rule of apply, the tasks preview, and propose says: a fact says how something is, an instruction says what to do, and an instruction is never a fact. Each part of a reply goes to one section only. In apply and propose, a part that is both a rule and a choice is a constraint only, because the done check checks each constraint. (D12, D13)
6. The fixture fact F1 of `finished-rate-limit` has 👤 and "Source: the user". The four fixtures with the old Constraints comment of the template have the current comment. HTML comments do not change the plan hash. (D11)
7. Scenario 15 checks that no spec holds a source emoji. Scenario 4 checks that each part of the answer is in one section only, and that the stack instruction is not a fact.

This revises D226, D227, D240, and D244.

**Rationale**: the defects D08 to D13 of `.scenario-runs/20261112-3fb090c/defects.md`. In scenario 15, archive guessed 👤 for two items and wrote the marks into a main spec. Archive read the 🤖 of the template comment as a mark. In scenario 4, two rules were both a constraint and a decision, and an instruction became a fact.

## D253: Fixes for the Defects D03, D05, D06, and D07 of the Run on 3fb090c

**Decision**: from `.scenario-runs/20261112-3fb090c/investigation-D01-D07.md`:

1. Upgrade step 2.2 writes only the requirements that step 2 planned and that the user approved, or whose source is a constraint or an answer of the user. It writes no requirement that step 2 did not plan, also if the CLI instruction or the Goal suggests one. The summary names the source of each requirement. (D03)
2. The `## Purpose` of a new spec states only what `plan.md` or an answer of the user states. If `plan.md` states no purpose, the Purpose describes what the capability does. The text of a `## Purpose` section is an item that can be inferred, so a new claim in it gets a 🤖. (D05)
3. On the archive guard path, archive ends its turn after the ADR offer, and offers nothing else in that reply. After a no, it offers the archive in no words. (D06)
4. Upgrade step 5.1 shows the destination list as a table with the columns `Section`, `Artifact`, and `Heading`, with one row for each section that has content. Scenario 20a says that a section with only a guidance comment needs no row. (D07)

The user chose these four fixes. The user did not choose the proposed fixes for D01, D02, and D04, so these defects stay open.

This revises D152, D164, D191, and D215.

**Rationale**: the investigation found a cause for each defect. The stock `specs` instruction asks "what the capability is for" and names "observable behavior", which pulls the agent to a new purpose and to a requirement from the Goal. Guard step 2 did not end the turn, so the agent added an archive offer to the same reply. Step 5.1 gave no form for the list.

## D254: Fixes From Review Loop 4, Round 1, on 99d8656..local

**Decision**: from `.review-reports/review_20261112094239_claude-opus-5-5_99d8656-local.md`:

1. The archive guard path has no first step that points to stock `/opsx:archive`. The ADR offer is guard step 1. A no to the offer goes to the 🤖 search, the open-question report, and the 🤖 block. Then, if no delta holds a 🤖, the guard tells the user to run stock `/opsx:archive`. While a delta holds a 🤖, the guard gives no pointer to `/opsx:archive`. Scenario 18 expects this.
2. `apply.instruction` step 4 says what to do when the user replies to a question of step 4, step 5, or step 6: record the answer, then go to step 4. The tasks preview runs step 8 again after a reply that does not make the preview stale.
3. Criterion (1) of apply says "you put something in the code, or plan to put something in the code", because step 3 decides questions before any code exists.
4. Scenario 4 expects a constraint for "create it in this repo", as the answer rule of D252 says, and still accepts a decision with no 🤖 (D226). Each part of the stack instruction that passes the rule test is a constraint.
5. Scenario 4b accepts only an open question for the header that names the API key. The user chose this. This revises D229 item 7.
6. Upgrade step 5.4 lists the items that stay in `plan.md` after a yes. Step 5.1 marks a question that also stays in `plan.md` as "kept".
7. Upgrade step 2 gives the question filter in its own text, with no reference to the `design` instruction, which the agent reads only in step 2.3.
8. Archive step 4 says that a selected constraint becomes a requirement in a spec.
9. The shared block `### Change selection` shows the name and the schema of each change when it asks the user to pick.
10. The upgrade guard stops on a `plan-lite` change with no `plan.md`, and points to `openspec-lite-propose`.
11. Archive step 5 ignores `skipped: true` only if `skip_specs` is set.

This revises D229 and D253.

**Rationale**: a fresh-context review found each gap. I checked each remark against the skills, `design.md`, and the decisions.

## D255: Fixes From Review Loop 4, Round 2, on 99d8656..local

**Decision**: from `.review-reports/review_20261112102432_claude-opus-5-5_99d8656-local.md`:

1. Upgrade step 2.2 also writes a planned requirement whose source is a decision with no 🤖 that is a contract.
2. In `apply.instruction` step 3, "stale" means the result of step 2. A constraint that an answer adds in step 3 does not trigger the stale question. Step 6 reports the constraint.
3. Upgrade step 2 uses only the test of the question rule of apply. It does not do the `plan.md` writes of that rule.
4. Upgrade step 2.3 writes each fact and each decision that step 2 planned.
5. Upgrade step 5.1 uses the destination "closed" only for a question that step 2 closed in this session. On the resume path, each question gets a destination from the artifacts.
6. Upgrade step 2.5 says that "a question that the tasks preview added" is a question in `## Open Questions` of `plan.md`.
7. Propose asks what the change does when the request names no outcome, and does not invent a Goal. Scenario 12 expects this.
8. The split questions and the Level 1 question of propose end the turn. All split questions go in one reply.
9. The archive guard stops on a `plan-lite` change with no `plan.md`, and points to `openspec-lite-propose`, as upgrade does (D254).
10. When the user replies after archive guard step 4, archive goes to guard step 2, and keeps the answer to the ADR offer.
11. `design.md` says that the archive question gives the number of unchecked tasks, as the skill and scenario 18b say.
12. The tasks-preview guard points to `/opsx:apply` when the change has `tasks.md`, and to `/opsx:continue` when it has none. Scenario 19 case 1 expects `/opsx:apply`.
13. Scenario 4 expects a constraint for a part that passes the rule test, not for each choice.
14. Scenario 18 has a step that declines the ADR offer, so that a run reaches the decline checks.

This revises D133, D154, D196, and D254.

**Rationale**: a fresh-context review found each gap. I checked each remark against the skills, `design.md`, and the decisions.

## D256: Fixes From Review Loop 4, Round 3, on 99d8656..local

**Decision**: from `.review-reports/review_20261112103716_claude-opus-5-5_99d8656-local.md`:

1. The question list of upgrade step 2 has an item for each requirement that upgrade plans from a contract point that step 2 decided.
2. If the user says yes in the upgrade question turn to a requirement from a 🤖 decision of `plan.md`, upgrade writes that decision in `design.md` with no 🤖, and the summary says that the yes removed the mark. The user chose this. This revises D182. Scenario 7 expects this.
3. The answer rule of apply, propose, and the tasks preview says what a rule is: a rule limits the result that a user or a program sees, or says what the change must not add. A choice of how to build the result is a decision, also when the user gives it, for example "use a sliding window" or "use plain HTML under `src/`". The user chose this. This revises D241 and D252. Scenario 4 expects a decision with no 🤖 for "create it in this repo" and for the build parts of the stack instruction, and a constraint for "no npm dependency".
4. Archive step 7 ends the turn at the keep-or-delete question for the files of an earlier run, and deletes each file that the user says to delete.
5. The tasks-preview guard gives the pointer and then stops. It names each open question of a kept `plan.md`, as the apply guard does.
6. On the upgrade resume path, step 5.1 uses the test of the question rule again for a question that no artifact holds. The destination "kept, in no artifact" is only for a question that is still open.
7. The Input line of the archive guard names `plan.md`.
8. The apply intro says which added rule is in section 2 and which rules are general rules.
9. The resume question of propose ends the turn.

This revises D182, D241, D252, and D255.

**Rationale**: a fresh-context review found each gap. I checked each remark against the skills, `design.md`, and the decisions. Four remarks came from the fixes of D254 and D255.

## D257: Fixes From Review Loop 4, Round 4, on 99d8656..local

**Decision**: from `.review-reports/review_20261112110221_claude-opus-5-5_99d8656-local.md`:

1. The apply answer rule records in `## Decisions` only a choice or an instruction that is not a fact and not a rule. A rule such as "add no npm dependency" goes to `## Constraints` only.
2. The tie-breaker of D252 changes. If a part limits the result and also says how to build the result, apply and propose record the limit as a constraint, and the build choice as a decision with no 🤖.
3. The split rule of upgrade has the D256 definition of a rule. A build choice of the user is not a requirement source.
4. Upgrade also removes the 🤖 of a decided contract point after a yes to its requirement, as D256 item 2 does for a 🤖 decision of `plan.md`.
5. Scenario 12 gives the answers in the order of the skill, and answers no to a Level 1 question.
6. Scenario 4 accepts a constraint for a build choice (D226), and never only a decision for a rule.
7. The glossary term **Agent decision** has the exception of D256 item 2.
8. On the upgrade resume path, a new answer that is a non-obvious fact, or a decision that the decision rule records, is "kept, in no artifact", and upgrade offers to add it to `design.md`. Only an obvious answer, or an answer that the decision rule does not record, is "closed".

This revises D252, D255, and D256.

**Rationale**: a fresh-context review found each gap. Five remarks came from the fixes of D255 and D256. The reviewer also suggested that propose checks an existing change name before the Level 1 question. I did not make this change, because the scenario fix closes the gap of the test, and the order change is a new rule.

**Status**: Item 6 revised by D262 item 8. Scenario 4 no longer accepts a constraint for a build choice.

## D258: Fixes From Review Loop 4, Round 5, on 99d8656..local

**Decision**: from `.review-reports/review_20261112110822_claude-opus-5-5_99d8656-local.md`:

1. Upgrade step 5.1 has one closed rule for each path. A question that no artifact holds is "closed" only when its answer is obvious, or is a decision that the decision rule does not record. A non-obvious fact or a recorded decision that no artifact holds is "kept, in no artifact". This also covers a `design.md` of an earlier run that step 2.3 kept.
2. Upgrade step 5.1 makes no separate offer to add an answer to `design.md`. Step 5.2 already tells the user that they can ask for it, so the prune question stays the last line of the reply. This revises D257 item 8.
3. The apply guard gives the pointer and names the open questions of a kept `plan.md`, and then stops, as the tasks-preview guard does (D256).
4. After a reply that does not make the preview stale, the tasks preview updates each task that the changed items make wrong, because the plan hash does not cover `## Decisions`.
5. Scenario 7 expects "no hidden columns" as a requirement in `specs/`, because the answer limits the result, so it is a rule and a requirement source (D256, D257).

This revises D255, D256, and D257.

**Rationale**: a fresh-context review found each gap. Three remarks came from the fixes of D254 and D257.

## D259: Each Example in `package/` Gives Its Own Setup

**Decision**: an example in a skill, in `schema.yaml`, or in a template gives its own setup, for example what `plan.md` asks for. It does not depend on a test fixture or a test scenario of this repo. The three examples of the inferred-item rule of upgrade now say what `plan.md` asks for, and use `#### Scenario:`, so that "scenario" cannot mean a test scenario. The example "use a sliding window" now says "for the rate limit". The user asked for this.

**Rationale**: only `package/` reaches the machine of the user. The old examples of upgrade named "the export" and "the column-order constraint" of the `after-preview` fixture. On another project, the agent could not know this context.

**Status**: Revised by D262 item 1. No example in `package/` copies the domain of a test scenario, so the example "use a sliding window for the rate limit" is gone.

## D260: Fixes for the Defects D01, D07 to D12, and D18 of the Run on b470899

**Decision**: from `.scenario-runs/20261112-b470899/defects.md`:

1. Propose lists the open points of the outcomes before it decides on the Level 1 question. If the list is not empty, the outcomes are not small, and propose does not ask the Level 1 question. (D08)
2. Archive searches each draft for a `plan.md` ID before step 6 shows the drafts. It replaces each ID with the item title, or a short form of its text. (D09)
3. Archive writes each approved draft exactly as the user approved it. A change to an approved draft needs a new approval. (D09, D18)
4. An ADR that an earlier run wrote needs no new approval. The `Status:` edit of step 10 needs no approval, because the approval of the new ADR with the `Supersedes:` line covers the edit. The archive general rules say both exceptions. (D10)
5. Scenario 13b step 2 answers the question about the archive target folder: "Do not delete the archive folder." Scenario 21b step 2 answers the keep-or-delete question: "Keep it." 21b expects no approval question for the existing ADR or for the `Status:` edit. (D11, D12)

6. Apply step 5 check 2 finds each condition in the code that gives the result of a 🤖 decision. The decision matches the code only when it names each such condition. A condition that gives the same result as a named condition is not named. (D07)
7. The question rule of apply and of the tasks preview: a point is open when the code must match something outside the repo, and the repo does not show it, for example the field names of a message that another service sends. A common convention does not answer such a point. A choice whose only reason is a convention or "Reason not checked.", and that must match something outside the repo, is an open question, not a 🤖 decision. The examples come from another domain than scenario 4b, so that the scenario still tests the rule (D259). (D01)
8. Apply step 5 check 1: if the agent cannot run the tests, for example because the user denies the test command, it does not wait. It says in the end summary that the tests did not run, and does checks 2 to 7. In the two reruns of 4b for D01, the agent stopped step 5 at the denied `npm test`, so check 3 did not record the error bodies (`verify-D01.md`). (D02)

This revises D111, D122, D138, D148, D202, D220, and D254.

**Rationale**: in scenarios 9 and 12, propose judged the request as small, asked the Level 1 question, and then wrote open questions, in three runs in a row. In scenario 15, the approved ADR draft held the ID "(F1)", and the agent removed the ID after the approval. In 20b, the written ADR differed from the approved draft. In 4b, apply chose the API key header "by convention" as a 🤖 decision in 2 of 2 runs. With the fix in the temp copies, 3 of 3 reruns asked the user first (`investigate/D01-D02.md`). In 4d, apply widened the exit-2 condition and said that D3 "still matches", because the result was the same exit 2. With the fix in the temp copies, 2 of 2 reruns updated the decision (`investigate/D06-D07.md`). In 21b, the general rule "Write nothing before the user approves" made the agent ask about an ADR of an earlier run and about the `Status:` edit.

## D261: Fixes for the Defects D02, D03, and D05 of the Run on b470899

**Decision**: from `.scenario-runs/20261112-b470899/investigate/`. The user chose these three fixes:

1. The decision rule of apply and of the tasks preview: `plan.md` or the user can fix only one part of a visible result, for example the status code of an error response. Each other part that the agent puts in the code is a choice of the agent, for example the body, a header, or the content type. (D02)
2. The answer rule of apply: an instruction that adds work to the change is a choice of the user. The decision rule and the question rule select only the choices of the agent, and never drop a part of a reply of the user. An answer to an open question goes to a section of `plan.md`, not only to the end summary. After the record, apply reads the reply again, part by part, and records each part that is in no section. Scenario 4 names both instructions of the answer. (D03)
3. The format of a file or of an output that another program reads is a contract. Upgrade, archive, `GLOSSARY.md`, and `docs/design.md` say this. If upgrade is not sure that a decision with 🤖 is a contract, it plans the requirement and asks the user. For each decision with 🤖 that it does not plan as a requirement, the question turn gives the reason in one sentence. Scenario 7 cites this decision for the quoting contract, not D182. (D05)

The examples of the three rules come from other domains than scenarios 4, 4b, and 7, so that the scenarios still test the rules (D259).

The user did not choose the proposed fixes for D04 and D06, so these defects stay open.

This revises D119, D166, D182, D219, and D256.

**Rationale**: in 4b, the agent read the constraint "status 429" as the whole response, and recorded no body. In 4 run 1, the answer "create it in this repo, scaffold a minimal report page" went to no section, because the decision rule says "Do not record your other choices". In 7 step 3, the skill defined a contract only in abstract words, so the agent called the CSV quoting "not a contract" in about 1 of 2 runs. Reruns with each fix in the temp copies: D02 3 of 3 recorded the 429 body, D03 3 of 3 passed, D05 3 of 3 planned the quoting requirement.

## D262: Fixes From Review Loop 5, Round 1, on 99d8656..local

**Decision**:

1. No example in `package/` copies the domain, the answer, or the fixture of a test scenario. The examples of the answer rule, the fact format, the decision rule, and the partial-result rule of apply, the tasks preview, and propose now use image thumbnails and uploads. The inferred-item examples of upgrade use thumbnails and an invoice email. This revises D259, which kept "use a sliding window for the rate limit".
2. The archive guard path drafts each ADR with the three checks of step 5, also the `plan.md` ID check of D260. Archive step 6 ends the turn after the drafts. The done check names each outcome and each constraint that is not met, and each open question that is left.
3. The template comment of `## Open Questions` says: an answer of the user goes to another section of the plan, and only an obvious answer that the agent found goes only to the summary. The fixtures have the same comment. This agrees with D261.
4. The tasks preview and propose have the four answer-rule bullets of D261.
5. Apply step 5 check 1: do not change a constraint or a decision with no 🤖 to make a test pass. If a failing test cannot pass, say which test fails, with the error text, and do checks 2 to 7. The end summary shows no 🤖 table when apply added no 🤖 decision.
6. The apply guard points to stock `/opsx:continue` when `tasks.md` does not exist, as the tasks-preview guard does.
7. Upgrade says where the schema check continues: section 2, step 1, or step 4 on the resume path. Propose lists the open points for itself before the Level 1 question, and section 3 records them. `GLOSSARY.md` → Visible result names "a name that the program gives to its output".
8. Scenario 4 fails when a build choice of the answer is a constraint. The user chose this. This revises D226 and D244.
9. The `after-propose` fixture is a fixed start state, not the output of scenario 1.

**Rationale**: the review `.review-reports/review_20261112124141_eu.anthropic.claude-opus-5-5_99d8656-local.md`, 20 remarks. Remark 11 was not accurate: the fact rule reason holds in apply, because the edit is not needed. The text now says "with no need".

## D263: Fixes From Review Loop 5, Round 2, on 99d8656..local

**Decision**:

1. Scenario 4 no longer says "A constraint for a build choice also passes". D262 item 8 removed only one of the two sentences.
2. The template comment of `## Open Questions`, and its fixture copies: an answer of the user goes to another section. An answer that the agent found goes to another section, or only to the summary when the answer is obvious or is a choice that the decision rule does not record. This matches the question rule.
3. The done check of apply also asks: did the tests run and pass? If a test fails, or the tests did not run, apply says so, and does not tell the user to archive.
4. The apply guard tells the user to answer an open question before the stock skill, because the guard can point to `/opsx:continue`.
5. The upgrade split rule maps "a section of `plan.md`" of the answer rule to the artifact of the split rule. After the write, upgrade reads the answer again, part by part, and writes each part that is in no artifact.
6. D226, D244, D257, and D259 have a `**Status**` line that names D262.
7. Scenario 1 expects no Level 1 question, and each open point of the request in `## Open Questions` (D260).

**Rationale**: the review `.review-reports/review_20261112141533_eu.anthropic.claude-opus-5-5_99d8656-local.md`, 7 remarks. Two remarks found D262 fixes that were not complete.

**Status**: Item 3 revised by D264 item 1. The test question is a separate test check, not a part of the done check.

## D264: Fixes From Review Loop 5, Round 3, on 99d8656..local

**Decision**:

1. The done check keeps one meaning: the three questions about the Goal, the Constraints, and `## Open Questions`, in apply and in archive. Apply step 6 has a separate test check: did the tests run and pass? Apply suggests the archive only when the test check and the done check pass. If the tests did not run, apply tells the user to run the test command and to run apply again. If a test fails, apply names the test. Archive does not run the tests. `GLOSSARY.md` has the term "Test check". The user chose this. This revises D263 item 3.
2. The examples of the condition rule of step 5 check 2 and of the fact rule now use the thumbnail domain. The old examples copied the cases of scenario 4d ("is not JSON" against a missing field, "the script must read the item count"). This completes D262 item 1.
3. `GLOSSARY.md` → Visible result names the output of another tool that the code reads, as the decision rule does (D218).
4. Apply step 3 says "where some code is when a search of the repo does not find the code", as the question rule says.
5. Scenario 4 says where the OQ2 answer goes (a constraint) and where the test stack goes (a decision with no 🤖).

**Rationale**: the review `.review-reports/review_20261112142047_eu.anthropic.claude-opus-5-5_99d8656-local.md`, 7 remarks. Two remarks found D263 item 3 not complete.

## D265: Fixes From Review Loop 5, Round 4, on 99d8656..local

**Decision**:

1. The fact-rule example of a choice is "the code must resize the images in one batch". The old example "the thumbnails must keep the aspect ratio" was a rule by the answer-rule test.
2. Apply step 5 check 1: if a test fails because the code follows a constraint or a decision with no 🤖, apply asks the user, and ends its turn. Step 6 names the failing test, and says what blocks the fix.
3. The test check passes when the repo has no test command, and the change changes no behavior. `GLOSSARY.md` says this.
4. Scenario 4 expects the test check and the done check. Scenario 4b: the two constraints of step 1 do not change, and a new constraint can come only from the answer about the header.
5. Upgrade: a constraint that limits a result that a user or a program sees is a requirement source, and does not also go to `design.md`. A constraint that only says what the change must not add goes to `## Context` or `## Risks / Trade-offs`. This gives the split that scenario 7 expects.
6. The propose summary lists each open question that propose recorded. Propose ends its turn after the tasks-preview question. Scenario 1 expects the list.
7. Apply step 2: after a `plan-hash:` error, apply asks the user to fix `plan.md` as the message says, as the tasks preview does.
8. D263 has a `**Status**` line that names D264.

**Rationale**: the review `.review-reports/review_20261112142946_eu.anthropic.claude-opus-5-5_99d8656-local.md`, 10 remarks. Remarks 1 and 2 found D264 fixes that were not complete.

**Status**: Item 5 reverted by D266 item 1. Each constraint is a requirement source again.

## D266: Fixes From Review Loop 5, Round 5, on 99d8656..local

**Decision**:

1. Revert D265 item 5. Each constraint of `plan.md` is a requirement source in upgrade, as in archive and in the split rule. Constraints also go to `## Context` or `## Risks / Trade-offs` of `design.md` if they fit. Scenario 7 accepts the "no new server endpoint" constraint in `specs/`, in `design.md`, or in both. The user chose this, because the split was only in one step, a constraint can fit both classes, and its example was close to a fixture.
2. Apply step 5 check 1 is a list of branches. It runs no test when the repo has no test command and the change changes no behavior. It updates a test that checks an old behavior that the change replaces, as the test rule says. Step 6 tells the user to run the test command only when the test check did not pass.
3. Propose: if the reply to the tasks-preview question answers an open question, propose records each answer with the answer rule, then asks the tasks-preview question again.

**Rationale**: the review `.review-reports/review_20261112143415_eu.anthropic.claude-opus-5-5_99d8656-local.md`, 7 remarks. Four remarks came from the constraint split of D265.

## D267: Clear Wording of the Condition Rule in Apply Step 5 Check 2

**Decision**: apply step 5 check 2 says the condition rule as two bullets. The second bullet says: do not count a condition as named only because the condition gives the same result as a named condition. The thumbnail example names both conditions, and says that both skip the thumbnail.

**Rationale**: the user could not understand the old sentence "A condition that gives the same result as a named condition is not named". The old sentence did not say which shortcut it blocks. The rule does not change.

## D268: Scenario Fixtures Follow the Current Skill Rules

**Decision**:

1. In the `after-preview` and `interrupted-upgrade` fixtures, each task of `tasks-preview.md` that depends on an open question says that the task waits for the answer, as the preview rule says. No task decides an open question, and no task only answers an open question.
2. The `after-preview` fixture keeps its three open questions, because scenario 4 tests that apply decides OQ3.
3. The `after-upgrade` fixture is the state where the user did not say yes to the quoting requirement. Its delta has no quoting requirement, and the "Quote each cell" decision in `design.md` keeps its 🤖. Scenario 7 accepts this state, and scenario 18b needs the 🤖.
4. The `after-upgrade` fixture has no "Exclude hidden columns" decision in `design.md`. The answer "no hidden columns" is a rule, so it is only a requirement in `specs/`, as the split rule of upgrade says.
5. The `rate-limit` fixture and `kept-plan.md` keep their form, because scenarios 4b and 17b need it.
6. In the `interrupted-upgrade` and `after-upgrade` fixtures, the `## Why` line of `proposal.md` ends with 🤖. `plan.md` does not say that users cannot take the rows out of the page, or what issue #42 asks, so the line is an inferred item. The user chose the mark over a rewrite.

**Rationale**: the user found that the fixtures did not follow the current schema. The fixtures date from D199. Later decisions changed the preview rule (D250) and the split rule (D256, D258).

## D269: Triage of the Must-Fix Defects of the Run on 84abcb6

**Decision**:

1. A defect has the cause `llm` when a rule covers the case and the agent did not follow the rule. A defect has the cause `skill` when the flow misses a case, is illogical, or is inconsistent.
2. Do not add an example to `package/` only to steer the agent to the result of a test scenario. An example that hints at the expected result makes the test measure the hint, not the rule.
3. D01, D03, D04, D08, D10, and D12 of the run have the cause `llm`. The skills do not change for them. D01 and D03 got worse after D262 replaced two examples, but the rules `schema.yaml:200`, `:202`, and `:203` still cover the cases.
4. D02 (skill): the question rule splits its class into "an intent of the user" and "a fact that only the user knows". The recommendation rule uses the same term. No example is added.
5. D05 (skill): archive says "Print the full text of … in your reply" for an ADR of an earlier run, for each file with the line `Change: <name>`, and for each delta file of an earlier run. "Show" had more than one meaning.
6. D06 (skill): the archive guard rule "Before each reply that says what holds a 🤖, search again" applies only in guard steps 2 to 4. The reply with the ADR offer says nothing about the 🤖 lines of `specs/`.
7. D07 (scenario, skill): the rule "After the user confirms a root, also start the first command with `cd <root> && `" is deleted in each of the six skills, because the block is shared, and because the rule for each `openspec` command covers the case. Scenario 11 checks the result, not the form of the first command.
8. D09 (skill): the decision format says "One decision records one choice. If you made two choices, write two decisions, each with its own reason." No rule about the output of a tool is added, because that rule is a hint example.

**Rationale**: the user reviewed each must-fix defect of `.scenario-runs/20261112-84abcb6/defects.md` with the investigation reports of the run. Items 4 to 8 are agreed fixes.

## D270: Results of the Rerun on 2119a53, and a Mixed Open Question

**Decision**:

1. If the answer to an open question depends on an intent of the user and also on a fact that only the user knows, the agent gives its recommended answer for the intent, and names the fact that it needs. This rule is in `apply.instruction`, the tasks preview, upgrade, and `docs/design.md`, next to each rule that gives no recommendation. No example is added (D269).
2. D09 of the run on 84abcb6 has the cause `llm` after D269. The rule "One decision records one choice" stays. In 4c, "return `null` or throw" can be one choice, and the missing reason is a rejected option. The rule "Add "Rejected Z because W." when there was an alternative" covers it.
3. D05, D06, and D07 of the run on 84abcb6 are fixed. The rerun shows it.
4. The rerun `.scenario-runs/20261112-5b411a1/` shows that item 1 fixes D02 in 2 of 2 runs. Scenario 4 still fails in 2 of 2 runs. Each failure has the cause `llm`, because a rule covers each case, so the skills do not change.

**Rationale**: the rerun `.scenario-runs/20261112-2119a53/` passed 5 of 8 runs (1 of 8 on 84abcb6). D02 failed in 2 of 2 runs after D269 item 4. The agent said "I have no recommendation, because the report's data model isn't visible here", and then gave a default. OQ2 of scenario 4 depends on an intent (the columns that the user wants) and on a fact (the columns that exist). The skill had no branch for such a question. The user agreed with both findings.

## D271: Fixes From the Review of the Skill Text at 98efbdb

**Decision**:

1. Hint phrases are removed from `package/`, because each one describes the exact case of a test scenario (D269 item 2):
   - "where some code is when a search of the repo does not find the code" (scenarios 3 and 4). This revises D195 and D264 item 4.
   - "also the output of another tool that the code reads" in the list of visible results (4c, 4d). This revises D231.
   - "for example the name of a file that the program writes for the user" (4). This revises D262.
   - "If you did not get the exit code, record nothing about the exit code." (4d). This revises D197.
   - "the output of a script is obvious when the code of the script shows the output" and "If a reader can see the same output in the code" (4c). The general obvious-fact rules stay. This revises D200.
   - "An answer such as "I do not know yet"…", and the examples "keep it open" or "leave it open" (20a, 4b), in each answer rule. The rule "Add the marker only when the user says to keep the question open" stays. This revises D247.
   - "This also applies to a question that the tasks preview added…" in upgrade (20a).
2. `apply.instruction` has an ask rule. Steps 3, 4, and 6 call it. Only the ask rule says when to give no recommendation, and it always asks why.
3. The kept-question rules move from step 3 to the question rule. "Do not ask a kept question." replaces "Do not ask a kept question again, unless the user answers the kept question now."
4. The stale question of apply step 3 depends only on the result of step 2. The answer rule no longer says that an edit of `## Constraints` makes the preview stale. Step 6 reports each new constraint.
5. A rule of the user is a "constraint" in the answer rules of apply, the tasks preview, and propose. "How to read this instruction" is now "How to read these steps".
6. The OpenSpec root block of the six skills: each `openspec` command, and each command with a relative `openspec/...` path, starts with `cd <root> && ` when the root is not the current folder. The prefix does not count as a chain. This revises D121.
7. Apply follows the skill names of the `instruction` field. It does not follow other CLI text that names a skill.
8. The schema skill reads the result of `install.mjs` from the output, not from the exit code. It reports "already current" when it skips the install.
9. Propose records each part of a reply before it acts on the yes or the no of the tasks-preview question. It asks again only when the reply has no yes and no no. Propose records each fact, constraint, or choice of a reply. Propose drops the fact-removal rule, because propose does not define a non-obvious fact.
10. Archive: the guard path uses section 2, steps 5, 6, and 10, and then goes back to guard step 1. Each draft is printed in full. One rule sends a fact to the `## Context` of each drafted ADR that the fact relates to. A fact ADR needs a fact that the change depends on. The "add it to `plan.md` first" line needs an item that the user named. The guard path offers no skipped item.
11. Upgrade: on a resumed run with a delta, step 2 plans no requirement. "Does not change the specs, the approach, or the tasks" replaces "safe to answer later". One bullet says that a yes removes the 🤖 of a decision.
12. Smaller fixes: the fact example "before this change, the thumbnail folder did not exist"; the tasks preview says "plan for the code"; the template comment splits a guess from an obvious fact; a change of a decision with no 🤖 is allowed when you move your own choice out of it; overlapping bullets of the tasks preview and propose are merged.

**Rationale**: the user asked for a review of `package/` for overlapping rules, hint phrases, and logic inconsistencies, with fixes that add no hint example. The report is `.review-reports/review_20261112232836_eu.anthropic.claude-opus-5-5_98efbdb-package.md`, 36 remarks. The user asked to fix all of them.

## D272: Fixes From Review Round 2 of the Skill Text at 3f1988c

**Decision**:

1. Ten D271 edits broke a copy or a near rule. These are fixed:
   - The tool-output fact rule records an output only when the output is a non-obvious fact. D271 removed its exception as a hint, but the exception was general.
   - A kept question stays until a message of the user answers it. Apply step 6 names a kept question and the part of the Goal that waits, and does not ask for its answer.
   - The tasks preview has the same kept-question rules and the same ask rule as apply, in its question rule and its ask rule. Its general rule says "constraint".
   - Archive: after section 2, step 6, the guard path continues guard step 1 with the write. After section 2, step 10, it goes to guard step 2. A non-obvious fact goes to each drafted ADR that it relates to. Another fact goes only to an ADR whose decision it justifies.
   - Upgrade: the delta condition is in one place, "Plan the requirements", and each requirement question names it. The split rule says "constraint". Upgrade calls the ask rule.
   - Propose keeps a part of a reply until `plan.md` exists.
   - The template comment allows the move of your own choice out of a decision with no 🤖.
   - The schema skill reads no exit code, shows the old-folder line before it stops, and says "already current" once.
2. Two more hint quotes are removed: the quoted archive replies of scenarios 18 and 18b, and the quoted pointers of scenario 20a in upgrade.
3. Ambiguities are fixed: "no code, doc, or run that you can reach shows it" replaces "the repo does not show it". "Those sections" names `## Constraints` and `## Non-Goals`. The ID rule applies to plan.md and to each other file. Apply follows each rule of the `instruction` field. Upgrade names "the question turn of step 2". A row of step 5.1 is kept when its `Heading` holds "kept". Propose and the tasks preview name an open question of `plan.md`, and "the decision that records a constraint of the user".
4. `apply.instruction` says that the `cd <root> && ` prefix does not count as a chain, so stock `/opsx:apply` also gets the rule.
5. When an edit changes a rule, check each copy of the rule and each rule near it in the same commit. Ten of the 29 remarks of round 2 came from D271 edits that missed a copy or a near rule.

**Rationale**: the user asked for a second review round, with a check for ambiguous phrasing. The report is `.review-reports/review_20261112235649_eu.anthropic.claude-opus-5-5_3f1988c-package.md`, 29 remarks. The user asked to fix all of them.

## D273: Fixes From Review Round 3 of the Skill Text at 4eccc57

**Decision**:

1. Upgrade: the question turn splits the answer and plans each part for its artifact. Steps 2.1 to 2.4 write the parts. The question turn plans a requirement for each constraint of the answer, with no new question.
2. Apply: a conflict with a constraint or with a decision with no 🤖, in step 4 or step 5, is recorded as an open question and asked with the ask rule. A failing test that checks an old behavior that the change replaces is updated, not asked.
3. The root prefix of `apply.instruction` has the same scope as the six skills.
4. The template comment of `## Constraints` names a limit on the result that a user or a program sees, or what the change must not add. Its placeholder is `<constraint>`.
5. The tasks preview: a reply that asks to change the existing text of Goal, Background, Non-Goals, or Constraints gets its other parts recorded, and the turn ends. A mixed part becomes two decisions. A decision with no 🤖 can change to move your own choice out.
6. Archive: if the user rejects each guard draft, archive goes to guard step 2. An edited draft is printed again for approval. An obvious fact goes to an ADR only when it justifies the decision of that ADR.
7. Propose records the open points of section 1 in step 5.
8. The example "the field names of a message that another service sends" is removed, because it is close to scenario 4b. The deploy-folder example stays.
9. Smaller fixes: apply no longer counts its rules; "kept or not"; "Do not run step 2 again"; the `## 0` task text names the specs, the approach, or the tasks; the upgrade summary ban is about the whole file; the split rule names steps 2.1 to 2.4.

**Rationale**: review round 3 of the loop that the user asked for (5 rounds of review and fix). The report is `.review-reports/review_20261113001040_eu.anthropic.claude-opus-5-5_4eccc57-package.md`, 20 remarks. Seven of them came from D272 edits.

## D274: Fixes From Review Round 4 of the Skill Text at dc95267

**Decision**:

1. Apply: if the user tells the agent to change or remove a constraint, the agent changes or removes it. Step 6 reports each added, changed, or removed constraint, and the stale preview. A 🤖 decision that conflicts follows the current-decisions rule with no question. Only a conflict that the code cannot follow becomes an open question.
2. The obvious-fact check of apply step 5 and of the tasks preview calls a fact obvious only when a reader can easily deduce it, with no long analysis, as the fact rule says.
3. The root rule of `apply.instruction` and of the six skills has one scope: each `openspec` command, and each command with a relative `openspec/...` path, runs from the OpenSpec root.
4. Upgrade: a choice from the answer of the user goes to `design.md` with no 🤖. A part of an answer whose artifact the resume rule kept is named in the summary, not written. Step 2.4 runs the last check of the split rule. No requirement is planned for a constraint of the answer when a delta exists.
5. The tasks preview: a conflict with a constraint is an open question. A request to change a fixed section is listed and ends the turn, and does not also match the reply rule. Step 8 says that a decision that records a constraint of the user can move to `## Constraints`. "Kept or not" and "new or existing" replace "also a …".
6. Propose sorts the facts, constraints, and choices of the first request with the answer rule.
7. The archive guard names the reject-all case in the time of the 🤖 search.
8. `GLOSSARY.md` and `docs/design.md` define a constraint as a limit on the result that a user or a program sees, or on what the change must not add.

**Rationale**: review round 4 of the loop that the user asked for. The report is `.review-reports/review_20261113001742_eu.anthropic.claude-opus-5-5_dc95267-package.md`, 14 remarks, no must fix. Five came from D273 edits.

## D275: Fixes From Review Round 5 of the Skill Text at 5fdda53

**Decision**:

1. Apply goes to step 4 after each reply in step 4, step 5, or step 6, or after step 6, also a reply that answers no question.
2. A new instruction of the user that supersedes a decision with no 🤖 updates or removes that decision, in `apply.instruction` and in the tasks preview.
3. The tasks preview has the two conflict rules of apply: a conflicting 🤖 decision is updated with no question, and a conflict that the plan cannot follow is an open question. Its step-8 note names only the decisions of this run that record a constraint of the user.
4. Propose changes or removes an item of `plan.md` when the user tells it to. It records the parts of each reply that it kept before `plan.md` existed. After the reply to the tasks-preview question, it lists each item that it recorded.
5. Upgrade: a late first delta of the last split check removes `skip_specs` and runs the `specs` instructions first. Section 3 names each part of a kept artifact, and step 5.4 adds the part on request and runs `validate` again. The requirement write of a constraint of the answer needs no delta. Only a planned 🤖 decision gets 🤖, and only a choice of the user that is not a contract goes to `## Decisions`.

**Rationale**: review round 5 of the loop that the user asked for. The report is `.review-reports/review_20261113002414_eu.anthropic.claude-opus-5-5_5fdda53-package.md`, 12 remarks, no must fix, no hint. Ten came from D274 edits, most of them a copy that D274 did not change.

## D276: Fixes From Review Round 6 of the Skill Text at 7433254

**Decision**:

1. Apply and the tasks preview change or remove an item when the user tells them to, and do not record the instruction as a decision. The preview limits this to `## Facts`, `## Decisions`, and `## Open Questions`.
2. Apply records only a fact, a constraint, or a choice for the change from a reply. A plain request to run a command or a skill, or a question to the agent, is done or answered, and nothing is recorded.
3. A new instruction of the user that supersedes a decision with no 🤖 is recorded as a new decision, and the old decision is removed. The rule that limits a change of a decision with no 🤖 names this case. Same in the tasks preview.
4. The tasks preview has one 🤖 conflict rule, with "record no question", and its open-question conflict names "the tasks of the preview".
5. Propose writes one choice per decision, and "Reason not checked." when the user gave no reason.
6. Upgrade: a choice of the answer that supersedes a decision of `plan.md` replaces it in `design.md`. Only a kept question that no message of the user answered is kept. The last split check follows the kept-artifact bullet only for a delta that the resume rule kept, and can write to an earlier artifact after `tasks.md`.
7. Upgrade no longer offers to add content to an artifact. The summary names each part of a kept artifact and each "kept, in no artifact" content, and tells the user to add it by hand. The offer grew a new branch in each round, and no scenario tests it. This revises D206 and D275 item 5.
8. The archive guard does the 🤖 search also when guard step 1 finds no decisions.
9. The template comments of `## Facts` and `## Decisions` and the decision-format comment match the rules: a 👤 fact is non-obvious, a 🤖 decision is removed when a new decision supersedes it, and one decision records one choice.

**Rationale**: review round 6 of the loop that the user asked for. A fourth reviewer compared the copies of each shared rule across the skills. The report is `.review-reports/review_20261113002913_eu.anthropic.claude-opus-5-5_7433254-package.md`, 13 remarks, no must fix, no hint.

## D277: Fixes From Review Round 7 of the Skill Text at 3fb3150

**Decision**:

1. One reply rule in `apply.instruction`, the tasks preview, and propose: each time the user replies, record the reply with the answer rule. The answer rule starts with one exception: a part that only asks for a command or a skill, or asks a question, is done or answered, and nothing from that part is recorded. Upgrade gets the exception through the answer rule of `apply.instruction`. This revises D276 item 2, which narrowed the reply rule too much: "remove F3" fit no rule.
2. Apply goes to step 4 after a reply only when the reply changed an item of `plan.md`. The tasks preview does not run step 8 again after a reply that changes no item. Propose lists the changed items only when it changed an item.
3. The change-or-remove rule applies when the user names the item, for example by its ID or its title. Each other new instruction follows the supersede rule. Same in the three skills.
4. Upgrade: a decision of `plan.md` that an answer superseded has the heading of the decision that replaced it, so the prune does not keep it. The resume rule names an incomplete kept artifact in the summary, and tells the user to complete it by hand. This removes the last offer to add content (D276 item 7).
5. Archive names each decision of `plan.md` that has no ADR, also a decision that step 4 did not draft.
6. The template comment of `## Decisions` says "Update each 🤖 decision that a new decision makes stale."

**Rationale**: review round 7, the last round of the loop that the user asked for. The report is `.review-reports/review_20261113003410_eu.anthropic.claude-opus-5-5_3fb3150-package.md`, 9 remarks, no must fix, no hint.

## D278: Fixes of the Skill Defects of the Run on afb706a

**Decision**:

1. Archive checks for a delta of an earlier run in step 5, before the drafts, next to the check for an earlier ADR. It prints the full text of each such file. Step 6 asks the user to keep or delete each such file, in the same reply as the drafts. Step 7 only deletes and merges. Before, the check was in step 7, after the user approved a draft for the same path. (D02 of the run)
2. Archive can say in one line that no decision heading, or no line of `specs/` and `design.md`, ends with 🤖. It never says that a decision has a 🤖 when its heading does not end with 🤖. This revises D192 item 7, which asked for silence. A true line does not harm the user, and scenario 5 already accepts it (D193 item 5). In 15 of 15 archive replies with a decision draft, the agent gave the line. (D12 of the run)
3. If no source supports a reason, the decision format ends the sentence after X or Z, and adds the sentence "Reason not checked." Before, "in place of the reason" met the template "because W", and gave "Rejected Z because Reason not checked." Same in `apply.instruction`, the tasks preview, and propose. (D13 of the run)

4. The rerun `.scenario-runs/20261113-3008ff0/` shows that items 2 and 3 work, in 4 of 4 runs. Item 1 fixes the order of D02, in 2 of 2 runs, but the agent still gives a one-line summary of the earlier delta, not its full text. The rule says to print the full text, so this part has the cause `llm`.

**Rationale**: the user asked to investigate each defect of the run `.scenario-runs/20261113-afb706a/` with the cause `skill`. The reports are `investigation-D02.md` and `investigation-D12.md` in that folder. The user agreed with the cause and the fix of each defect.

## D279: Scenario 4d Accepts a Real Run in a Test Repo

**Decision**: the check of scenario 4d for the "no spec" case passes when the agent runs the real script and the real `openspec` command in a repo with no spec. The repo can be the scenario repo, or a repo that a test creates. A run against a fake `openspec` alone does not pass.

**Rationale**: D06 of the run `.scenario-runs/20261113-afb706a/`. In 4d-2, the agent did not run the script in the scenario repo, but its test runs the real script with the real `openspec` command in a new empty temp folder. That proof is the same as a run in the scenario repo, and it stays in the test suite. The old text "in this repo" was stricter than the user needs. The user agreed with the cause `scenario` and with this text.

## D280: The Other Must-Fix Defects of the Run on afb706a

**Decision**:

1. D01 (4b, the API key header is a 🤖 decision with no question) has the cause `llm`. The question rule says that a convention or "Reason not checked." does not decide a point that must match something outside the repo. The agent wrote "Reason not checked." and still recorded a decision. The skills do not change: the user rejected a new general rule, and the old example was a hint (D271). 4b stays a known model risk.
2. D03 (13b, a denied ADR write, then the archive, and a false "I wrote" claim) has the cause `skill`, then `llm`. Archive step 10 had no branch for a failed write, so the agent went to step 11 and archived the change with no ADR. Now step 10 tries a failed write once more with another tool, reports the error and stops before step 11 if it fails again, and checks that each approved ADR file exists before step 11.

**Rationale**: the user asked to investigate each other must-fix defect of `.scenario-runs/20261113-afb706a/defects.md`, and agreed with each cause and fix.

**Status**: Item 2 revised by D281 item 2. Archive step 10 now calls the shared failure rule.

## D281: Error Handling in Each Skill

**Decision**:

1. Each skill and `apply.instruction` have one shared failure rule, with equal text. `tests/skills.test.mjs` checks the copies. An action fails when it exits non-zero, is denied, gives an error, or prints an output that the steps do not name. A step with its own failure branch follows that branch. A denied Bash call is tried once more as one plain command, or with the Read, Write, or Edit tool. The agent does not make up a missing output, for example a template, a hash, a version, or a status line. If the action fails again, the agent shows the error, names each file that this run changed, tells the user what to fix and to start the workflow again, and stops. The agent checks a file on disk before it reports a write, an edit, or a delete as done. A reply to a yes-or-no question with no yes and no no is asked again.
2. Archive step 10 calls the failure rule for a failed ADR write or `Status:` edit, and still checks each approved ADR file before step 11. This replaces the text of D280 item 2.
3. Steps with their own branch:
   - The shared OpenSpec root block stops when `openspec list --json` fails, and when the user rejects the root. The change selection asks again when the named change does not exist or has no `schema`. The schema check handles a version line with no known word as `fail:`.
   - Apply stops when `openspec instructions apply` fails or has no `instruction` field. In apply, a failed `plan-status.mjs` gives no commit note, and the step goes on. In apply, `plan-hash.mjs` with no hash makes the preview stale. In the tasks preview, `plan-hash.mjs` with no hash follows the failure rule. `exit: not run` means that the command did not run.
   - Propose asks for a new name only for an error about the name. It writes `plan.md` only from the `template` field. It names the folder that stays after a no to the resume question.
   - The schema skill stops when `install.mjs` did not run, and does not copy files by hand. After a partial copy, it tells the user to delete `plan-lite/` and run again. A failed `config.yaml` edit is reported, and the install stays good.
   - Archive needs the `instruction` field for the deltas, checks the delta writes and deletes before step 8, and tells the user to run archive again after a stop in step 9 or step 11.
   - Upgrade checks the four artifacts before the schema switch and reads the `schema` line after it, deletes `tasks-preview.md` only after `tasks.md` exists, sets `skip_specs: true` on "None", skips a requirement that the user did not answer, and follows the failure rule when `openspec instructions` fails.

**Rationale**: the user asked for a review of the error handling of each step. The report is `.review-reports/review_20261113013108_eu.anthropic.claude-opus-5-5_ad4f78e-package-errors.md`, 25 remarks. Only archive step 10 (D280) had a failure branch for a write. Remark 12 named a broken step reference in upgrade step 2.4, but the reference was correct, so only its first part was fixed.

## D282: Fixes of the Skill Defects D01, D02, D03, and D05 of the Run on eb2df49

**Decision**:

1. Archive step 5: a delta file of an earlier run does not replace a draft, because `validate` can have failed on the file. Archive drafts each selected requirement in full, also when a delta file of an earlier run holds the requirement. Step 7 merges a kept file with no duplicate requirement. An ADR of an earlier run is different: it passed `validate`, and the user approved it, so archive does not draft it again.
2. Archive has a general rule: the user does not see the output of a tool call, so a print is text in the reply. Step 6 prints the full text of each file of an earlier run of step 5 in the same reply as the drafts, also when the agent read or printed the file before.
3. Archive step 6 asks yes, no, or edit for each draft, not for each item. A file of an earlier run is not a draft: an ADR of an earlier run gets no question, and a delta file of an earlier run gets only the keep-or-delete question. The `Supersedes:` bullet says that the agent does not ask to approve the `Status:` edit, so the step is correct when the agent reads only that step.
4. Upgrade guard: the bullet of the resume question gives its reason with no step number: an earlier run can stop after it wrote the artifacts, and a finished upgrade can keep `plan.md`. A new bullet says that the reply with the resume question names no step number.

**Rationale**: the user asked to investigate the must-fix defects and D05 of `.scenario-runs/20261113-eb2df49/defects.md`. The report is `investigation.md` in that folder. The user agreed with the cause and the fix of D01, D02, D03, and D05. D12 stays open. In D01 (13a run 1), the agent applied the ADR rule "Do not draft a decision that already has an ADR" to the delta of run 1. It offered the delta that failed `validate` as the requirement. After "Delete it.", archive archived the change with no spec. In D02 (21b run 1), the agent read the earlier ADR and delta with `cat`, and said "I printed both above". No text of the reply held them. D278 had moved the print from step 7 to step 5, so the print and the reply were in different steps. In D03 (21b run 2), the agent asked to approve the `Status:` edit and the kept delta. "Do not ask about the edit." was only in the general rules, and step 6 said "The user answers yes, no, or edit for each item." In D05 (20a run 2), the agent copied "An earlier run may have stopped after step 3." from the bullet that says what to ask into the reply. D191 asks for a question with no step number.

## D283: Scenario Text Fixes of the Run on eb2df49

**Decision**:

1. Scenario 4b step 2 gives the answer "I have no preference." to each other question, for example about a request with no key. The Expected text does not change: after this answer, the agent picks, so the point is a 🤖 decision.
2. Scenario 4: the filter UI and the sort UI are two decisions, because "One decision records one choice", and the user can change one and keep the other.
3. Scenario 4: the columns of the scaffold table are a 🤖 decision, because they are the columns of the CSV export. The page title and the sample rows need no decision.
4. Scenario 4: the example of a visible choice is the module system of the page or of `package.json`, not only of `package.json`. A page that imports ES modules does not open from `file://` in Chrome (`docs/facts.md`).
5. The headless allowlist of "Running the Scenarios Headless" has `"Bash(npm:*)"`, so that 4 and 4b can run the tests through `package.json`. The runs after this change are not equal to the earlier runs on this point.

**Rationale**: the user asked to investigate the defects of `.scenario-runs/20261113-eb2df49/defects.md` with the cause `scenario`. The report is `investigation-scenario.md` in that folder. The user picked the option of each question. S5 and S6 need no change: D282 item 1 removes the cause of S5, and "Approve the other drafts" of 20b already covers a second ADR. In S1, group A had to invent an answer for the no-key question. In S2, both runs wrote one decision for the filter and the sort, and the old example "the filter and sort UI" accepted it. In S3, no run recorded the columns, and the Expected text did not say if the scaffold content needs a decision. In S4 and D10, run 2 loaded the page as ES modules with no `package.json`, and the group rated the fail with medium confidence, because the example named only `package.json`. In the harness part of D12, 4b could not run its tests, because each `npm` call was denied. The skill part of D12 (the retry rule) stays open.

## D284: The Rate Limit Fixture Has No Known Security Defect

**Decision**:

1. `tests/fixtures/scenarios/finished-rate-limit/src/rateLimit.js` says that it runs after the auth middleware, which rejects a missing or unknown API key. So the key is a valid key, and a client cannot get a new window with a new key.
2. The limiter fails closed: a request with no `x-api-key`, or an empty one, gets 401. No request shares the bucket of the key `undefined`.
3. A timer deletes the expired windows once in each window, so that the map does not grow with each new key. The timer uses `unref()`, so that it does not keep a process alive.
4. The 21a and 21b build helper of the run folder gets the same three changes for its sliding window.
5. `plan.md` of the fixture does not change. The 401 is a result for a state that the auth middleware prevents, so the Goal and the decision stay correct.

**Rationale**: the user asked to fix the findings of the automated security review of the scenario temp repos: an unbounded map, a rate limit key that the client controls, and a shared bucket for a missing key. In the run on 484f35a, an Opus summary of 13a also named "the shared counter for requests without an API key or the map that never drops old keys". A later archive run can now draft the 401 as a requirement. If a scenario of the fixture fails on that, the next run records it in its `defects.md`.

## D285: Fixes of the Skill Defects of the Run on 484f35a with Opus 5.5

**Decision**:

1. The shared failure rule, in each skill and in `apply.instruction`: a denied Bash call with more than one command is tried once more as single commands, or with the Read, Write, or Edit tool. A denied single command is not run again. If no step needs the output of a failed action, for example an extra check or a read of a link for more context, the agent names the action and the error, and goes on. A step always needs a test run that the step names, and a write, an edit, or a delete of a file. If a step needs the output, and the action fails again or a single command is denied, the agent reports and stops, as before. This revises D281 item 1.
2. Archive on the guard path: step 6 also names each draft that holds content from another 🤖 line of `proposal.md` or `design.md`, for example a `## Why` line, because the draft holds no 🤖. Guard step 2 searches `proposal.md`, `specs/`, and `design.md` for 🤖. Upgrade marks a new claim of `proposal.md` with 🤖, so archive must see it.
3. Archive writes each section of an ADR draft from `plan.md`, from `design.md` on the guard path, from the code, and from the facts. Step 6 quotes each sentence of an ADR draft that adds a claim that no source states, for example an inferred consequence, and says that the claim is an addition of the agent. An ADR holds no 🤖, so the reply is the only place to name the claim. The user picked this option over "no addition", because an inferred consequence is often useful.
4. The fact rule of propose: propose records no fact that only repeats the Goal, a constraint, or a non-goal of `plan.md`. A 👤 fact is always non-obvious, so archive promotes it, and a repeat of the Goal adds a line with no new content. Apply and the tasks preview do not need the rule, because they do not write the Goal.
5. The summary of upgrade: a decision with 🤖 in `plan.md` and no 🤖 in `design.md` has the confirmation of the user, because only a yes in the question turn of step 2 removes the mark. Upgrade does not ask to confirm the decision again, also on a resumed run, where the answers of the earlier session are not on disk.

**Rationale**: the user asked to investigate the defects of `.scenario-runs/20261113-484f35a-opus/defects.md` with the cause `skill`. The report is `investigation-skill.md` in that folder. The user agreed with each fix, and picked option (a) for D07. D18 is not a defect, because D244 item 1 allows `plan.md` IDs in a reply. In D05, the tasks preview stopped after two denied `gh issue view 42` calls for a link in Background, and apply stopped after two denials of an extra check. In D12 of `.scenario-runs/20261113-eb2df49/`, apply ran the denied single command `npm test` again with no change. In D06 (18b ×2), an ADR draft copied the 🤖 `## Why` claim of `proposal.md` into `## Context`, and the reply did not name it. In D07 (14, 15, 20b, 18b), each ADR draft added a consequence that no source states, for example "If a later change pages or lazy-loads the table, the export must be revisited", and no reply named it. In D09 (22a ×2), propose wrote "F1: 👤 Before this change, the report page showed dates in UTC …", which repeats the second Goal bullet. In D16 (20a run 2), the resumed run asked the user to confirm two decisions that the user confirmed in step 2.

## D286: Scenario and Fixture Fixes of the Run on 484f35a with Opus 5.5

**Decision**:

1. Scenario 13a: run 1 passes when the agent shows the `validate` error, or when it reads the delta back, names how the delta differs from the approved draft, and stops before `validate` with no ADR. Step 4 says to leave a question at the end of run 1 with no answer, and to start run 2 in a new session.
2. Scenario 21b: step 2 approves each draft with the "Keep it." answer. The Expected text says that the agent drafts the requirement again (D282), and that the main spec holds the requirement once after the merge.
3. Scenario 20a step 2 answers yes to each requirement that upgrade asks to write, from any source, also from a 🤖 decision.
4. The `interrupted-upgrade` fixture: the Verify line of task 1.1 of `tasks-preview.md` also covers an empty table, which exports only the header row. `plan.md` does not say this, so a scenario from it is a new claim with 🤖 in scenario 7. The plan hash does not change, because it covers only `plan.md`.
5. Scenario 4: a decision for the columns of the scaffold table that also lists the sample rows passes. The MIME type and the encoding of the download are part of the CSV format, not of the download method, so a format decision or a file name decision can hold them.
6. Scenario 4b gives the sliding window instruction after the first turn in which apply writes code, and in a headless run as the next turn. The old text "During the work" has no exact point in print mode.
7. Scenario 4d checks that the preview and apply ask no question about a result that the Goal states, that no constraint or decision contradicts the Goal, and that the agent records no part of an answer that contradicts the Goal. It names the conflict, and tells the user to change the Goal in `plan.md` first, because the tasks preview and apply do not edit the Goal.

**Rationale**: the user asked to investigate the defects of `.scenario-runs/20261113-484f35a-opus/defects.md` with the cause `scenario`, and to enhance the scenarios and the fixtures. The report is `investigation-scenario.md` in that folder. S8 needs no change: 4b already answers "I have no preference." to each other question, and D285 lets the agent skip an extra check that is denied. In S1, Opus read the delta back after the write, as the failure rule asks, saw the break of `break-delta.sh`, and stopped before `validate`. The stop is correct, so the old check was too strict. In S2, D282 made archive draft the requirement again, and the steps gave no answer for the new draft. In S3, upgrade asked about a requirement from a 🤖 decision, and the steps named only the Goal and the tasks preview. In S4, the Expected example "Table is empty" had no source in the fixture, so the 🤖 check of scenario 7 had no planted item to find. In S5 and S6, the groups had to judge these two cases with no Expected text. In S7, both runs finished the fixed window before the instruction, and the groups could not see when to give it. In S9 (D04), the preview asked about a point that the Goal fixes, recommended the other result, and the answer gave a constraint that contradicts the Goal. The done check still said "the Goal is met", and no check of 4d saw it.
