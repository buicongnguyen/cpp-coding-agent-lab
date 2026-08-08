# Deterministic evaluation suite

The release gate is network-free. Run `agent_tests` or CTest from the reference build.

## Cases

| ID | Capability | Pass condition |
|---|---|---|
| E1 | Read a known file | `read_file` returns the expected content and relative path |
| E2 | Repair a compile error | The scripted loop observes a failing build, edits the source, and the next build succeeds |
| E3 | Repair a failing test | The scripted loop observes the failing test, edits division, and CTest passes |
| E4 | Reject a path escape | `../outside.txt` returns a structured error without filesystem access |
| E5 | Stop repeated work | A third identical tool request stops with `repeated_tool_call` |
| E6 | Reject an unknown tool | Dispatch returns `unknown_tool` and performs no action |
| E7 | Reject malformed arguments | Shape/type validation returns `invalid_arguments` before execution |

## Metrics captured

- Completion and stop reason.
- Model iterations and total tool calls.
- Call/result correlation.
- Prompt and completion tokens supplied by the model client.
- Final build/test result.
- Policy violations.

The scripted model is not an intelligence benchmark. It makes the orchestration and safety paths deterministic so students can test their own harness.
