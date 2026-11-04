 "Writing skills without evaluation" is like "coding without tests".

  let's study how to evaluate the openspeclites skills effectiveness.

  --
  For a given commit or tag, I want to know: For a given Model (such as Sonnet 4.5)
  - does each skill make things better? or some skill might be uneccessary, just prompt normally then we would obtain the same or better result? => this is the most important objectif for skills evalution: the Baseline is "no-skill", then find the delta between "no-skill", and with a skill.
  - Or after a modification (change some wording or process in the skill):
    - does the quality go up or down?
    - any regression?
    - token consumption compared to old version
  
  --

  let's study some article to gain some insight and idea:

  1. https://developers.openai.com/blog/eval-skills

  An "evals" check whether a model's output, and the steps it took to produce it match what you intended. Instead of asking "does this feel better?" or relying on "vibes", evals must to ask
  concrete question

  2. https://claude.com/resources/articles/improving-skill-creator-test-measure-and-refine-agent-skills

  3. https://github.com/bjulius/skill-evaluator

  ---
  
  do we need to build an dedicated evaluation system? or is it too much? or is there a simpler idea?
  for example can we use something similar to `claude plugin eval init`,  or codex's skill-creator, spin up agent to run "forward-test"

  
---

# Research Results (2026-11-02)

## What the Three Articles Say

1. **OpenAI, "Eval skills"**: an eval is a prompt, a captured run (trace and files), a few checks, and a score. Use 10–20 prompts: explicit calls, implicit calls, and negative controls. Do deterministic checks on the JSONL trace first, for example "did it run `npm install`". Add a model-graded rubric only for style. Read tokens from the trace, and count commands to find loops.
2. **Anthropic, skill-creator**: run each prompt twice, with the skill and without it, in clean subagents. To test an edit, the baseline is a snapshot of the old skill (`old_skill/`), not "no skill". `aggregate_benchmark.py` gives pass rate, time, and tokens as mean ± stddev, and the delta. An analyst pass finds assertions that pass in both arms (they do not discriminate) and flaky evals. A blind comparator does A/B of two versions. If the baseline passes with no skill, the model already knows the technique, and the skill can go.
3. **bjulius/skill-evaluator**: static analysis only (security, quality, utility, compliance). It does not run the skill and has no baseline. It does not answer "does the skill help".

The Codex skill-creator has an "Independent Forward-Testing" section. Give a fresh subagent a realistic request and the skill, in a temp workspace. Do not tell it the expected answer. It has no baseline and no score.

## What This Repo Already Has

- 20 hand scenarios in `docs/test-scenarios.md`, run headless with `claude -p` (see "Running the Scenarios Headless"). This is a forward test.
- Reports in `.scenario-runs/`, graded by hand from the session JSONL.
- Missing: a no-skill arm, scripted checks, repeated runs per scenario, and token numbers.

## `claude plugin eval` (Claude Code 2.1.316): Probe Results

- It does most of what we want: a with-plugin arm and a no-plugin arm (`--ablation with-without`), 3 runs per case, a score delta, cost per run, and an HTML report.
- Graders: `regex`, `tool_used`, `tool_order`, `file_exists`, `llm` (Haiku, 2 of 3 votes), and `baseline`. No grader runs a shell command, so `openspec validate` cannot be a grader.
- The target needs `.claude-plugin/plugin.json`. Our `package/` has only `apm.yml`, so the baseline arm does not start.
- **Blocker on this machine**: the shell uses Bedrock with an AWS `credential_process`. The eval sandbox then refuses any case that grants Bash. Our skills need Bash for the `openspec` CLI. With no Bash, the child agent wrote no trace and timed out.
- It can run with an Anthropic API key, for example in CI. That needs a new secret and a cost budget.

## Two Traps Specific to openspec-lite

1. **The prompt names the skill.** Scenario prompts start with "openspec-lite-propose: …". In the no-skill arm, that name means nothing. Eval prompts must state the user's intent ("plan a CSV export before we code it"). The skill then triggers from its description, which is also a test.
2. **Shape checks do not discriminate.** A check like "`plan.md` has six headings" always fails without the skill. It shows nothing. Check outcomes: no code before approval, the plan holds the goal and the constraints, a decision reaches an ADR at archive, `openspec validate` passes. Stock OpenSpec (`/opsx:propose`) is the fair baseline, not an empty repo.

## Answer: Do We Need a Dedicated Eval System?

No. The repo already has 80% of it. Add a baseline arm and numbers to the scenario method you already use.

**Step 1 (now, no new tool).** Pick 3–5 scenarios with high value: 1, 4, 5, 20c, and 16b. For each, write an intent prompt and 3–5 outcome checks. Run each one 3 times with the skill and 3 times with stock OpenSpec only. `claude -p --output-format json` already gives `total_cost_usd`, `usage`, `num_turns`, and `duration_ms`. Record "passes of 3" and the mean tokens per arm in `.scenario-runs/`. This answers "does each skill help" for one model.

**Step 2 (for a skill edit).** Run the same cases on the old tag and the new commit. Use `git worktree` for the old tag. Compare passes and tokens. A drop in passes is a regression. This is the skill-creator "old_skill" method, with no extra code.

**Step 3 (only if Step 1 runs often).** Move the cases to `claude plugin eval` (`evals/<case>/prompt.md`, `graders/*.md`, `scaffold.sh`), and run it in CI with an API key. Add a `.claude-plugin/plugin.json` to `package/` for that.

Open questions for you:

- Can CI use an Anthropic API key, and what monthly budget is OK? Each case costs 6 agent runs (2 arms × 3 runs).
- Which skill do you doubt most? Start the baseline there.
