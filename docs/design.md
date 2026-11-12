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
│               ├── plan-status.mjs
│               ├── exit-code.mjs
│               └── templates/
│                   └── plan.md
├── scripts/
│   ├── check-version.mjs
│   ├── run-metrics.mjs
│   ├── scenario-setup.sh  # isolated start state for one scenario run
│   └── break-delta.sh     # scenario 13a helper
├── tests/
│   ├── fixtures/scenarios/  # fixed start states of the scenarios
│   ├── plan-hash.test.mjs
│   ├── check-version.test.mjs
│   ├── exit-code.test.mjs
│   ├── install.test.mjs
│   ├── openspec-version.test.mjs
│   ├── plan-status.test.mjs
│   ├── run-metrics.test.mjs
│   ├── scenario-fixtures.test.mjs
│   └── schema.test.mjs
├── .github/workflows/
│   ├── apm-install.yml
│   └── test.yml
├── docs/
│   └── test-scenarios.md
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
    2. Small request: propose offers Level 1. On yes, it fixes the typo directly, and writes no file under `openspec/` (D202).
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
    16. Stock `/opsx:archive` on a plan-lite change: 16a, with the guidance, the agent warns or runs `openspec-lite-archive` (D95, D115). The cases with no guidance and with the CLI are known gaps, and no scenario runs them (D190).
    17. `openspec-lite-apply` after an upgrade refuses and points to `/opsx:apply` (D75).
    18. `openspec-lite-archive` after an upgrade refuses, points to `/opsx:archive`, and warns about the decisions in `design.md` (D115). 18b: on a yes, it copies the decisions to ADRs, lists each 🤖 line, and then offers the archive (D154, D191, D192).
    19. tasks-preview and upgrade after an upgrade: refuse, or ask to resume when `plan.md` exists (D107, D108).
    20. Upgrade lists the destination of each `plan.md` section and asks before it prunes. The fact goes to `design.md`, and no artifact holds a `plan.md` ID (D135, D142). Archive drafts an item that the user picks from the skipped list. Upgrade with no requirement ends with `skip_specs: true` set, and the summary says so (D108, D120, D153, D160).
    21. Archive with a decision that replaces an `Accepted` ADR: the new ADR has `Supersedes:`, and only the `Status:` line of the old ADR changes. A rerun fixes an old ADR that an earlier run did not mark (D122).
    22. Goal with more than one outcome: (a) propose keeps related outcomes as bullets in one change; (b) propose asks before it leaves out an outcome that can ship alone; (c) archive names the outcome that is not met, asks only "Archive anyway?", and on no gives the paths for that outcome (D148, D155, D191).

## 2a. Tests (D84)

- Tests live in `tests/` and run with `node --test` from the repo root. They have no dependencies.
- `plan-hash.test.mjs`: CRLF, a UTF-8 BOM, section order, Open Questions, Facts, Decisions, and HTML comments do not change the hash. A stray `<!--` does not hide a heading. A comment inside a fence changes the hash. An absent and an empty `## Background` give the same hash. A changed Constraint or Background changes it. The shipped template hashes with no error. Text before the first `##` heading does not change the hash (D141). A heading with the wrong letter case exits with code 1. A plan with no comments keeps its v1 hash value. A missing required heading or a missing file exits with code 1.
- `check-version.test.mjs`: runs the script on fixture folders. A match passes. A mismatch fails. A missing marker line fails. A missing skill fails. A skill with CRLF line endings passes. An indented marker passes. A second marker with a wrong number fails. `01` equals `1`. A root with no `package/` prints one `schema.yaml` failure (D106).
- `install.test.mjs`: a first install copies. A lower repo version moves to a timestamped backup, then copies. An equal version prints `status: current`. A higher version exits with code 2. Missing shipped assets exit with code 3. A second backup with the same timestamp gets a `-2` suffix. A quoted higher version with a comment exits with code 2. A file system error exits with code 1, with an `install:` message and no stack trace (D96, D98, D102, D106).
- `plan-status.test.mjs`: in a temp git repo, a committed `plan.md` prints nothing. A changed or an untracked `plan.md` prints the note. With no git repo, it prints nothing and exits with code 0 (D193).
- `exit-code.test.mjs`: the script prints the output of the command, then `exit: <code>` as the last line, and exits with code 0. A command that cannot start and no command print `exit: not run (...)` (D197).
- `openspec-version.test.mjs`: with a fake `openspec` on `PATH`, 1.14.2 is in `>=1.9.0 <2.0.0`. A version outside the range and output with no version exit with code 2. A failed command and a `schema.yaml` with no range exit with code 1. The shipped `schema.yaml` has a readable range. It skips on Windows (D175).
- `run-metrics.test.mjs`: the script sums the tokens, turns, denials, and time of all turns. It takes the cost and the thinking tokens from the last turn of each session, because a `--resume` turn holds the totals of the session (D170). It counts a tool call that is twice in the log once. A turn in a new session is not a user turn. It lists the `.md` files under `openspec/`, except `openspec/schemas/` and `openspec/schemas-backup/` (D162). A missing session log exits with code 1 (D146).
- `schema.test.mjs`: in a temp repo, runs `openspec new change`, `instructions plan`, `validate`, and `archive --yes` on the shipped schema. It also tests the upgrade path (`instructions <artifact> --schema spec-driven` on a plan-lite change), an archive that merges a delta, and a `validate` failure with no delta and no `skip_specs` (D108). It also tests the CLI behavior that the skills rely on: `state: blocked` with no `plan.md`, `root.path` from a subfolder and `root: null` above it, `skipped: true` on `instructions specs` with `skip_specs`, and the failure on a duplicate key in `.openspec.yaml` (D112). The CLI test skips itself if `openspec` is not installed. When the `CI` environment variable is set, it fails instead, so a broken CI install cannot pass (D99). The `plan-hash.mjs` test in this file does not need `openspec` and never skips.
- `docs/test-scenarios.md` holds the agent scenarios, which we run by hand or headless before each release (D69). Each expected result is the best result for the end user, not a copy of the current skill behavior. A scenario can fail on the current skills. Then the gap goes to the `defects.md` of the run, or a new decision fixes the skill (D173, D251). Each scenario run is isolated: a new temp folder from `scripts/scenario-setup.sh`, a new session, and no output of another scenario or of an earlier run. A scenario that needs an earlier state starts from a fixture in `tests/fixtures/scenarios/` (D199).
- `exit-code.test.mjs` skips the missing-command case on Windows, where the shell reports it (D202).
- `scripts/break-delta.sh` is the 13a helper: it removes the `#### Scenario:` blocks of the first delta that the agent writes (D203).
- `skills.test.mjs`: the shared blocks `### OpenSpec root`, `### Change selection`, and `### Schema check` are the same text in each skill that has them. When you edit one copy, edit each other copy (D237).
- `scenario-fixtures.test.mjs`: the `tasks-preview.md` of the `after-preview` fixture has the `plan-sha256` of its `plan.md` (D199).

## 3. Skill Rules

### Names

- Skill descriptions (D104): `openspec-lite-propose` triggers on its name, on "plan-lite", and on "lightweight plan" or "medium change". The other five skills trigger only on their name or on "plan-lite". `openspec-lite-archive` also says to use it instead of stock `/opsx:archive` for a change with `schema: plan-lite` (D116).

