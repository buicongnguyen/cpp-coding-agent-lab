# Lab 0 — Prove the environment

Last verified: 2026-08-09 | Time: 12 minutes | Start: `checkpoints/00_api_smoke`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 00_api_smoke starter`; work only in the generated `course/run/checkpoints/00_api_smoke/starter` copy.

## Goal and constraints

Run a deterministic request, locate the API boundary, and classify one controlled failure. Live mode is optional. Never print or commit a key; do not install dependencies during class.

## Tasks

1. From the materialized starter directory, run `cmake -S . -B build` and `cmake --build build --config Debug --target agent_preflight`.
2. Run `ctest --test-dir build -C Debug -R ^checkpoint-00-preflight$ --output-on-failure`. For the same interactive output, run `build/agent_preflight` or the generator-specific path described in Hint 3. Record C++ standard, model, finish reason, usage, and response.
3. In `src/preflight.cpp`, mark the lines that create messages, call `ModelClient`, and inspect `ModelResponse`.
4. Predict the result of live mode with no key, then run it only if desired. Classify any failure as configuration, transport, HTTP/provider, or response-contract.
5. Optional live path: set `OPENROUTER_API_KEY` in the process environment, pin the instructor-tested `OPENROUTER_MODEL`, and add `--live` to the same generator-specific executable path. Redact the key from screenshots.

**Five-minute checkpoint:** every learner must have a deterministic response and be able to point at the network/model-client boundary.

## Acceptance criteria

- `agent_preflight` exits 0 in deterministic mode.
- Output reports C++17 or newer and never contains the credential value.
- The lab note names the model, harness, and tool responsibilities correctly.
- One failure is classified by layer with a proposed next diagnostic.

## Hints

1. Conceptual: deterministic and live clients implement the same interface.
2. Location: start with `src/preflight.cpp` and `include/course_agent/model_client.hpp` in the generated copy.
3. Near-solution: run `ctest --test-dir build -C Debug -R ^checkpoint-00-preflight$ --output-on-failure`; for an interactive run, use `build/agent_preflight` (single-config) or `build/Debug/agent_preflight` (multi-config; add `.exe` in PowerShell).

## Stretch

Add a redacted one-line diagnostic for an absent model identifier without changing deterministic behavior.
