# Assessment 0 — Environment and preflight

Last verified: 2026-08-08

## Questions

1. Which component actually opens a local file after a model requests `read_file`, and where should authorization occur?
2. Why is deterministic mode a required course path even when every learner has a live API key?
3. Trace reading: HTTP returns 200, but `choices[0].message` is absent. Did preflight succeed? Name the failure layer.
4. Executable check: build and run `agent_preflight` without `--live`; assert exit 0, C++ standard ≥ 201703, a non-empty response, and no credential value in output.

## Answer key and misconception notes

1. The harness authorizes and calls local tool code; the model only proposes. “The provider runs it” confuses generated output with local execution.
2. It isolates and reproducibly tests owned protocol/orchestration behavior. “Offline is only a demo” ignores real serializer, loop, dispatch, and limit tests.
3. No; transport succeeded but response-contract validation failed. “200 means correct” ignores semantic parsing.
4. Pass only when all assertions hold. A printed key is failure even if the request succeeds; C++98 output indicates a toolchain configuration defect.