- A skill name is `openspec-lite-<action>`. It uses only `a-z`, `0-9`, and `-`. It is the same as its folder name (D42).
- Users run `/opsx:explore` (stock) for exploration. openspec-lite has no explore skill (D16).

### Common rules for all workflow skills

- Each skill and `apply.instruction` follow the section "Write Instructions as Code" of `CLAUDE.md`: a "How to read" part, a "General rules" list, steps with Input and Output lines that end with the next step, one job per bullet, a named subject in each bullet, flat nesting, and each branch written (D248, D249, D250).

The five workflow skills are propose, tasks-preview, apply, upgrade, and archive.

**OpenSpec root** (D111): Each skill runs `openspec list --json` first and reads `root.path`. It runs each command from that folder, and reads each `openspec/...` path from it. If that folder is not the current folder, each `openspec` command starts with `cd <root> && `, also the first one after the user confirms a root (D121). OpenSpec finds the nearest `openspec/` folder, which can be a subfolder of the git root. OpenSpec searches only up from the current folder, so an agent that starts at the git root of a monorepo gets `root: null`. Then the skill searches the subfolders for an initialized `openspec/` (with `config.yaml`, `changes/`, or `specs/`), and skips `.git/`, `node_modules/`, and `apm_modules/`. It asks the user to confirm one match, or to pick one of several. Only with no match does it stop and tell the user to run `openspec init --tools <harness>` in the folder that must hold `openspec/` (D113).

**Change selection** (D61): Use the change named in the prompt. If no name is given and only one active change exists, use it. Otherwise ask. List active changes with `openspec list --json`. It does not give the schema, so read `schema` from each change's `.openspec.yaml` (D99). When the skill asks the user to pick, it shows the name and the schema of each change (D254).

**Change schema guard** (D75): tasks-preview, apply, upgrade, and archive refuse a change whose schema is not `plan-lite`. Point to the matching stock skill, for example `/opsx:archive`. tasks-preview points to `/opsx:apply` when `tasks.md` exists, and to `/opsx:continue` when it does not (D255). Like apply, it names each open question of a kept `plan.md` (D256). Archive and upgrade stop on a `plan-lite` change with no `plan.md`, and point to `openspec-lite-propose` (D254, D255). If apply refuses a change that still has `plan.md`, it names each open question in it, because the stock skills do not read `plan.md` (D192). When archive refuses a change whose `design.md` has `### Decision` entries, it also warns: stock `/opsx:archive` does not turn them into ADRs, so copy them to `openspec/adr/` first to keep them (D115). Archive can offer to do this copy. It writes nothing before a yes. It ends its turn after the offer, and offers nothing else in that reply (D253). On no, it writes no ADR, and does not offer the CLI command itself, also not in other words (D215, D253). On no, it still runs the 🤖 search, the open-question report, and the 🤖 block below. Then, if no delta holds a 🤖, it tells the user to run stock `/opsx:archive` (D254). On yes, it uses the ADR form, the checks, the file rules, and the `Supersedes:` edits of the archive steps. The `validate` condition of the ADR write does not apply. It writes no spec, and does not change `design.md`. After the ADRs are written, or after a no, it searches `specs/` and `design.md` of the change for 🤖, and lists each such line for the user to accept or delete. It does not offer the archive while a delta in `specs/` holds a 🤖, because the CLI copies it into the main spec (D192). It asks no question with a condition, such as "archive after you remove the marks?" (D215). It does not remove a 🤖 itself, names each open question of a kept `plan.md`, and searches again before each reply that says what holds a 🤖 (D193). Otherwise, it asks: "Archive the change now with `openspec archive <name> --yes`?" It says how many tasks of `tasks.md` are unchecked in the same question, because `--yes` skips the CLI prompt for them. On yes, it runs the command. On no, it tells the user to run stock `/opsx:archive` later (D154, D191). One exception: upgrade accepts a `spec-driven` change that still has `plan.md`. A `spec-driven` change with no `plan.md` is refused, like any other schema (D108). An earlier run stopped after the schema switch, so upgrade resumes at the step after it (D106). A finished upgrade can also keep `plan.md`, so upgrade asks the user before it resumes. The question says what is left to do: "The upgrade of <name> wrote the artifacts, and `plan.md` still exists. Finish the upgrade now: validate the artifacts, then decide what to delete from `plan.md`?" (D107, D191). The turn ends at the question, and `validate` waits for the answer. On no, upgrade names each open question that stays in `plan.md`, and stops (D196).

**Skill chaining** (D57): To run another skill, invoke it if the harness can. If the harness cannot, tell the user which skill to run, and stop.

**Schema check** (D44, D56, D81): Do this after change selection and the change schema guard, before any other step. propose has no change yet. It first asks the split question and the Level 1 question (see openspec-lite-propose), then starts here (D93, D148).

1. Read `version` from `openspec/schemas/plan-lite/schema.yaml` in the target repo.
2. Compare it with the shipped version. Each workflow skill holds the line `Shipped schema version: <n>` (D87). The number must equal `version` in `assets/plan-lite/schema.yaml` (D66).
   - The file is missing, its version is lower, or it has no readable `version` line: run `openspec-lite-schema` (D110). If the user declines the copy, stop. After the copy, read the version again. If it still differs from the shipped version, stop and report both versions. Otherwise, continue with the next step of the calling skill, in the same turn (D93, D114). The end summary of the calling skill copies the schema report: the `status:`, `backup:`, and each `copied:` line of `install.mjs`, as they are (D121, D192).
   - Its version is higher: stop. Tell the user: "This repo uses a newer plan-lite schema. Run `apm update`. If the schema is still newer, edit the openspec-lite ref in `apm.yml` to the next major version, then run `apm install`. If you installed openspec-lite with `apm install -g`, use `apm update -g` and edit `~/.apm/apm.yml`." A minor or patch tag can bump the schema, so `apm update` usually fixes it. Only a breaking schema change needs the next major tag (D93, D109).
3. From the OpenSpec root, run `node openspec/schemas/plan-lite/openspec-version.mjs`. It prints one line that starts with `ok:`, `warn:`, or `fail:`. The agent runs it alone, reads the first word of the line, not the exit code, and does not compare the versions itself (D175, D192). On `fail:`, show the line, and stop (D93). On `warn:`, show the line as a warning, and continue. In both cases, point to the compatibility table at `https://github.com/duongphuhiep/openspec-lite#compatibility`. The installed package has no README.

**Plan hash** (D72): From the OpenSpec root, run:

```sh
node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md
```

If it prints a `plan-hash:` message and no hash (exit code 1), show the message and stop. The agent reads the output, not the exit code. Ask the user to fix `plan.md` as the message says (D93, D99, D212).

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

### openspec-lite-propose (D10, D26, D28, D50, D54, D68, D78, D80, D148, D168, D169, D182, D184)

