# Demonstration and trace catalog

Last reviewed: 2026-08-10

Every artifact declares its provenance. `captured_reference` means the tested local executable emitted the events. `authored_deterministic_fixture` means stable teaching JSON written to exercise a boundary; it is not evidence that a provider or executable produced that exact prose. `pending` is a capture schema only.

## Reference-executable captures

| File | Provenance | Outcome |
|---|---|---|
| `full_repair_trace.jsonl` | captured reference executable | compile failure, repair, test failure, second repair, passing verification |
| `repeated_read_trace.jsonl` | captured reference executable | repeated identical-call limit stops the run |
| `empty_final_trace.jsonl` | captured reference executable, `empty-final` scenario | empty assistant final is rejected |
| `capstone_trace.jsonl` | captured deterministic checkpoint fallback | automatically materialize the starter, verify/apply the checked-in instructor answer patch, build, and pass the full suite in isolation; no model generation or human review is captured |

The first three were last regenerated 2026-08-10 from a current clean build of the canonical reference executable after the full CTest suite passed. Regenerate after implementation/fixture changes. Use a fresh disposable copy of `fixture/buggy_calculator` for any write-capable scenario. Trace details replace the selected root with `<WORKSPACE>`; each executable capture retains one run ID and timestamp sequence without a personal path.

For `tool_result` events, read `authorization` separately from `status`: `allowed` means the effect crossed the policy boundary even when the observed program later failed, `rejected` is an explicit approval denial or missing required approval, and `not_evaluated` means schema or boundary validation stopped the request before an authorization decision. `status` reports whether the tool envelope itself succeeded; a permitted build may therefore have `authorization: allowed`, `status: ok`, and a nonzero process exit code in `detail`.

## Authored deterministic failure fixtures

| File | Failure under study | Pass condition |
|---|---|---|
| `path_escape_failure_trace.jsonl` | parent traversal proposal | dispatcher returns `path_outside_workspace`; no read occurs |
| `malformed_arguments_failure_trace.jsonl` | wrong JSON argument type | validator returns `invalid_arguments`; process continues safely |
| `false_success_failure_trace.jsonl` | final prose contradicts latest test evidence | evaluator rejects task success despite protocol completion |

These three files contain a metadata record with `provenance: authored_deterministic_fixture`. Along with the executable-captured repeated-call and empty-final traces, they provide more than three distinct failure paths without presenting synthetic content as a live recording.

## Per-chapter request/response fixtures

`chapter_fixtures/00_*.json` through `08_*.json` preserve the exact teaching shape for each instructor demonstration. They are stable, synthetic fallbacks; Chapter 3 intentionally stops before execution. The Chapter 8 fixture teaches the proposed isolation/review workflow. Separately, `capstone_trace.jsonl` records an automated checkpoint fallback using the already-authored, checked-in answer patch; it is not evidence of live-agent self-modification or a real reviewer decision.

## Live and recapture templates

- `live_provider_trace_template.jsonl` specifies the redacted metadata and event fields for an actual live run. It contains no provider result and does not satisfy the live-run delivery gate.
- `capstone_trace_template.jsonl` preserves the required schema for a future recapture. The current repository evidence is the separately named `capstone_trace.jsonl`.

Never put credentials, real personal paths, or proprietary repositories into shared traces. Retain raw unredacted provider data only under the organization’s approved access and retention policy.
