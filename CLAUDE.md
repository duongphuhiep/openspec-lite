## Communication Style

Write all prose in ASD-STE100 Simplified Technical Language.

- Keep procedural sentences (steps) to 20 words or fewer.
- Keep descriptive sentences to 25 words or fewer.
- Do not put more than 3 nouns in a row.
- Put the "If..." clause at the start of the sentence.
- Use active voice and simple tenses.
- Use one word for one meaning.
- Write one instruction per sentence.
- Keep exact technical terms. Do not replace them with vague words.
- Apply these rules to all prose: chat replies, code comments, commit messages, and docs.
- Do not apply these rules to code identifiers.

## Write Instructions as Code

The instructions in `SKILL.md`, `schema.yaml`, and the template comments are code in natural language. An agent runs them with no human to fix a misread.

- A file is a program.
- An ordered step is a statement. A rule is a function that the steps call.
- A term in `GLOSSARY.md` is a type. Use the same term each time, as code uses the same name.

Apply the best practices of programming:

- **Isolate each unit.** Write each bullet or paragraph so that it is correct when an agent reads only that bullet or paragraph. Do not depend on "above" or "as before".
- **Be explicit, not short.** Clarity is more important than few words. Repeat the subject in each sentence. Do not use "it" or "this" when the reader can misread them.
- **Give one job to each unit.** If a bullet does two jobs, split it into two bullets.
- **Refactor when a unit grows.** A bullet can start simple and grow complex as you add rules. Then move a rule to a separate bullet, or split the bullet by its logic.
- **Keep the nesting flat.** If a bullet has three or more sub-levels, flatten it if you can.
- **Keep the order of execution clear.** Use numbered steps for the order. Put the rules that apply at all times in a separate list, not inside a step (D235, D236).
- **Write each branch.** For each "If..." condition, say what to do. Also say what to do in the other case, when it is not obvious.
- **Name the inputs and outputs.** Say which file, section, or command output a step reads, and what it writes.
- **Keep shared blocks equal.** An agent loads one skill at a time, so a skill cannot call a block in another skill. If two skills need the same rule, write the same block in each skill. `tests/skills.test.mjs` fails if one copy differs. When you edit one copy, edit each other copy (D237).
- **Remove dead code.** If a rule no longer applies, delete it. Do not keep it as history. `docs/decisions.md` keeps the history.

## Project Files and Source of Truth

| File | Purpose | Source of truth for |
| --- | --- | --- |
| `docs/design.md` | Current rules for skills, schema, layout, and delivery | What to build. Read it first when you implement. |
| `docs/decisions.md` | Append-only log of decisions with rationale | Why a rule exists. Old entries can be superseded. |
| `docs/facts.md` | Verified facts about OpenSpec and tools, with sources | How external tools behave |
| `GLOSSARY.md` | Glossary of project terms | What each term means |
| `docs/todo.md` | Open items with evidence and a recommendation, but no decision yet | What is left to decide. Remove an item when its decision is in `decisions.md`. |
| `docs/test-scenarios.md` | Agent test scenarios that we run by hand before each release | What a good result is for the end user |
| `README.md` | User-facing overview and lifecycle | Nothing. It summarizes the files above. |

Rules:

- If `design.md` and `decisions.md` disagree, `design.md` is correct. Fix `decisions.md` with a `**Status**` line.
- If a decision has a `**Status**: Superseded` or `Revised` line, follow the newer decision.
- When you make a new decision, add it to `decisions.md`. Then update `design.md` in the same commit.
- When you find a new fact about OpenSpec or another tool, add it to `facts.md` with its source.
- Use the terms in `GLOSSARY.md`. Do not use the words in its _Avoid_ lists.

## Writing Test Scenarios

`docs/test-scenarios.md` holds the agent test scenarios. We run them by hand, or headless, before each release.

When you write a new scenario or refine an existing one:

- Write the expected result that is best for the end user. Find the most logical and useful result first.
- Do not copy the current skill behavior into the expected result. Question the skill. If the skill does something that does not help the user, write the better result.
- A scenario can fail on the current skills. That is correct when the skill is wrong. Then record the gap in `docs/todo.md`, or fix the skill with a new decision.

## After Each Review, Grilling Round, or Scenario Run

After every grilling round, review round, or test scenario run, you MUST do both steps:

1. Record all new decisions in `docs/decisions.md`.
2. Record all facts discovered about OpenSpec, apm, or other tools in `docs/facts.md` with their sources.

Do not mark the work complete until both files are updated.
