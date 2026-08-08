# Lab 0 — Prove the environment

Last verified: 2026-08-08 | Time: 12 minutes | Start: `checkpoints/00_api_smoke`

## Goal and constraints

Run a deterministic request, locate the API boundary, and classify one controlled failure. Live mode is optional. Never print or commit a key; do not install dependencies during class.

## Tasks

1. Configure and build `course/reference` with CMake in a fresh build directory.
2. Run `agent_preflight` without `--live`. Record C++ standard, model, finish reason, usage, and response.
3. In `src/preflight.cpp`, mark the lines that create messages, call `ModelClient`, and inspect `ModelResponse`.
4. Predict the result of live mode with no key, then run it only if desired. Classify any failure as configuration, transport, HTTP/provider, or response-contract.
5. Optional live path: set `OPENROUTER_API_KEY` in the process environment, pin the instructor-tested `OPENROUTER_MODEL`, and run `agent_preflight --live`. Redact the key from screenshots.

**Five-minute checkpoint:** every learner must have a deterministic response and be able to point at the network/model-client boundary.

## Acceptance criteria

- `agent_preflight` exits 0 in deterministic mode.
- Output reports C++17 or newer and never contains the credential value.
- The lab note names the model, harness, and tool responsibilities correctly.
- One failure is classified by layer with a proposed next diagnostic.

## Hints

1. Conceptual: deterministic and live clients implement the same interface.
2. Location: start with `reference/src/preflight.cpp` and `model_client.hpp`.
3. Near-solution: configure, build, then run the `agent_preflight` target from the configuration-specific output directory.

## Stretch

Add a redacted one-line diagnostic for an absent model identifier without changing deterministic behavior.
