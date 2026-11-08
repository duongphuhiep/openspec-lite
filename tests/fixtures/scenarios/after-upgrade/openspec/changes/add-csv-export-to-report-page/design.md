# Design

## Context

See proposal.md for motivation. The export must keep the on-screen column order and must add no new server endpoint (see the specs of `report-export`). Sources: docs/report-page.md, issue #42.

## Goals / Non-Goals

**Goals:**
- Export the rows shown in the report table as CSV from the report page.

**Non-Goals:**
- None beyond the proposal.

## Decisions

### Decision: Generate the CSV in the browser
Chose to generate the CSV in the browser because the data is already loaded there.

### Decision: Quote each cell 🤖
Chose to quote each cell because a cell can hold a comma.

### Decision: Exclude hidden columns
Chose to leave hidden columns out of the export, on the answer of the user in this upgrade.

## Risks / Trade-offs

None known.
