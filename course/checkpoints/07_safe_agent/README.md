# Checkpoint 07 — Safe and evaluated agent

## Add

- Workspace canonicalization.
- File and output limits.
- API-key removal from child processes.
- Repeated-call detection.
- Seven deterministic evaluation cases, E1–E7.

## Learner task

Run the evaluation suite, diagnose one failure from its trace, fix the correct layer, and rerun.

## Release gate

All network-free CTest cases pass.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 07_safe_agent starter` from the repository root. Compare with the `solution` variant only after recording the learner evidence.
