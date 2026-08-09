# Lab 6 — Annotate a run trace

Last verified: 2026-08-09 | Time: 18 minutes | Start: `checkpoints/06_trace_and_limits`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 06_trace_and_limits starter`; work only in the generated `course/run/checkpoints/06_trace_and_limits/starter` copy.

Configure that copy with `cmake -S . -B build`, build with `cmake --build build --config Debug`, and copy `../fixture/buggy_calculator` to a disposable directory. Use the built `coding_agent` path for your generator as described in Lab 5.

## Goal and constraints

Measure model calls, tools, history growth, time, tokens, and cost without exposing secrets. Do not delete evidence when proposing compaction.

## Tasks

1. Run `coding_agent --mock --workspace <disposable-copy> --scenario full-repair --trace trace-before.jsonl` using the built executable path. Observe that the pre-checkpoint serializer preserves only `kind` and `detail`; record that insufficiency rather than inventing missing fields.
2. Implement the Chapter 6 trace serialization TODO in `src/agent_loop.cpp`, including iteration, call ID, authorization/status, usage, elapsed/run identity, duration, model/finish reason, and stop/final evidence.
3. Rebuild and rerun into `trace-after.jsonl`, then run `ctest --test-dir build -C Debug -L checkpoint-06 --output-on-failure`.
4. Build a table per model call: message count, cumulative tool results, prompt/completion tokens, elapsed time, and estimated cost. Mark the latest authoritative build/test result and superseded output.
5. Propose a retention policy that keeps goal, constraints, latest evidence, unresolved errors, and correlation integrity. Identify two outputs that could be bounded or summarized for future context while remaining in the raw trace.

**Five-minute checkpoint:** learners distinguish user-visible turns, model calls, and tool calls with exact counts.

## Acceptance criteria

- Counts reconcile with the post-change trace events; the sparse baseline is labeled incomplete.
- Usage/cost source is identified; estimates are labeled.
- Proposed compaction does not remove current pass/fail evidence.
- Trace contains no credential value.

## Hints

1. Conceptual: prompt context and audit trace have different retention needs.
2. Location: trace writes in `agent_loop.cpp`; response usage in `types.hpp`.
3. Near-solution: retain raw JSONL externally and summarize only the message vector used in later model requests.

## Stretch

Add a trace summarizer that emits totals and maximum consecutive tool calls without modifying the raw trace.
