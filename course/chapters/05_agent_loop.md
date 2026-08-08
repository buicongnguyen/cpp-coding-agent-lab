# Chapter 5 — The bounded agentic loop

Last verified: 2026-08-08  
Class time: 60 minutes  
Checkpoint: `05_agent_loop`

## Main ideas reviewed

| Main idea | Clearest formulation | Failure if omitted |
|---|---|---|
| Feedback loop | Each model decision sees the exact approved results of earlier calls. | Later steps become guesses. |
| History invariant | Append the assistant proposal, then exactly one result per executed call. | Correlation and causal replay break. |
| Hard limits | Iteration, tool, repetition, process, and wall-clock budgets guarantee termination. | A pathological run can continue indefinitely. |
| Recovery semantics | Tool failures become evidence; provider failures are harness-level events. | Errors are hidden or retried unsafely. |
| Progress and success | Loop completion is not task success; current deterministic verification is. | Fluent final text can mask a failing project. |
| Traceability | Structured events reconstruct what was known, allowed, changed, and verified. | Failures cannot be diagnosed or evaluated reliably. |

An “agentic loop” is therefore not just repetition. It is a bounded state transition system whose next input contains authoritative observations from the previous transition.

## The failure: one tool call is not an agent

A one-shot program can ask a model for a file and execute one read. It cannot use the contents to decide on a write, inspect compiler feedback, revise the edit, and prove that tests pass. The agentic behavior comes from a feedback loop owned by the harness.

The minimal loop is:

```text
initialize history with system + user
repeat within limits:
    response = model.complete(history, tool_definitions)
    append the assistant message exactly once
    if tool calls exist:
        validate, authorize, and execute each call
        append one correlated tool result for each call
        continue
    require non-empty assistant content
    return completion
otherwise stop with a limit error
```

This looks small because tool details were isolated in Chapter 4. Its correctness depends on invariants.

## Loop invariants

At the start of every model call:

- history is in causal order;
- every earlier assistant tool call has exactly one correlated result;
- no tool executes before authorization;
- counters and deadline are current;
- the raw trace can reconstruct decisions;
- completion has not already been returned.

Append the assistant message before executing its calls. If execution fails, retain the original proposal and append a structured failure. That evidence gives the model a chance to recover.

One way to make the state machine explicit is:

| Current state | Accepted event | Next state |
|---|---|---|
| Need decision | model returns calls | Await/execute authorized tools |
| Need decision | model returns non-empty text and no calls | Protocol complete |
| Execute tools | each call returns success or structured failure | Need decision after all required results |
| Any active state | hard limit, cancellation, or provider failure | Stopped with classified reason |
| Any active state | malformed internal history | Protocol error; do not continue |

The generic reference loop does not store this enum, but its branches implement the same transitions. Writing the table first makes it easier to prove that every event has one outcome and no terminal state calls the model again.

## Stopping is a feature

The reference `AgentLimits` bounds:

- model iterations;
- total tool calls;
- consecutive identical calls;
- wall-clock duration.

It also rejects a final assistant message with no tool calls and no content. These conditions distinguish a controlled state machine from `while(true)`.

The identical-call detector must count consecutive repetition, not historical frequency. Reading the same file again after a compile result can be reasonable. Reading it three times without intervening progress is likely a loop. The signature includes tool name and normalized argument JSON.

Provide cancellation in interactive products. The workshop deadline illustrates the concept, while process-specific timeouts ensure that one build cannot consume the entire agent budget.

Limits answer different questions:

- iteration limit: how many model decisions are allowed;
- tool-call limit: how many local proposals may execute;
- repetition limit: is the run making the same immediate request without new evidence;
- process timeout: can one child action monopolize the run;
- wall-clock limit: what is the maximum end-to-end duration;
- user cancellation: does a human retain control now.

Return the specific stop reason and current counters. “Stopped” without the exhausted budget is not actionable.

## Failure recovery

