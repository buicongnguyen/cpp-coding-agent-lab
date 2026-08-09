# Chapter 6 — Turns, context, tokens, and cost

Last verified: 2026-08-09
Class time: 30 minutes  
Checkpoint: `06_trace_and_limits`

## What you'll learn and prove

| Main idea | Clearest formulation | Measurement |
|---|---|---|
| Event counting | A visible task, model request, assistant message, and tool call are different units. | Count structured trace events. |
| Context growth | Explicit history causes earlier content and tool definitions to reappear in later inputs. | Track message and input-token counts per request. |
| State transport | History may be resent, chained by response ID, or stored in a durable conversation. | Record which mechanism and retention rules apply. |
| Retention and compaction | Keep authoritative current facts; summarize superseded bulk; retain raw audit evidence separately. | Identify freshness and loss for every summary. |
| Cost and latency | Accumulate provider-reported usage and separate model time from tool time. | Reconcile per-call and run totals. |
| Privacy | Prompts, cached prefixes, stored conversations, and local traces all have data lifecycles. | Document storage, access, redaction, and deletion. |

The chapter replaces the vague word *turn* with an event ledger. Once each event has a type, timestamp, usage record, and evidence role, context and cost become engineering quantities instead of intuition.

## The failure: “three turns” produced eleven requests

People use *turn* loosely. A user may see one task and one final answer while the harness makes eleven model calls and ten tool executions. For engineering and billing, count concrete events:

- user-visible tasks;
- model API calls;
- assistant messages;
- tool calls/results;
- prompt and completion tokens;
- elapsed time and estimated cost.

The reference trace writes one JSON object per line for model requests, model responses, tool requests/results, limit or failure stops, and completion. Each event carries elapsed milliseconds and enough structured data to reconstruct the control flow. The trace sink replaces the selected workspace root with a portable marker and must never log credentials.

## Why history grows

In application-managed chat history, every new model request contains the relevant earlier messages: system instructions, the user goal, assistant tool calls, and tool outputs. A long compiler log can therefore be paid for and processed repeatedly. Tool definitions also consume input context on calls where they are sent.

The growth is not simply “one token per character”; tokenization varies. Use provider-reported usage for actual accounting and record the model. When exact cost fields are available, prefer them over hard-coded price multiplication because routing and pricing can vary.

For explicit replay, a simplified input-growth model is:

```text
input_i = durable_instructions
        + user_goal
        + tool_definitions_i
        + prior_assistant_messages
        + prior_tool_results
        + retained_summaries
```

The cumulative processed input across a run is the sum of `input_i`, not merely the size of the final history. This is why one 20 KB compiler log can affect several later calls. Provider caching may reduce billed or processed cost under documented conditions, but it does not remove the need to keep context relevant and within the model window.

Distinguish four token categories when a provider reports them: prompt/input, completion/output, reasoning, and cached input. Do not add categories twice when an aggregate already includes a detail field; follow the provider schema. Record unknown when a field is absent.

## Retention policy before compression

Decide what must remain:

- the current goal and durable constraints;
- the latest authoritative content or a reference to it;
- the most recent build/test evidence;
- unresolved errors and approvals;
- correlation information needed by the API.

Older raw compiler logs and superseded file contents are candidates for summarization or omission from future model context, but keep the original trace outside the prompt for audit. A summary is a lossy transformation; label it and do not replace deterministic pass/fail evidence with a prose claim.

Cap tool output at the source. It is better to return the relevant bounded tail plus `truncated: true` than to receive megabytes and hope the context layer recovers. Cache stable prompt prefixes when the provider supports it, but treat cache behavior as an optimization, not correctness.

Use a retention decision table:

| Item | Keep in active context? | Keep in raw trace? | Reason |
|---|---:|---:|---|
| user goal and non-goals | yes | yes | defines success and scope |
| latest file content after write | yes or reference it | yes/protected | current implementation evidence |
| compiler error fixed by later build | concise summary | yes | useful history, no longer current failure |
| latest build/test exit and scope | yes | yes | authoritative completion evidence |
| repeated unchanged tool definition | sent when API requires; cache candidate | version/hash | stable protocol configuration |
| secret or authorization header | no | no | minimize exposure rather than summarize |

A summary must say what was omitted and what source it derives from. “Build had issues” is not a safe compression of an exact exit code and diagnostic. “Previous build exited 1 for missing semicolon; full log in trace event 14; superseded by build event 22 exiting 0” preserves provenance and freshness.

## Stateful APIs

Some current APIs can persist or reference conversation state. That may reduce the application's need to resend a full message array and can change billing or caching behavior. It does not mean the model has arbitrary memory. State is still finite, scoped, provider-defined context. Record identifiers carefully, understand retention, and keep a portable trace of the tool/decision events you need for audit.

The workshop uses explicit history because it makes each byte of context teachable and keeps the deterministic client provider-neutral.

