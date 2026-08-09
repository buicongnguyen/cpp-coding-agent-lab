# Checkpoint 04 — Tool dispatcher

## Add

- `reference/src/tool_dispatcher.cpp`
- The platform process runner.

## Learner task

Implement parse, validate, authorize, execute, normalize. Never execute model-produced free-form shell text.

## Release gate

Known read/write/command actions succeed, `../` escapes fail, an unknown command action is rejected, and `list_files` remains unavailable.

## Materialize

Run `node course/scripts/checkpoints.mjs materialize 04_tool_dispatch starter` from the repository root. Compare with the `solution` variant only after recording the learner evidence.
