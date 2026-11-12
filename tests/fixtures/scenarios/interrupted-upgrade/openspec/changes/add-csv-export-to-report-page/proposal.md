# Proposal

## Why

Users of the report page cannot take the rows of the table out of the page. Issue #42 asks for a CSV export of the report table. 🤖

## What Changes

- Add one "Export CSV" button on the report page.
- The button downloads the rows shown in the table as a CSV file, in the same column order as on screen.
- The CSV is generated in the browser. No new server endpoint.

Sources: docs/report-page.md, issue #42.

## Capabilities

### New Capabilities

- `report-export`: export of the report table as a CSV file from the report page.

### Modified Capabilities

None.

## Impact

- Report page front-end code: new button and CSV generation.
- No server or API change.
