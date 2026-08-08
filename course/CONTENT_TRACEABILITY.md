# Supplied-brief traceability

Reviewed: 2026-08-08 | Source: `../Info.txt`

| Supplied promise/topic | Delivered treatment | Verification artifact |
|---|---|---|
| One-day, lab-heavy C++ agent workshop | 390-minute map with 65–70% active work; nine timed labs | `Course_Chapter_Production_Plan.md`, `CURRICULUM_INDEX.md` |
| Starter API plumbing; C++17/CMake audience | Provider-neutral client, raw HTTP adapters, dependency-free course JSON, preflight | Chapter 0, `reference/`, deterministic preflight |
| Dumb-model/file-blindness problem | Secret-file and independent-history experiments; evidence/inference/action vocabulary | Chapter/lab/assessment 1 |
| System prompts change behavior | Five-block prompt, four controlled variants, observable metrics | Chapter/lab/assessment 2 |
| System/user/assistant roles | Causal typed messages plus the later API `tool` result role | Chapters 2, 4, and trace tests |
| Tool schema and calls | Definition/call/execution/result separation; strict schemas; paused raw-call demo | Chapter/lab/assessment 3 |
| Read/write/command execution and results | Workspace-confined read/write/list; symbolic configure/build/test; correlated envelopes | Chapter/lab/assessment 4 and dispatcher tests |
| Think/request/execute/observe/repeat | Bounded loop with tool/iteration/repetition/time stops and non-empty completion | Chapter/lab/assessment 5 and scripted repair |
| Turns and context | Explicit history, event accounting, usage/cost, compaction and current state APIs | Chapter/lab/assessment 6 and JSONL trace |
| Prevent agents going off the rails | Least privilege, injection/agency/output threats, isolation, approvals, evals | Chapter/lab/assessment 7 and eval cases |
| Agent modifies its own source | Isolated vertical `list_files` change, diff review, focused boundary tests, evidence ladder | Chapter/lab/assessment 8 |
| Read, write, compile, repair | Two-stage compile/behavior fixture repair | `demos/full_repair_trace.jsonl`, CTest |

## Intentional corrections

- Live OpenRouter remains supported but is optional for completion; deterministic mode prevents provider/network variability from blocking the workshop.
- “Send the entire conversation every time” is taught as this course's explicit-history implementation, with a current note on provider-managed state.
- Arbitrary `run_command(command)` is narrowed to an action enum to preserve the learning goal without teaching an unsafe shell boundary.
- `list_files` is available in the canonical solution for testing and demonstration; learners add or refine it as the self-modification vertical slice.
