# Lab 8 — Make a reviewable self-change

Last verified: 2026-08-09 | Time: 38 minutes | Start: `checkpoints/08_capstone_solution`

Materialize the deliberately incomplete learner state with `node course/scripts/checkpoints.mjs materialize 08_capstone_solution starter`; confirm that `list_files` is absent before working in `course/run/checkpoints/08_capstone_solution/starter`.

Configure/build only inside that isolated starter with `cmake -S . -B build` and `cmake --build build --config Debug`. Use `ctest --test-dir build -C Debug -L checkpoint-08 --output-on-failure` as the focused post-change gate.

## Goal and constraints

In an isolated copy, have the agent add or refine `list_files` end to end, then review and verify the result. No publish, delete, network, package install, or external workspace access is allowed.

## Tasks

1. Create a clean copy/worktree and record baseline build/tests.
2. Give the requirement: bounded, sorted, workspace-relative regular files; skip symlinks; accurate `count`/`truncated`; no unrelated changes.
3. If live mode is enabled, let the pinned model attempt the change. Otherwise implement the slice yourself before inspecting `answer.patch`. The recorded deterministic capstone fallback applies the checked-in instructor patch and proves build/tests only; it does not run an agent or attest human review.
4. Review the diff before accepting the final claim.
5. Run build, full tests, and focused exact-limit/over-limit behavior tests.
6. Classify any failure as planning, protocol, policy, implementation, verification, reporting, or infrastructure.
7. Decide to keep, amend, or discard the isolated change.

**Five-minute checkpoint:** the team has mapped the feature across schema, dispatch, envelope, trace, and tests before allowing an edit.

## Acceptance criteria

- Diff is narrow, contains no generated output/secrets, and is human reviewed.
- Existing and new deterministic tests pass.
- Escape/symlink safety behavior remains green.
- Final report cites the latest build and focused test evidence.

## Hints

1. Conceptual: a new tool is a vertical slice, not one C++ function.
2. Location: definitions and `list_files` in `tool_dispatcher.cpp`; tests in `tests/test_main.cpp`.
3. Near-solution: detect truncation only when an additional eligible file exists beyond the maximum.

## Stretch

Require the agent to produce a structured change summary with requirement-to-test mapping, then verify every claim against the trace.