- If the request names no outcome, ask what the change does, end the turn, and do not invent a Goal (D255). The split questions go in one reply, and the turn ends after them. The turn also ends after the Level 1 question (D255).
- The first outcome of the request is the main outcome, also when the request has only one outcome. If another outcome touches the same code as the main outcome, keep it, with no question. Otherwise, if it can ship alone, ask: "<outcome> can ship alone. Leave it out of this change, and propose it later as a separate change?" On yes, leave it out of this change. On no, keep it (D148).
- If the outcomes that stay are small (one obvious fix, no constraints or open questions worth recording), ask: "This looks small. Implement directly with no change?" On yes, make the fix directly, with no change and no file under `openspec/`. Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it. Then stop (D148, D202).
- Use the change name from the prompt. Otherwise, derive a kebab-case name of 2 to 10 words. Start the name with the main outcome. You can add words from the other outcomes after it. 10 words is a soft limit: go over it only if a shorter name is not clear. If the name is too long, remove the words of the other outcomes first (D168).
- Run `openspec new change "<name>" --schema plan-lite`. If it fails because a plan-lite change with that name exists and has no `plan.md`, an earlier run stopped here: offer to resume. In each other case, show the error and ask for another name (D99, D111).
- Read `.openspec.yaml` before the edit. OpenSpec 1.14.2 already writes `skip_specs: true` (`docs/facts.md`). If the line exists, do not edit the file. If it is missing, add it. A duplicate key breaks each CLI command on the change (D112, D150).
- Get the template from `openspec instructions plan --change "<name>" --json` → `template`. Write `plan.md` from it. Fill only what is known. Leave the other sections empty. Keep each `<!-- ... -->` guidance comment, also in a section that you fill. Write the content on the lines under the comment (D127, D131). Do not invent non-goals, constraints, facts, or decisions (D114). Propose decides no open point: it records each one as an open question, and the tasks preview tries to decide it. Each fact starts with a source emoji, and stays true after the change (D227, D233). A user answer is split: a fact goes to `## Facts` with 👤 and "Source: the user", a rule that the change must follow is a constraint, and each other choice or instruction is a decision with no 🤖 (D226, D229). Do not write an outcome that the user moved out in `plan.md`, also not in `## Non-Goals`. The summary names it (D169). Keep only the current decisions, and no facts with statistics that soon go out of date (D136). Remove each fact that justifies no current decision or constraint, except a non-obvious fact (D140, D171, D184).
- `## Goal` holds one outcome by preference. If the change has more than one outcome, write one outcome per bullet, in one or two sentences each (D148).
- If an upgrade signal is present (see §5), suggest an upgrade.
- In the summary, show the change name. Name each outcome that the user moved out, and tell the user to run `openspec-lite-propose` for it (D148).
- At the end, ask: "Do you want a tasks preview?" On yes, run `openspec-lite-tasks-preview`.
- Do not write code, except after a yes to the Level 1 question (D202).

### openspec-lite-tasks-preview (D19, D23, D24, D26, D32, D49, D52, D53, D72, D76, D171, D172, D174, D177, D180, D181, D182, D183, D184, D193, D211, D217, D218, D219, D220, D221, D222, D223, D224, D225, D226, D227, D228, D229, D230, D231, D236)

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
- At the start, run `node openspec/schemas/plan-lite/plan-status.mjs <plan.md>` alone. If it prints a line, copy the line to the user, and continue. If it prints nothing, say nothing about commits (D171, D193).
- Record in `plan.md`, with no question (D171). Edit only `## Facts`, `## Decisions`, and `## Open Questions`. The plan hash does not cover them, so the preview stays current.
  - **Fact**, when you find it: each non-obvious fact, with its source, and a source emoji at the start: 👤 📖 🎫 📊 🌐 🔬 🔍 (D226). An answer of the user is a source of a non-obvious fact, and a 👤 fact is always non-obvious. The fact is written so that it stays true after the change. The agent does not change an existing fact only to add an emoji (D227). An obvious fact or a well-known fact is not recorded. If it is the reason of a decision, it goes into the "because" part of that item (D192). A sentence that states a choice is a decision, not a fact (D192). A non-obvious fact needs one of these to find: a run or a test result; research of remote sources, for example documentation on the internet, another repo, logs, or a remote database; a long analysis of the code; or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found it. A run alone is not enough: the result must be one that a reader cannot see in the code or in the file list. For example, what a script prints when its code shows it, or which files exist, is obvious. This includes each error or output of a tool that makes the agent change what it does (D172), unless a reader can see the same output in the code (D200). The agent reads an exit code with `exit-code.mjs`, not with `echo $?`, and records nothing about an exit code that it did not get (D197). No guess, no fact that a reader can easily deduce from the code (also if a run found it, D186; a run is not enough if a reader can see the result in the code or the file list, D198), and no numbers that soon go out of date (D136, D174, D184).
  - **Decision**, when you make it: (1) each thing that the preview plans for the code and that changes a visible result, also the input or output of a program and the result on an error or an edge case, and that `plan.md` and the user did not say; (2) each choice between close options with no clear winner, also an internal one. No other choice. The decision holds only the part that matches (1) or (2). An internal detail can appear only in the "because" part (D220). The apply end check reads each added or changed file for (1). Only the agent at the moment of the choice can see (2) (D217, D218, D219, D224). Each reason comes from this run, the user, `plan.md`, the code, or a well-known fact (D177, D192). A claim about how a tool, a runtime, or a platform behaves needs a run or a doc. With no source, the agent writes "Reason not checked." (D194). End the heading with 🤖, unless the decision records an answer or an instruction of the user. Remove the 🤖 when the agent updates a decision to follow the user. A decision with no 🤖 belongs to the user. Update or remove only a 🤖 decision, also after the user corrected `plan.md`. Change a decision with no 🤖 only when the user says so in this session. On another conflict, record an open question (D181, D182).
  - **Open question**: each point that the agent cannot decide and cannot find the answer to, for example because the answer depends on information that only the user has: an intent, or where some code is when a search does not find it. An obvious answer goes only to the summary (D226). A point that it can decide is a 🤖 decision, not a question. Before it writes the tasks, it tries to decide or find the answer to each existing question. The answer becomes a fact, a 🤖 decision when the decision rule records it, or else an answer in the summary, and the agent removes the question, unless the user said to keep it open (D234). A kept question ends with "(kept open by the user)" (D228). It records each new question after it writes the preview. If the user answers one in this session, the agent splits the answer: each fact goes to `## Facts` with 👤, and each choice, instruction, or rule becomes a decision with no 🤖. The preview cannot edit `## Constraints`, so its summary says that the user can move a rule there (D240). Then it removes the question (D183, D223, D226).
- Before it writes `tasks-preview.md`, the preview checks each fact that the run added, except a 👤 fact. If a reader can see it in the code or the file list, it is obvious, also after a run: move it to the "because" part of the decision that it justifies, or remove it (D211, D227). In the same step, it removes each added 🤖 decision that matches neither criterion (D221, D230, D234).
- In the summary, list each fact, decision, and open question that the run added, changed, or removed (D171). Then show a table of each added 🤖 decision, with its criterion, (1) or (2), and why (D221, D234).

### openspec-lite-apply (D27, D64, D73, D171, D172, D177, D193)

