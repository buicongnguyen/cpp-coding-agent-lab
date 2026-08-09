# Dated live-model selection record

Checked: 2026-08-10 UTC

This record separates public catalog evidence from authenticated execution evidence. The public OpenRouter Models API was queried with `supported_parameters=tools`; both selected request IDs were then checked through the single-model endpoint. No API key or completion request was used.

## Selected classroom candidates

| Role | OpenRouter request ID | Why selected | Public catalog evidence | Authenticated status |
|---|---|---|---|---|
| primary | `openai/gpt-5.4-mini` | current compact coding-capable model, 400,000-token context, tool and `tool_choice` support | HTTP 200; canonical catalog slug `openai/gpt-5.4-mini-20260317`; no advertised expiration | **not yet tested** |
| fallback | `google/gemini-2.5-flash` | independent provider family, lower listed token price, 1,048,576-token context, tool and `tool_choice` support | HTTP 200; canonical catalog slug equals request ID; no advertised expiration | **not yet tested** |

The exact machine-readable fields retained from the public response are in `model_selection_2026-08-10.json`. Prices are a dated observation, not a classroom budget promise.

## Promotion rule

Do not call either candidate “tested,” “pinned for delivery,” or “the fallback that works” until an instructor account has:

1. set a spend limit and alerts;
2. run `agent_preflight --live` with the request ID;
3. recorded the returned model, date, finish reason, usage, and error category without credentials;
4. run the E1–E5 live-capable subset three times with `scripts/run-live-gates.ps1`;
5. had a second person review promoted traces for secrets and personal paths.

Re-query the public model endpoint two weeks and two days before delivery. If the request ID disappears, loses `tools`, gains an expiration date that conflicts with the event, or returns an unexpected canonical model, stop live delivery and use the deterministic course.

Sources: [OpenRouter Models API](https://openrouter.ai/docs/guides/overview/models), [tool calling](https://openrouter.ai/docs/guides/features/tool-calling), and [errors and debugging](https://openrouter.ai/docs/api/reference/errors-and-debugging).
