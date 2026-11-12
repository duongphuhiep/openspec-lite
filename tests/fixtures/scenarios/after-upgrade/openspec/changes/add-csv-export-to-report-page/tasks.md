# Tasks

## 0. Open questions

- [ ] 0.1 Answer: Where does the report page live? The repo has no app code and no `docs/report-page.md`, so the tasks name no real files. The answer can change the specs, the approach, or the tasks.

## 1. CSV generation in the browser

- [ ] 1.1 Add a function that turns the table's displayed rows and columns into CSV text, in the on-screen column order (column-order constraint), with proper escaping of commas, quotes, and newlines. Verify: unit tests cover column order, the header row, and values with commas, quotes, and newlines. The output matches the table's displayed rows. (Files: report page module, path to find in the code.)
- [ ] 1.2 Take visible columns only: hidden columns stay out of the export. Verify: a unit test with a hidden column shows that the CSV has no column for it. The column list is one input of the function in 1.1.

## 2. Export CSV button (depends on 1)

- [ ] 2.1 Add one Export CSV button to the report page. Clicking it builds the CSV from the data already loaded and downloads it as a file, with no request to the server (no-new-endpoint constraint). Verify: a component test clicks the button and checks that a download starts with the expected content. No network request is made. (Files: report page component.)

## 3. Docs (same change as 2)

- [ ] 3.1 Update `docs/report-page.md` to describe the Export CSV button and the column rule. Verify: the doc matches the final behavior, including that hidden columns are not exported.
