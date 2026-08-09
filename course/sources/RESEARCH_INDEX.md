# Research-maintenance index

Last maintenance sweep: 2026-08-10
Last fully reachable source set: 2026-08-09

This course distinguishes stable concepts from provider behavior that must be retested before delivery.

## Chapter 0 — Setup and API boundary

- Stable: an application authenticates, sends a request, receives structured output, and owns error handling.
- Recheck: endpoints, model IDs, supported parameters, rate limits, free-router availability, and error fields.
- Sources: [OpenRouter Quickstart, including current direct API/client SDK/Agent SDK options](https://openrouter.ai/docs/quickstart), [Models API](https://openrouter.ai/docs/guides/overview/models), [Errors](https://openrouter.ai/docs/api/reference/errors-and-debugging).
- 2026-08-10 outcome: the current quickstart still documents direct `/api/v1/chat/completions`, client SDK, and Agent SDK routes. The public Models API supports filtering by `supported_parameters=tools`. A dated, non-authenticated primary/fallback selection is retained in `../assets/chapter_00/MODEL_SELECTION.md`; authenticated behavior remains a delivery gate.

## Chapter 1 — Model limitations and hallucination

- Stable: a model cannot observe a local file absent supplied content or an application tool.
- Recheck: examples and claims about current hallucination performance.
- Sources: [Nature 2026 hallucination research](https://www.nature.com/articles/s41586-026-10549-w), [official OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).
- 2026-08-10 outcome: the official function-calling guide continues to distinguish application-provided tools, model-generated tool calls, and application-generated tool outputs correlated to a call. No manuscript correction was required.

## Chapter 2 — Prompting and roles

- Stable: instructions shape behavior but do not replace permissions.
- Recheck: provider role translation and model-specific prompting recommendations.
- Sources: [OpenRouter message formats](https://openrouter.ai/docs/agent-sdk/call-model/message-formats), [official OpenAI model guidance, including lean-prompt recommendations](https://developers.openai.com/api/docs/guides/latest-model).
- 2026-08-10 outcome: current model guidance remains model-specific; the course keeps prompt experiments controlled and avoids presenting one universal prompt as provider-independent truth.

## Chapters 3–5 — Tools and orchestration

- Stable: advertise tools, receive calls, validate and execute locally, correlate results, repeat within limits.
- Recheck: tool-call wire fields, `tool_choice`, parallel-call support, and finish reasons.
- Sources: [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), [official OpenAI function calling, strict schemas, and parallel-call controls](https://developers.openai.com/api/docs/guides/function-calling), [JSON Schema objects](https://json-schema.org/understanding-json-schema/reference/object), [Microsoft CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw).
- 2026-08-10 outcome: current provider documentation still uses advertised tool schemas, returned tool calls, correlated tool results, and a subsequent model call. The course intentionally remains sequential even though current APIs also describe parallel calls.

## Chapter 6 — State and context

- Stable: the model can use only context supplied or referenced through the selected API mechanism; tokens and tool definitions consume finite context.
- Recheck: stateful APIs, compaction, caching, usage fields, and model context limits.
- Sources: [official OpenAI conversation state, response chaining, and durable conversations](https://developers.openai.com/api/docs/guides/conversation-state), [OpenRouter usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting), [message transforms](https://openrouter.ai/docs/guides/features/message-transforms), [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching).
- 2026-08-10 outcome: current conversation-state documentation still presents manual history alongside provider-managed chaining/state. The course correctly labels its local history as one design and keeps compaction/caching claims qualified.

## Chapter 7 — Safety and evaluation

- Stable: least privilege, deterministic authorization, bounded execution, traceability, and task-specific tests.
- Recheck: current agentic threat taxonomy and provider logging/retention behavior.
- Sources: [OWASP excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), [OWASP improper output handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), [official OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [OpenRouter logging](https://openrouter.ai/docs/guides/features/input-output-logging).
- 2026-08-10 outcome: the current OpenAI evaluation guide and NIST AI 600-1 page continue to support task-specific evaluation and lifecycle risk management; NIST records an April 8, 2026 page update. OWASP pages remained the cited primary guidance; their live site throttled this maintenance pass, so they must be retried at the event-time gate rather than silently treated as reverified.

## Chapter 8 — Self-modification

- Stable: isolate changes, inspect a diff, run deterministic verification, and preserve human approval for risky actions.
- Recheck: current agentic coding security guidance.
- Sources: [Git worktree](https://git-scm.com/docs/git-worktree.html), [Git diff](https://git-scm.com/docs/git-diff), [CTest](https://cmake.org/cmake/help/latest/manual/ctest.1.html), [OWASP securing agentic applications](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/).
- 2026-08-10 outcome: isolation, diff review, and fresh CTest evidence remain the stable capstone mechanism. The OWASP agentic-guide page was throttled during this pass and remains an event-time retry rather than a completed freshness claim.

## Maintenance evidence rule

A reachable documentation page and a public Models API response can establish current documented shape and advertised capability. They cannot establish account quota, actual routing, completion quality, returned model, or classroom-network behavior. Those require the live and event-time evidence in `../DELIVERY_GATES.md`.
