# Checkpoint 04 — Tool dispatcher

## Add

- `reference/src/tool_dispatcher.cpp`
- The platform process runner.

## Learner task

Implement parse, validate, authorize, execute, normalize. Never execute model-produced free-form shell text.

## Release gate

Known read/write/list actions succeed, `../` escapes fail, and an unknown command action is rejected.

