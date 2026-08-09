# Preflight troubleshooting sheet

Preserve a redacted status, request ID when safe, and bounded provider message. Never print authorization headers.

| Signal | Likely layer | Instructor action | Retry? |
|---|---|---|---|
| compiler/CMake not found | local toolchain | return to prework; use prepared machine | no API retry |
| deterministic test fails | owned C++ code/build | use canonical checkpoint; save compiler/test evidence | after repair |
| 400 | request/schema | inspect sanitized body, model name, and message/tool shape | only after correction |
| 401 | credential | verify variable exists; rotate invalid key; never display value | after correction |
| 402 | account/credit | use deterministic track or funded instructor fallback | not immediately |
| 408 | transport/provider timeout | keep bounded error; one capped retry or deterministic fallback | bounded |
| 429 | rate/capacity | honor `Retry-After`, cap retries, stagger class requests | bounded |
| 502 | upstream provider | switch to tested fallback or deterministic mode | bounded |
| 503 | routing/model availability | verify eligible provider/model and fallback | bounded |
| JSON parse failure after 2xx | adapter/schema drift | archive redacted body; switch deterministic; update adapter offline | no blind retry |

Escalation order: preserve evidence, redact, classify the layer, choose the documented fallback, then continue the lesson. “API failed” is not a diagnosis.
