# Delivery gate ledger

Last reviewed: 2026-08-10

Status vocabulary:

- `REPO_VERIFIABLE`: can be decided by checked-in tests/scripts and immutable repository evidence.
- `PASS_RELEASE`: passed for the cited release commit/run; rerun after implementation changes.
- `EXTERNAL_PENDING`: requires current provider/account/network/hardware/human evidence and is not satisfied by this repository.
- `EVENT_TIME`: intentionally checked for each delivery.
- `SKIPPED_BY_OWNER`: intentionally excluded from the finalized deterministic self-paced release; no passing claim is allowed.
- `BLOCKED`: failed evidence prevents the supported delivery mode.

Do not convert a template, synthetic fixture, CI badge, or model-generated rehearsal into external evidence.

## Repository gates

| Gate | Status | Required evidence before release |
|---|---|---|
| deterministic reference builds/tests | PASS_RELEASE | canonical 16-test suite passed on all three operating systems in [run 31340157043](https://github.com/buicongnguyen/cpp-coding-agent-lab/actions/runs/31340157043) for `5fdfb0e` |
| all nine checkpoint starters/solutions/diffs agree with canonical source | PASS_RELEASE | materializer plus 10 unique-state build/test matrix passed on Ubuntu, Windows, and macOS in the same run |
| five-case+ deterministic eval suite passes | PASS_RELEASE | E1–E7 runner passed on all three operating systems in the same run |
| mock/offline course has no package download requirement | PASS_RELEASE | deterministic materializer, builds, tests, and evals ran without a model credential; platform toolchain installation remains documented prework |
| manuscripts/slides/labs/instructor/assessments/assets agree | PASS_RELEASE | materials verifier, website content/UI checks, and production build passed in the same run |
| at least three labeled deterministic failure traces parse | PASS_RELEASE | materials verifier parsed the captured/authored provenance catalog in the same run |
| no key-shaped secret or personal absolute path in publishable artifacts | PASS_RELEASE | recursive secret/path verifier passed in the same run; exact-value checking remains mandatory for future live captures |
| Pages site builds and internal links resolve | PASS_RELEASE | [Pages run 31340157044](https://github.com/buicongnguyen/cpp-coding-agent-lab/actions/runs/31340157044) succeeded; the two new resources and their resource navigation were inspected on the deployed site |

## Two weeks before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| selected primary/fallback candidates exist and advertise tool support | SKIPPED_BY_OWNER | dated public-catalog snapshot retained for reference; live delivery is disabled and no authenticated model claim is made |
| tested fallback model works | SKIPPED_BY_OWNER | no authenticated preflight was run; fallback is not described as tested |
| account credit/rate-limit assumptions | SKIPPED_BY_OWNER | no instructor account readiness or spending claim is made |
| each supported checkpoint runs on Windows/macOS/Linux | PASS_RELEASE | release-specific run 31339259838 covers all 10 unique states and their applicable gates on all three advertised operating systems |
| current OpenRouter tool/error docs reviewed | PASS_RELEASE | 2026-08-10 review outcome and primary links are recorded in `sources/RESEARCH_INDEX.md`; public model fields are retained in the Chapter 0 snapshot |
| current conversation-state guidance reviewed | PASS_RELEASE | 2026-08-10 review outcome and primary link are recorded in `sources/RESEARCH_INDEX.md`; no manuscript correction was required |
| current OWASP guidance reviewed | SKIPPED_BY_OWNER | the primary pages throttled the 2026-08-10 sweep; the retry was waived and the failed fetch is not represented as review |
| two-person timed unfamiliar-developer pilot complete | SKIPPED_BY_OWNER | `PILOT.md` records that no pilot occurred; no pilot-tested claim is permitted |

## Two days before delivery

| Gate | Status | Owner/evidence |
|---|---|---|
| automated clean-checkout setup succeeds | PASS_RELEASE | fresh GitHub-hosted Ubuntu, Windows, and macOS runners checked out the repository, materialized checkpoints, built/tested all unique states, ran canonical preflight/CTest, and ran E1–E7 in run 31340157043 |
| unfamiliar human follows setup without author intervention | SKIPPED_BY_OWNER | human usability testing was waived; automated clean-runner evidence is not presented as human evidence |
| live-capable eval subset E1–E5 run three times on pinned model | SKIPPED_BY_OWNER | no authenticated live trials were run; deterministic E1–E7 remain the release gate |
| live-eval capture plan itself is complete and fail-closed | REPO_VERIFIABLE | `scripts/run-live-gates.ps1 -DryRun -Trials 3` must report 15 planned trials; live execution refuses a missing key/model or a non-three-trial release run |
| deterministic checkpoint fallback reaches at least Level 3 | REPO_VERIFIABLE | `demos/capstone_trace.jsonl` records automated starter materialization, hash verification/application of the checked-in instructor answer patch, isolated build, full CTest run, and sanitized provenance; it does not record model generation or human review |
| live/provider example captured and redacted | SKIPPED_BY_OWNER | pending template retained; no live capture or reviewer claim |
| fallback credentials validated/rotated | SKIPPED_BY_OWNER | live mode disabled; no credential exists in the repository |
| fixtures reset and local demo/checkpoint archives ready | SKIPPED_BY_OWNER | no scheduled classroom delivery is included in this release |

## Immediately before class

| Gate | Status | Owner/evidence |
|---|---|---|
| classroom-network preflight | SKIPPED_BY_OWNER | no classroom event supplied; no network-readiness claim |
| provider status/model availability | SKIPPED_BY_OWNER | live provider mode disabled for the finalized release |
| projector/terminal JSON readability | SKIPPED_BY_OWNER | no venue/projector supplied; no back-row-readability claim |
| local checkpoints and recorded fallbacks accessible offline | SKIPPED_BY_OWNER | event-specific offline inventory waived; published repository remains the distribution source |
| spend limit/alerts configured | SKIPPED_BY_OWNER | no live instructor account is part of this release |

## Go/no-go rule

The finalized release is the deterministic self-paced course only. It is a no-go if any repository gate fails or a supported learner platform has no evidence. Live mode, claims of a validated 390-minute workshop, and classroom-readiness claims are disabled because their gates were skipped by owner—not silently treated as passing. Reopening one of those modes requires changing its skipped gates back to active requirements and collecting the named evidence. Any suspected secret exposure or workspace escape remains a full stop until contained, rotated if applicable, corrected, and retested.
