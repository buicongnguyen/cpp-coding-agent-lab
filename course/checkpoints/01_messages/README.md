# Checkpoint 01 — Message history

## Add

- `Message`, `ToolCall`, `Usage`, and `ModelResponse` types.
- `message_to_json` and response parsing.

## Learner task

Serialize `system`, `user`, and `assistant` messages and reconstruct the stateless-history experiment.

## Release gate

The JSON round-trip test passes and the student can point to every item supplied to the model.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 01_messages starter` from the repository root. Compare with the `solution` variant only after recording the learner evidence.
