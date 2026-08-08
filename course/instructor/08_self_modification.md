# Instructor guide 8 — Self-modification capstone

Last verified: 2026-08-08 | 50 minutes: frame 5, map 6, demo 8, capstone 26, review 5

## Demonstration script

1. Start from a clean isolated copy and show baseline tests.
2. Exact requirement: `Implement bounded sorted list_files results with accurate truncation; keep paths workspace-relative, skip symlinks, add focused boundary tests, and make no unrelated changes.`
3. Before running, map schema, dispatcher, result, trace, and tests on the board.
4. Stop after edit, inspect diff, then build/test. Do not reveal the full solution before learner work.

Expected branches: a live model may over-edit, omit a boundary test, or falsely claim success. Treat each as capstone evidence and use the failure taxonomy. Deterministic fallback uses the canonical implementation and checkpoint manifest. If baseline is not green, move the learner to a fresh supplied copy; do not attribute inherited failure to the agent.

Misconceptions: self-modification changes the running binary; compilation alone completes the task; a green existing suite proves new behavior; a clean final message substitutes for diff review. Require a human keep/amend/discard decision.