- Run `openspec instructions apply --change "<name>" --json`. Follow its `instruction`. The schema `apply.instruction` is the only copy of the plan-lite apply rules.
- Add one rule to the CLI output: ignore checkbox and task-count text. A plan-lite change has no tracked tasks.
- If `state` is `blocked`, `plan.md` is missing. Stop, and point to `openspec-lite-propose`. Do not follow CLI text that names another skill (D111).
- Users try stock `/opsx:apply` first (D27).

### openspec-lite-upgrade (D13, D31, D46, D52, D62, D79, D97, D120, D121, D148, D152, D153, D158, D163, D164, D166, D167, D181, D182, D191, D193, D196, D228, D229, D230, D231, D253)

1. Keep `skip_specs: true` in `.openspec.yaml` until the first spec write. Then remove it, before `openspec instructions specs`, because while it is set, the CLI forbids spec files (D99). A run that stops before the specs then leaves a change that passes `validate` (D208).
2. Before any artifact, plan the requirements (D164, D166). A requirement comes only from these sources:
   - a constraint of `plan.md`. A fact is not a source of a requirement, so it goes to `design.md` → `## Context`, with its source emoji (D227);
   - a decision that is also a contract, as `GLOSSARY.md` defines it: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. A decision that is not a contract goes only to `design.md` → `## Decisions`;
   - an answer of the user.

   The Goal and `tasks-preview.md` alone are not sources. Upgrade writes no requirement that step 2 did not plan, and the summary names the source of each requirement. The `## Purpose` of a new spec states only what `plan.md` or an answer states, and it can be an inferred item. The prune list is a table with the columns `Section`, `Artifact`, and `Heading` (D253). Before it asks, upgrade tries to decide or find the answer to each open question, as apply does. A found answer that is a non-obvious fact goes to `design.md` → `## Context`, an obvious answer goes only to the summary, and a decided point is a decision with 🤖 in `design.md` only when the decision rule records it, or else an answer in the summary (D234). If a decided point is a contract, upgrade asks its requirement, as for a 🤖 decision of `plan.md`. A question that ends with "(kept open by the user)" stays, and upgrade does not ask it again (D228, D229). Then ask in one reply, and end the turn:
   - each open question that is still open and that changes the specs, the approach, or the tasks;
   - each requirement that you plan from the Goal, the preview, or a 🤖 decision of `plan.md`, with its text (D182);
   - a question if the change has a requirement, if you plan none. "None" is a valid answer, and then upgrade writes no spec (D210).

   If all three lists are empty, do not ask. If the user cannot answer an open question now, the question stays in `plan.md` (D120, `docs/facts.md`). Then write the four artifacts in dependency order, while the change is still plan-lite. Get each template from `openspec instructions <artifact> --change "<name>" --schema spec-driven --json`. Run it as one plain command, with no loop, no chain, and no pipe. Read the full JSON. Do not write the artifact without its `template` and `instruction` (D133). On a resumed run, keep each artifact that already exists, and write only the missing ones. Ask the step 2 questions again before the first missing artifact, because the answers of the earlier session are not on disk (D208). Follow the `instruction` field of each result.
   Do not write the `plan.md` IDs in an artifact. Refer to an item by its title, or a short form of its text, with the change name (D142, D143).
   In `proposal.md`, `specs/`, and `design.md`, put 🤖 at the end of the line or the heading of each inferred item: an item from no section of `plan.md` and from no answer of the user in this upgrade. An item is inferred only if it holds a new claim: a case, a value, a behavior, a risk, a dependency, a choice, or a reason that `plan.md` and the answers do not state. `tasks-preview.md` is not a source. Before it marks an item, the agent checks each sentence of the item and names the new claim. Other words, another form (a scenario that only restates its requirement), another artifact or section, and the code that a `plan.md` item clearly touches are not new claims (D163, D167). One mark per item. `tasks.md` gets no mark (D152).
   1. `proposal.md`: from Goal and the scope. If the Goal has more than one outcome, give each outcome its own item in What Changes (D148). If `## Background` exists, use its scope items and source links (D125). Non-Goals go to `design.md` → `## Goals / Non-Goals`.
   2. `specs/` and `design.md`: from `plan.md`. For specs, use the archive delta rules: pick `<capability>` from `openspec/specs/` first, add a `## Purpose` section for a new capability (D117), give each ADDED or MODIFIED requirement at least one `#### Scenario:`, and copy the full requirement for MODIFIED. Write only the requirements of step 2. After a yes in step 2, a requirement gets no 🤖 mark (D131, D152, D164). If no requirement is left after step 2, write no spec, and keep `skip_specs: true` (D108, D166, D208). Decisions go to `design.md` → `## Decisions`. A decision with 🤖 keeps its 🤖, also with no new claim (D181, D182). If the user said yes in the question turn to a requirement from that decision, the decision has no 🤖, and the summary says that the yes removed the mark (D256). The same holds for a contract point that step 2 decided. A rule of an answer limits the result that a user or a program sees, or says what the change must not add. A choice of how to build the result is not a rule (D257). Constraints go to `## Context` or `## Risks / Trade-offs` if they fit. Facts go to `## Context` (D135). An open question that is safe to answer later goes to `## Open Questions`. An open question that changes the specs, the approach, or the tasks has no slot. Its answer goes to the specs or to `## Decisions`. Neither the question nor a note that points to it goes to `design.md` (D133). After `tasks.md`, the agent reads `proposal.md` and `design.md` again, and removes each sentence that restates or points to a question of `## 0. Open questions`, for example "See task 0.2" (D196). If the user has no answer, the question stays in `plan.md`, and it is also the first task of `tasks.md`, because the stock skills do not read `plan.md` (D191).
   3. `tasks.md`: if `tasks-preview.md` exists, use it as the seed and add `[ ]` to each task line. Replace each `plan.md` ID in it with the item title (D142). If an answer from step 2 changes the tasks, edit the seed to match it, and say so in the summary. Upgrade splits an answer of the user as apply does, but writes each part to an artifact: a fact goes to `## Context` with 👤, a rule is a requirement source, like a constraint, and a choice goes to the specs only when it is a contract, else to `## Decisions`. A kept question that is safe to answer later goes to `## Open Questions` of `design.md` (D230, D242, D243). Put each open question that step 2 asked and that the user could not answer, and each question with the "(kept open by the user)" marker that changes the specs, the approach, or the tasks, before the first group, as `## 0. Open questions`, with one task each: `- [ ] 0.1 Answer: <question> The answer can change the specs.` (D191). Then delete `tasks-preview.md`. If `tasks.md` already exists and `tasks-preview.md` is still there, an earlier run stopped here: keep `tasks.md`, and delete `tasks-preview.md` (D107).
