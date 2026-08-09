# Course production-plan completion matrix

Audit date: 2026-08-10
Authoritative plan: `../Course_Chapter_Production_Plan.md`
Source brief: `../Info.txt`

This ledger separates files that exist from evidence that an execution or external event occurred. Update it only from cited artifacts/logs; a template or authored fixture is not a captured run.

## Status meanings

- `COMPLETE_REPO`: the authorable artifact exists and can be reviewed in the repository.
- `REPO_VERIFY_PENDING`: implementation/evidence exists or is being integrated, but the full verifier must pass before calling it complete.
- `CONTENT_GAP`: a stated repository deliverable is not yet at the plan target.
- `EXTERNAL_PENDING`: requires current credentials, provider/account/network/platform, hardware, or independent humans.
- `EVENT_TIME`: intentionally repeated shortly before each delivery.

## Course design and package standard

| Plan requirement | Status | Evidence / exact remaining proof |
|---|---|---|
| one intensive day, 390 instructional minutes | COMPLETE_REPO | plan schedule and nine instructor guides plus `WRAP_UP.md` |
| approximately 65–70% active learning | EXTERNAL_PENDING | activity is designed into labs/checkpoints; actual ratio must be timed in the two-person pilot (`PILOT.md`) |
| experienced C++ audience; C++17/CMake/JSON prework | COMPLETE_REPO | plan audience and `assets/chapter_00/SETUP.md` |
| deterministic core and optional live mode behind one model-client interface | COMPLETE_REPO | `reference/include/course_agent/model_client.hpp`, scripted and OpenRouter implementations |
| raw HTTP/JSON teaching boundary; streaming deferred | COMPLETE_REPO | Chapters 0/3, provider adapter, chapter wire fixtures |
| one small fixture reused through the day | COMPLETE_REPO | `fixture/buggy_calculator` and labs |
| nine manuscript packages | COMPLETE_REPO | `chapters/00_*.md` through `08_*.md` |
| manuscript word targets | COMPLETE_REPO | measured whitespace counts: Ch0 1,730/1,000; Ch1 2,206/1,500; Ch2 2,037/1,800; Ch3 2,072/2,000; Ch4 2,629/2,500; Ch5 2,644/2,500; Ch6 1,879/1,200; Ch7 2,035/2,000; Ch8 2,029/2,000. The plan now states these as minimum self-paced baselines and uses the website's workshop view to time-box live delivery. |
| 6–10 slides per chapter with planned exact counts | COMPLETE_REPO | `slides/Coding_Agent_Workshop.pptx` has the exact 6,8,8,8,10,10,6,8,6 allocation (70 total), 70 sourced notes pages, a passing overflow scan, and a reviewed full-deck montage; `build_deck.mjs` retains maintainer generation provenance and `slides/README.md` states its Codex-runtime dependency |
| 5–10 minute scripted demos with exact prompt, expected branches, fallback, recovery | COMPLETE_REPO | nine `instructor/*.md` guides and `demos/chapter_fixtures/` fallbacks |
| raw request/response JSON for every chapter demo | COMPLETE_REPO | `demos/chapter_fixtures/00_*.json` through `08_*.json`; all are explicitly authored deterministic fixtures |
| learner lab: goal/start/constraints/acceptance/three hints/five-minute checkpoint/stretch | COMPLETE_REPO | nine `labs/*.md` files |
| per-chapter assessment: two concepts, trace item, executable check, misconception notes | COMPLETE_REPO | nine `assessments/*.md` files |
| maintenance/research block with primary sources | COMPLETE_REPO | manuscript maintenance notes and `sources/RESEARCH_INDEX.md`; delivery-date recheck remains external below |
| one artifact feeds the next chapter | COMPLETE_REPO | `LEARNER_PATH.md`, lab deliverables, checkpoint sequence |

## Canonical code, checkpoints, and evaluation

