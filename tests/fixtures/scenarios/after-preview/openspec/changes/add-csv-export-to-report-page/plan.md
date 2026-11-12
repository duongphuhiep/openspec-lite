<!-- Each C, OQ, F, and D ID is unique in this file only. Give each new item a number higher than each ID of its kind in this file. Gaps and any order are OK. Use the IDs only in this file and in tasks-preview.md. Outside them, refer to an item by its title, or a short form of its text, with the change name. -->

## Goal
<!-- The outcome(s) this change delivers. Prefer one outcome per change. More than one related outcome is OK: one per bullet, one or two sentences each. The first outcome is the main outcome. Keep each outcome that touches the same code as the main outcome. Otherwise, if an outcome can ship alone, ask the user to make it a separate change. -->
Add a CSV export to the report page, so a user can download the report data as a CSV file.

## Background
<!-- Optional. List scope items and link to source documents that set the context. -->

## Non-Goals
<!-- What this change will not do. One item per line. -->

## Constraints
<!-- Rules the implementation must follow, for example from the user, a ticket, or the platform. One item per line, as "- C<n>: <rule>". A constraint is not a choice. If the result breaks it, the change is not done. A choice of how to meet the goal is a decision. -->

## Open Questions
<!-- Open points, as "- OQ<n>: <question>". Apply and the tasks preview keep only a point that they cannot decide and cannot find the answer to. Keep a question that the user said to keep open, and end it with "(kept open by the user)". When a question gets an answer, remove it: an answer of the user goes to another section of the plan. An answer that the agent found goes to another section, or only to the summary when the answer is obvious or is a choice that the decision rule does not record. -->
- OQ1: Where is the report page? The repo has no application code, so is this the wrong repo or folder?
- OQ2: Which columns does the export hold, and does it respect the filters of the page?
- OQ3: Is the CSV built in the browser or on the server?

## Facts
<!-- Non-obvious facts found during exploration, grilling, the tasks preview, or apply, as "- F<n>: <fact>", with the source and a source emoji: 👤 the user, 📖 documentation, 🎫 a ticket, 📊 an external report, 🌐 online research or a community, 🔬 a test run or a probe, 🔍 a long analysis of the code. A non-obvious fact needs an answer of the user, a run or a test result, research of remote sources (documentation on the internet, another repo, logs, a remote database), a long analysis of the code, or other work that is worth an agent to find it. A run alone is not enough: if a reader can see the result in the code or in the file list, the fact is obvious. Do not record a guess, an obvious fact, or a well-known fact: write such a fact in the "because" part of the decision that it justifies. Do not record numbers or statistics that soon go out of date. A number as a reference or an example is OK. -->

## Decisions
<!-- Keep only the current decisions, not a history. When you add a decision, check the others. Remove each superseded decision. Update each stale decision. Change a decision with no 🤖 only on an answer or an instruction of the user. Then remove each fact that justifies no current decision or constraint, except a non-obvious fact. -->
<!-- ### Decision D<n>: <title>, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. An agent ends the heading with 🤖, unless the decision records an answer or an instruction of the user. A decision with no 🤖 belongs to the user. Remove the 🤖 to accept a decision. -->