3. Change `schema: plan-lite` to `schema: spec-driven` in `.openspec.yaml`. If a step before this one fails, the change is still plan-lite, and a new upgrade run resumes it.
4. Run `openspec validate "<name>"`. Report each error. Do not fix errors silently. Upgrade validates before the prune question, so that the user decides on the delete with the result (D191).
5. List each `plan.md` section with its destination artifact and heading, or "kept". A question that no artifact holds is "closed" only when its answer is obvious, or is a decision that the decision rule does not record. On the resume path, upgrade uses the test of the question rule again to find that answer. A non-obvious fact or a recorded decision that no artifact holds is "kept, in no artifact", and the user can ask to add it to an artifact (D255, D256, D258). If the items of one section go to different destinations, list each item. Keep a section that has no slot, for example an open question that the user cannot answer now. List each content that is in no artifact as "kept, in no artifact". A yes to the prune question does not delete it. The summary names it, and says that the user can ask to add it to an artifact (D206). Write one reply in this order: the `validate` result, the summary of step 6, the list, and last the question "Delete the moved sections from `plan.md`?". If `validate` failed, recommend to keep `plan.md` until the errors are fixed. The summary does not say that `plan.md` is deleted or kept: its file list names the files that upgrade wrote, and `tasks-preview.md` if it deleted it (D210). The question is the last line. End the turn, and wait for the answer (D132, D191, D193). On yes, delete each section or item whose content moved. Keep the ID comment at the top while a section is left (D158). If no section is left, delete `plan.md`. A section with only an HTML comment counts as no section. Then say in one line what was deleted and what was kept, and tell the user to resolve a kept item before `/opsx:apply`. On no, keep `plan.md`, and say in one line that its moved sections are old copies, and that the artifacts are the source of truth (D120, D121, D127). Do not write the summary again (D193).
6. The summary comes in the reply of step 5, before the question (D193). In the summary, ask the user to review all artifacts. List each 🤖 item with its new claim (D167), and ask the user to remove the mark to accept it, or to delete the item (D152). Ask for an extra review of `tasks.md`, because it is a contract. Say the `skip_specs` state at the end: absent, because the change has spec deltas, or set, because it has none (D153). Name each `plan.md` item that has no slot and stays in `plan.md`. The stock skills do not read `plan.md`. Tell the user to resolve the kept items before `/opsx:apply`. If `design.md` has `### Decision` entries, warn that stock `/opsx:archive` does not turn them into ADRs, and that `openspec-lite-archive` can copy them to `openspec/adr/` before it (D115, D154).

### openspec-lite-archive (D3, D6, D8, D9, D18, D30, D47, D55, D58, D59, D60, D74, D77, D105, D119, D120, D121, D122, D148, D154, D155, D179, D180, D181, D184, D191, D193, D253)

1. Ask the done check (see §4). To find the code, search for what each outcome of the Goal names, for example with `git grep`, from the git root, because an earlier `cd` can stay in effect (D209). Name each outcome that is not met (D148). Do not judge from the first lines of `git ls-files` (D121). If an answer is "no", show the warnings and ask only: "Archive anyway?", with no other options in this question. On no, give the paths below, then stop (D201). For each outcome or constraint that is not met, give two paths: implement it with `openspec-lite-apply`, or remove it from `plan.md` and propose it as a separate change. For each open question that is left, tell the user to run `openspec-lite-apply` with the answer, so that apply records it (D230, D232). Then tell the user to run archive again. Also say: to keep an item that is not in `plan.md`, add it to `plan.md` first (D155, D191).
2. Read `plan.md`. Do not read `tasks-preview.md` for promotion.
3. Select each item that passes at least one filter:
   - **Non-obvious**: a reader cannot deduce it from the code in 5 minutes.
   - **Surprising**: it would surprise a new team member.
   - **Contract**: externally observable behavior that a client or another team depends on. Internal helpers, log text, and UI layout are not contracts. It goes to a spec, even if it is obvious from the code (D119).
   - **Non-obvious fact**: a fact of `## Facts` that needs an answer of the user, a run or a test result, research of remote sources, a long analysis of the code, or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code or the file list is not one, also if a run found it: a run alone is not enough (D184, D186, D198).
4. Sort each item: constraint → requirement in a spec, decision → ADR. If a decision is also a contract, draft the contract as a requirement. Its rationale can also go to an ADR (D119). List each other `plan.md` item that is not drafted, including each non-goal, with a one-line reason (D116). The non-goal rule comes second, right after the sort rule (D147). A fact goes to the `## Context` of each ADR whose decision it justifies, with its source emoji (D135, D227). A spec holds no source emoji: a fact in a requirement text gives its source in words. Archive adds no emoji to a fact that has none, and does not guess its source. A 🤖 in an HTML comment is not a mark. Archive names each spec draft and each ADR draft that holds content from a 🤖 decision (D252). A fact that justifies a requirement goes into the requirement text, as its reason (D147, D191). The example of the skill is from another domain than the scenarios, so that a scenario can test the rule (D192). A non-obvious fact goes to the `## Context` of each drafted ADR that it relates to. If no drafted ADR holds it, and no drafted requirement holds it as its reason, archive drafts an ADR for the fact (D203): `## Context` holds the fact and its source, `## Decision` says how the change uses or handles the fact, as the code shows, and `## Consequences` says what a later change must keep. If the change does not depend on the fact, archive lists it as not drafted (D179, D184). An answer of the user is a source of a non-obvious fact, and a 👤 fact is always non-obvious (D227, D228). Each other fact that is in no draft is listed as not drafted, with a one-line reason (D137, D139, D143, D191). Do not copy the `plan.md` IDs to a spec or an ADR. Refer to an item by its title, or a short form of its text, with the change name (D138, D142).
5. Draft the full text of each item:
   - A requirement becomes a delta under ADDED, MODIFIED, REMOVED, or RENAMED. Give each ADDED or MODIFIED requirement at least one `#### Scenario:`, derived from `plan.md` and the code. If an item gives a reason, for example the "because" part of a constraint, keep the reason in the requirement text. A scenario title alone does not keep it (D147). For MODIFIED, copy the full requirement from the main spec, then edit it. To pick `<capability>`, list `openspec/specs/`. Reuse a capability that matches. Name a new one only when none matches (D93). For a new capability, start the delta with a `## Purpose` section, because the CLI otherwise writes "TBD" as the Purpose of the new main spec (D117).
   - A decision becomes an ADR: a `# <Title>` heading, then the plain lines `Status: Accepted` and `Change: <name>`, then the sections `## Context`, `## Decision`, and `## Consequences` (D112). Before drafting, skip each decision or fact that already has an ADR with `Change: <name>` in `openspec/adr/`, because an earlier run wrote it (D111, D180).
   - Superseded ADR (D122): compare each new decision with each `Status: Accepted` ADR in `openspec/adr/`. If the new decision fully replaces an old one, the draft gets the line `Supersedes: <old file name>` after `Change:`. If it changes only part of an old decision, the draft gets no such line, and the agent tells the user that both ADRs stay `Accepted`.
   - Get the delta format from the `instruction` of `openspec instructions specs --change <name> --schema spec-driven --json`. It defines REMOVED (`**Reason**`, `**Migration**`) and RENAMED (`FROM:`, `TO:`) (D111). While `skip_specs` is set, the result also has `skipped: true` and a warning: ignore both. Use SHALL or MUST, as the instruction says (D112).