Failures become context, not hidden control flow:

- malformed arguments → return `invalid_arguments`;
- rejected path → return `path_outside_workspace`;
- compile failure → return output and nonzero exit code;
- timeout → return `timed_out: true`;
- provider failure → terminate or use an explicitly configured retry/fallback policy.

Do not ask the model to interpret a network exception it never received. Provider failures occur outside the reasoning loop. Retries should be bounded and avoid replaying mutating calls without idempotency analysis.

Use this retry classification:

| Failure point | Local side effect may have happened? | Safe default |
|---|---:|---|
| request rejected before provider processing | no local tool effect | bounded retry may be reasonable |
| provider timeout with no response | no new local tool effect, remote status uncertain | retry only with request/idempotency strategy |
| read tool failed | normally no mutation | return structured failure to model |
| whole-file write completed, result delivery failed | yes | do not replay blindly; inspect current file/state |
| build timed out | project processes may remain | terminate process tree/isolation, report timeout |

Retries are part of state management. They must not erase the distinction between “not executed,” “executed and failed,” and “outcome unknown.”

## Walk through the repair fixture

The deterministic `full-repair` trace provides an explainable path:

1. `configure` creates the build graph.
2. `build` returns a compiler error caused by a missing semicolon.
3. `read_file` inspects the implicated implementation.
4. `write_file` makes the smallest syntax correction.
5. `build` succeeds.
6. `test` reveals the integer-division defect.
7. `read_file` inspects the failing test expectation.
8. `write_file` promotes the arithmetic.
9. `build` succeeds after the behavioral edit.
10. `test` passes.
11. The assistant reports completion with evidence.

This is not the only acceptable live path. A live model might inspect the header first or run configuration earlier. The rubric evaluates safety and evidence, not an exact call sequence.

## Pathologies to demonstrate

Run the `repeated-read` scenario and watch the harness stop. Then consider three other pathologies:

- **Premature completion:** model says “fixed” before verification; the rubric rejects the run even if the loop terminates normally.
- **Thrashing:** alternating edits without improved compiler evidence; use tool/iteration bounds and trace review.
- **Context drift:** old errors dominate after a repair; mark latest results and consider later compression.

A production orchestrator may use explicit states such as `Inspecting`, `Editing`, `Verifying`, and `AwaitingApproval`. The course keeps a generic loop so students see the protocol, but the state-machine interpretation should remain visible.

## Work through one iteration precisely

Suppose history ends with the user repair goal. Iteration one calls the model with the four tool definitions. The response requests symbolic `configure`. The loop appends that assistant message, increments the iteration counter, checks that executing the call will not exceed the tool budget, and dispatches. It appends a `tool` message whose content is the serialized process envelope and whose call ID matches.

Iteration two sends the expanded history. The model requests `build` and receives an actual compiler diagnostic. On the following iteration it can select the implicated file using that evidence. If a response requests multiple reads, the loop executes them according to its sequential policy, increments tool count for each, and appends one result per call. At no point does the dispatcher decide whether another model call is needed; orchestration remains in the loop.

When a response has no calls, the loop checks content. Non-empty content is a protocol completion, but task success remains a rubric decision. `LoopResult` records completion, stop reason, counts, cumulative usage, and final text. An evaluator then inspects whether required verification evidence exists.

## Model-call failures and mutation replay

A provider timeout before a response is different from a tool timeout. It yields no assistant message or calls to append. A bounded retry may be safe because no local action was proposed or executed. A network failure after receiving a response but before the application records it is harder; durable production systems need request IDs and careful state persistence.

Never blindly retry a model turn after some of its mutating tool calls executed. The new response could propose the mutation again. Tool idempotency, call-ID ledgers, transactional writes, and resumable state are production concerns introduced by this edge case. The workshop avoids automatic retries and keeps one process-local trace.

## Progress, verification, and stopping policy

