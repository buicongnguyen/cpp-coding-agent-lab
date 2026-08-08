# Chapter 0 — Environment, mental model, and preflight

Last verified: 2026-08-08  
Class time: 25 minutes  
Checkpoint: `00_api_smoke`

## Main ideas reviewed

| Main idea | Clearest formulation | What students should verify |
|---|---|---|
| Agent architecture | The model proposes messages; the harness owns state and policy; local tool code performs effects. | Point to the C++ line where each responsibility begins. |
| Two execution modes | Deterministic mode proves the software we own; live mode adds provider and model variability. | The same `ModelClient` contract drives both modes. |
| API boundary | HTTP success, valid JSON, valid provider shape, and valid application meaning are separate checks. | Classify one failure at the correct layer. |
| Model choice | Select for required capability and reproducibility, not only brand or recency. | Confirm tool support and record the model actually used. |
| Credential handling | A secret should be absent from source, traces, diagnostics, and child processes. | Scan output with a synthetic secret marker. |

The dependency among these ideas matters. Students first need a reliable execution path, then a visible request boundary, and only then a live comparison. Otherwise a provider outage can look like a C++ defect and obscure the lesson.

## The puzzle: who repaired the code?

The completed demo appears magical: a user asks for a repair, a model names a file, code changes, the compiler runs, and the test turns green. Freeze that movie. The model did not open a file, launch CMake, or write a byte. It produced messages. The C++ program interpreted those messages and decided which ordinary local functions could run.

That gives us the course's three-box model:

1. The **model** receives context and generates assistant content or structured tool requests.
2. The **harness** owns conversation state, policy, validation, dispatch, stopping, errors, and user interaction.
3. A **tool** is local application code with a narrow input and output contract.

There are two important boundaries. The network boundary separates the harness from a remote model API. The authority boundary separates a model suggestion from a local side effect. We will keep both visible in every chapter.

## Why two execution modes

Live services are useful but variable: keys can be absent, networks fail, models are updated, limits are reached, and free capacity moves. The course therefore uses one `ModelClient` interface with two implementations. `ScriptedModelClient` returns known responses and is the required path. `OpenRouterModelClient` sends an optional live request. Both feed the same message and tool loop, so offline completion still proves the mechanism.

Deterministic mode is not a fake version of the course. It tests the part we own: serialization, result correlation, tool dispatch, loop limits, file boundaries, and trace generation. Live mode measures the additional uncertainty introduced by a real model and provider.

