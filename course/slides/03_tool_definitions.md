# Slide outline 3 — Tool definitions

Last verified: 2026-08-09 | Target: 8 slides

1. **Prediction:** raw `tool_calls` JSON—has anything executed?
2. **Four objects:** definition → call → execution → correlated result.
3. **Minimal schema:** annotated `read_file` object.
4. **Strict fields:** missing `required` and typo accepted versus rejected.
5. **Wire adapter:** provider JSON to provider-neutral `ToolCall`.
6. **Prediction:** what should malformed arguments do?
7. **Schema limit:** types versus path authorization table.
8. **Parallel calls deferred:** conflict/correlation visual and exit check.

Demo capture must include call ID, arguments, finish reason, and unchanged file evidence.
