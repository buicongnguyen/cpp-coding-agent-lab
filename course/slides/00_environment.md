# Slide outline 0 — Environment and preflight

Last verified: 2026-08-08 | Target: 6 slides

1. **Outcome first:** terminal frames from goal → call → tool → test → completion; visual: annotated trace timeline.
2. **Prediction:** “Which component edited the file?” Learners vote model/harness/tool before reveal.
3. **Three boxes, two boundaries:** model, harness, tools; visual: network and authority boundaries.
4. **Two modes, one interface:** scripted required/live optional; visual: `ModelClient` fork converging on `ModelResponse`.
5. **Read a response:** short JSON showing model, message, finish reason, usage; no full solution code.
6. **Failure map and exit check:** key/HTTP/schema layers plus the question “What evidence proves preflight?”

Speaker assets: deterministic console capture, redacted live request/response, redacted 401/429 fallback. Reverify model/endpoint details before delivery.