Counters are coarse safety mechanisms; progress signals improve quality. The reference detects consecutive identical calls. Further signals might include unchanged build error fingerprints, writes that produce identical content, or repeated test failures without a relevant intervening edit. Do not make heuristic progress checks the only stop condition: they can be wrong, while hard budgets always terminate.

Verification policy can be task-specific. A documentation edit may not need all C++ tests. A source repair should normally require configuration/build and relevant tests after the latest write. Encode this in the evaluation layer or an explicit workflow state rather than asking a generic loop to infer universal success.

The final report should be useful when separated from live terminal output. Ask for files changed, concise cause/fix, and commands/results. Then compare those claims with trace evidence. If the model says “all tests” but only one focused test ran, mark a reporting defect even if the code is correct.

Define success as a predicate over the trace, not a keyword in final prose. For the repair fixture:

```text
success = protocol_completed
       && final_content_non_empty
       && every_executed_call_has_correlated_result
       && no_policy_violation_executed
       && latest_build_after_latest_source_write.exit_code == 0
       && latest_test_after_latest_source_write.exit_code == 0
```

The “after latest source write” clause is essential. A green test from before the change is stale evidence. Other tasks should define a different verifier predicate rather than reuse this one blindly.

## Trace as a state-machine proof

For every iteration, emit a model-request event with message/tool counts, a model-response event with usage and call metadata, and a tool-result event with the complete structured envelope. Emit limit/failure and completion events. Use elapsed time relative to run start and a run identifier in production.

Avoid logging authorization headers, keys, or unnecessary complete file contents. The educational trace includes tool data so students can reconstruct the loop; sensitive production traces may store hashes, sizes, redacted excerpts, and protected blob references. Observability must not create a new exfiltration channel.

Ask learners to replay the trace manually: before each model response, list exactly what evidence existed; before each tool execution, identify the authorization decision; at completion, locate the newest verifier. If any step cannot be reconstructed, the orchestration is not sufficiently observable.

## Deterministic scenario design

Scripted responses should validate the protocol without pretending to emulate model intelligence. Each scenario has a purpose: `smoke` validates basic response handling, `full-repair` exercises feedback and recovery, and `repeated-read` proves termination. Tests should fail if a required call did not execute, a result was mis-correlated, or final content is empty.

Keep scripted calls aligned with public schemas. Otherwise offline tests can pass while the live adapter uses a different contract. When tool definitions change, update the scenario fixtures and add a compatibility assertion.

## Review checkpoint

Given a completed trace, number every model iteration and tool execution independently. Verify call/result pairing, locate counter changes, and state why the loop continued or stopped after each response. Then remove the last passing test event conceptually: the loop may still have protocol completion, but the repair rubric must fail. This distinction between loop termination and task success is the final concept to carry into observability and evals.

## Current ecosystem

Tool-calling APIs continue to evolve, but orchestration remains application code: append the assistant proposal, execute approved calls, return correlated results, and repeat within limits. See [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), [OpenRouter error handling](https://openrouter.ai/docs/api/reference/errors-and-debugging), and the [official OpenAI function-calling guide](https://developers.openai.com/api/docs/guides/function-calling). Recheck parallelism, finish reasons, retry advice, and provider errors. Keep termination, authorization, and causal history provider-neutral.

Higher-level SDKs may now implement this cycle automatically, but that changes ownership visibility rather than the underlying obligations. Before adopting one, identify where it stores history, validates tool arguments, authorizes effects, correlates outputs, limits repetitions, exposes cancellation, and emits traces. If any item is hidden, add an integration test at that boundary.

## What you should now be able to explain

- Why feedback, not a single tool call, creates agentic behavior.
- The invariants required before each model call.
- Why consecutive repetition differs from total historical repetition.
- Which failures belong inside tool context and which terminate outside the loop.
- Why passing compiler/test evidence, not final prose, closes the repair task.

Retest provider error behavior and the live repair demo two weeks and two days before delivery.
