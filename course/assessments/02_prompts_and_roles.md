# Assessment 2 — Prompts and roles

Last verified: 2026-08-08

## Questions

1. Rewrite “be safe and check your work” as two observable requirements.
2. Why must a path boundary be enforced in C++ even when the system instruction forbids leaving the workspace?
3. Trace reading: order is `user, tool(result id=x), assistant(call id=x)`. Identify the protocol defect.
4. Inspectable check: compare two prompt variants with fixture, model/mode, tools, and sampling held fixed; report read-before-write and final-verification metrics.

## Answer key and misconception notes

1. Example: reject any normalized path outside the configured workspace; report completion only after the latest requested test exits 0. Vague synonyms are not observable.
2. Model instructions influence proposals; the harness controls authority. “System has highest priority” describes instruction handling, not an OS access control.
3. Causality is reversed; assistant must request before the correlated tool result. Matching IDs alone do not repair ordering.
4. Pass only if one intended prompt factor changes. A single attractive live answer is not evidence of reliable improvement.