6. Show the drafts. Name each draft that comes from a decision whose heading ends with 🤖, in `plan.md` or, on the guard path, in `design.md`, because the user did not confirm it yet. If no decision has 🤖, say nothing about marks. No spec or ADR gets a 🤖 (D181, D192, D204). For each draft with a `Supersedes:` line, name the old ADR and say that its `Status` line changes (D122). The user answers yes, no, or edit for each item. Tell the user that they can pick a skipped item to draft. If the user picks one, draft it and show it for approval (D120). Write nothing before approval.
7. Before the write, list the files under `<change>/specs/` from an earlier run. Show each one, and ask the user to keep or delete it. The turn ends at the question (D256). Then write the approved deltas to `<change>/specs/<capability>/spec.md`. Merge into a kept file with the same path (D110, D112).
8. Decide from the files on disk, not from this run. If any file exists under `<change>/specs/`, remove `skip_specs`. If none exists, set `skip_specs: true`. `validate` fails with a delta and the flag, and also with no delta and no flag (D93, D110).
9. Run `openspec validate "<name>"`. If it fails, stop and report.
10. Only after `validate` passes, write the approved ADRs to `openspec/adr/YYYY-MM-DD-<slug>.md`. Use the archive date. Set Status to `Accepted` (D93, D105, D121). If the name exists for another change, add `-2`, `-3`, and so on. Never overwrite an ADR (D112). After each new ADR with a `Supersedes:` line, change only the `Status:` line of the old ADR to `Status: Superseded by <new file name>`. Then check each ADR with `Change: <name>` and a `Supersedes:` line, also from an earlier run, and fix its old ADR the same way (D122).
11. Run `openspec archive "<name>" --yes`. The CLI applies the deltas and moves the change (with `plan.md` and `tasks-preview.md`) to the archive. If it fails after step 10, report it. The ADRs stay, because each one is still a correct decision (D105). In the end summary, if the user rejected a draft of a decision, say that this decision now exists only in `openspec/changes/archive/` (D204).

## 4. plan-lite Schema

`assets/plan-lite/schema.yaml` (D12, D25, D40, D53):

```yaml
name: plan-lite
version: 6
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

`apply.instruction` holds the plan-lite apply rules (D29, D33, D49, D60, D64, D72, D73, D99, D106, D171, D172, D174, D177, D178, D180, D181, D182, D183, D184, D186, D194, D195, D197, D198, D211, D212, D213, D214, D216, D217, D218, D219, D220, D221, D222, D223, D225, D226, D227, D228, D229, D230, D231, D232, D233, D234, D235, D239, D240, D241, D242, D243, D244, D247, D252). It ships in the user's repo, so it must not refer to this file. This is the exact text in `schema.yaml`:

```text
This is a plan-lite change. It has no tasks.md and no checkboxes.

How to read this instruction:

- Do steps 1 to 6 in order.
- The general rules apply at all times, in each step.
- A named rule, for example the question rule, applies in each step where its topic comes up, also when the step does not name the rule.
- The OpenSpec root is the folder that holds `openspec/`. Run each command from the OpenSpec root.
- `<changeDir>` is the folder of the change.

## General rules

- If plan.md and tasks-preview.md conflict, follow plan.md.
- Do not edit tasks-preview.md.
- Each time the user answers an open question, record the answer with the answer rule.
- Each time the user gives a fact, a rule, or a choice for the change in a reply, record the reply with the answer rule.
- When you make a decision, record the decision with the decision rule, the decision format, and the mark rule.
- When you add or change a decision, keep `## Decisions` current with the current-decisions rule.
- When you find a fact, record the fact with the fact rule and the fact format.
- When you need the exit code of a command, use the exit-code rule.
- When you change a behavior, follow the test rule.
- When you write a file other than plan.md and tasks-preview.md, or a commit message, follow the ID rule.
- Suggest running openspec-lite-upgrade when one of these conditions is true:
  - Another person or agent must continue the work.
  - The change touches more than one capability.
  - The change touches more than one repo.
  - A contract (spec) becomes necessary.

## Step 1: Report the commit state of plan.md

- Input: `<changeDir>/plan.md`.
- Run `node openspec/schemas/plan-lite/plan-status.mjs <changeDir>/plan.md`.
- Run the `plan-status.mjs` command alone, not in a chain.
- If `plan-status.mjs` prints a line, copy the line to the user as it is.
- If `plan-status.mjs` prints nothing, say nothing about commits.
- Go to step 2.

## Step 2: Check if the preview is stale

- Input: `<changeDir>/tasks-preview.md`, and the output of `plan-hash.mjs`.
- Output: the preview is current, stale, or absent.
- If `<changeDir>/tasks-preview.md` does not exist, the preview is absent. Go to step 3.
- Run `node openspec/schemas/plan-lite/plan-hash.mjs <changeDir>/plan.md`. You do not need the exit code of `plan-hash.mjs`.
- If `plan-hash.mjs` prints a message that starts with `plan-hash:` and no hash, show the message to the user, and stop.
- If the hash differs from the `plan-sha256` line in the preview header, the preview is stale.
- If the preview header has no `plan-sha256` line, the preview is stale.
- If the hash equals the `plan-sha256` line, the preview is current.
- If the preview is stale, do not write code yet. Step 3 asks the stale question.
- Go to step 3.

## Step 3: Close the open questions before you write code

- Input: `## Open Questions` of plan.md, and the result of step 2.
- Read each question in `## Open Questions`.
- A question that ends with "(kept open by the user)" is a kept question.
- Keep each kept question, also if you can decide the kept question.
- Do not ask a kept question again, unless the user answers the kept question now.
- Do not write the code that depends on a kept question.
- Try to close each question that is not a kept question with the question rule.
- Make the list of questions to ask:
  - If the preview is stale, add the stale question: "Regenerate the preview with openspec-lite-tasks-preview, or continue from plan.md?"
  - Add each open question that has no marker and that you did not ask yet in this session.
- If the list of questions to ask is empty, go to step 4.
- If the list of questions to ask is not empty, ask all questions of the list in one reply:
  - Give your recommended answer for each open question.
  - Give no recommendation when the answer is a fact that only the user knows, for example where some code is. Say why you give no recommendation.
  - In the same reply, give the answer of each question that you closed.
  - End your turn, and wait for the reply of the user.
- When the user replies to the questions of step 3:
  - Record each answer with the answer rule.
  - In step 3, "stale" means the result of step 2. A constraint that the answer rule adds in this run does not make step 3 ask the stale question. Step 6 reports the new constraint.
  - A question that the user did not answer stays open. Do not write the code that depends on that question.
  - If the user says to regenerate the preview, give the end summary of step 6 for your edits to plan.md. Tell the user to run openspec-lite-tasks-preview. End your turn.
  - If the user says to continue from plan.md, go to step 4.
  - If the preview is stale, and the user does not answer the stale question, ask the stale question again, and end your turn.
  - If the preview is not stale, go to step 4.

## Step 4: Write the code

- Input: plan.md, and `<changeDir>/tasks-preview.md` as a guide if it exists. The CLI does not list tasks-preview.md in contextFiles.
- Output: the code, and the updates of plan.md.
- Implement from plan.md.
- If your work conflicts with a decision with no 🤖, ask the user, and end your turn.
- If you find a new point that you cannot close with the question rule:
  - Record the point as an open question before you write the code that depends on the point.
  - Ask the open question with your recommended answer.
  - Give no recommendation when the answer is a fact that only the user knows.
  - End your turn.
- When the user replies to a question of step 4, step 5, or step 6, record each answer with the answer rule. Then go to step 4, and write the code that waited for the answer.
- When the code is written, go to step 5.

