# Lab 4 — Execute and correlate tools safely

Last verified: 2026-08-09 | Time: 42 minutes | Start: `checkpoints/04_tool_dispatch`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 04_tool_dispatch starter`; work only in the generated `course/run/checkpoints/04_tool_dispatch/starter` copy.

Configure that copy with `cmake -S . -B build`, build with `cmake --build build --config Debug`, and use `ctest --test-dir build -C Debug -L checkpoint-04 --output-on-failure` as the focused gate.

## Goal and constraints

Complete a dispatcher for read, write, and symbolic configure/build/test actions. All paths remain inside a disposable workspace. Do not invoke a shell or accept arbitrary command text. `list_files` must remain unavailable until the Chapter 8 capstone.

## Tasks

1. Trace `dispatch` through argument checks, workspace resolution, action execution, and result envelope.
2. Execute a successful `read_file`; append the unchanged assistant call followed by a tool result with the same ID.
3. Test `../outside.txt`, an absolute path, an extra argument, an unknown tool, and an oversized write.
4. Run `configure`, `build`, and `test` through the enum action. Record `ok`, `exit_code`, `timed_out`, and `truncated` separately.
5. Confirm the model key is absent from the child environment and no shell parsing occurs.
6. Complete one manual model → call → dispatch → result → model round trip.

**Five-minute checkpoint:** path escape is rejected by a direct dispatcher call, independent of model behavior.

## Acceptance criteria

- Every result uses the shared success/failure envelope.
- Call/result IDs match.
- Escape, unknown tool, extra property, and size-limit tests pass.
- `run_command` accepts only `configure|build|test` and captures a nonzero exit as process data.

## Hints

1. Conceptual: validate shape, semantics, authorization, and execution in that order.
2. Location: `src/tool_dispatcher.cpp` and the generated copy's platform `src/process_*.cpp`.
3. Near-solution: map each action to a fixed executable plus argument vector; never concatenate model strings into a command line interpreted by a shell.

## Stretch

Add a process-output boundary test that distinguishes a complete result from `truncated:true` without logging beyond the configured limit.
