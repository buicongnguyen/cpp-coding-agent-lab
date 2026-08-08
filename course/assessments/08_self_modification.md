# Assessment 8 — Self-modification

Last verified: 2026-08-08

## Questions

1. Why is the capstone not runtime mutation of the currently executing binary?
2. List the implementation layers that must be reviewed when adding `list_files`.
3. Trace reading: agent edits dispatcher, build passes, existing tests pass, but no limit-boundary test exists and final claims “truncation is correct.” Classify the gap.
4. Executable check: from a clean isolated copy, diff is scoped; build and existing tests pass; exact-limit and over-limit focused tests pass; escape/symlink tests remain green.

## Answer key and misconception notes

1. A process edits repository files that affect a later compilation; its loaded machine code is unchanged.
2. Definition/schema, provider adapter if needed, validation/authorization, execution, envelope/correlation, trace, prompt guidance, and tests/documentation.
3. Verification/reporting gap: compilation and unrelated tests do not establish the claimed boundary behavior.
4. Every rung is required. A green build alone establishes syntax/link compatibility, not behavior, safety, or a reviewable scope.
