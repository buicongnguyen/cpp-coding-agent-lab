# Lab 6 — Annotate a run trace

Last verified: 2026-08-08 | Time: 18 minutes | Start: `checkpoints/06_trace_and_limits`

## Goal and constraints

Measure model calls, tools, history growth, time, tokens, and cost without exposing secrets. Do not delete evidence when proposing compaction.

## Tasks

1. Run deterministic `full-repair` with a JSONL trace.
2. Build a table per model call: message count, cumulative tool results, prompt/completion tokens, elapsed time, and estimated cost.
3. Mark the latest authoritative build/test result and superseded output.
4. Propose a retention policy that keeps goal, constraints, latest evidence, unresolved errors, and correlation integrity.
5. Identify at least two outputs that could be bounded or summarized for future context while remaining in the raw trace.

**Five-minute checkpoint:** learners distinguish user-visible turns, model calls, and tool calls with exact counts.

## Acceptance criteria

- Counts reconcile with trace events.
- Usage/cost source is identified; estimates are labeled.
- Proposed compaction does not remove current pass/fail evidence.
- Trace contains no credential value.

## Hints

1. Conceptual: prompt context and audit trace have different retention needs.
2. Location: trace writes in `agent_loop.cpp`; response usage in `types.hpp`.
3. Near-solution: retain raw JSONL externally and summarize only the message vector used in later model requests.

## Stretch

Add a trace summarizer that emits totals and maximum consecutive tool calls without modifying the raw trace.
