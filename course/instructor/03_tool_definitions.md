# Instructor guide 3 — Tool definitions

Last verified: 2026-08-09 | 45 minutes: failure 4, explain 10, demo 8, lab 20, check 3

## Demonstration script

1. Show a raw assistant `tool_calls` response. Prediction: “Has the file been read?”
2. Print ID, name, arguments, finish reason, and file timestamp; deliberately do not dispatch.
3. Compare the definition, call, C++ function, and result as four cards.
4. Feed a call with `{"pth":"x","surprise":1}` and show why strict shape validation matters.

Exact task: `Inspect src/calculator.cpp and tell me the first compile problem. Request a tool if evidence is missing.` Expected live branch is a read call or a statement of limitation; a plain invented answer becomes discussion evidence. Recorded fallback uses the scripted call.

Fallback asset: [`03_tool_definition.json`](../demos/chapter_fixtures/03_tool_definition.json). It is intentionally paused before dispatch.

Recovery: if the selected model does not support tools, switch to the tested model or deterministic response; do not rewrite the schema mid-demo. Misconceptions: schema enforces the filesystem boundary; advertising a tool runs it; finish reason alone is sufficient to find calls.
