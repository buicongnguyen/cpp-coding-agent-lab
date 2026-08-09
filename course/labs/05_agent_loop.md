# Lab 5 — Assemble the bounded loop

Last verified: 2026-08-09 | Time: 42 minutes | Start: `checkpoints/05_agent_loop`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 05_agent_loop starter`; work only in the generated `course/run/checkpoints/05_agent_loop/starter` copy.

Configure that copy with `cmake -S . -B build` and build with `cmake --build build --config Debug`. Copy `../fixture/buggy_calculator` to a disposable directory before any repair run.

## Goal and constraints

Implement the feedback loop and repair the fixture in deterministic mode. Every call must be correlated; every run must stop; final success must be supported by a current build/test result.

## Tasks

1. Add system and user messages to history.
2. On each iteration call the model, append its assistant message exactly once, then dispatch every approved call and append one correlated result.
3. Finish only on non-empty assistant content with no tool calls.
4. Enforce iteration, total-tool, consecutive-identical-call, and wall-clock limits.
5. Run the built `coding_agent` with `--mock --workspace <disposable-copy> --scenario full-repair` (`build/coding_agent` for single-config; `build/Debug/coding_agent` for multi-config, with `.exe` in PowerShell). Inspect the two failures and two minimal writes.
6. Reset the disposable copy, run the same executable with `--scenario repeated-read`, and prove the detector stops consecutive repetition.

**Five-minute checkpoint:** a two-call scripted scenario has causal history in the order `user, assistant(call), tool(result), assistant`.

## Acceptance criteria

- Full repair finishes; latest build and test exit codes are 0.
- Fixture's syntax and arithmetic defects are corrected without unrelated edits.
- Repeated-read scenario stops with the expected limit classification.
- Empty final content and unmatched result IDs are rejected by tests.

## Hints

1. Conceptual: the loop owns feedback and termination; the dispatcher owns actions.
2. Location: the generated copy's `src/agent_loop.cpp`.
3. Near-solution: reset the identical-call counter when the serialized name+arguments signature changes.

## Stretch

Add a cancellation callback checked before model calls and between tool calls, with a deterministic cancellation test.
