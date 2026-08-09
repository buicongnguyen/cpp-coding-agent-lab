# Checkpoint 06 — Trace and limits

## Add

- JSON-line trace events.
- Cumulative token and cost accounting.
- Explicit stop reasons.

## Learner task

Annotate a full-repair trace and identify one compaction candidate and one message that must remain.

## Release gate

Each model and tool transition is visible with iteration, call ID, result, usage, and stop reason.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 06_trace_and_limits starter` from the repository root. Compare with the `solution` variant only after recording the learner evidence.