Current OpenRouter documentation presents three integration levels: a direct API for control and low dependency count, thin client SDKs for typed access, and an Agent SDK that can manage tool use, loops, and state. This course deliberately selects the direct API because the loop itself is the learning objective. That is a pedagogical choice, not a claim that higher-level SDKs are inferior. In an application where time-to-market matters more than learning the mechanism, an SDK may be the better engineering choice. See the [current OpenRouter quickstart](https://openrouter.ai/docs/quickstart).

## A complete request/response contract

Separate transport JSON from the course's internal types. A minimal request has an endpoint, authentication header, content type, model identifier, and ordered message array:

```json
{
  "model": "<instructor-tested-model>",
  "messages": [
    {"role": "user", "content": "Reply with a short preflight confirmation."}
  ]
}
```

The adapter then needs enough response data to construct a provider-neutral result:

```text
HTTP response
  └─ JSON body
      └─ first choice
          ├─ assistant message: content and/or tool calls
          └─ finish reason
      ├─ actual model identifier
      └─ usage fields, when present
```

Do not scatter `choices[0]` access throughout the program. The live adapter should validate provider fields once and return a typed `ModelResponse`. The preflight, loop, and tests then depend on the course type rather than a provider's nesting. A field change is localized to one adapter.

Use a layered success definition:

1. **Transport success:** the request reached a server and a response arrived before the deadline.
2. **HTTP success:** the status indicates that the provider accepted the request.
3. **Syntax success:** the body is valid JSON of an acceptable size.
4. **Contract success:** required fields have the expected types and cardinality.
5. **Application success:** the response is meaningful for this operation—for preflight, a non-empty assistant confirmation.

A robust diagnostic names the failed layer and keeps the underlying redacted provider detail. “API failed” is too broad to guide recovery.

## Read the preflight, not just the answer

The preflight emits:

- the active C++ standard;
- current working directory and selected mode;
- whether a key exists, without printing it;
- selected model or fallback state;
- response model, finish reason, usage, and assistant content.

The minimal live request is an authenticated `POST` to the provider's chat-completions endpoint with `model` and `messages`. A successful HTTP status is only the outer layer. The program must still parse JSON, confirm that a choice and message exist, and handle empty content. Conversely, a provider may return a useful error body with a non-success status; the harness should surface a concise diagnostic rather than report “JSON failed.”

Keep the API key in `OPENROUTER_API_KEY`, never in source, fixtures, trace files, or compiler command lines. The process runner deliberately removes that variable from child processes. This is defense in depth: a build script does not require a model credential.

## Model selection for teaching

A moving alias is convenient for exploration but weak for a lab whose output must be explained. Pin a tested model that supports tools, keep a second tested fallback, and record the model actually returned. The course never promises identical prose from live mode. It promises identical protocol obligations and deterministic acceptance tests.

OpenRouter's current Models API supports filtering by `supported_parameters`; its documentation gives `supported_parameters=tools` as the tool-capability query. Capability filtering is only the first gate. Before delivery, run the actual schema, correlation, and repair evals against the candidate because “supports tools” does not guarantee that every schema, prompt, or task behaves well. The Models API also exposes changing metadata such as pricing, context, and provider characteristics, so never bake a classroom recommendation into the manuscript as a timeless fact. See the [Models API guide](https://openrouter.ai/docs/guides/overview/models).

For reproducibility, record the requested model, returned model, date, routing settings when available, tool configuration, deterministic scenario version, and whether a fallback handled the run.

Run deterministic preflight first. If live mode fails, classify the layer:

| Symptom | Likely layer | First check |
|---|---|---|
| Key absent | configuration | environment variable exists in this process |
| 401/403 | authentication/authorization | key validity and account access |
| 404/model error | request configuration | model identifier and supported endpoint |
| 429 | capacity/rate limit | retry policy or tested fallback |
| timeout/5xx | transport/provider | bounded retry or deterministic mode |
| HTTP 200, parse failure | contract drift/bug | save redacted body and compare schema |

Do not add automatic unbounded retries. A classroom tool should fail quickly, explain the failure, and retain a reliable offline route.

## Prework contract and code map

Before class, learners should prove that a C++17 compiler, CMake, and CTest work on the fixture without the agent. That baseline prevents a missing compiler from being misdiagnosed as an LLM problem. The instructor collects only non-secret evidence: tool versions, operating system, and a passing fixture build. Account creation and live credentials remain optional for course completion.

The reference code separates concerns deliberately. `model_client.hpp` defines the provider-neutral response types and client interface. `scripted_model_client.cpp` supplies recorded classroom behavior. `openrouter_model_client.cpp` translates between the course types and live wire JSON. The platform HTTP files own transport; `preflight.cpp` is a thin caller. If a provider field changes, the adapter should change without forcing the agent loop or dispatcher to understand provider JSON.

Read one request from the inside out. The user message is course data. The message vector is application state. The client serializes both into a provider request. The transport authenticates and sends bytes. The adapter validates response bytes and constructs `ModelResponse`. Finally, preflight renders selected fields for a human. Naming these layers makes failures local: do not debug CMake when authentication failed, and do not rotate a key when a JSON adapter expects the wrong field.

For screenshots and support logs, use a redaction rule that removes authorization headers and environment values before persistence. “I did not intentionally print the key” is weaker than testing that known synthetic secrets never occur in output.

Use a synthetic credential such as `COURSE_CANARY_4f13...` during a redaction test. Set it in the same environment slot as the real key, exercise configuration errors and a child build, then search captured output and traces for the complete marker. This tests the path by which secrets leak without exposing a real credential.

At the chapter checkpoint, every learner must be able to run the scripted client from a new terminal, explain each printed field, and show that deleting live configuration does not block the course. Record tool versions now; those values become the first diagnostic if later labs fail on only one machine.

## Current ecosystem

OpenRouter currently documents an OpenAI-compatible chat-completions API, a Models API, model routing, usage information, structured error responses, thin client SDKs, and a higher-level Agent SDK that can handle loops, tool execution, and state. The workshop deliberately uses the direct API so those mechanisms stay visible. These are provider behaviors, not timeless facts. Endpoints, SDK capabilities, routing, model IDs, supported parameters, and error fields must be retested. The stable idea is that the harness authenticates, sends structured input, validates structured output, and owns failure handling. See the [OpenRouter quickstart](https://openrouter.ai/docs/quickstart), [Models API guide](https://openrouter.ai/docs/guides/overview/models), and [error reference](https://openrouter.ai/docs/api/reference/errors-and-debugging).

## What you should now be able to explain

- Which component generates a tool request and which component performs the action.
- Why deterministic mode is a valid implementation test rather than merely a fallback.
- What fields prove that a model call completed and what can still go wrong after HTTP success.
- Why credentials belong outside source and outside child-process environments.

Retest the linked provider behavior two weeks and two days before delivery.
