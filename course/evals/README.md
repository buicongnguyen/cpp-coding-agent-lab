# Deterministic evaluation suite

The release gate is network-free. `cases.json` is executable rather than a descriptive list: each ID maps to a focused assertion in `agent_tests`, and the runner fails when a manifest ID has no implementation.

```powershell
node course/scripts/run-evals.mjs --build-dir course/reference/build --report course/run/eval-report.json
```

The report location is intentionally under the ignored `course/run/` directory. Do not commit machine paths or delivery credentials.

`deterministic_baseline_report.json` is the reviewed portable release capture. The runner replaces its build directory with `<BUILD_DIR>` before writing output; regenerate it from a clean reference build whenever E1–E7 or their implementation changes. Ad hoc learner reports still belong under `course/run/`.

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
