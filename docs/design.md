# Design

The current rules for openspec-lite. Read this file first when you implement.
Each rule cites the decision that holds its rationale in `docs/decisions.md`.
If this file and `decisions.md` disagree, this file is correct. Fix `decisions.md`.

---

## 1. Repo Layout

```
openspec-lite/
├── package/                 # the only folder that APM downloads
│   ├── LICENSE              # MIT
│   ├── apm.yml              # name and version, for APM
│   └── skills/
│       ├── openspec-lite-propose/SKILL.md
│       ├── openspec-lite-tasks-preview/SKILL.md   # holds the preview template inline
│       ├── openspec-lite-apply/SKILL.md
│       ├── openspec-lite-upgrade/SKILL.md
│       ├── openspec-lite-archive/SKILL.md
│       └── openspec-lite-schema/
│           ├── SKILL.md
│           ├── scripts/install.mjs    # backup and copy, not copied to the user repo
│           └── assets/plan-lite/
│               ├── schema.yaml
│               ├── plan-hash.mjs
│               ├── openspec-version.mjs
│               └── templates/
│                   └── plan.md
├── scripts/
│   ├── check-version.mjs
│   └── run-metrics.mjs
├── tests/
│   ├── plan-hash.test.mjs
│   ├── check-version.test.mjs
│   ├── install.test.mjs
│   ├── run-metrics.test.mjs
│   └── schema.test.mjs
├── .github/workflows/
│   ├── apm-install.yml
│   └── test.yml
├── docs/
│   ├── test-scenarios.md
│   └── todo.md            # open items with evidence, no decision yet
├── GLOSSARY.md
└── README.md
```

- The repo holds the design docs and the deliverable together (D38).
- Only `package/` is the deliverable. Tests, scripts, and docs stay outside it, so APM does not download them (D83).
- The schema source is in the assets of `openspec-lite-schema`. There is no other copy in this repo (D43, D44).
- The tasks preview template is inline in the `openspec-lite-tasks-preview` SKILL.md (D53, D76).

## 2. Delivery

- Ship through Microsoft APM only. The git repo is the package (D70).
- The repo is `github.com/duongphuhiep/openspec-lite` (D100).
- README tells users to install the `package/` subfolder with a semver range and a target: `apm install duongphuhiep/openspec-lite/package#^1.0.0 --target claude`. The user replaces `claude` with their harness. With no target and no harness folder, APM deploys nothing (D81, D83, D103).
- README lists the requirements: `npm install -g @fission-ai/openspec@1` (inside the `openspec-version` range), the APM CLI, and `openspec init --tools <harness>`, which installs the stock OpenSpec skills and `/opsx:*` commands. `--tools none` installs none (D103, D106, D118).
- README has a table of harness names for `openspec init --tools` and `apm install --target`. They are the same, except GitHub Copilot: `github-copilot` and `copilot` (D118).
- The repo has no `package.json`. `package/apm.yml` holds only `name: openspec-lite` and `version`. APM rejects a folder with only `skills/` and no `apm.yml` (D94).
- A release is a git tag named `vMAJOR.MINOR.PATCH`, for example `v1.0.0`. APM range matching recognizes this form. The tag selects the schema version (D43, D70, D93).
- Each change to a file under `assets/plan-lite/` bumps the schema `version` by 1. Any tag can ship the bump. Only a breaking schema change needs a new major tag (D109).
- CI fails if a file under `assets/plan-lite/` changed since the latest `v*` tag but `version` did not. The check runs on each pull request, on a push to `main`, and on a tag push, so a missing bump stops before the release (D109, D110).
- Ship skills only. Do not ship slash-command files or per-harness plugin manifests (D35, D42).
- `schema.yaml` is the only declaration of compatible OpenSpec versions (D48).
- The license is MIT. The one `LICENSE` file is `package/LICENSE`, with the line "Copyright (c) 2026 DUONG Phu-Hiep". The root README links to it (D89, D100).
- README has a compatibility table: each openspec-lite major tag with its `openspec-version` range (D67, D81).
- CI (`.github/workflows/test.yml`) runs on a push to `main`, on a `v*` tag push, and on each pull request (D85, D88, D107):
  - It runs a Node matrix: 20.19 (the OpenSpec minimum) and 24 (D107).
  - It runs a matrix of two `@fission-ai/openspec` versions: the lower bound of `openspec-version` in `schema.yaml`, read by a CI step, and `latest`.
  - It runs `node scripts/check-version.mjs`. Contract: `node scripts/check-version.mjs [root]`, default `.`. It checks the five workflow skills by name under `<root>/package/skills/`. It prints `ok <skill> <n>` or `FAIL <skill>: <reason>` per skill, and exits with code 1 on any failure (D99). If `schema.yaml` has no readable version, it prints only `FAIL schema.yaml: missing file or version line`. The script reads each line `Shipped schema version: <n>` in each workflow skill. The line can be indented. It normalizes CRLF to LF first. It compares numbers. It fails if a workflow skill has no marker line, or if any number differs from `version` in `assets/plan-lite/schema.yaml` (D66, D87, D93, D106).
  - It runs `node --test` from the repo root. Node finds `tests/*.test.mjs`. `node --test tests/` fails on Node 24 (D84, D99).
  - On a tag push, it fails if the tag is not `v` + `version` from `package/apm.yml`. It reads the line `^version:` with no YAML library (D94).
