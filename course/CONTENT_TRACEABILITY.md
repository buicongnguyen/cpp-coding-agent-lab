# Supplied-brief traceability

Reviewed: 2026-08-09 | Source: `../Info.txt`

| Supplied promise/topic | Delivered treatment | Verification artifact |
|---|---|---|
| One-day, lab-heavy C++ agent workshop | 390-minute design target with nine timed labs; human pilot and measured 65–70% activity were skipped, so the workshop is retained but not release-validated | `Course_Chapter_Production_Plan.md`, `CURRICULUM_INDEX.md`, `PILOT.md` |
| Starter API plumbing; C++17/CMake audience | Provider-neutral client, raw HTTP adapters, dependency-free course JSON, preflight | Chapter 0, `reference/`, deterministic preflight |
| Dumb-model/file-blindness problem | Secret-file and independent-history experiments; evidence/inference/action vocabulary | Chapter/lab/assessment 1 |
| System prompts change behavior | Five-block prompt, four controlled variants, observable metrics | Chapter/lab/assessment 2 |
| System/user/assistant roles | Causal typed messages plus the later API `tool` result role | Chapters 2, 4, and trace tests |
| Tool schema and calls | Definition/call/execution/result separation; strict schemas; paused raw-call demo | Chapter/lab/assessment 3 |
| Read/write/command execution and results | Workspace-confined read/write; symbolic configure/build/test; correlated envelopes; listing intentionally deferred | Chapter/lab/assessment 4 and dispatcher tests |
| Think/request/execute/observe/repeat | Bounded loop with tool/iteration/repetition/time stops and non-empty completion | Chapter/lab/assessment 5 and scripted repair |
| Turns and context | Explicit history, event accounting, usage/cost, and a provenance-preserving retention/compaction policy comparison | Chapter/lab/assessment 6 and JSONL trace |
| Prevent agents going off the rails | Least privilege, injection/agency/output threats, a tested write-approval extension point, child-environment allowlisting, and executable evals; the CLI auto-allows bounded writes and full process/network isolation remains an explicit production boundary | Chapter/lab/assessment 7, dispatcher/child tests, and E1–E7 |
| Agent modifies its own source | Generated capstone starter without `list_files`, vertical answer patch, isolated apply/build/test fallback, focused boundary tests, and a separate learner human-review gate | Chapter/lab/assessment 8, checkpoint 08, and `demos/capstone_trace.jsonl`; the fallback explicitly does not evidence a model-authored change or human approval |
| Read, write, compile, repair | Two-stage compile/behavior fixture repair | `demos/full_repair_trace.jsonl`, CTest |

## Intentional corrections

- The OpenRouter adapter and guarded live runner remain as maintainer extensions, but live delivery was skipped and is not supported or verified by this release.
- “Send the entire conversation every time” is taught as this course's explicit-history implementation, with a current note on provider-managed state.
- Arbitrary `run_command(command)` is narrowed to an action enum to preserve the learning goal without teaching an unsafe shell boundary.
- The checkpoint 08 starter deliberately omits and rejects `list_files`; applying its reviewed answer patch produces the byte-identical canonical solution. The recorded deterministic capstone fallback is not presented as a live-model sample.
