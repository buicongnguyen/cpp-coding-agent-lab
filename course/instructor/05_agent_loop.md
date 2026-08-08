# Instructor guide 5 — Agent loop

Last verified: 2026-08-08 | 60 minutes: trace 5, explain 12, demo 12, lab 27, check 4

## Demonstration script

1. Prediction: stop after the first `read_file` and ask what information the next decision requires.
2. Run deterministic `full-repair` slowly. Freeze on each model response and tool result; maintain iteration/tool counters on screen.
3. At the first compiler failure, ask whether tool invocation failed (no—the observed process exited nonzero).
4. Run `repeated-read` and show the consecutive-signature stop reason.

Exact prompt: `Configure, build, test, and repair this project. Use the smallest appropriate changes.` Expected deterministic sequence is documented; live sequence is not guaranteed. Recorded fallback is the JSONL trace. If platform build tools fail, switch the run-command results to recorded fixtures and continue the loop.

Misconceptions: final prose is verification; every repeated read is pathological; append tool results before the assistant request; retry model failures indefinitely. End by having learners state the invariant before the next model call.