- The `apm-install` workflow (`.github/workflows/apm-install.yml`) does the real APM install from the tag. It runs only by hand, from the Actions tab (`workflow_dispatch`) (D130):
  - It installs the latest APM with `microsoft/apm-action@v1` in `setup-only` mode, with `apm-version: latest`.
  - It reads the latest `v*` tag. In an empty `git init` folder, it runs `apm install duongphuhiep/openspec-lite/package#^<major>.0.0 --target claude`.
  - It checks that `.claude/skills/` has the six `openspec-lite-*` skills, with `scripts/install.mjs` and `assets/plan-lite/` in `openspec-lite-schema/`. It checks that `apm_modules/duongphuhiep/openspec-lite/` holds only `package/`, and that `apm.lock.yaml` has `resolved_ref: <tag>`.
- Before each release tag:
  - Run scenarios 1–9 and 11–22 in `docs/test-scenarios.md` by hand (D69, D113, D115, D120, D122). Each scenario has steps and an expected result. Each report has the metrics table of "Metrics" in `docs/test-scenarios.md`, made with `node scripts/run-metrics.mjs` (D146). The list (D99):
    1. Fresh repo: propose installs the schema, creates the change, writes `plan.md`.
    2. Small request: propose offers Level 1 and stops on yes, with no files written.
    3. Tasks preview, then edit a Constraint: apply warns that the preview is stale.
    4. Stock `/opsx:apply` on a plan-lite change: it follows `apply.instruction`, writes no `plan.md` ID outside `plan.md`, and ends with the done check. 4b: apply keeps only the current decisions and removes orphan facts.
    5. Archive with one requirement and one decision: the delta merges, the ADR is written.
    6. Archive with nothing promoted: `skip_specs` is set, archive succeeds.
    7. Upgrade with a preview, interrupted after it writes `proposal.md`, then run again: it resumes and validates. It asks the open question and each planned requirement from the Goal or the preview in one turn before any write, and marks each inferred item with 🤖 (D152, D164).
    8. Newer repo schema: each workflow skill stops with the "Run `apm update`" message.
    9. Schema re-copy: the old folder moves to `openspec/schemas-backup/`. An existing `operations.archive.guidance` list keeps its items and gets the openspec-lite item, with one `operations:` key (D110).
    10. Not used. The `apm-install` workflow does the real APM install from the tag (D83, D130). Run it after the tag push when the release adds, moves, or deletes a file in `package/`, or changes `package/apm.yml`. Also run it after an APM update.
    11. OpenSpec root in a subfolder of the git root: the skills run from `root.path`, and the skill-folder search finds the skill in a parent folder (D111).
    12. propose resume: a plan-lite change with no `plan.md` resumes with one `skip_specs` line (D111, D112).
    13. archive rerun: (a) after a failed validate, the agent shows earlier deltas before the write and drafts the decision again; (b) after a failed `openspec archive`, it skips the ADRs with `Change: <name>` (D111, D112, D113).
    14. Promotion into an existing capability: archive reuses the capability, and the main spec ends up correct (D115). The ADR `## Context` holds the fact, with no `plan.md` ID (D135, D142).
    15. Promotion keeps each non-obvious item and each contract of `plan.md`, or names it as skipped (D115, D119). A fact goes to its ADR, or is named as not drafted. No spec or ADR holds a `plan.md` ID (D135, D142).
    16. Stock `/opsx:archive` on a plan-lite change: (a) with the guidance, the agent warns or runs `openspec-lite-archive`; (b) without the guidance, and (c) the CLI directly, are known gaps that the run records (D95, D115).
    17. `openspec-lite-apply` after an upgrade refuses and points to `/opsx:apply` (D75).
    18. `openspec-lite-archive` after an upgrade refuses, points to `/opsx:archive`, and warns about the decisions in `design.md` (D115). 18b: on a yes, it copies the decisions to ADRs, and does not archive (D154).
    19. tasks-preview and upgrade after an upgrade: refuse, or ask to resume when `plan.md` exists (D107, D108).
    20. Upgrade lists the destination of each `plan.md` section and asks before it prunes. The fact goes to `design.md`, and no artifact holds a `plan.md` ID (D135, D142). Archive drafts an item that the user picks from the skipped list. Upgrade with no requirement ends with `skip_specs: true` set, and the summary says so (D108, D120, D153, D160).
    21. Archive with a decision that replaces an `Accepted` ADR: the new ADR has `Supersedes:`, and only the `Status:` line of the old ADR changes. A rerun fixes an old ADR that an earlier run did not mark (D122).
    22. Goal with more than one outcome: (a) propose keeps related outcomes as bullets in one change; (b) propose asks before it leaves out an outcome that can ship alone; (c) archive names the outcome that is not met, and asks only "Archive anyway?" (D148, D155).

## 2a. Tests (D84)