| Plan requirement | Status | Evidence / exact remaining proof |
|---|---|---|
| canonical C++ reference implementation | COMPLETE_REPO | clean Windows Ninja configure/build plus all 16 named CTest tests passed; the CI matrix repeats the canonical build/test on Ubuntu, Windows, and macOS |
| starter code, instructor solution, answer diff, previous-checkpoint diff for nine checkpoints | COMPLETE_REPO | all nine `checkpoint.json`, `answer.patch`, and `from_previous.patch` artifacts pass the materializer's integrity/patch checks; all 18 variants materialize deterministically |
| checkpoints generated from canonical source rather than hand-maintained copies | COMPLETE_REPO | `scripts/checkpoints.mjs check` proves starter/solution chain identity, portable hashes, and final solution equality; all 10 unique states built locally on Windows |
| deterministic fixture compile and behavioral repair | COMPLETE_REPO | freshly isolated `full_repair_trace.jsonl` records compile failure/fix, behavioral failure/fix, clean-first rebuild, and passing test |
| executable evaluation suite | COMPLETE_REPO | E1–E7 map to named CTest labels, all passed, and `evals/deterministic_baseline_report.json` is a sanitized captured report rather than a manifest-only claim |
| optional live OpenRouter client | COMPLETE_REPO | adapter/HTTP code compiles behind the same `ModelClient` interface; actual provider behavior remains explicitly external below |
| provider-neutral message/tool/result envelope | COMPLETE_REPO | final types/dispatcher tests cover malformed/duplicate IDs, non-object arguments, strict schemas, correlation, and boundary cases |
| bounded sequential loop, cancellation, repeat/tool/iteration/time stops | COMPLETE_REPO | named deterministic tests cover iteration/tool/repetition/wall/cancellation/protocol/model/evidence stops |
| usage, elapsed time, call/result/stop traces | COMPLETE_REPO | refreshed JSONL captures and trace tests validate run ID, time, model/finish metadata, authorization, correlation, usage, and stop/final events |
| successful deterministic compile/test repair trace | COMPLETE_REPO | `demos/full_repair_trace.jsonl` |
| at least three distinct deterministic failure traces | COMPLETE_REPO | executable captures `repeated_read_trace.jsonl`, `empty_final_trace.jsonl`; authored boundary fixtures `path_escape_failure_trace.jsonl`, `malformed_arguments_failure_trace.jsonl`, `false_success_failure_trace.jsonl`; provenance is explicit |
| deterministic `list_files` checkpoint fallback | COMPLETE_REPO | `demos/capstone_trace.jsonl` records automated starter materialization, absence check, checked-in instructor answer-patch hash/application, isolated configure/build/full CTest, and sanitized paths; it records neither model-generated code nor human review |
| live example capture | EXTERNAL_PENDING | `demos/live_provider_trace_template.jsonl` is only a redacted schema; actual dated provider run required |

## Chapter-specific production assets

