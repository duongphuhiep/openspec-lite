<!-- Generated. Edit plan.md, not this file. -->
<!-- plan-sha256: f898dbb6f619c8dcb84d2b59af14906bede37f593d42cad510834ec78350cf32 -->

## 1. CSV generation in the browser

- 1.1 Add a function that turns the table's displayed rows and columns into CSV text, in the on-screen column order (C1), with proper escaping of commas, quotes, and newlines. The place of the function waits for the answer to OQ2, because the repo has no app code.
  - Verify: unit tests cover column order, the header row, and values with commas, quotes, and newlines. The output matches the table's displayed rows.
- 1.2 Build the column list of the export. The task waits for the answer to OQ1.
  - Verify: the column list is one input of the function in 1.1, so the answer to OQ1 changes only the code that builds that list.

## 2. Export CSV button (depends on 1)

- 2.1 Add one Export CSV button to the report page. Clicking it builds the CSV from the data already loaded and downloads it as a file, with no request to the server (C2). The task waits for the answer to OQ2.
  - Verify: a component test clicks the button and checks that a download starts with the expected content. No network request is made.

## 3. Docs (same change as 2)

- 3.1 Update `docs/report-page.md` to describe the Export CSV button and the column rule. The task waits for the answer to OQ1.
  - Verify: the doc matches the final behavior, including the answer to OQ1.
