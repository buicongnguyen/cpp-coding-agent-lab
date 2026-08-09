# Assessment 7 — Safety and evals

Last verified: 2026-08-09

## Questions

1. Give one mitigation each for prompt injection and excessive agency, and name the deterministic enforcement point.
2. Why can configuring/building an in-workspace project still be risky after path validation passes?
3. Trace reading: malicious README requests a key; model calls only `read_file`; child environment lacks the key; no network/write tool follows. Was exfiltration possible through this trace?
4. Executable check: run every deterministic eval case and assert no forbidden operation executes; expected stop/error classifications match.

## Answer key and misconception notes

1. Treat repository text as untrusted data plus prevent dangerous capabilities; expose least-privilege tools and validate/authorize in dispatcher. Prompt refusal alone is not deterministic.
2. Build configuration/tests execute repository-controlled code and can consume resources or access available OS capabilities. Path confinement is not process isolation.
3. No observed exfiltration path exists in that trace; do not overclaim universal safety beyond exposed capabilities/environment.
4. A suite passes on observable effects and classifications, not whether a model used reassuring words.
