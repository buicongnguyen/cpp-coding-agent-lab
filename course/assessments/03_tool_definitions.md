# Assessment 3 — Tool definitions

Last verified: 2026-08-09

## Questions

1. Distinguish a tool definition from a tool call in one sentence each.
2. What does `additionalProperties: false` prevent, and what important safety property does it not enforce?
3. Trace reading: assistant returns a call ID/name/arguments; no tool result follows and the file is unchanged. Is that necessarily an error at the inspection checkpoint?
4. Executable check: schema tests accept `{"path":"a.cpp"}` and reject `{}`, `{"pth":"a.cpp"}`, and `{"path":"a.cpp","extra":1}`.

## Answer key and misconception notes

1. Definition advertises a contract; call is model output proposing one invocation. Neither is execution.
2. It rejects unknown fields/typos; it does not prove the path is authorized. “Schema confines the filesystem” is false unless a custom validated semantic rule is enforced locally.
3. No—the lab intentionally stops before dispatch to expose the boundary. In the completed loop it would be incomplete.
4. Pass requires both positive and negative cases; testing only serialization does not validate the contract.
