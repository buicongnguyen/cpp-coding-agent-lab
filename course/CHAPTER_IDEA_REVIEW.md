# Main-idea clarity and web-research review

Reviewed: 2026-08-09
Scope: all nine chapter manuscripts in `course/chapters/`

## Review method

Each main idea was checked for four qualities:

1. **Definition:** can a learner restate the idea without relying on a metaphor?
2. **Boundary:** does the text say what the idea does *not* guarantee?
3. **Mechanism:** does it show the message, state transition, C++ boundary, or evidence flow that makes the idea real?
4. **Verification:** is there an observable test, trace property, or review question?

Current claims were compared with primary provider, standards, security, toolchain, and research documentation. Every manuscript now opens with a learner-facing `What you'll learn and prove` table and contains a worked clarification tied to its existing lab.

## Chapter 0 — Environment, mental model, and preflight

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Model/harness/tool architecture | Responsibilities were correct but introduced only as prose. | Added an explicit responsibility map and network/authority boundary dependency. | Learner points to client, loop/policy, and local tool lines. |
| Deterministic versus live | Offline mode could still sound like a reduced simulation. | Explained that it proves owned protocol/policy behavior while live adds service/model variables. | Both clients satisfy the same `ModelClient` interface. |
| API boundary | HTTP status, JSON parsing, and semantic success were compressed together. | Added five layers: transport, HTTP, syntax, contract, application meaning. | Learner classifies a controlled failure at one layer. |
| Integration choice | Direct HTTP was justified only by course simplicity. | Compared current direct API, client SDK, and Agent SDK options and stated the pedagogical tradeoff. | Learner can explain when an SDK is the better product choice. |
| Model/secret handling | Selection and redaction advice lacked an exact procedure. | Added capability filtering, run metadata, and synthetic-canary secret testing. | Trace/output scan contains no canary value. |

