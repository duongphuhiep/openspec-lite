# openspec-lite

A lightweight workflow extension for [OpenSpec](https://github.com/Fission-AI/OpenSpec). It fills the gap between a throwaway `plan.md` and a full spec-driven change.

## The Problem

The OpenSpec workflow has four artifacts: `proposal → specs → design → tasks`.

1. This workflow is too heavy for medium changes. A `plan.md` is sufficient for medium changes.
2. The artifacts repeat information. Proposal covers WHY, design covers HOW, and specs cover WHAT. The boundary between them is fuzzy. A good proposal needs scope, feasibility, and trade-offs, which belong to design.
3. `tasks.md` is pseudo-code close to real code. It also needs review, which is redundant. It is useful only when a large model writes it to guide a small model.

## The Solution: `openspec-lite`

`openspec-lite` targets medium changes. The workflow is: plan → implement (→ doc).

- plan: `openspec-lite-propose` creates `plan.md` in `openspec/changes/<name>/`. Add any context the AI needs to implement correctly.
- implement: `openspec-lite-apply` implements from `plan.md`.
- doc: `openspec-lite-archive` promotes non-obvious information from `plan.md` to `openspec/specs/` and ADRs. Then it moves the change to the archive.

**To review the AI's plan before it writes code:** Use `tasks-preview.md`. See the Tasks Preview section.

**If the change grows too large:** Run `openspec-lite-upgrade`. It converts the plan-lite change to a spec-driven change.

## Install

Requirements:

- [OpenSpec](https://github.com/Fission-AI/OpenSpec) CLI `>=1.9.0 <2.0.0`. The `@1` keeps npm inside that range:

  ```sh
  npm install -g @fission-ai/openspec@1
  ```

- [Microsoft APM](https://github.com/microsoft/apm) CLI.

In your repo, run these two commands. Use the same harness in both:

```sh
openspec init --tools claude
apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude
```

- `openspec init` installs the stock OpenSpec skills and the `/opsx:*` commands that openspec-lite uses. With `--tools none`, it installs no skills.
- `apm install` installs the six openspec-lite skills. `#^1.0.0` lets `apm update` move to each newer 1.x release.
- Always pass `--target`. Without it, APM deploys only to harness folders that it detects. For example, `openspec init --tools codex` writes only `.agents/skills/`, which APM does not detect, so `apm install` with no `--target` installs nothing for Codex.

The two tools use the same harness name, except for GitHub Copilot:

| Harness        | `openspec init --tools` | `apm install --target` |
| -------------- | ----------------------- | ---------------------- |
| Claude Code    | `claude`                | `claude`               |
| Codex          | `codex`                 | `codex`                |
| Cursor         | `cursor`                | `cursor`               |
| Gemini CLI     | `gemini`                | `gemini`               |
| OpenCode       | `opencode`              | `opencode`             |
| Kiro           | `kiro`                  | `kiro`                 |
| GitHub Copilot | `github-copilot`        | `copilot`              |

## What openspec-lite Ships

- **`plan-lite` schema**: one artifact, `plan.md`. It has no design and no `tasks.md`. The opt-in `tasks-preview.md` is outside the schema.
- **`openspec-lite-propose`**: creates a plan-lite change. It asks if you want a tasks preview.
- **`openspec-lite-tasks-preview`**: generates or regenerates `tasks-preview.md`.
- **`openspec-lite-apply`**: implements from `plan.md`. It uses `tasks-preview.md` as a guide.
- **`openspec-lite-upgrade`**: upgrades a plan-lite change to spec-driven when the scope grows.
- **`openspec-lite-archive`**: archives the change. It promotes selected items to specs and ADRs.
- **`openspec-lite-schema`**: installs or replaces the plan-lite schema in the repo. It moves an old copy to `openspec/schemas-backup/`. The other skills check the schema version and run it when necessary.

Try stock `/opsx:apply` first. If it does not work well, use `openspec-lite-apply`.

Do not run stock `/opsx:archive` on a plan-lite change. It skips promotion, so the `plan.md` decisions never become specs or ADRs. Use `openspec-lite-archive`.

Use stock `/opsx:explore` before you propose. openspec-lite has no explore skill.

## Tasks Preview

`tasks-preview.md` is opt-in. It shows the code changes that the AI intends to make. Read it before coding starts, to find a wrong approach early.

- It is a reference, not a contract. Apply can change the approach, for example to make the code simpler.
- It uses the OpenSpec `tasks.md` layout, with plain bullets instead of checkboxes. Tasks are in dependency order. Each task has verification criteria. Tests and docs go with the related code.
- Each task is a meaningful, verifiable outcome. Do not split the work into very small subtasks.
- Do not edit it by hand. Put corrections in `plan.md`. Then run `openspec-lite-tasks-preview` again. It overwrites the old file.

During apply:

- When the two files conflict, `plan.md` wins.
- If `plan.md` changed after the preview was generated, apply warns you. The preview stores a hash of `plan.md` for this check. The hash covers only Goal, Non-Goals, and Constraints, because apply adds to the other sections.
- Apply records each meaningful deviation in the `plan.md` decisions.

## Lifecycle

```
openspec-lite-propose
      │
      ▼
  plan.md (grows during work)
      │
      ├── want a preview? → openspec-lite-tasks-preview → tasks-preview.md
      │                         ↑ disagree? edit plan.md, regenerate
      │
      ├── /opsx:apply or openspec-lite-apply → code
      │
      ├── scope grows? → openspec-lite-upgrade → spec-driven change
      │
      └── done? → openspec-lite-archive
                        │
                        ├── requirements → specs/<capability>/spec.md
                        ├── decisions → openspec/adr/YYYY-MM-DD-<slug>.md
                        └── plan.md, tasks-preview.md → local archive
```

At archive time, the AI uses two filters to select what to promote:

- **Non-obvious**: a future reader cannot deduce it from the code in 5 minutes.
- **Surprising**: it would surprise a new team member.

One filter is sufficient. The AI shows the list. You approve, reject, or edit each item in the conversation. The AI writes nothing before your approval.

## Upgrade Path

When a Level 2 change grows past its original scope, `openspec-lite-upgrade` does these steps:

1. It removes `skip_specs: true` from `.openspec.yaml`.
2. It writes `proposal.md`, `specs/`, `design.md`, and `tasks.md` in that order, from `plan.md`. The `plan.md` decisions go to `design.md`. If `tasks-preview.md` exists, it seeds `tasks.md` and adds checkboxes. Then it deletes the preview.
3. It changes `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. This is the last switch, so an interrupted upgrade can run again.
4. It deletes each `plan.md` section whose content moved. If nothing is left, it deletes `plan.md`.
5. It runs `openspec validate`.

Review all artifacts after the upgrade. Review `tasks.md` carefully, because it is a contract.

After an upgrade, archive with stock `/opsx:archive`.

## Compatibility

Run `apm update` to get the newest release in your range. A minor or patch release can update the plan-lite schema. The skills then replace the copy in your repo, after they ask you. Only a breaking schema change needs a new major tag.

| openspec-lite major tag | OpenSpec CLI     |
| ----------------------- | ---------------- |
| v1                      | `>=1.9.0 <2.0.0` |

## Development

- `node --test` runs the tests in `tests/`. The schema test needs the `openspec` CLI.
- `node scripts/check-version.mjs` checks the shipped schema version in each workflow skill.
- Before a release, run the scenarios in [`docs/test-scenarios.md`](docs/test-scenarios.md).

## License

MIT. See [`package/LICENSE`](package/LICENSE).

## See Also

- [`docs/design.md`](docs/design.md): current rules for skills, schema, and delivery
- [`CONTEXT.md`](CONTEXT.md): glossary of project terms
- [`docs/facts.md`](docs/facts.md): verified facts about OpenSpec internals
- [`docs/decisions.md`](docs/decisions.md): design decisions with rationale
