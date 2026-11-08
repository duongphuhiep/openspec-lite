<!-- Generated. Edit plan.md, not this file. -->
<!-- plan-sha256: 7268cd95fce2b160235913a868f6b468eaf46335622c2f3f4bae40fafaf4be91 -->

## 1. Locate the report page and its data source

- 1.1 Identify the report page and the code that loads its data (the repo has no application code yet).
  - Verify: the report page component and its data source are named, and OQ1 is answered.

## 2. CSV generation

- 2.1 Add a function that turns the report rows into CSV text (header row, quoting of commas, quotes, and newlines).
  - Verify: unit tests cover plain values, values with commas, quotes, and newlines, and an empty report.
  - Files: to be set after 1.1

## 3. Export control on the report page

- 3.1 Add an "Export CSV" button to the report page that downloads the file with a clear filename.
  - Verify: clicking the button downloads a CSV whose content matches the rows shown on the page; a test or a manual run confirms it.
  - Files: to be set after 1.1
