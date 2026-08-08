# Lab 3 — Define and inspect `read_file`

Last verified: 2026-08-08 | Time: 30 minutes | Start: `checkpoints/03_tool_schema`

## Goal and constraints

Build a precise JSON Schema tool definition and parse a model request without executing it. Keep parallel calls disabled and do not add filesystem code yet.

## Tasks

1. Construct the `read_file` definition: one string `path`, required, no extra properties, with a relative-workspace description.
2. Serialize and pretty-print it. Validate the expected top-level provider shape.
3. Feed the deterministic tool-call response into the adapter.
4. Print call ID, name, parsed arguments, and finish reason. Confirm the target file timestamp/content is unchanged.
5. Run malformed fixtures: missing ID, non-object arguments, unknown response shape. Record the error layer.
6. Explain which constraints belong in schema and which require dispatcher policy.

**Five-minute checkpoint:** the schema rejects a missing `path` and an unexpected `pth` property in the learner's reasoning/test.

## Acceptance criteria

- Schema contains `type`, `properties`, `required`, and `additionalProperties: false`.
- Parsed call preserves its ID and name.
- No tool implementation executes in this lab.
- Malformed calls fail with a useful adapter/validation error.

## Hints

1. Conceptual: definition, call, execution, and result are four separate objects.
2. Location: `ToolDispatcher::definitions()` and model-response conversion.
3. Near-solution: make `path` the only allowed property and parse `function.arguments` from its JSON string before dispatch.

## Stretch

Add a schema-contract unit test for every advertised tool name without testing execution.
