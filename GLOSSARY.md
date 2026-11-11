# openspec-lite

A lightweight workflow on top of OpenSpec for medium changes. It replaces the full spec-driven change with a plan and an optional tasks preview.

## Language

**Level 1 / Level 2 / Level 3**:
The three sizes of a change. Level 1 is a direct implementation with no artifacts. Level 2 is a plan-lite change. Level 3 is a spec-driven change.
_Avoid_: Tier, mode

**plan-lite**:
The custom OpenSpec schema for Level 2. Its only artifact is the plan. The tasks preview is a file outside the schema.
_Avoid_: Lite schema, openspec-lite schema

**Plan**:
The living document of a plan-lite change. It holds the goal, an optional background, non-goals, constraints, open questions, facts, and decisions.
_Avoid_: Proposal, design

**Fact**:
An item of `## Facts` in a plan: a non-obvious fact, with its source. Its text starts with a source emoji: 👤 the user, 📖 documentation, 🎫 a ticket, 📊 an external report, 🌐 online research or a community, 🔬 a test run or a probe, 🔍 a long analysis of the code (D226). The emoji does not replace the source in words. An obvious fact or a well-known fact is not a fact of the plan. It goes into the "because" part of the decision that it justifies (D184, D192, D231). It is not an entry of `docs/facts.md`, which holds the facts about the tools that openspec-lite uses.
_Avoid_: Finding, note

**Non-obvious fact**:
A fact that needs one of these to find: an answer of the user; a run or a test result; research of remote sources, for example documentation on the internet, another repo, logs, or a remote database; a long analysis of the code; or other work that is worth an agent to find it. A fact that a reader can easily deduce from the code or the file list is not one, also if a run found it (D198). A plan keeps it also when no decision uses it, and archive keeps it in an ADR if the change depends on it (D179, D184).
_Avoid_: Tool fact, finding

**Item ID**:
The short ID of a constraint, open question, fact, or decision in a plan: `C<n>`, `OQ<n>`, `F<n>`, or `D<n>`. It is unique only in its plan. It appears only in the plan and in its tasks preview. Elsewhere, an item is named by its title, or a short form of its text, with the change name.
_Avoid_: Number, key

**Tasks preview**:
An opt-in list of intended code changes for human review before coding. It is a reference, not a contract.
_Avoid_: Task preview, tasks, task list, checklist

**Tasks** (OpenSpec):
The `tasks.md` artifact of a spec-driven change. The apply phase follows it and tracks it as a checklist.
_Avoid_: Tasks preview

**Deviation**:
A change of approach during apply, compared to the tasks preview. Apply records it in the `## Decisions` section of the plan only when it is a decision: it changes a visible result, or it was a close call (D225).
_Avoid_: Drift, divergence

**Promotion**:
The move of non-obvious information and contracts from a plan into permanent specs or ADRs. It happens during archive. The CLI applies the spec deltas when the change moves to the archive.
_Avoid_: Sync, merge, upgrade

**Contract**:
Externally observable behavior that a client or another team depends on. Promotion writes it to a spec, even if it is obvious from the code. Three other uses of the word are different. "`tasks.md` is a contract" means that apply must follow its steps. The upgrade signal "a contract (spec) becomes necessary" means a spec that others must agree on before the work. In `docs/design.md`, "contract" also names the command-line interface of a script, for example `install.mjs`.
_Avoid_: Interface, API (for this meaning)

**Outcome**:
A result that a change delivers. `## Goal` in `plan.md` holds one outcome by preference, or more than one related outcome, one per bullet. The first outcome of the request is the **main outcome**. The change name starts with it. The **split question** asks the user to leave out an outcome that can ship alone and does not touch the code of the main outcome. The done check asks if each outcome is met.
_Avoid_: Objective

**Inferred item**:
An item that upgrade writes in `proposal.md`, `specs/`, or `design.md`, but that comes from no section of `plan.md` and from no answer of the user. A restatement of a `plan.md` item in other words is not an inferred item. It has a 🤖 mark at the end of its line or heading. An agent decision of the plan keeps its 🤖 in `design.md`, also when it is not inferred. The user removes the mark to accept the item.
_Avoid_: Guess, assumption

**Constraint**:
An item of `## Constraints` in a plan: a rule that the implementation must follow. It comes from the user, a ticket, or the platform. It is not a choice, so it has no "because" part to weigh and no 🤖. Test: if the result breaks it, the change is not done. A choice of how to meet the goal is a decision. The plan hash covers `## Constraints`, so an edit makes the tasks preview stale. The done check asks if each constraint is met (D226, D240, D241).
_Avoid_: Requirement, rule set

**Decision**:
An item of `## Decisions` in a plan. The agent records a choice as a decision when (1) it changes a visible result that the plan and the user did not give, or (2) the agent weighed close options with no clear winner. The agent records no other choice of its own, also not a choice that answers an open question. A choice or an instruction in an answer of the user is also a decision. A fact in that answer goes to `## Facts`. In propose and apply, a rule in that answer that the change must follow is a constraint. The tasks preview cannot edit `## Constraints`, so there it is a decision (D219, D222, D225, D226, D229, D240).
_Avoid_: Choice log, rationale

**Visible result**:
What a user or another program sees or uses: a UI, a public interface, the input or output of a program, the signature of an exported function, a data format, a file name or path in the repo that another program, a config, or a doc outside this change refers to, a key in a config file that a program or a user reads, a new dependency, or the result on an error or an edge case (D218, D220, D222).
_Avoid_: Observable behavior

**Open question**:
An item of `## Open Questions` in a plan: a point that is still open. Propose records each open point, because it does not explore the code. Apply, the tasks preview, and upgrade keep only a point that they cannot decide and cannot find the answer to, for example because only the user has the information. A point that the agent can decide is a decision, not a question. A question that the user said to keep open stays open, also if the agent can decide it. Its text ends with "(kept open by the user)", so that a later session also keeps it (D223, D225, D228).
_Avoid_: Pending item, TODO

**Agent decision**:
A decision in a plan that an agent wrote, and that records no answer and no instruction of the user. Its heading ends with 🤖. Upgrade keeps the mark in `design.md`. A decision with no 🤖 belongs to the user: one that the user wrote, or one that records an answer or an instruction of the user. An agent changes only an agent decision with no question. The user removes the 🤖 to accept it (D181).
_Avoid_: AI decision, draft decision

**Done check**:
The three questions at the end of apply and the start of archive: Is each outcome of the Goal met? Is each Constraint met? Is `## Open Questions` empty?
_Avoid_: Done checklist, definition of done

**Upgrade**:
The switch of an active change from plan-lite to spec-driven. You can upgrade a change at any time.
_Avoid_: Graduation, promotion, migration

**Schema update**:
A change to the `version` of the plan-lite schema, and the copy of the new version into a repo.
_Avoid_: Schema upgrade, schema migration