- Tests live in `tests/` and run with `node --test` from the repo root. They have no dependencies.
- `plan-hash.test.mjs`: CRLF, a UTF-8 BOM, section order, Open Questions, Facts, Decisions, and HTML comments do not change the hash. A stray `<!--` does not hide a heading. A comment inside a fence changes the hash. An absent and an empty `## Background` give the same hash. A changed Constraint or Background changes it. The shipped template hashes with no error. Text before the first `##` heading does not change the hash (D141). A heading with the wrong letter case exits with code 1. A plan with no comments keeps its v1 hash value. A missing required heading or a missing file exits with code 1.
- `check-version.test.mjs`: runs the script on fixture folders. A match passes. A mismatch fails. A missing marker line fails. A missing skill fails. A skill with CRLF line endings passes. An indented marker passes. A second marker with a wrong number fails. `01` equals `1`. A root with no `package/` prints one `schema.yaml` failure (D106).
- `install.test.mjs`: a first install copies. A lower repo version moves to a timestamped backup, then copies. An equal version prints `status: current`. A higher version exits with code 2. Missing shipped assets exit with code 3. A second backup with the same timestamp gets a `-2` suffix. A quoted higher version with a comment exits with code 2. A file system error exits with code 1, with an `install:` message and no stack trace (D96, D98, D102, D106).
- `openspec-version.test.mjs`: with a fake `openspec` on `PATH`, 1.14.2 is in `>=1.9.0 <2.0.0`. A version outside the range and output with no version exit with code 2. A failed command and a `schema.yaml` with no range exit with code 1. The shipped `schema.yaml` has a readable range. It skips on Windows (D175).
- `run-metrics.test.mjs`: the script sums the tokens, turns, denials, and time of all turns. It takes the cost and the thinking tokens from the last turn of each session, because a `--resume` turn holds the totals of the session (D170). It counts a tool call that is twice in the log once. A turn in a new session is not a user turn. It lists the `.md` files under `openspec/`, except `openspec/schemas/` and `openspec/schemas-backup/` (D162). A missing session log exits with code 1 (D146).
- `schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It also tests the upgrade path (`instructions <artifact> --schema spec-driven` on a plan-lite change), an archive that merges a delta, and a `validate` failure with no delta and no `skip_specs` (D108). It also tests the CLI behavior that the skills rely on: `state: blocked` with no `plan.md`, `root.path` from a subfolder and `root: null` above it, `skipped: true` on `instructions specs` with `skip_specs`, and the failure on a duplicate key in `.openspec.yaml` (D112). The CLI test skips itself if `openspec` is not installed. When the `CI` environment variable is set, it fails instead, so a broken CI install cannot pass (D99). The `plan-hash.mjs` test in this file does not need `openspec` and never skips.
- `docs/test-scenarios.md` holds the agent scenarios, which we run by hand or headless before each release (D69). Each expected result is the best result for the end user, not a copy of the current skill behavior. A scenario can fail on the current skills. Then the gap goes to `docs/todo.md`, or a new decision fixes the skill (D173).

## 3. Skill Rules

### Names

- Skill descriptions (D104): `openspec-lite-propose` triggers on its name, on "plan-lite", and on "lightweight plan" or "medium change". The other five skills trigger only on their name or on "plan-lite". `openspec-lite-archive` also says to use it instead of stock `/opsx:archive` for a change with `schema: plan-lite` (D116).

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Common rules for all workflow skills

The five workflow skills are propose, tasks-preview, apply, upgrade, and archive.

**OpenSpec root** (D111): Each skill runs `openspec list --json` first and reads `root.path`. It runs each command from that folder, and reads each `openspec/...` path from it. If that folder is not the current folder, each `openspec` command starts with `cd <root> && `, also the first one after the user confirms a root (D121). OpenSpec finds the nearest `openspec/` folder, which can be a subfolder of the git root. OpenSpec searches only up from the current folder, so an agent that starts at the git root of a monorepo gets `root: null`. Then the skill searches the subfolders for an initialized `openspec/` (with `config.yaml`, `changes/`, or `specs/`), and skips `.git/`, `node_modules/`, and `apm_modules/`. It asks the user to confirm one match, or to pick one of several. Only with no match does it stop and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/` (D113).

**Change selection** (D61): Use the change named in the prompt. If no name is given and only one active change exists, use it. Otherwise ask. List active changes with `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml` (D99).

**Change schema guard** (D75): tasks-preview, apply, upgrade, and archive refuse a change whose schema is not `plan-lite`. Point to the matching stock skill, for example `/opsx:archive`. When archive refuses a change whose `design.md` has `### Decision` entries, it also warns: stock `/opsx:archive` does not turn them into ADRs, so copy them to `openspec/adr/` first to keep them (D115). Archive can offer to do this copy. It writes nothing before a yes. On yes, it uses the ADR form, the checks, the file rules, and the `Supersedes:` edits of the archive steps. The `validate` condition of the ADR write does not apply. It writes no spec, does not change `design.md`, and does not archive the change (D154). One exception: upgrade accepts a `spec-driven` change that still has `plan.md`. A `spec-driven` change with no `plan.md` is refused, like any other schema (D108). An earlier run stopped after the schema switch, so upgrade resumes at the step after it (D106). A finished upgrade can also keep `plan.md`, so upgrade asks the user before it resumes (D107).

**Skill chaining** (D57): To run another skill, invoke it if the harness can. If the harness cannot, tell the user which skill to run, and stop.

**Schema check** (D44, D56, D81): Do this after change selection and the change schema guard, before any other step. propose has no change yet. It first asks the split question and the Level 1 question (see openspec-lite-propose), then starts here (D93, D148).

1. Read `version` from `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. Compare it with the shipped version. Each workflow skill holds the line `Shipped schema version: <n>` (D87). The number must equal `version` in `assets/plan-lite/schema.yaml` (D66).
   - The file is missing, its version is lower, or it has no readable `version` line: run `openspec-lite-schema` (D110). If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of the calling skill, in the same turn (D93, D114). The end summary of the calling skill includes the schema report: the status, the copied files, and the backup path (D121).
   - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`." A minor or patch tag can bump the schema, so `apm update` usually fixes it. Only a breaking schema change needs the next major tag (D93, D109).
3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`. The agent does not compare the versions itself (D175). If it exits with code 1, show its line, and stop (D93). If it exits with code 2, show its line as a warning, and continue. In both cases, point to the compatibility table at `https://github.com/duongphuhiep/openspec-lite#compatibility`. The installed package has no README.

**Plan hash** (D72): From the OpenSpec root, run:

```sh
node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md
```

If it exits with code 1, show its message and stop. Ask the user to fix `plan.md` as the message says (D93, D99).

### openspec-lite-schema (D41, D43, D44, D48, D56, D65, D71, D82, D86, D90, D95, D96, D98)

