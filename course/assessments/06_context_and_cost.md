# Assessment 6 — Context and cost

Last verified: 2026-08-09

## Questions

1. Distinguish a user-visible task, a model call, and a tool call.
2. Which information should normally survive prompt compaction, and why keep the raw trace separately?
3. Trace reading: five model-response events contain tool calls of counts 2, 1, 0, 3, 0. How many model calls and tool calls occurred? What else is needed for cost?
4. Inspectable check: trace totals reconcile; newest build/test evidence is identified; no secret value appears; token/cost estimates name their source.

## Answer key and misconception notes

1. Task is user goal scope; model call is one API inference; tool call is one proposed local action. They are not interchangeable “turns.”
2. Goal, constraints, current authoritative state/evidence, unresolved issues, and required correlation survive; raw evidence supports audit after lossy summary.
3. Five model calls and six tool calls; provider usage and pricing/cost fields/model routing are still needed. Character count alone is not exact cost.
4. Synthetic deterministic usage must be labeled; missing data must not be silently invented.
