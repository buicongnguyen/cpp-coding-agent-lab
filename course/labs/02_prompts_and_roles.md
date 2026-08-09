# Lab 2 — Run a controlled prompt experiment

Last verified: 2026-08-09 | Time: 25 minutes | Start: `checkpoints/02_prompt_lab`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 02_prompt_lab starter`; work only in the generated `course/run/checkpoints/02_prompt_lab/starter` copy.

Configure that copy with `cmake -S . -B build` and build with `cmake --build build --config Debug`. Chapter 2 uses a static prompt gate because the progressive agent loop is not implemented yet.

## Goal and constraints

Create a concise five-block system instruction and measure observable behavior while changing one prompt factor at a time. Prompt wording may guide behavior but may not be treated as authorization.

## Tasks

1. Write role, objective, process, boundaries, and completion blocks in no more than 140 words.
2. Define metrics before running: read-before-write, latest test exit, tool count, rejected paths, and unsupported completion claim.
3. Implement the prompt in `src/main.cpp`, rebuild, and verify that the five blocks replace the checkpoint TODO. The Chapter 2 starter intentionally has no working agent loop yet.
4. Fill `assets/chapter_02/PROMPT_WORKSHEET.md` from the fixed cases and provenance-labeled `deterministic_outputs.json`. Compare the four authored rehearsal variants without presenting them as fresh model trials; if the instructor runs an optional live demonstration, record at least three trials for two selected variants.
5. Save the exact system/user messages and results. Do not change the task, fixture, model, or tool definitions between any live comparisons.
6. Predict the result of a path-escape proposal and explain why prompt compliance is irrelevant. Direct dispatcher proof belongs to Chapter 4, after dispatch exists.

**Five-minute checkpoint:** each learner has one measurable completion rule and one matching enforcement or trace assertion.

## Acceptance criteria

- Prompt contains all five blocks and no contradictory rule.
- Experiment table records controlled variable, provenance/mode, and observable metrics; authored rehearsal output is not labeled as a live run.
- Roles are appended in causal order.
- Report explicitly distinguishes prompt guidance from policy enforcement.

## Hints

1. Conceptual: replace adjectives such as “careful” with observable actions.
2. Location: `default_system_prompt` in the generated copy's `src/main.cpp`.
3. Near-solution: use “Do not claim success unless the latest build and requested tests succeeded” as the completion block; confirm `TODO checkpoint 02` is gone from `src/main.cpp`.

## Stretch

Implement a deterministic trace check that rejects a “completed” evaluation case whose latest test exit code is nonzero.
