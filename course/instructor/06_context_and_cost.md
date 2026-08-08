# Instructor guide 6 — Context and cost

Last verified: 2026-08-08 | 30 minutes: surprise 4, explain 8, demo 7, lab 9, check 2

## Demonstration script

1. Ask: “How many turns did the repair take?” Collect answers before defining task, model call, and tool call.
2. Open the raw JSONL trace and tally event types. Plot message count and cumulative tool output per model request.
3. Highlight an old compiler log, then the newest test result. Ask which can be summarized and which is authoritative.
4. Show usage/cost fields as reported data; label deterministic usage as synthetic.

Expected branch: live providers may omit or differ in cost detail. Recorded fallback has token counts sufficient for the accounting exercise. If a trace is incomplete, do not interpolate silently; mark the missing field.

Misconceptions: provider-managed state is infinite memory; compression is lossless; user turns equal billable calls; cached input is free or guaranteed. Preserve raw trace even when proposing prompt compaction.