- Find the skill's own folder, `<skillDir>`. It holds `scripts/` and `assets/plan-lite/`:
  1. Use the base directory from the harness, if it gives one.
  2. Otherwise, search for `openspec-lite-schema/` with `assets/plan-lite/` in it, and use the first match (D111, D112):
     1. Project folders: in the OpenSpec root, then in each parent folder, check `.agents/skills/`, `.claude/skills/`, `.kiro/skills/`, `.grok/skills/`, and then `apm_modules/` (D99).
     2. User folders, only after all project folders: `~/.claude/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`.
  3. If no path has the folder, stop and tell the user.
- Then compare the repo version with the shipped version. Read the shipped version from `<skillDir>/assets/plan-lite/schema.yaml` (D93, D99):
  - Higher: stop, with the same message as the schema check.
  - Equal: say "already current". Skip the install, but still do the archive guidance step, which is idempotent. To repair a damaged schema, the user deletes `openspec/schemas/plan-lite/` and runs the skill again (D101, D107).
  - Lower, missing, or no readable version: continue.
- If a repo copy exists, ask the user: "This replaces `openspec/schemas/plan-lite/` (v<old> → v<new>). The old folder moves to `openspec/schemas-backup/`. Proceed?" End the turn, and wait. Do not run the install script before a yes. On no, stop (D114).
- Run the install script with the OpenSpec root as its argument. Do not read the schema content into the conversation (D98, D111):

  ```sh
  node "<skillDir>/scripts/install.mjs" "<root>"
  ```

  `install.mjs` contract (D98, D101, D102):
  - Usage: `node install.mjs <repoRoot>`. It finds its own `assets/plan-lite/` through `import.meta.url`.
  - It reads each version from the line `^version:\s*["']?(\d+)["']?\s*(?:#.*)?$` in `schema.yaml`, with no YAML library. Quotes and a trailing comment are allowed (D106).
  - Shipped version missing or not readable: exit 3.
  - No repo copy: copy. A repo copy with no readable version counts as lower.
  - Repo version lower: move the repo copy to `openspec/schemas-backup/plan-lite-v<old>-<YYYYMMDD-HHMMSS>/`, then copy. If that name exists, add `-2`, `-3`, and so on.
  - Repo version equal: copy nothing.
  - Repo version higher: copy nothing, exit 2.
  - Output: one line `status: installed`, `replaced`, `current`, or `newer`. Then `backup: <path>` if it made a backup, and `copied: <path>` for each file. Exit 0 on `installed`, `replaced`, and `current`.
  - A file system error: exit 1, with `install: <message>` on stderr and no stack trace. If the old schema already moved, a second line names the backup folder (D106).
- Add this item to `operations.archive.guidance` in `openspec/config.yaml`, if the list does not have it yet. `guidance` must be a YAML list (D95):

  ```yaml
  operations:
    archive:
      guidance:
        - "For a plan-lite change, run openspec-lite-archive first. It promotes plan.md decisions to specs and ADRs, then archives."
  ```

  This guard is best effort. The stock archive skill treats guidance as optional advice.

  - If `openspec/config.yaml` is missing, create it with only this block. `openspec new change` keeps such a file.
  - If the file has no `operations` key, add the whole block, and keep the other keys and comments. `openspec init` writes `operations` only in a comment, so this is the usual case (D106).
  - If `operations` exists without `archive`, or `operations.archive` exists without `guidance`, add only the missing part under the existing key. Never add a second `operations:` key: OpenSpec then ignores the whole file (D107).
  - If `guidance` is a plain string, OpenSpec ignores it. Do not edit it. Show the user how to change it to a list (D99).

- Report the copied files, the backup path, and the `config.yaml` line. Do not use `git diff` or `git status`. Tell the user to compare and delete the backup.
- Tell the user to commit the schema to git.

### openspec-lite-propose (D10, D26, D28, D50, D54, D68, D78, D80, D148)

- The first outcome of the request is the main outcome, also when the request has only one outcome. If another outcome touches the same code as the main outcome, keep it, with no question. Otherwise, if it can ship alone, ask: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?" On yes, leave it out of this change. On no, keep it (D148).
- If the outcomes that stay are small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it. Then stop (D148).
- Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 10 words. Start the name with the main outcome. You can add words from the other outcomes after it. 10 words is a soft limit: go over it only if a shorter name is not clear. If the name is too long, remove the words of the other outcomes first (D168).
- Run `openspec new change "<name>" --schema plan-lite`. If it fails because a plan-lite change with that name exists and has no `plan.md`, an earlier run stopped here: offer to resume. In each other case, show the error and ask for another name (D99, D111).
- Read `.openspec.yaml` before the edit. OpenSpec 1.14.2 already writes `skip_specs: true` (`docs/facts.md`). If the line exists, do not edit the file. If it is missing, add it. A duplicate key breaks each CLI command on the change (D112, D150).
- Get the template from `openspec instructions plan --change "<name>" --json` → `template`. Write `plan.md` from it. Fill only what is known. Leave the other sections empty. Keep each `<!-- ... -->` guidance comment, also in a section that you fill. Write the content on the lines under the comment (D127, D131). Do not invent non-goals, constraints, facts, or decisions (D114). Do not write an outcome that the user moved out in `plan.md`, also not in `## Non-Goals`. The summary names it (D169). Keep only the current decisions, and no facts with statistics that soon go out of date (D136). Remove each fact that justifies no current decision or constraint, except a fact about an external service or tool (D140, D171).
- `## Goal` holds one outcome by preference. If the change has more than one outcome, write one outcome per bullet, in one or two sentences each (D148).
- If an upgrade signal is present (see §5), suggest an upgrade.
- In the summary, show the change name. Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it (D148).
- At the end, ask: "Do you want a tasks preview?" On yes, run `openspec-lite-tasks-preview`.
- Do not write code.

