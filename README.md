# openspec-lite

If you think that [OpenSpec](https://github.com/Fission-AI/OpenSpec) is too heavy or verbose, **openspec-lite** is a compatible alternative.
It adds a custom OpenSpec schema, `plan-lite`, that generates one minimal `plan.md`. The workflow becomes `plan → implement (→ doc)`.

## The problem with OpenSpec

The OpenSpec workflow `explore → proposal → apply → archive` generates `proposal → specs → design → tasks` artifacts.

- **The workflow is too heavy for medium changes.** For most medium changes, a `plan → implement` flow with one minimal `plan.md` is sufficient.
- **The artifacts overlap.** The proposal covers WHY, the design covers HOW, and the specs cover WHAT. The boundary between them is fuzzy. A good proposal needs scope, feasibility, and trade-offs, but these belong to the design.
- **`tasks.md` adds little value.**
   - It can become pseudo-code that is almost real code. Then the AI can write the real code directly.
   - The AI writes `tasks.md` before implementation, so it locks in the approach too early. `tasks.md` is a contract. When the AI finds a better approach during implementation, `tasks.md` either restricts the AI or becomes out of date.
   - `tasks.md` is useful mainly for three purposes:
     - To guide a small model when a large model writes it.
     - To track implementation progress.
     - To preview the implementation.
   - For a medium change, the same model usually plans and codes, and you do not need to track progress. So you often read `tasks.md` only to preview the code changes that the AI intends to make.

## The solution

openspec-lite targets medium changes. The workflow is `plan → implement (→ doc)`:

- **Plan**: `openspec-lite-propose` creates `plan.md` in `openspec/changes/<name>/`. Add the context that the AI needs to implement the change correctly.
- **Implement**: `openspec-lite-apply` implements the change from `plan.md`.
- **Doc**: `openspec-lite-archive` promotes non-obvious information and contracts from `plan.md` to `openspec/specs/` and ADRs. Then it moves the change to the archive.

`plan.md` keeps WHY, WHAT, and HOW together while you propose and explore the change. `plan.md` is a living document. It records:

- The context and your proposal.
- The non-obvious facts that you find during exploration, when they justify a decision or a constraint.
- The current decisions: yours, and the decisions that the AI makes during implementation. When a new decision replaces an old one, the AI removes or updates the old one. `plan.md` is not a history.

Each constraint, open question, fact, and decision has a short ID, such as `C1` or `D2`. The IDs appear only in `plan.md` and `tasks-preview.md`. Specs, ADRs, code comments, and commit messages name an item by its title instead.

`plan.md` is a compact form of `proposal.md`, `design.md`, and `specs/`. It has no overlap between sections, so it is easier to review.

At archive time, the AI separates the items that last: requirements and contracts go to specs, and decisions go to ADRs with the facts that justify them.

A custom OpenSpec schema alone can give you a one-artifact workflow. openspec-lite adds the preview, upgrade, and promotion steps around it.

**To review the AI's plan before it writes code**, use `tasks-preview.md`. See [Preview the code changes](#preview-the-code-changes).

**At any time**, you can convert a plan-lite change (`plan.md`) to a stock OpenSpec change (`proposal.md`, `design.md`, and so on). See [Upgrade to a spec-driven change](#upgrade-to-a-spec-driven-change).

## Install openspec-lite

Before you begin, install these tools:

- The [OpenSpec](https://github.com/Fission-AI/OpenSpec) CLI, version `>=1.9.0 <2.0.0`. The `@1` keeps npm inside that range:

  ```sh
  npm install -g @fission-ai/openspec@1
  ```

- The [Microsoft APM](https://github.com/microsoft/apm) CLI.

In your repo, run these two commands. Use the same harness in both commands:

```sh
openspec init --tools claude
apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude
```

- `openspec init` installs the stock OpenSpec skills and the `/opsx:*` commands that openspec-lite uses. With `--tools none`, it installs no skills.
- `apm install` installs the six openspec-lite skills. `#^1.0.0` lets `apm update` move to each newer 1.x release.
- Always pass `--target`. Without it, APM deploys only to the harness folders that it detects. For example, `openspec init --tools codex` writes only `.agents/skills/`, and APM does not detect this folder. So `apm install` with no `--target` installs nothing for Codex.

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

To check the install, look for the six `openspec-lite-*` skill folders in your harness folder, for example `.claude/skills/`.

### Update openspec-lite

To get the newest 1.x release, run this command in your repo:

```sh
apm update
```

- `apm update` stays inside the range in `apm.yml`, for example `^1.0.0`. It does not install a new major version.
- If you installed openspec-lite with `apm install -g`, run `apm update -g`.
- To move to a new major version, edit the openspec-lite ref in `apm.yml`, for example to `#^2.0.0`. Then run `apm install`.

## What openspec-lite ships

- **`plan-lite` schema**: one artifact, `plan.md`. It has no design and no `tasks.md`. The opt-in `tasks-preview.md` is outside the schema.
- **`openspec-lite-propose`**: creates a plan-lite change. It asks if you want a tasks preview.
- **`openspec-lite-tasks-preview`**: generates or regenerates `tasks-preview.md`.
- **`openspec-lite-apply`**: implements the change from `plan.md`. It uses `tasks-preview.md` as a guide.
- **`openspec-lite-upgrade`**: upgrades a plan-lite change to spec-driven, at any time.
- **`openspec-lite-archive`**: archives the change. It promotes selected items to specs and ADRs.
- **`openspec-lite-schema`**: installs or replaces the plan-lite schema in the repo. It moves an old copy to `openspec/schemas-backup/`. The other skills check the schema version and run it when necessary.

To implement, try stock `/opsx:apply` first. If it does not follow `plan.md` well, use `openspec-lite-apply`.

Do not run stock `/opsx:archive` on a plan-lite change. It skips promotion, so the `plan.md` decisions never become specs or ADRs. Use `openspec-lite-archive` instead.

## Explore a change without `/opsx:explore`

openspec-lite has no explore skill. You can use stock `/opsx:explore`, but you usually do not need it:

1. Plan the change directly with `openspec-lite-propose`. It generates `plan.md`.
2. To add facts and decisions to `plan.md` as you go, use a questioning skill such as [mattpocock/grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md).

## Preview the code changes

`tasks-preview.md` is opt-in. It shows the code changes that the AI intends to make. Read it before coding starts, to find a wrong approach early.

- It is a reference, not a contract. Apply can change the approach, for example to make the code simpler.
- It uses the OpenSpec `tasks.md` layout, with plain bullets instead of checkboxes. Tasks are in dependency order. Each task has verification criteria. Tests and docs go with the related code.
- Each task is a meaningful, verifiable result. Do not split the work into very small subtasks.
- Do not edit it by hand. Put corrections in `plan.md`. Then run `openspec-lite-tasks-preview` again. It overwrites the old file.

During apply:

- When the two files conflict, `plan.md` wins.
- If `plan.md` changed after the AI generated the preview, apply warns you. The preview stores a hash of `plan.md` for this check. The hash covers only Goal, Background, Non-Goals, and Constraints, because apply edits the other sections. It ignores HTML comments.
- Apply records each meaningful deviation as a decision in `plan.md`. It removes each decision that the deviation supersedes, and updates each decision that it makes stale. Then it removes each fact that justifies no current decision or constraint.

## Lifecycle

```text
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
      ├── want full OpenSpec? → openspec-lite-upgrade → spec-driven change
      │
      └── done? → openspec-lite-archive
                        │
                        ├── requirements → specs/<capability>/spec.md
                        ├── decisions → openspec/adr/YYYY-MM-DD-<slug>.md
                        └── plan.md, tasks-preview.md → local archive
```

At archive time, the AI uses three filters to select what to promote:

- **Non-obvious**: a future reader cannot deduce it from the code in 5 minutes.
- **Surprising**: it would surprise a new team member.
- **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It goes to a spec, even if it is obvious from the code.

An item needs to pass only one filter. The AI shows the list. You approve, reject, or edit each item in the conversation. You can also pick a skipped item, and the AI drafts it. The AI writes nothing before your approval.

## Upgrade to a spec-driven change

To convert a plan-lite change to a stock OpenSpec spec-driven change, run `openspec-lite-upgrade`. It does these steps:

1. It removes `skip_specs: true` from `.openspec.yaml`.
2. It asks you to answer each open question that changes the specs, the approach, or the tasks. Then it writes `proposal.md`, `specs/`, `design.md`, and `tasks.md` in that order, from `plan.md`. The `plan.md` decisions and facts go to `design.md`. If `tasks-preview.md` exists, it seeds `tasks.md` and adds checkboxes. Then it deletes the preview.
3. It changes `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. This step comes after the four artifacts, so you can run an interrupted upgrade again.
4. It lists where each `plan.md` section moved, and asks before it deletes the moved sections. If nothing is left, it deletes `plan.md`.
5. It runs `openspec validate`.

Review all artifacts after the upgrade. Review `tasks.md` carefully, because it is a contract.

If you keep `plan.md`, resolve the kept items before you run `/opsx:apply`. The stock skills do not read `plan.md`.

After an upgrade, archive with stock `/opsx:archive`.

### You may not need `openspec-lite-upgrade`

openspec-lite targets medium changes, but in practice it also works well for large changes. An upgrade often doubles the size of the change, because the spec-driven artifacts repeat the same content.

So you rarely need to upgrade a plan-lite change to a spec-driven change.

## Compatibility

Run `apm update` to get the newest release in your range. A minor or patch release can update the plan-lite schema. The skills then replace the copy in your repo, after they ask you. Only a breaking schema change needs a new major tag.

| openspec-lite major tag | OpenSpec CLI     |
| ----------------------- | ---------------- |
| v1                      | `>=1.9.0 <2.0.0` |

## Development

- `node --test` runs the tests in `tests/`. The schema test needs the `openspec` CLI.
- `node scripts/check-version.mjs` checks the shipped schema version in each workflow skill.
- `node scripts/run-metrics.mjs` prints the cost, token, and tool numbers of a scenario run. See "Metrics" in [`docs/test-scenarios.md`](docs/test-scenarios.md).
- Before a release, run the scenarios in [`docs/test-scenarios.md`](docs/test-scenarios.md).
- To test a real install from the latest tag, run the `apm-install` workflow from the GitHub **Actions** tab.

## License

MIT. See [`package/LICENSE`](package/LICENSE).

## See also

- [`docs/design.md`](docs/design.md): current rules for skills, schema, and delivery
- [`GLOSSARY.md`](GLOSSARY.md): glossary of project terms
- [`docs/facts.md`](docs/facts.md): verified facts about OpenSpec internals
- [`docs/decisions.md`](docs/decisions.md): design decisions with rationale