| Chapter | Required artifact/outcome | Status | Evidence / remaining proof |
|---:|---|---|---|
| 0 | cross-platform setup guide | COMPLETE_REPO | `assets/chapter_00/SETUP.md` |
| 0 | five-minute deterministic preflight and mock mode | COMPLETE_REPO | clean final build printed compiler, CMake, C++ standard, cwd, mode/key state, tool count, model, finish reason, usage, elapsed time, and deterministic response |
| 0 | sanitized response and HTTP-status troubleshooting | COMPLETE_REPO | `assets/chapter_00/sanitized_response.json`, `TROUBLESHOOTING.md` |
| 0 | current pinned/fallback tool-capable models | EXTERNAL_PENDING | no model is claimed by the synthetic placeholder; dated API/provider check required |
| 1 | secret-file/stateless history experiment deliverable | COMPLETE_REPO | `assets/chapter_01/EXPERIMENT_REPORT.md`, Chapter 1 demo fixture |
| 2 | worksheet, four prompts, fixed cases | COMPLETE_REPO | `assets/chapter_02/` |
| 2 | instructor examples from the actual pinned model | EXTERNAL_PENDING | deterministic examples are labeled rehearsal data; three+ live trials must record model/settings/date |
| 3 | raw tool-call response without execution | COMPLETE_REPO | `demos/chapter_fixtures/03_tool_definition.json` |
| 4 | Windows/POSIX path cases, command policy, fake calls, transcript worksheet | COMPLETE_REPO | `assets/chapter_04/` |
| 4 | direct dispatcher enforcement of every path/size/action case | COMPLETE_REPO | final named tests passed relative/absolute/symlink escape, missing/binary/size/write approval, action, environment, and no-side-effect assertions |
| 5 | autonomous compile-error repair and pathology evidence | COMPLETE_REPO | `full_repair_trace.jsonl`, repeated/empty/false-success traces |
| 6 | message/token/usage growth evidence | COMPLETE_REPO | full repair trace and `demos/chapter_fixtures/06_context_cost.json`; live price/accounting values remain delivery-date data |
| 7 | threat-to-control matrix and injected repository fixture | COMPLETE_REPO | `assets/chapter_07/` |
| 7 | E1–E7 run and a before/after learner comparison path | COMPLETE_REPO | executable cases, `evals/deterministic_baseline_report.json`, and the red-team worksheet provide the stable baseline; each learner records one controlled change rather than the course fabricating a universal “improvement” |
| 8 | isolation contract/checklist, recovery runbook, diff/review/retrospective | COMPLETE_REPO | `assets/chapter_08/` |
| 8 | isolated deterministic checkpoint fallback reaches at least Level 3 | COMPLETE_REPO | `demos/capstone_trace.jsonl` records automated application of the checked-in instructor answer patch through a passing full suite (Level 5); this proves the prepared fallback, not agent self-modification or a reviewer decision |
| 8 | pinned live-model agent-generated capstone example | EXTERNAL_PENDING | requires credentials, selected current model, clean baseline, human diff approval, and redacted capture; deterministic course completion does not depend on it |

## Wrap-up and learner assessment

| Plan requirement | Status | Evidence / exact remaining proof |
|---|---|---|
| ten-minute sequence annotation exit check | COMPLETE_REPO | `WRAP_UP.md` includes timing and answer key |
| detailed 20-point rubric | COMPLETE_REPO | `WRAP_UP.md` includes full/partial/zero evidence and safety gates |
| deterministic minimum-completion standard | COMPLETE_REPO | `WRAP_UP.md` gates match plan §5 |
| website exposes learner path, missions, evidence steps, trace viewer, and resources | COMPLETE_REPO | production generation/content/UI/Vite checks pass; browser QA covered workshop/self-paced depth, attested progress, ordered continuation, internal routing, console errors, and mobile navigation |

## Human, live-provider, platform, and delivery evidence

| Plan requirement | Status | Evidence / exact remaining proof |
|---|---|---|
| timed pilot with two experienced C++ developers unfamiliar with repository | EXTERNAL_PENDING | `PILOT.md` is explicitly unexecuted; requires two real participants and issue closure |
| clean-room learner setup | EXTERNAL_PENDING | run from the published setup on a clean supported machine/image |
| Windows, macOS, Linux checkpoint runs | EXTERNAL_PENDING | CI can support evidence, but release-specific logs must cover every advertised platform/checkpoint |
| pinned live eval subset E1–E5: three trials each | EXTERNAL_PENDING | 15 labeled live results with requested/returned model and routing differences; E6/E7 remain deterministic harness gates |
| account credit/rate limits, fallback credentials, spend controls | EVENT_TIME | instructor-only account checks; never store credential values |
| current provider model/tool/error behavior and response format | EVENT_TIME | dated primary-source/API review and re-capture when changed |
| current conversation-state and OWASP guidance | EVENT_TIME | dated source review with change/no-change decision |
| classroom network/provider status/projector readability | EVENT_TIME | immediately-before-class checks in `DELIVERY_GATES.md` |
| local offline archives/reset fixture copies | EVENT_TIME | instructor inventory/checksums and reset confirmation |

## Honest completion rule

The repository-authoring phase is complete only when all `CONTENT_GAP` rows are closed and all `REPO_VERIFY_PENDING` rows have passing, retained verifier output. The course can be released as a deterministic self-paced package while `EXTERNAL_PENDING` live-mode gates are clearly disabled, but it cannot claim “pilot-tested,” “live-verified,” or “ready for this classroom event” until the corresponding external evidence exists. See `DELIVERY_GATES.md` for go/no-go decisions.