## Step 5: Check plan.md against the code

Do these checks in this order:

1. Run the tests. If a test fails, fix the code, and run the tests again.
2. Compare each decision in `## Decisions` with the code:
   - If the code no longer matches a 🤖 decision, update the 🤖 decision.
   - If the code does not match a decision with no 🤖, fix the code, because plan.md wins.
   - If the code cannot follow a decision with no 🤖, ask the user, and end your turn.
3. Read each file that you added or changed. Find each thing in the file that matches criterion (1) of the decision rule, and that `## Decisions` does not hold. Record each such thing as a 🤖 decision.
4. Check each decision with no 🤖. Move each choice that you added to a decision with no 🤖 into its own 🤖 decision.
5. Record each point that you cannot close with the question rule as an open question. Keep each kept question.
6. Check each 🤖 decision that you added in this run. If a 🤖 decision matches neither criterion (1) nor criterion (2) of the decision rule, remove the 🤖 decision.
7. Check the facts. Do this check last, because checks 2 to 6 can add facts:
   - Compare each fact in `## Facts` with the code. Update or remove each fact that is no longer true.
   - Check each fact that you added in this run, except a fact that the user gave (👤). If a reader can see the fact in the code or in the file list, the fact is obvious, also if you found the fact with a run.
   - Move each obvious fact to the "because" part of the decision that the fact justifies, or remove the obvious fact.

When the checks are done, go to step 6.

## Step 6: End

1. Give the end summary:
   - List each fact, decision, and open question that you added, changed, or removed in plan.md, with its ID.
   - For each open question that you removed, give its answer.
   - Say that the plan hash does not cover `## Facts`, `## Decisions`, and `## Open Questions`, so your edits of these sections do not make the preview stale.
   - If you added a constraint, list the constraint with its ID.
   - If you added a constraint, and the preview is not absent, say that the new constraint makes the preview stale, and that the next run of apply asks to regenerate the preview.
   - Show a table of each 🤖 decision that you added: `| Decision | Criterion | Why |`. In the Criterion column, write (1) or (2) of the decision rule. In the Why column, write the visible result for (1), or the close options for (2).
   - Ask each new open question of step 5 with your recommended answer. Give no recommendation when the answer is a fact that only the user knows.
2. Do the done check: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty? An HTML comment does not count as a question.
3. If an outcome of the Goal or a Constraint is not met, name each one that is not met.
4. If an open question is left, tell the user to answer the open question in the next message, so that you record the answer. Name the part of the Goal that waits for the answer of each open question. When the user replies, step 4 says what to do.
5. If the done check passes, tell the user to archive with openspec-lite-archive, not /opsx:archive. openspec-lite-archive promotes the decisions first. Ignore any built-in text that suggests /opsx:archive.

## Question rule: close an open question

- A question is open only while you cannot decide the question and cannot find its answer.
- You cannot decide a question when its answer depends on information that only the user has. Examples: an intent, or where some code is when a search of the repo does not find the code.
- To close a question, read the code and the docs, or run a command.
- If you find the answer, and the answer is a non-obvious fact, record the fact with the fact rule.
- If you find the answer, and the answer is obvious, give the answer in the end summary.
- If you can decide the question, also when no option is a clear winner, and the decision rule records the choice, record a 🤖 decision.
- If you can decide the question, and the decision rule does not record the choice, record no decision. Give the answer in the end summary.
- When you close a question, remove the question from `## Open Questions`.
- Do not record a point that you can decide as an open question.
- Write a new open question as `- OQ<n>: <question>`.

## Answer rule: record a reply of the user

- If a reply of the user answers an open question, remove the question from `## Open Questions`.
- If the user says to keep a question open, keep the question in `## Open Questions`, and end its text with "(kept open by the user)".
- Add the "(kept open by the user)" marker only when the user says to keep the question open, for example "keep it open" or "leave it open".
- An answer such as "I do not know yet" leaves the question open with no marker.
- Split the reply of the user as well as you can into facts, rules, and choices.
- A fact says how something is, for example "the report page does not exist yet". An instruction says what to do, for example "use plain HTML under `src/`". An instruction is never a fact.
- Record each part of the reply in one section only. If a part limits the result and also says how to build the result, record the limit as a constraint, and the build choice as a decision with no 🤖.
- Record each fact of the reply in `## Facts`, with 👤 and "Source: the user".
- Record each rule of the reply that the change must follow in `## Constraints`.
- A rule limits the result that a user or a program sees, or says what the change must not add. A rule passes this test: if the result breaks the rule, the change is not done. Examples: "add no npm dependency", or "a request over the limit gets status 429".
- A choice of how to build the result is not a rule, also when the user gives the choice. Examples: "use a sliding window", or "use plain HTML under `src/`".
- Record each other choice or instruction of the reply, that is not a fact and not a rule, in `## Decisions`, as a decision with no 🤖.
- An edit of `## Constraints` makes the preview stale. This result is correct, because the preview does not know the new rule yet.

## Decision rule: when to record a decision

- Record a decision when criterion (1) or criterion (2) is true.
- Criterion (1): you put something in the code, or plan to put something in the code, that changes a visible result, and plan.md and the user did not say it. The thing is your choice, so record the thing as a decision.
- A visible result is one of these things:
  - a UI, a public interface, or the signature of an exported function
  - the input or output of a program, or a data format, also the output of another tool that the code reads, for example a field of its JSON output
  - a file name or path in the repo that another program, a config, or a doc outside this change refers to
  - a name that the program gives to its output, for example a download file name
  - a key in a config file that a program or a user reads, for example a field of `package.json` or an env var
  - a new dependency
  - the result on an error or an edge case, for example a status code, an exit code, an error message, or a thrown error
- Criterion (2): you weighed two or more close options, and no option was a clear winner. Criterion (2) also applies to an internal choice.
- Do not record your other choices.
- Record only the part of the decision that matches criterion (1) or criterion (2).
- If you need an internal detail to explain the reason, write the detail in the "because" part, not in the title or in "Chose X".

## Decision format

- Write `### Decision D<n>: <title>`, with `<n>` higher than each decision ID in the file.
- After the heading, write "Chose X because Y."
- Add "Rejected Z because W." when there was an alternative.
- Each reason must come from this run, the user, plan.md, the code, or a well-known fact.
- A claim about how a tool, a runtime, or a platform behaves is not a well-known fact. Check the claim with a run or a doc, and give the source.
- If no source supports a reason, write "Reason not checked." in place of the reason.
- Do not guess a reason, also not a wish of the user.

## Mark rule: the 🤖 mark

- End the heading of a decision with 🤖, unless the decision records an answer or an instruction of the user.
- A 🤖 in an HTML comment, for example in a template comment, is not a mark. A decision is a 🤖 decision only when its heading ends with 🤖.
- A decision with no 🤖 belongs to the user, also a decision that the user wrote by hand.
- A decision with no 🤖 holds only what the user said. Put each choice that you add, and that the decision rule records, in its own 🤖 decision.
- When you update a 🤖 decision to follow an answer or an instruction of the user, remove the 🤖 of that decision.
- The user removes the 🤖 to accept a decision.

## Current-decisions rule: keep `## Decisions` current

