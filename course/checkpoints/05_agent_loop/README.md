# Checkpoint 05 — Agent loop

## Add

- `reference/include/course_agent/agent_loop.hpp`
- `reference/src/agent_loop.cpp`

## Learner task

Append the assistant call before its correlated tool results and stop on final text, cancellation, error, repetition, time, or configured limits.

## Release gate

The deterministic `compile-fix` scenario builds the fixture and every executed call has exactly one result.