### openspec-lite-tasks-preview (D19, D23, D24, D26, D32, D49, D52, D53, D72, D76, D171, D172, D174, D177)

- If `plan.md` is missing, stop. Tell the user to run `openspec-lite-propose` (D99).
- Read `plan.md` and explore the code first.
- Write `tasks-preview.md` from this template. Pseudo-diffs are permitted.

  ```markdown
  <!-- Generated. Edit plan.md, not this file. -->
  <!-- plan-sha256: <hash> -->

  ## 1. <group title>

  - 1.1 <task: a verifiable result>
    - Verify: <criteria>
    - Files: <paths, optional>

  ## 2. <next group, depends on 1>
  ```

- Use plain bullets. Do not use `- [ ]` checkboxes.
- Order tasks by dependency. Give each task verification criteria. Put tests and docs with the related code.
- Each task is a meaningful, verifiable result. Do not split into very small subtasks.
- Get `<hash>` with the plan hash command.
- Overwrite the old file.
- At the start, run `git status --porcelain` on `plan.md`. If it prints a line, say in one line that `plan.md` is not committed, and continue. With no git repo, say nothing (D171).
- Record in `plan.md`, with no question (D171): each fact about an external service or tool that the change uses, seen in this run, with its source (a command that you ran, a file that you read, a doc URL, or an error text), when you find it. This includes each error or output of a tool that makes you change what you do (D172). A fact about a file in the repo states a behavior that the code does not show at a glance (D174); each choice between real alternatives in the approach, as a decision, when you make it. Each reason comes from this run, the user, or `plan.md` (D177); and at the end, each point that you are unsure or worried about, as an open question. Do not answer or remove an existing open question: only an answer of the user closes it (D172). Do not edit Goal, Background, Non-Goals, or Constraints. The plan hash does not cover the other sections, so the preview stays current.
- In the summary, list each fact, decision, and open question that the run added, changed, or removed (D171).

### openspec-lite-apply (D27, D64, D73, D171, D172, D177)

- Run `openspec instructions apply --change "<name>" --json`. Follow its `instruction`. The schema `apply.instruction` is the only copy of the plan-lite apply rules.
- Add one rule to the CLI output: ignore checkbox and task-count text. A plan-lite change has no tracked tasks.
- If `state` is `blocked`, `plan.md` is missing. Stop, and point to `openspec-lite-propose`. Do not follow CLI text that names another skill (D111).
- Users try stock `/opsx:apply` first (D27).

### openspec-lite-upgrade (D13, D31, D46, D52, D62, D79, D97, D120, D121, D148, D152, D153, D158, D163, D164, D166, D167)

1. Remove `skip_specs: true` from `.openspec.yaml`. While it is set, the CLI forbids spec files (D99).
2. Before any artifact, plan the requirements (D164, D166). A requirement comes only from these sources:
   - a constraint of `plan.md`. A fact is only the reason for a decision or a constraint, so it goes to `design.md` → `## Context`;
   - a decision that is also a contract, as `GLOSSARY.md` defines it: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. A decision that is not a contract goes only to `design.md` → `## Decisions`;
   - an answer of the user.

   The Goal and `tasks-preview.md` alone are not sources. Then ask in one reply, and end the turn:
   - each open question that changes the specs, the approach, or the tasks;
   - each requirement that you plan from the Goal or the preview, with its text;
   - a request for one requirement, if you plan none.

   If all three lists are empty, do not ask. If the user cannot answer an open question now, the question stays in `plan.md` (D120, `docs/facts.md`). Then write the four artifacts in dependency order, while the change is still plan-lite. Get each template from `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`. Run it as one plain command, with no loop, no chain, and no pipe. Read the full JSON. Do not write the artifact without its `template` and `instruction` (D133). On a resumed run, keep each artifact that already exists, and write only the missing ones. Follow the `instruction` field of each result.
   Do not write the `plan.md` IDs in an artifact. Refer to an item by its title, or a short form of its text, with the change name (D142, D143).
   In `proposal.md`, `specs/`, and `design.md`, put 🤖 at the end of the line or the heading of each inferred item: an item from no section of `plan.md` and from no answer of the user in this upgrade. An item is inferred only if it holds a new claim: a case, a value, a behavior, a risk, a dependency, a choice, or a reason that `plan.md` and the answers do not state. `tasks-preview.md` is not a source. Before it marks an item, the agent checks each sentence of the item and names the new claim. Other words, another form (a scenario that only restates its requirement), another artifact or section, and the code that a `plan.md` item clearly touches are not new claims (D163, D167). One mark per item. `tasks.md` gets no mark (D152).
   1. `proposal.md`: from Goal and the scope. If the Goal has more than one outcome, give each outcome its own item in What Changes (D148). If `## Background` exists, use its scope items and source links (D125). Non-Goals go to `design.md` → `## Goals / Non-Goals`.
   2. `specs/` and `design.md`: from `plan.md`. For specs, use the archive delta rules: pick `<capability>` from `openspec/specs/` first, add a `## Purpose` section for a new capability (D117), give each ADDED or MODIFIED requirement at least one `#### Scenario:`, and copy the full requirement for MODIFIED. Write only the requirements of step 2. After a yes in step 2, a requirement gets no 🤖 mark (D131, D152, D164). If no requirement is left after step 2, write no spec, and put `skip_specs: true` back (D108, D166). Decisions go to `design.md` → `## Decisions`. Constraints go to `## Context` or `## Risks / Trade-offs` if they fit. Facts go to `## Context` (D135). An open question that is safe to answer later goes to `## Open Questions`. An open question that changes the specs, the approach, or the tasks has no slot. Its answer goes to the specs or to `## Decisions`. Neither the question nor a note that points to it goes to `design.md` (D133).
   3. `tasks.md`: if `tasks-preview.md` exists, use it as the seed and add `[ ]` to each task line. Replace each `plan.md` ID in it with the item title (D142). If an answer from step 2 changes the tasks, edit the seed to match it, and say so in the summary. Then delete `tasks-preview.md`. If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here: keep `tasks.md`, and delete `tasks-preview.md` (D107).
3. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. If a step before this one fails, the change is still plan-lite, and a new upgrade run resumes it.
4. List each `plan.md` section with its destination artifact and heading, or "kept". If the items of one section go to different destinations, list each item. Keep a section that has no slot, for example an open question that the user cannot answer now. Name each content that is in no artifact and is not kept, and offer to add it first. Show the list, and ask before the delete in the same reply. End the turn, and wait for the answer. Do not validate or write the summary before it (D132). On yes, delete each section or item whose content moved. Keep the ID comment at the top while a section is left (D158). If no section is left, delete `plan.md`. A section with only an HTML comment counts as no section. On no, keep `plan.md` (D120, D121, D127).
5. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently.
6. In the summary, ask the user to review all artifacts. List each 🤖 item with its new claim (D167), and ask the user to remove the mark to accept it, or to delete the item (D152). Ask for an extra review of `tasks.md`, because it is a contract. Say the `skip_specs` state at the end: absent, because the change has spec deltas, or set, because it has none (D153). If `plan.md` is kept, name each kept section. The stock skills do not read `plan.md`. Tell the user to resolve the kept items before `/opsx:apply`. If the user said no to the delete, say that the moved sections in `plan.md` are old copies, and that the artifacts are the source of truth (D120). If `design.md` has `### Decision` entries, warn that stock `/opsx:archive` does not turn them into ADRs, and that `openspec-lite-archive` can copy them to `openspec/adr/` before it (D115, D154).

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47, D55, D58, D59, D60, D74, D77, D105, D119, D120, D121, D122, D148, D154, D155, D179)

1. Ask the done check (see §4). To find the code, search for what each outcome of the Goal names, for example with `git grep`. Name each outcome that is not met (D148). Do not judge from the first lines of `git ls-files` (D121). If an answer is "no", show the warnings and ask only: "Archive anyway?", with no other options. On no, stop, and tell the user: to keep an item that is not in `plan.md`, add it to `plan.md`, then run archive again (D155).
2. Read `plan.md`. Do not read `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
   - **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It goes to a spec, even if it is obvious from the code (D119).
4. Sort each item: requirement → spec, decision → ADR. If a decision is also a contract, draft the contract as a requirement. Its rationale can also go to an ADR (D119). List each other `plan.md` item that is not drafted, including each non-goal, with a one-line reason (D116). The non-goal rule comes second, right after the sort rule (D147). A fact goes to the `## Context` of each ADR whose decision it justifies (D135). A fact about an external service or tool goes to the `## Context` of each drafted ADR whose decision uses that service or tool. If none uses it, archive drafts an ADR for the fact: `## Context` holds the fact and its source, `## Decision` says how the change handles the behavior, as the code shows, and `## Consequences` says what a later change must keep. If the code does not handle the behavior, archive lists it as not drafted (D179). Each other fact that justifies no drafted ADR is listed as not drafted, with a one-line reason. This includes a fact of a decision that is drafted only as a requirement (D137, D139, D143). Do not copy the `plan.md` IDs to a spec or an ADR. Refer to an item by its title, or a short form of its text, with the change name (D138, D142).
5. Draft the full text of each item:
   - A requirement becomes a delta under ADDED, MODIFIED, REMOVED, or RENAMED. Give each ADDED or MODIFIED requirement at least one `#### Scenario:`, derived from `plan.md` and the code. If an item gives a reason, for example the "because" part of a constraint, keep the reason in the requirement text. A scenario title alone does not keep it (D147). For MODIFIED, copy the full requirement from the main spec, then edit it. To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches (D93). For a new capability, start the delta with a `## Purpose` section, because the CLI otherwise writes "TBD" as the Purpose of the new main spec (D117).
   - A decision becomes an ADR: a `# <Title>` heading, then the plain lines `Status: Accepted` and `Change: <name>`, then the sections `## Context`, `## Decision`, and `## Consequences` (D112). Before drafting, skip each decision that already has an ADR with `Change: <name>` in `openspec/adr/`, because an earlier run wrote it (D111).
   - Superseded ADR (D122): compare each new decision with each `Status: Accepted` ADR in `openspec/adr/`. If the new decision fully replaces an old one, the draft gets the line `Supersedes: <old file name>` after `Change:`. If it changes only part of an old decision, the draft gets no such line, and the agent tells the user that both ADRs stay `Accepted`.
   - Get the delta format from the `instruction` of `openspec instructions specs --change <name> --schema spec-driven --json`. It defines REMOVED (`**Reason**`, `**Migration**`) and RENAMED (`FROM:`, `TO:`) (D111). While `skip_specs` is set, the result also has `skipped: true` and a warning: ignore both. Use SHALL or MUST, as the instruction says (D112).
