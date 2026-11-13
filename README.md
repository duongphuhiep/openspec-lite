# openspec-lite

If you think that [OpenSpec](https://github.com/Fission-AI/OpenSpec) is too verbose, **openspec-lite** is a compatible alternative.
It adds a custom OpenSpec schema, `plan-lite`, that generates one compact `plan.md`. The workflow becomes `plan → implement (→ doc)`.

openspec-lite is compact, but it is not "lite". It does more work than stock OpenSpec, and it uses more tokens. See [Cost: compact, not lite](#cost-compact-not-lite).

## The problem with OpenSpec

The OpenSpec workflow `explore → proposal → apply → archive` generates `proposal → specs → design → tasks` artifacts.

- **The workflow is too heavy.** For most changes, a `plan → implement` flow with one compact `plan.md` is sufficient.
- **The artifacts overlap.** The proposal covers WHY, the design covers HOW, and the specs cover WHAT. The boundary between them is fuzzy. A good proposal needs scope, feasibility, and trade-offs, but these belong to the design.
- **`tasks.md` adds little value.**
   - It can become pseudo-code that is almost real code. Then the AI can write the real code directly.
   - The AI writes `tasks.md` before implementation, so it locks in the approach too early. `tasks.md` is a contract. When the AI finds a better approach during implementation, `tasks.md` either restricts the AI or becomes out of date.
   - `tasks.md` is useful mainly for three purposes:
     - To guide a small model when a large model writes it.
     - To track implementation progress.
     - To preview the implementation.
   - For a medium change, the same model usually plans and codes, and you do not need to track progress. So you often read `tasks.md` only to preview the code changes that the AI intends to make.
- **The artifacts do not show who decided what.** They do not separate your decisions from the guesses of the AI. They do not keep the facts that justify a decision.
- **The artifacts go out of date during implementation.** When the AI finds a better approach in the code, the artifacts keep the old plan.

## The solution

openspec-lite works for medium and large changes. The workflow is `plan → implement (→ doc)`:

- **Plan**: `openspec-lite-propose` creates `plan.md` in `openspec/changes/<name>/`. Add the context that the AI needs to implement the change correctly.
- **Implement**: `openspec-lite-apply` implements the change from `plan.md`.
- **Doc**: `openspec-lite-archive` promotes non-obvious information and contracts from `plan.md` to `openspec/specs/` and ADRs. Then it moves the change to the archive.

`plan.md` keeps WHY, WHAT, and HOW together while you propose and explore the change. `plan.md` is a living document. It records:

- The context and your proposal.
- The non-obvious facts: the facts that need a run, a test, research, or a long analysis of the code to find. An obvious or well-known reason goes into the "because" part of the decision instead.
- The current decisions: yours, and the decisions that the AI makes during implementation. When a new decision replaces an old one, the AI removes or updates the old one. `plan.md` is not a history.

Each constraint, open question, fact, and decision has a short ID, such as `C1` or `D2`. The IDs appear only in `plan.md` and `tasks-preview.md`. Specs, ADRs, code comments, and commit messages name an item by its title instead.

`plan.md` is a compact form of `proposal.md`, `design.md`, and `specs/`. It has no overlap between sections, so it is easier to review.

At archive time, the AI separates the items that last: requirements and contracts go to specs, and decisions go to ADRs with the facts that justify them.

A custom OpenSpec schema alone can give you a one-artifact workflow. openspec-lite adds the preview, upgrade, and promotion steps around it.

**To review the AI's plan before it writes code**, use `tasks-preview.md`. See [Preview the code changes](#preview-the-code-changes).

**At any time**, you can convert a plan-lite change (`plan.md`) to a stock OpenSpec change (`proposal.md`, `design.md`, and so on). See [Upgrade to a spec-driven change](#upgrade-to-a-spec-driven-change).

### What openspec-lite adds to OpenSpec

- **You and the AI make the plan together.** The AI asks you each open question that only you can answer, with its recommended answer. You correct the plan, and the AI updates `plan.md`. After some rounds, the plan becomes solid.
- **`plan.md` records the source of each item.** Each fact has a source. Each decision of the AI ends with 🤖. A decision with no 🤖 is yours, and the AI asks you before it changes it.
- **`plan.md` follows the implementation.** During apply, the AI updates the facts and decisions to match the code. After implementation, `plan.md` describes the code that exists, not only the code that you planned.

### Cost: compact, not lite

`plan.md` is shorter than the stock OpenSpec artifacts, but openspec-lite is not simpler than OpenSpec. It records more information: facts with their sources, the owner of each decision, and the changes after implementation. The skills read and write more, so they use more tokens than the stock OpenSpec skills.

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
- **`openspec-lite-tasks-preview`**: generates or regenerates `tasks-preview.md`. It records the facts, decisions, and open questions that it finds in `plan.md`.
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
- Apply records a deviation from the preview as a decision in `plan.md` only when it changes a visible result or was a close call. It removes each 🤖 decision that the deviation supersedes, and updates each 🤖 decision that it makes stale. It changes a decision with no 🤖 only when you say so. Then it removes each fact that justifies no current decision or constraint, except a non-obvious fact.

The tasks preview and apply both keep `plan.md` up to date while they work:

- **Facts**: each non-obvious fact, with its source and a source emoji, for example 👤 for you, 📖 for documentation, or 🔬 for a test run. An obvious or well-known fact goes into the "because" part of the decision that it justifies. A non-obvious fact needs an answer of you, a run or a test result, research of remote sources (docs, another repo, logs, a remote database), a long analysis of the code, or other work that is worth an agent to find it. This includes each tool error that makes them change the work, unless the code shows the same output. A run alone is not enough. They do not record a fact that you can easily deduce from the code. At the end, apply updates or removes each fact that its work made false, and writes a test for each changed behavior.
- **Decisions**: each choice that changes a visible result, for example a UI, an interface, or the input or output of a program, or where no option is a clear winner, with the reason and the rejected options. The agent does not record other choices. A decision that the agent made ends with 🤖, unless it records your answer or your instruction. A decision with no 🤖 is yours: the agent asks before it changes it. Remove the 🤖 to accept a decision of the agent. The end summary shows a table of each 🤖 decision that the agent added, with the reason why it is a decision.
- **Open questions**: each point that the agent cannot decide and cannot find the answer to, because only you have the information. Before apply writes code, it tries to resolve each open question from the code, the docs, or a run. It records each answer that it finds as a fact or a 🤖 decision. It asks you each question that is still open, with its recommended answer. An open question makes the done check fail until it is closed.

These sections are not in the hash, so the preview stays current. The summary lists each item that the run added, changed, or removed. To see the full change, commit `plan.md` before the run, then run `git diff`. If `plan.md` is not committed, the agent tells you at the start.

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

At archive time, the AI uses four filters to select what to promote:

- **Non-obvious**: a future reader cannot deduce it from the code in 5 minutes.
- **Surprising**: it would surprise a new team member.
- **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It goes to a spec, even if it is obvious from the code.
- **Non-obvious fact**: a fact of `plan.md` that needed a run, a test, research, or a long analysis of the code to find. A fact that you can easily see in the code is not one. It goes to the context of an ADR.

An item needs to pass only one filter. The AI shows the list. You approve, reject, or edit each item in the conversation. You can also pick a skipped item, and the AI drafts it. The AI writes nothing before your approval.

## Upgrade to a spec-driven change

To convert a plan-lite change to a stock OpenSpec spec-driven change, run `openspec-lite-upgrade`. It does these steps:

1. Before it writes a file, it asks you its questions in one reply. It asks each open question that changes the specs, the approach, or the tasks. It also asks about each requirement that it plans to write from the Goal or the tasks preview. A requirement comes from a constraint, a decision that is a contract, or your answer. Then it writes `proposal.md`, `specs/`, `design.md`, and `tasks.md` in that order, from `plan.md`. Just before the first spec, it removes `skip_specs: true` from `.openspec.yaml`. The `plan.md` decisions and facts go to `design.md`. If `tasks-preview.md` exists, it seeds `tasks.md` and adds checkboxes. Then it deletes the preview.
2. It changes `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. This step comes after the four artifacts, so you can run an interrupted upgrade again.
3. It runs `openspec validate`.
4. In one reply, it shows the result, the summary of what to review, and where each `plan.md` section moved. The last line asks before it deletes the moved sections. If `validate` failed, it recommends to keep `plan.md` until you fix the errors. If nothing is left, it deletes `plan.md`.

Review all artifacts after the upgrade. Review `tasks.md` carefully, because it is a contract. The AI puts 🤖 at the end of each item that it inferred, that is, an item that is not in `plan.md` or in your answers. Remove the mark to accept the item, or delete the item, before you run `/opsx:archive`.

If you keep `plan.md`, resolve the kept items before you run `/opsx:apply`. The stock skills do not read `plan.md`. So each open question that you could not answer is also the first task of `tasks.md`.

After an upgrade, archive with stock `/opsx:archive`. It does not turn the decisions in `design.md` into ADRs. To keep them as ADRs, run `openspec-lite-archive` first. It stops, and can offer to copy the decisions to `openspec/adr/`. If it does not offer, ask it to. After the copy, it offers to archive the change for you.

### You may not need `openspec-lite-upgrade`

openspec-lite works well for large changes. An upgrade often doubles the size of the change, because the spec-driven artifacts repeat the same content.

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
