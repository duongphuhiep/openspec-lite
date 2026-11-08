<!-- Each C, OQ, F, and D ID is unique in this file only. Give each new item a number higher than each ID of its kind in this file. Gaps and any order are OK. Use the IDs only in this file and in tasks-preview.md. Outside them, refer to an item by its title, or a short form of its text, with the change name. -->

## Goal
<!-- The outcome(s) this change delivers. Prefer one outcome per change. More than one related outcome is OK: one per bullet, one or two sentences each. The first outcome is the main outcome. Keep each outcome that touches the same code as the main outcome. Otherwise, if an outcome can ship alone, ask the user to make it a separate change. -->
Limit each API key to 100 requests per minute on the public HTTP API.

## Background
<!-- Optional. List scope items and link to source documents that set the context. -->
- Scope: the public HTTP API, in `src/rateLimit.js`.
- Source: incident INC-42 (one client overloaded the API).

## Non-Goals
<!-- What this change will not do. One item per line. -->
- No per-user limits for the admin UI.

## Constraints
<!-- Rules the implementation must follow. One item per line, as "- C<n>: <rule>". -->
- C1: Over-limit requests get HTTP 429 with a `Retry-After` header in seconds. Mobile clients depend on this header to back off.
- C2: Add no new runtime dependency.

## Open Questions
<!-- Unresolved questions, as "- OQ<n>: <question>". Remove each question when its answer goes to ## Decisions. -->

## Facts
<!-- Non-obvious facts found during exploration or grilling, as "- F<n>: <fact>". Record only facts that justify a decision or a constraint of this change. Do not record statistics that soon go out of date. A number as an example or a reference is OK. -->
- F1: The public API runs as a single instance.

## Decisions
<!-- Keep only the current decisions, not a history. When you add a decision, check the others. Remove each superseded decision. Update each stale decision. Then remove each fact that justifies no current decision or constraint. -->
<!-- ### Decision D<n>: <title>, then "Chose X because Y." Add "Rejected Z because W." when there was an alternative. -->
### Decision D1: In-memory fixed window instead of Redis
Chose an in-memory fixed-window counter because the API runs as a single instance (F1) and C2 forbids a new dependency. Rejected Redis because it adds a runtime dependency and a service to run.