6. Show the drafts. For each draft with a `Supersedes:` line, name the old ADR and say that its `Status` line changes (D122). The user answers yes, no, or edit for each item. Tell the user that they can pick a skipped item to draft. If the user picks one, draft it and show it for approval (D120). Write nothing before approval.
7. Before the write, list the files under `<change>/specs/` from an earlier run. Show each one, and ask the user to keep or delete it. Then write the approved deltas to `<change>/specs/<capability>/spec.md`. Merge into a kept file with the same path (D110, D112).
8. Decide from the files on disk, not from this run. If any file exists under `<change>/specs/`, remove `skip_specs`. If none exists, set `skip_specs: true`. `validate` fails with a delta and the flag, and also with no delta and no flag (D93, D110).
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Only after `validate` passes, write the approved ADRs to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use the archive date. Set Status to `Accepted` (D93, D105, D121). If the name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR (D112). After each new ADR with a `Supersedes:` line, change only the `Status:` line of the old ADR to `Status: Superseded by <new file name>`. Then check each ADR with `Change: <name>` and a `Supersedes:` line, also from an earlier run, and fix its old ADR the same way (D122).
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas and moves the change (with `plan.md` and `tasks-preview.md`) to the archive. If it fails after step 10, report it. The ADRs stay, because each one is still a correct decision (D105).

## 4. plan-lite Schema

`assets/plan-lite/schema.yaml` (D12, D25, D40, D53):

```yaml
name: plan-lite
version: 5
openspec-version: ">=1.9.0 <2.0.0"
description: Lightweight plan — goal, constraints, facts, decisions. No tasks. Upgradeable to spec-driven.
artifacts:
  - id: plan
    generates: plan.md
    description: Living plan — goal, background, non-goals, constraints, open questions, facts, decisions
    template: plan.md   # relative to templates/
    requires: []
apply:
  requires: [plan]
  # no `tracks`: plan-lite has no tracked tasks file
  instruction: |
    <the exact text of the apply rules below>
```

- Do not add `tasks-preview` as an artifact. Stock `/opsx:continue` and `/opsx:ff` would generate it (D53).
- Keep the `apply` block. Do not set `apply.tracks` (`docs/facts.md`, Trap 2).
- OpenSpec ignores the `openspec-version` key. Only the skills read it (D48).
- `version` is an integer. A change to it is a schema **update** (D45).

`apply.instruction` holds the plan-lite apply rules (D29, D33, D49, D60, D64, D72, D73, D99, D106, D171, D172, D174, D177). It ships in the user's repo, so it must not refer to this file. This is the exact text in `schema.yaml`:

```text
This is a plan-lite change. It has no tasks.md and no checkboxes.
- First, run `git status --porcelain -- <changeDir>/plan.md` from the OpenSpec root. If it prints a line, tell the user in one line: "plan.md is not committed, so git diff cannot show the changes of this run alone. Commit plan.md before the next run." Then continue. If the command fails, for example with no git repo, say nothing.
- Implement from plan.md. If <changeDir>/tasks-preview.md exists, use it as a guide. The CLI does not list it in contextFiles.
- Before you write any code: if the preview exists, run `node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md` from the OpenSpec root, the folder that holds `openspec/`. If the result differs from `plan-sha256` in the preview header, the preview is stale. It is also stale if the header is missing. If it is stale, stop and ask the user: regenerate the preview with openspec-lite-tasks-preview, or continue from plan.md? End your turn, and wait for the answer.
- If the plan hash command exits with code 1, show its message and stop.
- Before you write any code: if `## Open Questions` holds a question that you did not ask yet in this session, ask each one in one reply, with your recommended answer, and end your turn. If the preview is also stale, ask both in the same reply. Do not answer an open question yourself. If the user leaves a question open, keep it in `## Open Questions`, and continue.
- When plan.md and tasks-preview.md conflict, plan.md wins.
- Record each decision in `## Decisions` of plan.md when you make it. A decision is a choice between real alternatives that another person could make in a different way. A meaningful deviation from the preview, for example to make the code simpler, is also a decision. Do not record a choice that follows directly from the code or from a constraint. Write `### Decision D<n>: <title>`, with `<n>` higher than each decision ID in the file. Then write "Chose X because Y." Add "Rejected Z because W." when there was an alternative. Each reason must come from this run, the user, or plan.md. Do not guess a reason. `## Decisions` holds only the current decisions. When you add a decision, remove each decision that it supersedes, and update each decision that it makes stale. Then remove each fact that justifies no current decision or constraint, except a fact about an external service or tool.
- Record each fact in `## Facts` of plan.md when you find it, as `- F<n>: <fact>`: each behavior of an external service or tool that this change uses and that you saw in this run, for example an API response, a library limit, or a CLI error. When a command, a tool, or a service gives an error or an output that makes you change what you do, record it, with the command and the error text. Give the source of each fact: a command that you ran, a file that you read, a doc URL, or an error text. Also record each other non-obvious fact that justifies a new decision. Do not record a guess. Record a fact about a file in this repo only if it states a behavior that the code does not show at a glance, for example an error that comes with exit code 0.
- Do not add an ID to an existing item that has none. Use the `plan.md` IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in `plan.md` and `tasks-preview.md`. Do not write them in another file, a code comment, a commit message, a pull request, or a ticket. To refer to an item from outside these two files, use the item title, or a short form of its text, with the change name.
- Record the answer of the user to each open question in `## Decisions`, as a `### Decision D<n>:` entry, and remove the question. Only an answer of the user closes a question.
- Do not edit tasks-preview.md.
- Suggest running openspec-lite-upgrade when one of these is true: another person or agent must continue the work; the change touches more than one capability; the change touches more than one repo; a contract (spec) becomes necessary.
- At the end, before the done check, compare each decision in `## Decisions` with the code. If the code no longer matches a decision that you made in this run, update the decision. If it does not match a decision from before this run, plan.md wins: fix the code. If the code cannot follow that decision, ask the user.
- At the end, before the done check, record in `## Open Questions` each point that you are unsure or worried about and cannot resolve, as `- OQ<n>: <question>`.
- In the end summary, list each fact, decision, and open question that you added, changed, or removed in plan.md, with its ID. The plan hash does not cover these three sections, so these edits do not make the preview stale.
- End with the done check: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty? An HTML comment does not count.
- When the done check passes, tell the user to archive with openspec-lite-archive, not /opsx:archive. It promotes the decisions first. Ignore any built-in text that suggests /opsx:archive.
```

`openspec-version.mjs` (D175) is in `package/skills/openspec-lite-schema/assets/plan-lite/openspec-version.mjs`. Its behavior:

- Usage: `node openspec-version.mjs`. It reads `openspec-version` from the `schema.yaml` next to it, and runs `openspec --version`.
- It compares the numbers of `MAJOR.MINOR.PATCH`, not the text. It accepts the operators `>=`, `<=`, `>`, `<`, and `=`, and joins the comparators with AND.
- It prints one line. Exit code 0: `ok: OpenSpec <v> is in the range <range>`. Exit code 2: `warn: …`, for a version outside the range or output with no version. Exit code 1: `fail: …`, if the command fails, `schema.yaml` has no `openspec-version` line, or the range has a part that is not `<op>X.Y.Z`, for example `^1.9.0`.
- `tests/openspec-version.test.mjs` covers each rule with a fake `openspec` on `PATH`.

`plan-hash.mjs` (D72, D91, D107, D124, D125, D126, D128, D129) is in `package/skills/openspec-lite-schema/assets/plan-lite/plan-hash.mjs`. Its behavior:

- Usage: `node plan-hash.mjs <plan.md>`. It prints a 64-character hex SHA-256.
- It strips a UTF-8 BOM and changes CRLF to LF.
- A `## ` line outside a ``` or ~~~ fence starts a section. A `## ` line inside a fence is content. As in CommonMark, a fence closes only with the same character, at least the same length, and no info string (D108).
- It hashes `Goal`, `Non-Goals`, `Constraints`, and `Background` (optional). It strips each `<!-- ... -->` HTML comment inside a section body, so a stray `<!--` cannot hide a heading (D124, D126). A comment inside a fence is content, and it stays in the hash (D129). It collapses whitespace and sorts the sections, so whitespace and section order do not change the hash.
- It ignores the text before the first `##` heading, for example the ID comment of the template (D140, D141).
- An empty `## Background` hashes the same as a missing one (D126).
- It exits with code 1 if a heading differs from a hashed title only in letter case, for example `## background` (D128).
- It exits with code 1 if the file cannot be read, or if `Goal`, `Non-Goals`, or `Constraints` is missing. `Background` is optional: no error if absent (D125).
- `tests/plan-hash.test.mjs` covers each rule.

