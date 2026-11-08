## Goal
Limit each API key to 100 requests per minute on the API server.

## Background

## Non-Goals

## Constraints
- The limiter must not add an npm dependency.
- A request over the limit gets status 429.

## Open Questions

## Facts
- F1: A fixed window needs only one counter for each API key.
- F2: In the access logs, the clients retry after 30 seconds or more.

## Decisions
### Decision D1: Use a fixed 60-second window
Chose a fixed 60-second window for each API key, because it needs only one counter for each key (F1), and the clients retry slowly, so bursts at the window edge do not matter (F2).
