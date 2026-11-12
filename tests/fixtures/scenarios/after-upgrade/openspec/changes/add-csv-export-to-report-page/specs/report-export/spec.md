# Spec Delta

## Purpose

Lets users take the rows of the report table out of the report page as a CSV file.

## ADDED Requirements

### Requirement: Report page has an Export CSV button
The report page SHALL have one "Export CSV" button that downloads the rows shown in the table as a CSV file.

#### Scenario: User exports the table
- **WHEN** the user clicks "Export CSV" on the report page
- **THEN** a CSV file with the rows shown in the table is downloaded

#### Scenario: Table is empty 🤖
- **WHEN** the table shows no rows and the user clicks "Export CSV"
- **THEN** a CSV file with only the header row is downloaded

### Requirement: CSV columns follow the on-screen order
The CSV export SHALL use the same column order as the table on screen.

#### Scenario: Columns follow the on-screen order
- **WHEN** the user exports the table
- **THEN** the columns of the CSV are in the same order as the columns of the table

### Requirement: Hidden columns are not exported
The CSV export SHALL NOT include hidden columns of the table.

#### Scenario: Table has a hidden column
- **WHEN** the user exports a table that has a hidden column
- **THEN** the CSV has no column for the hidden column

### Requirement: Export uses no new server endpoint
The CSV export SHALL NOT call a new server endpoint.

#### Scenario: Export makes no new server call
- **WHEN** the user clicks "Export CSV"
- **THEN** no request goes to a new server endpoint
