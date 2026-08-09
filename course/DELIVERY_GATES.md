# Delivery gate ledger

Last reviewed: 2026-08-10

Status vocabulary:

- `REPO_VERIFIABLE`: can be decided by checked-in tests/scripts and immutable repository evidence.
- `EXTERNAL_PENDING`: requires current provider/account/network/hardware/human evidence and is not satisfied by this repository.
- `EVENT_TIME`: intentionally checked for each delivery.
- `BLOCKED`: failed evidence prevents the supported delivery mode.

Do not convert a template, synthetic fixture, CI badge, or model-generated rehearsal into external evidence.

## Repository gates

| Gate | Status | Required evidence before release |
|---|---|---|
| deterministic reference builds/tests | REPO_VERIFIABLE | clean configure/build/CTest log |
| all nine checkpoint starters/solutions/diffs agree with canonical source | REPO_VERIFIABLE | materializer/verifier report for every checkpoint |
| five-case+ deterministic eval suite passes | REPO_VERIFIABLE | evaluator output tied to case IDs |
| mock/offline course has no package download requirement | REPO_VERIFIABLE | clean-room dependency audit |
| manuscripts/slides/labs/instructor/assessments/assets agree | REPO_VERIFIABLE | materials verifier plus completion matrix review |
| at least three labeled deterministic failure traces parse | REPO_VERIFIABLE | JSONL parse and provenance checks |
| no key-shaped secret or personal absolute path in publishable artifacts | REPO_VERIFIABLE | secret/path scan reviewed for false positives |
| Pages site builds and internal links resolve | REPO_VERIFIABLE | production build/link check |

## Two weeks before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| pinned model still exists and advertises tool support | EXTERNAL_PENDING | dated Models API response and returned model |
| tested fallback model works | EXTERNAL_PENDING | redacted dated preflight/fixture run |
| account credit/rate-limit assumptions | EXTERNAL_PENDING | instructor account check; no credentials recorded |
| each supported checkpoint runs on Windows/macOS/Linux | EXTERNAL_PENDING | release-specific CI or hardware logs for all advertised platforms |
| current OpenRouter tool/error docs reviewed; changed responses re-recorded | EXTERNAL_PENDING | reviewer/date/source links and redacted captures |
| current conversation-state and OWASP guidance reviewed | EXTERNAL_PENDING | reviewer/date/source links and change decision |
| two-person timed unfamiliar-developer pilot complete | EXTERNAL_PENDING | completed `PILOT.md`, issue closure, signatures |

## Two days before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| clean-room student setup succeeds | EXTERNAL_PENDING | clean environment log with no author-only steps |
| live-capable eval subset E1–E5 run three times on pinned model | EXTERNAL_PENDING | 15 labeled results; E6/E7 remain deterministic harness gates; routing/model differences separated |
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
