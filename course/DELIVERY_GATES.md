# Delivery gate ledger

Last reviewed: 2026-08-10

Status vocabulary:

- `REPO_VERIFIABLE`: can be decided by checked-in tests/scripts and immutable repository evidence.
- `PASS_RELEASE`: passed for the cited release commit/run; rerun after implementation changes.
- `EXTERNAL_PENDING`: requires current provider/account/network/hardware/human evidence and is not satisfied by this repository.
- `EVENT_TIME`: intentionally checked for each delivery.
- `BLOCKED`: failed evidence prevents the supported delivery mode.

Do not convert a template, synthetic fixture, CI badge, or model-generated rehearsal into external evidence.

## Repository gates

| Gate | Status | Required evidence before release |
|---|---|---|
| deterministic reference builds/tests | PASS_RELEASE | canonical 16-test suite passed on all three operating systems in [run 31339259838](https://github.com/buicongnguyen/cpp-coding-agent-lab/actions/runs/31339259838) for `b23e9e4` |
| all nine checkpoint starters/solutions/diffs agree with canonical source | PASS_RELEASE | materializer plus 10 unique-state build/test matrix passed on Ubuntu, Windows, and macOS in the same run |
| five-case+ deterministic eval suite passes | PASS_RELEASE | E1–E7 runner passed on all three operating systems in the same run |
| mock/offline course has no package download requirement | PASS_RELEASE | deterministic materializer, builds, tests, and evals ran without a model credential; platform toolchain installation remains documented prework |
| manuscripts/slides/labs/instructor/assessments/assets agree | PASS_RELEASE | materials verifier, website content/UI checks, and production build passed in the same run |
| at least three labeled deterministic failure traces parse | PASS_RELEASE | materials verifier parsed the captured/authored provenance catalog in the same run |
| no key-shaped secret or personal absolute path in publishable artifacts | PASS_RELEASE | recursive secret/path verifier passed in the same run; exact-value checking remains mandatory for future live captures |
| Pages site builds and internal links resolve | PASS_RELEASE | [Pages run 31339259860](https://github.com/buicongnguyen/cpp-coding-agent-lab/actions/runs/31339259860) succeeded and the deployed overview → lesson → lab route was inspected |

## Two weeks before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| selected primary/fallback candidates exist and advertise tool support | EVENT_TIME | 2026-08-10 public-catalog snapshot is retained in `assets/chapter_00/model_selection_2026-08-10.json`; re-query near delivery and record the returned model from authenticated preflight |
| tested fallback model works | EXTERNAL_PENDING | redacted dated preflight/fixture run |
| account credit/rate-limit assumptions | EXTERNAL_PENDING | instructor account check; no credentials recorded |
| each supported checkpoint runs on Windows/macOS/Linux | PASS_RELEASE | release-specific run 31339259838 covers all 10 unique states and their applicable gates on all three advertised operating systems |
| current OpenRouter tool/error docs reviewed; changed responses re-recorded | EXTERNAL_PENDING | reviewer/date/source links and redacted captures |
| current conversation-state and OWASP guidance reviewed | EXTERNAL_PENDING | reviewer/date/source links and change decision |
| two-person timed unfamiliar-developer pilot complete | EXTERNAL_PENDING | completed `PILOT.md`, issue closure, signatures |

## Two days before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| clean-room student setup succeeds | EXTERNAL_PENDING | clean environment log with no author-only steps |
| live-capable eval subset E1–E5 run three times on pinned model | EXTERNAL_PENDING | 15 labeled results; E6/E7 remain deterministic harness gates; routing/model differences separated |
| live-eval capture plan itself is complete and fail-closed | REPO_VERIFIABLE | `scripts/run-live-gates.ps1 -DryRun -Trials 3` must report 15 planned trials; live execution refuses a missing key/model or a non-three-trial release run |
| deterministic checkpoint fallback reaches at least Level 3 | REPO_VERIFIABLE | `demos/capstone_trace.jsonl` records automated starter materialization, hash verification/application of the checked-in instructor answer patch, isolated build, full CTest run, and sanitized provenance; it does not record model generation or human review |
| live/provider example captured and redacted | EXTERNAL_PENDING | replacement for pending template; second-person redaction review |
| fallback credentials validated/rotated | EXTERNAL_PENDING | instructor attestation only; never store value |
| fixtures reset and local demo/checkpoint archives ready | EVENT_TIME | inventory and checksums |

## Immediately before class

| Gate | Status | Owner/evidence |
|---|---|---|
| classroom-network preflight | EVENT_TIME | timestamp, requested/returned model, result category |
| provider status/model availability | EVENT_TIME | status page/API check |
| projector/terminal JSON readability | EVENT_TIME | back-row check at actual resolution |
| local checkpoints and recorded fallbacks accessible offline | EVENT_TIME | instructor opens representative files |
| spend limit/alerts configured | EVENT_TIME | instructor account confirmation |

## Go/no-go rule

Core deterministic delivery is a no-go if any repository gate fails or a supported learner platform has no evidence. Live mode is disabled—not improvised—when its external gates fail. Any suspected secret exposure or workspace escape is a full stop until contained, rotated if applicable, corrected, and retested.
