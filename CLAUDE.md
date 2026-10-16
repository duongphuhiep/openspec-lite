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

## Project Files and Source of Truth

| File | Purpose | Source of truth for |
| --- | --- | --- |
| `docs/design.md` | Current rules for skills, schema, layout, and delivery | What to build. Read it first when you implement. |
| `docs/decisions.md` | Append-only log of decisions with rationale | Why a rule exists. Old entries can be superseded. |
| `docs/facts.md` | Verified facts about OpenSpec and tools, with sources | How external tools behave |
| `CONTEXT.md` | Glossary of project terms | What each term means |
| `README.md` | User-facing overview and lifecycle | Nothing. It summarizes the files above. |

Rules:

- If `design.md` and `decisions.md` disagree, `design.md` is correct. Fix `decisions.md` with a `**Status**` line.
- If a decision has a `**Status**: Superseded` or `Revised` line, follow the newer decision.
- When you make a new decision, add it to `decisions.md`. Then update `design.md` in the same commit.
- When you find a new fact about OpenSpec or another tool, add it to `facts.md` with its source.
- Use the terms in `CONTEXT.md`. Do not use the words in its _Avoid_ lists.
