# Lab 2 — Run a controlled prompt experiment

Last verified: 2026-08-08 | Time: 25 minutes | Start: `checkpoints/02_prompt_lab`

## Goal and constraints

Create a concise five-block system instruction and measure observable behavior while changing one prompt factor at a time. Prompt wording may guide behavior but may not be treated as authorization.

## Tasks

1. Write role, objective, process, boundaries, and completion blocks in no more than 140 words.
2. Define metrics before running: read-before-write, latest test exit, tool count, rejected paths, and unsupported completion claim.
3. Run four variants from the manuscript table against the same task/model configuration. Deterministic runs validate mechanics; if live, collect at least three trials for two selected variants.
4. Save system/user messages and results. Do not change temperature, fixture, model, or tool definitions between compared trials.
5. Invoke a path-escape dispatcher test directly and explain why prompt compliance is irrelevant to the expected rejection.

**Five-minute checkpoint:** each learner has one measurable completion rule and one matching enforcement or trace assertion.

## Acceptance criteria

- Prompt contains all five blocks and no contradictory rule.
- Experiment table records controlled variable, model/mode, and observable metrics.
- Roles are appended in causal order.
- Report explicitly distinguishes prompt guidance from policy enforcement.

## Hints

1. Conceptual: replace adjectives such as “careful” with observable actions.
2. Location: `default_system_prompt` in `reference/src/main.cpp`.
3. Near-solution: use “Do not claim success unless the latest build and requested tests succeeded” as the completion block.

## Stretch

Implement a deterministic trace check that rejects a “completed” evaluation case whose latest test exit code is nonzero.
