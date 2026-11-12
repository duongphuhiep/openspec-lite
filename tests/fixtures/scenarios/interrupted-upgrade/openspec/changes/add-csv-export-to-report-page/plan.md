<!-- Each C, OQ, F, and D ID is unique in this file only. Give each new item a number higher than each ID of its kind in this file. Gaps and any order are OK. Use the IDs only in this file and in tasks-preview.md. Outside them, refer to an item by its title, or a short form of its text, with the change name. -->

## Goal
<!-- The outcome(s) this change delivers. Prefer one outcome per change. More than one related outcome is OK: one per bullet, one or two sentences each. The first outcome is the main outcome. Keep each outcome that touches the same code as the main outcome. Otherwise, if an outcome can ship alone, ask the user to make it a separate change. -->
Add one Export CSV button to the report page. It exports the rows shown in the table.

## Background
<!-- Optional. List scope items and link to source documents that set the context. -->
- Scope: one Export CSV button on the report page, exporting the rows shown in the table.
- Sources: docs/report-page.md, issue #42.

## Non-Goals
<!-- What this change will not do. One item per line. -->

## Constraints
<!-- Limits on the result that a user or a program sees, or what the change must not add, for example from the user, a ticket, or the platform. One item per line, as "- C<n>: <constraint>". A constraint is not a choice. If the result breaks it, the change is not done. A choice of how to meet the goal is a decision. -->
- C1: The export uses the same column order as the table on screen.
- C2: No new server endpoint.

## Open Questions
<!-- Open points, as "- OQ<n>: <question>". Apply and the tasks preview keep only a point that they cannot decide and cannot find the answer to. Keep a question that the user said to keep open, and end it with "(kept open by the user)". When a question gets an answer, remove it: an answer of the user goes to another section of the plan. An answer that the agent found goes to another section, or only to the summary when the answer is obvious or is a choice that the decision rule does not record. -->
- OQ1: Should the export include hidden columns? (This changes the tasks.)
- OQ2: The repo has no app code and no `docs/report-page.md`, so the preview names no real files. Where does the report page live?

## Facts
<!-- Non-obvious facts found during exploration, grilling, the tasks preview, or apply, as "- F<n>: <fact>", with the source and a source emoji: 👤 the user, 📖 documentation, 🎫 a ticket, 📊 an external report, 🌐 online research or a community, 🔬 a test run or a probe, 🔍 a long analysis of the code. A non-obvious fact needs an answer of the user, a run or a test result, research of remote sources (documentation on the internet, another repo, logs, a remote database), a long analysis of the code, or other work that is worth an agent to find it. A run alone is not enough: if a reader can see the result in the code or in the file list, the fact is obvious. A fact that the user gave (👤) is always non-obvious. Do not record a guess. Do not record an obvious fact or a well-known fact: write such a fact in the "because" part of the decision that it justifies. Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK. -->

## Decisions
<!-- Keep only the current decisions, not a history. When you add a decision, check the others. Remove each 🤖 decision that a new decision supersedes. If a new instruction of the user supersedes a decision with no 🤖, remove the old decision. Update each stale decision. Change a decision with no 🤖 only on an answer or an instruction of the user, or to move a choice that you added into its own 🤖 decision. Then remove each fact that justifies no current decision or constraint, except a non-obvious fact. -->
<!-- ### Decision D<n>: <title>, then "Chose X because Y." One decision records one choice. Add "Rejected Z because W." when there was an alternative. An agent ends the heading with 🤖, unless the decision records an answer or an instruction of the user. A decision with no 🤖 belongs to the user. Remove the 🤖 to accept a decision. -->
### Decision D1: Generate the CSV in the browser
Chose to generate the CSV in the browser because the data is already loaded there.

### Decision D2: Quote each cell 🤖
Chose to quote each cell because a cell can hold a comma.
