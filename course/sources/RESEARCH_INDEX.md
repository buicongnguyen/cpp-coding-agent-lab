# Research-maintenance index

Last verified: 2026-08-08

This course distinguishes stable concepts from provider behavior that must be retested before delivery.

## Chapter 0 — Setup and API boundary

- Stable: an application authenticates, sends a request, receives structured output, and owns error handling.
- Recheck: endpoints, model IDs, supported parameters, rate limits, free-router availability, and error fields.
- Sources: [OpenRouter Quickstart, including current direct API/client SDK/Agent SDK options](https://openrouter.ai/docs/quickstart), [Models API](https://openrouter.ai/docs/guides/overview/models), [Errors](https://openrouter.ai/docs/api/reference/errors-and-debugging).

## Chapter 1 — Model limitations and hallucination

- Stable: a model cannot observe a local file absent supplied content or an application tool.
- Recheck: examples and claims about current hallucination performance.
- Sources: [Nature 2026 hallucination research](https://www.nature.com/articles/s41586-026-10549-w), [official OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Chapter 2 — Prompting and roles

- Stable: instructions shape behavior but do not replace permissions.
- Recheck: provider role translation and model-specific prompting recommendations.
- Sources: [OpenRouter message formats](https://openrouter.ai/docs/agent-sdk/call-model/message-formats), [official OpenAI model guidance, including lean-prompt recommendations](https://developers.openai.com/api/docs/guides/latest-model).

## Chapters 3–5 — Tools and orchestration

- Stable: advertise tools, receive calls, validate and execute locally, correlate results, repeat within limits.
- Recheck: tool-call wire fields, `tool_choice`, parallel-call support, and finish reasons.
- Sources: [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), [official OpenAI function calling, strict schemas, and parallel-call controls](https://developers.openai.com/api/docs/guides/function-calling), [JSON Schema objects](https://json-schema.org/understanding-json-schema/reference/object), [Microsoft CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw).

## Chapter 6 — State and context

- Stable: the model can use only context supplied or referenced through the selected API mechanism; tokens and tool definitions consume finite context.
- Recheck: stateful APIs, compaction, caching, usage fields, and model context limits.
- Sources: [official OpenAI conversation state, response chaining, and durable conversations](https://developers.openai.com/api/docs/guides/conversation-state), [OpenRouter usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting), [message transforms](https://openrouter.ai/docs/guides/features/message-transforms), [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

## Chapter 7 — Safety and evaluation

- Stable: least privilege, deterministic authorization, bounded execution, traceability, and task-specific tests.
- Recheck: current agentic threat taxonomy and provider logging/retention behavior.
- Sources: [OWASP excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), [OWASP improper output handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), [official OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [NIST Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [OpenRouter logging](https://openrouter.ai/docs/guides/features/input-output-logging).

## Chapter 8 — Self-modification

- Stable: isolate changes, inspect a diff, run deterministic verification, and preserve human approval for risky actions.
- Recheck: current agentic coding security guidance.
- Sources: [Git worktree](https://git-scm.com/docs/git-worktree.html), [Git diff](https://git-scm.com/docs/git-diff), [CTest](https://cmake.org/cmake/help/latest/manual/ctest.1.html), [OWASP securing agentic applications](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/).
