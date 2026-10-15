# Test Scenarios

Run these scenarios by hand before each release tag (D69). The automated tests (`node --test`) cover the scripts and the schema. These scenarios cover the skills, which only an agent can run.

Setup for each scenario, unless it says otherwise:

1. Create an empty folder and run `git init`.
2. Run `openspec init`.
3. Install the release candidate: `apm install <path-to-this-repo>/package --target claude` (or your harness).
4. Start a new agent session in the folder.

Record the agent, the model, the OpenSpec version, and the result of each scenario.

---

## 1. Fresh repo: propose

**Steps**: Ask: "openspec-lite-propose: add a CSV export to the report page."

**Expected**:

- The agent runs `openspec-lite-schema`. `openspec/schemas/plan-lite/` exists. `openspec/config.yaml` has the archive guidance item.
- `openspec/changes/<name>/` exists. `.openspec.yaml` has `schema: plan-lite` and `skip_specs: true`.
- `plan.md` has the five headings, with only known content filled in.
- The agent asks: "Do you want a tasks preview?" It writes no code.

## 2. Small request: Level 1

**Steps**: Ask: "openspec-lite-propose: fix the typo 'recieve' in README.md."

**Expected**: The agent asks: "This looks small. Implement directly with no change?" Answer yes. No file under `openspec/` is created.

## 3. Stale preview

**Steps**:

1. Run scenario 1, and answer yes to the tasks preview.
2. Check `tasks-preview.md`: the second line is `<!-- plan-sha256: <64 hex chars> -->`, and the tasks have no checkboxes.
3. Edit a line under `## Constraints` in `plan.md`.
4. Run stock `/opsx:apply` (or `openspec-lite-apply`).

**Expected**: Before coding, the agent says that the preview is stale and offers to regenerate it. An edit under `## Open Questions` or `## Decisions` alone does not cause this warning.

## 4. Stock apply follows the plan-lite rules

**Steps**: On the change from scenario 1, run stock `/opsx:apply`.

**Expected**:

- The agent implements from `plan.md`, and records deviations as `### Decision:` entries.
- It does not edit `tasks-preview.md`.
- It ends with the done check (Goal, Constraints, Open Questions).
- It tells the user to archive with `openspec-lite-archive`, not `/opsx:archive`.

## 5. Archive with promotion

**Steps**:

1. On a finished change, make sure `plan.md` has one non-obvious requirement and one `### Decision:` entry.
2. Run `openspec-lite-archive`. Approve both drafts.

**Expected**:

- The agent asks the done check first.
- The requirement draft has at least one `#### Scenario:`.
- `openspec validate` passes. `openspec/adr/YYYY-MM-DD-<slug>.md` exists with Status `Accepted`.
- `openspec/specs/<capability>/spec.md` holds the requirement. The change is in `openspec/changes/archive/`.

## 6. Archive with nothing promoted

**Steps**: Remove `skip_specs` from `.openspec.yaml` of a finished change. Run `openspec-lite-archive`, and reject each draft.

**Expected**: The agent sets `skip_specs: true`. `openspec validate` passes, and the archive succeeds. No ADR and no spec is written.

## 7. Interrupted upgrade

**Steps**:

1. Create a change with a tasks preview (scenario 3, steps 1–2).
2. Run `openspec-lite-upgrade`. Stop the agent after it writes `proposal.md`.
3. Run `openspec-lite-upgrade` again.

**Expected**:

- After step 2, `.openspec.yaml` still has `schema: plan-lite`, and `skip_specs` is gone.
- After step 3, the agent keeps `proposal.md` and writes the rest. `tasks.md` has `- [ ]` tasks seeded from the preview. `tasks-preview.md` is deleted.
- `.openspec.yaml` has `schema: spec-driven`. `openspec validate` passes or the agent reports each error.

## 8. Newer repo schema

**Steps**: Change `version: 1` to `version: 99` in `openspec/schemas/plan-lite/schema.yaml`. Run each workflow skill.

**Expected**: Each skill stops with the message "Edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`." No file changes.

## 9. Schema re-copy

**Steps**: Change `version: 1` to `version: 0` in `openspec/schemas/plan-lite/schema.yaml`. Add a file `openspec/schemas/plan-lite/local-note.txt`. Run `openspec-lite-propose`.

**Expected**:

- The agent tells the user that the schema is replaced (v0 → v1) and asks first.
- After yes, `openspec/schemas-backup/plan-lite-v0-<timestamp>/` holds the old folder with `local-note.txt`.
- `openspec/schemas/plan-lite/` has no `local-note.txt`.
- The agent reports the backup path and the copied files.

## 10. Real APM install from the tag

**Steps**:

1. Push the release tag `vX.Y.Z`.
2. In an empty folder: `git init`, then `apm install duongphuhiep/openspec-lite/package#^X.0.0 --target claude`.

**Expected**:

- `.claude/skills/` has the six `openspec-lite-*` skills. `openspec-lite-schema/` has `scripts/install.mjs` and `assets/plan-lite/`.
- `apm_modules/duongphuhiep/openspec-lite/` has only `package/` content: no `tests/`, `scripts/`, or `docs/`.
- `apm.lock.yaml` has `resolved_ref: vX.Y.Z`.
