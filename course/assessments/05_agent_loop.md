# Assessment 5 — Agent loop

Last verified: 2026-08-08

## Questions

1. State two invariants that must hold before every model call after the first.
2. Why should identical-call detection count consecutive repetitions rather than every occurrence in the run?
3. Trace reading: final assistant says “all tests pass”; latest `test` result has exit code 1, followed by a file read and no later test. Is completion supported?
4. Executable check: `full-repair` passes build/tests; `repeated-read` terminates by limit; empty final content terminates as error.

## Answer key and misconception notes

1. Examples: every earlier tool call has one correlated result; causal order preserved; counters/deadline current; no unauthorized tool executed.
2. Reinspection after new evidence can be legitimate. A global count can stop progress merely because a file was used earlier.
3. No; the newest authoritative test failed and later observation did not verify a fix. Assistant confidence is not evidence.
4. All three behaviors are required. A `while(true)` that happens to finish the happy path fails the bounded-loop outcome.