Current official OpenAI documentation distinguishes chained responses using `previous_response_id` from durable Conversations API objects. It also states that prior input in a response chain is still billed as input and documents different storage lifetimes for response and conversation items. Those details can change and are not automatically OpenRouter behavior. The engineering checklist is stable: determine what is stored, where the identifier lives, who can retrieve/delete it, how tool items are correlated, how context limits apply, and what is billed. See [conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

## Read the JSONL trace as a ledger

Begin with event counts. The CLI/configuration establishes mode and limits outside the current JSONL event stream. Each model-request/response pair contributes one iteration. Each tool-result event contributes one executed call. A terminal `final` or `stop` event states the outcome. Reconcile these with `LoopResult`; disagreement is an observability bug.

For each response, accumulate usage rather than overwriting it. Keep prompt tokens, completion tokens, and reported cost separate. The deterministic client uses synthetic fixed usage to exercise accounting and must be labeled as such. A live provider may return missing, delayed, or route-dependent price information; never convert absent data into zero without an “unknown” distinction.

Latency also has components. Measure model time, tool time, and end-to-end time. A slow agent may be dominated by compilation rather than inference. A parallel tool implementation could reduce latency while increasing conflict risk and explanation complexity. Optimize only after the trace identifies the actual bottleneck.

## A concrete retention exercise

After the syntax edit, the original compiler error is useful history but no longer current state. Retain a short fact—“initial build failed for a missing semicolon; fixed in the latest source”—while keeping the full raw log outside prompt context. After the final test passes, retain the exact action, exit code, and concise relevant output. Do not summarize `exit_code: 1` into “tests were run.”

File content needs similar treatment. A full file read followed by a successful complete-file write is superseded by the written content. Later, another read may be authoritative if external changes are possible. A repository hash or per-file version in a production system can make freshness explicit.

Tool definitions are often identical across calls and make good cache-prefix candidates. Stable system instructions can share that prefix. User goals, assistant calls, and results change. Provider cache eligibility and pricing rules vary, so trace observed cache fields rather than assuming a hit.

OpenRouter currently recommends using returned usage information for native token counts and detailed prompt, completion, reasoning, and cached-token accounting; it also documents retrieving historical usage by generation ID. Prompt-caching behavior is provider- and model-dependent. Arrange genuinely stable content first only after verifying the selected provider's caching rules, and treat a cache miss as a performance event rather than a correctness failure. See [usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting) and [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

## Budgeting before a run

Set hard ceilings for model iterations, tools, wall time, file/output bytes, and—when supported—tokens or monetary cost. Decide what happens at each ceiling: stop with a structured reason, request approval for more budget, or return a partial report. A limit that silently truncates reasoning and still marks completion is unsafe.

Budget selection is task-dependent. The tiny calculator can finish within a handful of calls; a large repository cannot. Scale observation tools and retrieval before simply raising context. Directory filters, targeted search, compiler diagnostic parsing, and patches can reduce context while preserving evidence.

## Privacy and retention

Provider-managed state, prompt caching, and input/output logging have privacy implications. Determine what the provider stores, for how long, under which account settings, and whether cached content crosses any organizational boundary. Redact secrets before sending; retention settings are not a substitute for minimizing sensitive input.

The local trace also needs a retention policy. Protect it as potentially sensitive development data, restrict access, and define deletion. Educational traces should use synthetic repositories and credentials so instructors can share them safely.

## Worked accounting example

Suppose one visible repair contains eight model calls and seven tool calls. The provider reports 18,000 prompt tokens, 2,000 completion tokens, and a billed cost of $0.09. Report all four counts; do not divide $0.09 by the visible “turn” and imply there was one inference. If two compiler results account for half the repeated input, that observation suggests output bounding or summarization. It does not prove caching would have applied.

Now imagine the final response lacks usage. Mark the final call's tokens and cost unknown while retaining earlier totals as partial. An honest interval or partial total is better than treating absence as zero. For deterministic mode, use the synthetic fields only to verify accumulation logic, never to forecast provider spending.

At the checkpoint, learners should be able to point to one byte-heavy superseded item, propose a safe compact representation, and identify the raw trace location that preserves full evidence.

They should also state a limit-trigger response: stop, explain which budget ended, preserve partial evidence, and avoid presenting an incomplete run as success. Budget exhaustion is a controlled outcome, not permission to fabricate the missing verification.

## Current ecosystem

See the [official OpenAI conversation-state guide](https://developers.openai.com/api/docs/guides/conversation-state), [OpenRouter usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting), [message transforms](https://openrouter.ai/docs/guides/features/message-transforms), and [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching). Recheck context limits, usage/cost fields, state retention, compaction, and caching. Stable concept: finite context has an observable quality, latency, and cost budget owned by the application.

## What you should now be able to explain

- Why a single visible task can contain many billable model calls.
- Which history elements are authoritative and which can be compacted.
- Why raw traces should survive even when prompt context is summarized.
- How provider-managed state changes transport without granting arbitrary memory.

Retest accounting and context behavior two weeks and two days before delivery.