Primary basis: [OpenRouter quickstart](https://openrouter.ai/docs/quickstart), [Models API](https://openrouter.ai/docs/guides/overview/models), and [error handling](https://openrouter.ai/docs/api/reference/errors-and-debugging).

## Chapter 1 — The model observation boundary

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| File blindness | The secret-file experiment was strong but could be interpreted as a model-intelligence test. | Reframed the central question as what context was available at generation time. | Outgoing request is searched for the nonce. |
| Evidence versus inference | The labels lacked a repeatable review procedure. | Added provenance, freshness, completeness, and falsifiability questions. | Every key diagnosis claim points to an event and a possible verifier. |
| State | “Stateless” risked sounding universal. | Compared explicit replay, previous-response chaining, and durable conversations. | Learner names who stores/references state in each pattern. |
| Hallucination | A refusal/guess comparison could invite overgeneralized model claims. | Added a response-interpretation table and cautious research framing. | Conclusion is limited to request bytes and observed response. |
| History integrity | Correlation was present but ownership/immutability was implicit. | Added immutable raw-trace evidence and labeled derived-summary rules. | Raw call/result remains available after any proposed active-context compaction. |

Primary basis: [OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state), [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), and the [2026 Nature study](https://www.nature.com/articles/s41586-026-10549-w).

## Chapter 2 — Instructions and message roles

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Roles | Roles were listed but the purpose of provenance was not stated first. | Defined roles as source/function labels whose causal order preserves evidence. | Serialized history is `system/user/assistant/tool` in causal order. |
| System prompt | Five blocks were abstract. | Added a complete concise course prompt with every sentence mapped to a scorecard item. | Reviewer can trace each instruction to a metric or boundary. |
| Prompt experiments | Repetition guidance did not state how to report small samples. | Added count-based reporting and separation of fallback/provider trials. | Results say `n/N`, model, config, and controlled variable. |
| Prompt versus policy | The distinction was correct but distributed across sections. | Added a concern/prompt contribution/deterministic control matrix. | Forbidden direct dispatcher input fails without the prompt. |
| Prompt length | “Keep it short” lacked current evidence and caveat. | Added current lean-prompt guidance as a hypothesis requiring local evals. | One instruction group is removed and the same evals rerun. |

Primary basis: [OpenRouter message formats](https://openrouter.ai/docs/agent-sdk/call-model/message-formats) and [official OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).

## Chapter 3 — Tool definitions and calls

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Four objects | The distinctions were correct but lacked a chapter-level dependency map. | Added the `describe → receive → inspect` spine before side effects. | File metadata remains unchanged at the paused checkpoint. |
| Schema | Keyword explanations did not clearly show duplicated local checks. | Added schema-versus-application responsibility matrix. | Local parser rejects malformed shape even without provider strictness. |
| Strict generation | Current strict-mode requirements were absent. | Explained current provider-specific strict requirements and local validation invariance. | Schema has required fields and no additional properties. |
| Wire parsing | Two-layer JSON argument encoding was described but not shown. | Added assistant wire JSON and adapter conversion walkthrough. | Malformed inner argument JSON reaches no dispatcher action. |
| Tool choice/parallelism | Parallelism was called complex without an effect model. | Added read/write dependency examples and actual execution-order requirements. | Multiple calls keep unique IDs and deterministic result order. |

Primary basis: [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), [OpenAI function calling and strict mode](https://developers.openai.com/api/docs/guides/function-calling), and [JSON Schema objects](https://json-schema.org/understanding-json-schema/reference/object).

## Chapter 4 — Execution and result messages

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Dispatch stages | Stages existed but their side-effect boundary was implicit. | Added stage inputs/outcomes and exact implementation error codes. | Rejected call fails before open/write/process creation. |
| Least capability | The action enum was explained mainly as shell-injection prevention. | Connected it to effect classes and omission of unnecessary capability. | Unknown action cannot select a new executable. |
| Path confinement | Text overclaimed generic symlink refusal and omitted race limits. | Clarified canonical escape rejection, listing behavior, component comparison, and TOCTOU limit. | Absolute/traversal/symlink-mediated escape tests fail. |
| Process execution | Direct exec could be mistaken for a sandbox. | Split invocation safety from workload isolation and linked platform behavior. | No shell syntax; untrusted builds still require separate containment. |
| Result semantics | `ok:true` plus exit 1 was explained but truncation implications were not. | Added evidence interpretation for exit, timeout, and truncation fields. | Reviewer avoids claiming unseen output content. |
| Authorization/approval | Approval callback was abstract. | Added effect-class table and normalized action preview rule. | Approved parameters equal executed parameters. |

Primary basis: [OWASP Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), [OWASP Improper Output Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), [CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw), and current tool-calling documentation.

## Chapter 5 — The agent loop

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Feedback | Loop pseudocode was clear but “agentic” remained informal. | Defined the loop as a bounded state transition system with authoritative feedback. | Every next decision follows correlated results. |
| Invariants | Invariants were listed without explicit transitions. | Added state/event/next-state table. | No terminal state requests another model response. |
| Limits | Limits lacked a one-purpose-per-limit explanation. | Explained iteration, tool, repetition, child-process, wall-time, and cancellation separately. | Stop event names the exact exhausted budget. |
| Recovery | Provider/tool failures were distinguished but retry uncertainty was not. | Added a failure-point, side-effect-possibility, safe-default table. | Completed writes are never blindly replayed. |
| Success | Completion versus task success relied on prose. | Added a trace predicate requiring current post-write build/test evidence. | Removing the last pass makes the rubric fail. |
| SDK comparison | Current higher-level orchestration was mentioned only generally. | Added an SDK adoption checklist for state, validation, limits, cancellation, and trace visibility. | Integration tests cover hidden orchestration boundaries. |

Primary basis: [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), [OpenRouter errors](https://openrouter.ai/docs/api/reference/errors-and-debugging), and [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Chapter 6 — Context, tokens, and cost

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Turns/events | The term was criticized but the replacement ontology was not summarized. | Added distinct task/request/message/call/result units. | Counts reconcile with JSONL and `LoopResult`. |
| Context growth | Repetition was described without a compact model. | Added an input composition formula and cumulative-input explanation. | Per-request message/token growth is tabulated. |
| Retention | Keep/drop guidance needed concrete examples. | Added active-context/raw-trace decision table and provenance-preserving summary. | Latest verifier remains exact and fresh. |
| Stateful APIs | State patterns were named but retention/billing questions were not operationalized. | Added a storage/access/deletion/correlation/context/billing checklist. | Provider behavior is recorded, not assumed. |
| Usage/caching | Cost advice lacked category and cache-miss semantics. | Added token categories, unknown handling, generation-ID accounting, and cache-as-optimization rule. | Totals do not double count; missing usage is unknown. |
| Trace accuracy | Manuscript claimed a run-start event not emitted by the implementation. | Corrected the event inventory to match the executable trace. | First current event is `model_request`; terminal event is `final` or `stop`. |

Primary basis: [OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state), [OpenRouter usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting), [message transforms](https://openrouter.ai/docs/guides/features/message-transforms), and [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

## Chapter 7 — Safety, observability, and evals

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Threat model | Threats and controls were listed without threat/vulnerability/failure distinction. | Added precise vocabulary and remediation implications. | Finding names cause, weakness, observed event, and impact. |
| Excessive agency | Least privilege was present but its three dimensions were implicit. | Separated excessive functionality, permissions, and autonomy. | Controls address each dimension independently. |
| Output handling | Shell example dominated. | Added HTML, SQL, URL, and filesystem interpreter boundaries. | Output is validated/encoded for its destination context. |
| Isolation/approval | Good controls needed a sharper guarantee statement. | Reaffirmed workspace confinement is not process isolation, added exact write approval and a child-environment allowlist, and kept network isolation as a separate deployment control. | Sentinel parent secrets are absent in child tests; any network-isolation claim requires separate sandbox evidence. |
| Evaluation | Three test categories lacked a standardized case schema. | Added eval record fields, positive controls, and human calibration. | A reject-everything implementation fails allowed cases. |
| Current practice | “Evals, not vibes” lacked direct current-method support. | Added eval-driven, task-specific, logged, automated, human-calibrated guidance. | Deterministic policy tests precede prompt tuning. |

Primary basis: [OWASP Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), [OWASP Improper Output Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), [OpenAI eval best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), and [OpenRouter logging](https://openrouter.ai/docs/guides/features/input-output-logging).

## Chapter 8 — Self-modification capstone

| Main idea | Issue found | Revision made | Observable check |
|---|---|---|---|
| Meaning | Runtime/source distinction was clear but not tied to the whole course. | Framed capstone as governance of proposal-to-later-build chain. | Running binary and rebuilt artifact are identified separately. |
| Contract | Protocol list lacked one concise statement of scope and non-goals. | Added a ready-to-use capstone contract with evidence and stop conditions. | Reviewer can classify scope drift before execution. |
| Worktree isolation | Text could imply a worktree is a security sandbox. | Clarified shared Git/OS authority and when to use copy/container isolation. | Baseline identity and execution containment are recorded separately. |
| Vertical slice | Layer list was correct but review evidence was implicit. | Connected requirement to schema, dispatch, envelope, trace, and focused test map. | No advertised but unimplemented capability remains. |
| Listing determinism | Text overclaimed that sorting removes traversal-order effects above the limit. | Clarified sorted returned subset versus globally deterministic selection. | Exact `N` and `N+1` tests make only promised assertions. |
| Evidence/review | Diff ladder omitted untracked/mode/stale-build concerns. | Added baseline-specific diff forms, status checks, and same-workspace verifier rule. | Accepted evidence all follows the latest edit in the reviewed workspace. |

Primary basis: [Git worktree](https://git-scm.com/docs/git-worktree.html), [Git diff](https://git-scm.com/docs/git-diff), [CTest](https://cmake.org/cmake/help/latest/manual/ctest.1.html), and the [OWASP agentic applications guide](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/).

## Cross-chapter result

The revised progression is now explicit:

```text
0 boundary and environment
  → 1 observation and evidence
  → 2 instructions and roles
  → 3 capability contracts
  → 4 authorized effects
  → 5 bounded feedback
  → 6 finite context and accounting
  → 7 system controls and evaluation
  → 8 isolated, reviewed self-change
```

No chapter now depends on “the model behaves well” as a safety or success condition. Model behavior is measured; capability, authorization, limits, correlation, and deterministic verification are enforced by the harness and its environment.
