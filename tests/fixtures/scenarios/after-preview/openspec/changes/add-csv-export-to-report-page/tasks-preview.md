<!-- Generated. Edit plan.md, not this file. -->
<!-- plan-sha256: 7268cd95fce2b160235913a868f6b468eaf46335622c2f3f4bae40fafaf4be91 -->

## 1. CSV generation

- 1.1 Add a function that turns the report rows into CSV text, with a header row, and with quoting of commas, quotes, and newlines. The columns and the rows wait for the answer to OQ2. The place of the function waits for the answers to OQ1 and OQ3.
  - Verify: unit tests cover plain values, values with commas, quotes, and newlines, and an empty report.

## 2. Export control on the report page (depends on 1)

- 2.1 Add an "Export CSV" button to the report page that downloads the CSV file. The task waits for the answer to OQ1, because the repo has no report page.
  - Verify: a click on the button downloads a CSV file whose content matches the rows shown on the page. A test or a manual run confirms it.
