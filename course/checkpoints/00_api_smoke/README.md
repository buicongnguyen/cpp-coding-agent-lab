# Checkpoint 00 — API smoke test

## Start from

- `reference/include/course_agent/json.hpp`
- `reference/include/course_agent/types.hpp`
- `reference/include/course_agent/model_client.hpp`
- `reference/src/types.cpp`
- `reference/src/scripted_model_client.cpp`
- `reference/src/preflight.cpp`

## Learner task

Build `agent_preflight`, run deterministic mode, and identify the model, finish reason, content, and usage fields. Live mode is optional.

## Release gate

`agent_preflight` prints `Mock model is ready.` without an API key.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 00_api_smoke starter` from the repository root. Compare with the `solution` variant only after recording the learner evidence.
