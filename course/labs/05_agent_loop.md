# Lab 5 — Assemble the bounded loop

Last verified: 2026-08-08 | Time: 42 minutes | Start: `checkpoints/05_agent_loop`

## Goal and constraints

Implement the feedback loop and repair the fixture in deterministic mode. Every call must be correlated; every run must stop; final success must be supported by a current build/test result.

## Tasks

1. Add system and user messages to history.
2. On each iteration call the model, append its assistant message exactly once, then dispatch every approved call and append one correlated result.
3. Finish only on non-empty assistant content with no tool calls.
4. Enforce iteration, total-tool, consecutive-identical-call, and wall-clock limits.
5. Run `full-repair` on a fresh copy of `buggy_calculator`. Inspect the two failures and two minimal writes.
6. Run `repeated-read` and prove the detector stops consecutive repetition.

**Five-minute checkpoint:** a two-call scripted scenario has causal history in the order `user, assistant(call), tool(result), assistant`.

## Acceptance criteria

- Full repair finishes; latest build and test exit codes are 0.
- Fixture's syntax and arithmetic defects are corrected without unrelated edits.
- Repeated-read scenario stops with the expected limit classification.
- Empty final content and unmatched result IDs are rejected by tests.

## Hints

1. Conceptual: the loop owns feedback and termination; the dispatcher owns actions.
2. Location: `reference/src/agent_loop.cpp`.
3. Near-solution: reset the identical-call counter when the serialized name+arguments signature changes.

## Stretch

Add a cancellation callback checked before model calls and between tool calls, with a deterministic cancellation test.
