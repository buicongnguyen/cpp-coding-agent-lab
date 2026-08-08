# Assessment 1 — Model boundary

Last verified: 2026-08-08

## Questions

1. A user message names `config.json`. What additional evidence is required before the assistant can truthfully quote its contents?
2. Why can replaying prior messages make a nonce available while a new independent chat-completions request cannot?
3. Trace reading: `assistant` claims line 8 is wrong; the earlier trace contains only `list_files`, no `read_file` or supplied content. Classify the claim.
4. Inspectable check: prove the secret phrase is absent from the first request JSON and identify the exact later tool result/message that first contains it.

## Answer key and misconception notes

1. Supplied file bytes or a successful correlated read result. A plausible filename or training familiarity is inference, not observation.
2. The application explicitly reintroduces the data into context. “The model remembers this session automatically” is not established by stateless requests.
3. Unsupported inference/hallucination; a directory listing proves existence/name, not line content.
4. Pass requires byte-level/request inspection, not “the model said it could not access it.” A refusal is behavior, not proof of request contents.