- `## Decisions` holds only the current decisions.
- Remove each 🤖 decision that a new decision supersedes.
- Update each 🤖 decision that a new decision makes stale.
- Update or remove each 🤖 decision that conflicts with a constraint or with a decision with no 🤖.
- Change a decision with no 🤖 only when the user tells you to.
- After you update the decisions, remove each fact that justifies no current decision or constraint, except a non-obvious fact.

## Fact rule: when to record a fact

- Record each non-obvious fact when you find the fact.
- A non-obvious fact needs one of these sources to find:
  - an answer of the user
  - a run or a test result
  - research of remote sources, for example documentation on the internet, another repo, logs, or a remote database
  - a long analysis of the code
  - other work that is worth an agent to find the fact
- A fact that a reader can easily deduce from the code is never a non-obvious fact, also if a run found the fact.
- A run alone does not make a fact non-obvious. The result must be one that a reader cannot see in the code or in the file list.
- For example, the output of a script is obvious when the code of the script shows the output. The list of files that exist is obvious too.
- A fact that the user gave (👤) is always non-obvious. The rules about obvious facts do not apply to a 👤 fact, also not the obvious-fact check of step 5.
- The other checks apply to a 👤 fact, for example the check of a fact that is no longer true.
- When a command, a tool, or a service gives an error or an output that makes you change what you do, record the output as a fact, with the command and the error text.
- If a reader can see the same output in the code, the output is an obvious fact.
- Do not record an obvious fact or a well-known fact in `## Facts`.
- If an obvious fact or a well-known fact is the reason of a decision, write the fact in the "because" part of that decision.
- If an obvious fact or a well-known fact justifies only a constraint or a non-goal, do not record the fact, because an edit of those sections makes the preview stale.
- Do not record a guess.
- A sentence that states a choice, for example "the script must read the item count", is a decision, not a fact.
- Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK.

## Fact format

- Write `- F<n>: <fact>`.
- Start the fact text with one emoji for its source:
  - 👤 the user
  - 📖 documentation
  - 🎫 a ticket
  - 📊 an external report
  - 🌐 online research or a community
  - 🔬 a test run or a probe
  - 🔍 a long analysis of the code
- Also give the source in words: a command or a test that you ran, the files that you analyzed, a doc URL, a log, or an error text.
- Do not change an existing fact only to add an emoji.
- Write a fact so that the fact stays true after the change, for example "Before this change, the report page did not exist."

## Exit-code rule

- To know the exit code of a command, run `node openspec/schemas/plan-lite/exit-code.mjs <command> <args...>`.
- Run the `exit-code.mjs` command alone, not in a chain.
- Read the last line of the output: `exit: <code>`.
- Do not add `echo $?`.
- If you did not get the exit code, record nothing about the exit code.

## Test rule

- When you change a behavior, write or update a test that fails if the behavior breaks.
- If the change replaces an old behavior, the test must also fail on the old behavior.
- A manual run is not a test. Write the test in a file that the test command of the repo runs.
- If the repo has no test setup, add the smallest test setup that needs no new dependency, for example `node:test` for JavaScript.

## ID rule

- Give each new item a number higher than each ID of its kind in the file.
- Do not add an ID to an existing item that has none.
- Use the plan.md IDs (`C<n>`, `OQ<n>`, `F<n>`, `D<n>`) only in plan.md and tasks-preview.md.
- Do not write the plan.md IDs in another file, a code comment, a commit message, a pull request, or a ticket.
- To refer to a plan.md item from outside plan.md and tasks-preview.md, use the item title, or a short form of its text, with the change name.
```

`plan-status.mjs` (D193) is in `package/skills/openspec-lite-schema/assets/plan-lite/plan-status.mjs`. Usage: `node plan-status.mjs <plan.md>`. It runs `git status --porcelain -- <plan.md>`. If the output is not empty, it prints the note "plan.md is not committed, so git diff cannot show the changes of this run alone. Commit plan.md before the next run." Otherwise, and if git fails, it prints nothing. It always exits with code 0. The agent copies the line, and does not read the git output itself.

`exit-code.mjs` (D197) is in `package/skills/openspec-lite-schema/assets/plan-lite/exit-code.mjs`. Usage: `node exit-code.mjs <command> [args...]`. It runs the command with no shell, except on Windows, where a shell starts `.cmd` shims such as `openspec.cmd`. It shows its output, and prints `exit: <code>` as the last line. If the command cannot start, the last line is `exit: not run (<error code>)`. It always exits with code 0. The scenario allowlist denies `echo $?`, and allows `node`, so the agent can read an exit code with it.

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

`templates/plan.md` (D10, D124, D125, D134, D135, D136, D137, D140, D142, D144, D171, D180, D182, D184):

```markdown
<!-- Each C, OQ, F, and D ID is unique in this file only. Give each new item a number higher than each ID of its kind in this file. Gaps and any order are OK. Use the IDs only in this file and in tasks-preview.md. Outside them, refer to an item by its title, or a short form of its text, with the change name. -->

## Goal
<!-- The outcome(s) this change delivers. Prefer one outcome per change. More than one related outcome is OK: one per bullet, one or two sentences each. The first outcome is the main outcome. Keep each outcome that touches the same code as the main outcome. Otherwise, if an outcome can ship alone, ask the user to make it a separate change. -->

## Background
<!-- Optional. List scope items and link to source documents that set the context. -->

## Non-Goals
<!-- What this change will not do. One item per line. -->

## Constraints
<!-- Rules the implementation must follow, for example from the user, a ticket, or the platform. One item per line, as "- C<n>: <rule>". A constraint is not a choice. If the result breaks it, the change is not done. A choice of how to meet the goal is a decision. -->

## Open Questions
<!-- Open points, as "- OQ<n>: <question>". Apply and the tasks preview keep only a point that they cannot decide and cannot find the answer to. Keep a question that the user said to keep open, and end it with "(kept open by the user)". When a question gets an answer, remove it: the answer goes to another section of the plan, or only to the summary. -->

## Facts
<!-- Non-obvious facts found during exploration, grilling, the tasks preview, or apply, as "- F<n>: <fact>", with the source and a source emoji: 👤 the user, 📖 documentation, 🎫 a ticket, 📊 an external report, 🌐 online research or a community, 🔬 a test run or a probe, 🔍 a long analysis of the code. A non-obvious fact needs an answer of the user, a run or a test result, research of remote sources (documentation on the internet, another repo, logs, a remote database), a long analysis of the code, or other work that is worth an agent to find it. A run alone is not enough: if a reader can see the result in the code or in the file list, the fact is obvious. Do not record a guess, an obvious fact, or a well-known fact: write such a fact in the "because" part of the decision that it justifies. Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK. -->

## Decisions
<!-- Keep only the current decisions, not a history. When you add a decision, check the others. Remove each superseded decision. Update each stale decision. Change a decision with no 🤖 only on an answer or an instruction of the user. Then remove each fact that justifies no current decision or constraint, except a non-obvious fact. -->
<!-- ### Decision D<n>: <title>, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. An agent ends the heading with 🤖, unless the decision records an answer or an instruction of the user. A decision with no 🤖 belongs to the user. Remove the 🤖 to accept a decision. -->
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