`templates/plan.md` (D10, D124, D125, D134, D135, D136, D137, D140, D142, D144, D171):

```markdown
<!-- Each C, OQ, F, and D ID is unique in this file only. Give each new item a number higher than each ID of its kind in this file. Gaps and any order are OK. Use the IDs only in this file and in tasks-preview.md. Outside them, refer to an item by its title, or a short form of its text, with the change name. -->

## Goal
<!-- The outcome(s) this change delivers. Prefer one outcome per change. More than one related outcome is OK: one per bullet, one or two sentences each. The first outcome is the main outcome. Keep each outcome that touches the same code as the main outcome. Otherwise, if an outcome can ship alone, ask the user to make it a separate change. -->

## Background
<!-- Optional. List scope items and link to source documents that set the context. -->

## Non-Goals
<!-- What this change will not do. One item per line. -->

## Constraints
<!-- Rules the implementation must follow. One item per line, as "- C<n>: <rule>". -->

## Open Questions
<!-- Unresolved questions, as "- OQ<n>: <question>". Remove each question when its answer goes to ## Decisions. -->

## Facts
<!-- Non-obvious facts found during exploration, grilling, the tasks preview, or apply, as "- F<n>: <fact>". Record a fact that justifies a decision or a constraint of this change. Also record a behavior of an external service or tool that this change uses, seen during the work, with its source: a command that you ran, a file that you read, a doc URL, or an error text. Do not record a guess. Record a fact about a file in this repo only if it states a behavior that the code does not show at a glance. Do not record statistics that soon go out of date. A number as an example or a reference is OK. -->

## Decisions
<!-- Keep only the current decisions, not a history. When you add a decision, check the others. Remove each superseded decision. Update each stale decision. Then remove each fact that justifies no current decision or constraint, except a fact about an external service or tool. -->
<!-- ### Decision D<n>: <title>, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. -->
```

`## Decisions` holds only the current decisions, not a history. When an agent adds a decision, it removes each superseded decision and updates each stale one (D136). Entry format: `### Decision D<n>: <title>`, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative (D92, D134).

## 5. Upgrade Signals (D11, D50, D54)

Suggest an upgrade when one of these is true:

- Another person or agent must continue the work.
- The change touches more than one capability.
- The change touches more than one repo.
- A contract (spec) becomes necessary.

Only propose and apply check these signals.

## 6. Out of Scope

- A schema index with many versions. Add it when a second schema version exists (D40).
- Slash commands and raw harness manifests (D35, D42).
- The user-level schema location `${XDG_DATA_HOME}/openspec/schemas/` (D41).
- Upstream contribution of the schema to OpenSpec, until real use proves it (D14).
- Automated skill evals. Add them when a regression happens (D69).
- npm and skillpm delivery. skillpm installs one skill per package. Add per-skill npm packages when a user asks for npm (D70).
