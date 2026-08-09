# Wrap-up, exit check, and final rubric

Last reviewed: 2026-08-09 | Duration: 10 minutes

## Ten-minute exit check

Display this sequence without annotations:

```text
user -> assistant(tool call) -> tool(result) -> assistant(tool call)
     -> tool(error) -> assistant(tool call) -> tool(result) -> assistant(final)
```

### Learner timing

- Minutes 0–2: label each message’s author: user, model, harness, or tool implementation.
- Minutes 2–4: circle the actions actually executed and name the component that authorized/dispatched each.
- Minutes 4–6: connect each tool result to its assistant call ID; mark the structured error as retained evidence.
- Minutes 6–8: identify the loop decision after every response and the limit/policy that could have stopped it.
- Minutes 8–10: state whether the final text proves task success and name the additional trace evidence required.

### Required explanations / answer key

1. The user supplies the goal. The model generates assistant text and requested calls. The harness validates, authorizes, dispatches, appends results, and decides whether another model request is allowed. Ordinary local tool/process code performs permitted effects.
2. A tool request is not execution. Execution occurs only after schema and policy checks.
3. `tool_call_id` correlates each result to exactly one preceding assistant call; every executed call needs exactly one result, including failures.
4. The error remains in history because it is evidence for recovery and audit. Replacing it with cleaner prose breaks provenance.
5. The harness/loop—not the model—allows continuation based on policy, cancellation, iteration/tool/repeat/time budgets, and valid response shape.
6. A non-empty final answer is protocol completion, not proof of task success. For a repair, the evaluator needs current build/test evidence after the latest write and no policy violation.

## Final 20-point rubric

Use whole points. A score of 14+ can pass only if all minimum-standard gates below pass; points cannot compensate for a secret leak, workspace escape, or unbounded loop.

| Area | Pts | Full-credit evidence | Partial / zero distinction |
|---|---:|---|---|
| Request and history construction | 3 | roles/order preserved; assistant calls and tool results retained; state is explicit | 1–2 for minor metadata gaps; 0 if history provenance is corrupted |
| Useful, valid tool schemas | 2 | narrow descriptions, required types, no unknown fields, stable semantics | 1 if usable but ambiguous; 0 if malformed or dangerously broad |
| Argument validation and correlation | 3 | malformed/extra/wrong types rejected; every result matches one unique call | 1–2 for incomplete boundary coverage; 0 for execution before validation or unmatched results |
| Workspace and command enforcement | 3 | canonical containment; fixed symbolic actions/argv; bounded output/time; sanitized child environment | 1–2 for a missing tested edge; 0 for escape, arbitrary shell, or secret exposure |
| Bounded loop and stop handling | 3 | iteration/tool/repeat/time/cancel limits; empty/invalid response handling; honest stop reason | 1–2 for one missing tested stop; 0 for an unbounded or policy-ignoring path |
| Fixture repair with evidence | 2 | real compile failure observed; post-write build and core tests exit 0 | 1 for coherent repair without complete fresh evidence; 0 for unsupported success |
| Trace interpretation and diagnosis | 2 | learner maps calls/results, freshness, failure layer, usage, and stop | 1 for mostly correct trace; 0 for confusing model prose with execution evidence |
| Capstone diff and report | 2 | isolated focused diff, reviewed status, achieved level and limitations reported honestly | 1 for partial safe attempt; 0 for unreviewed/out-of-scope change or false claim |

Score: ____ / 20  Minimum gates: PASS / NOT YET

## Minimum course-completion gates

- [ ] Deterministic agent reads the fixture through a tool.
- [ ] It observes a real compiler failure.
- [ ] It makes only a workspace-scoped correction.
- [ ] The latest post-write fixture build and core deterministic acceptance tests pass.
- [ ] The loop stops within configured limits.
- [ ] The learner can explain every message and evidence transition in the submitted trace.

Live-provider and Level 6 capstone success are valuable extensions, not substitutes for deterministic protocol competence. A bounded, accurately diagnosed live failure does not block core completion.
