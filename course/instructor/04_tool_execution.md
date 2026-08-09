# Instructor guide 4 — Tool execution

Last verified: 2026-08-09 | 60 minutes: threat 5, explain 12, demo 10, lab 28, debrief 5

## Demonstration script

1. Prediction: present a valid free-form command string containing a shell operator. Reveal that the corrected API exposes only `configure|build|test`.
2. Execute one manual `read_file` round trip. Highlight the identical call ID on request and result.
3. Directly dispatch a successful read, path escape, extra property, unknown tool, and failing build.
4. Compare tool `ok` with process `exit_code`: observation can succeed while compilation fails.

Exact model prompt: `Read src/calculator.cpp, then describe only evidence present in the returned tool result.` Expected branches are one call followed by an evidence-based answer. Recorded fallback is the scripted pair. If CMake differs, use the supplied compiler-output fixture and continue protocol instruction.

Fallback assets: [`04_tool_result_roundtrip.json`](../demos/chapter_fixtures/04_tool_result_roundtrip.json), the [fake calls](../assets/chapter_04/fake_tool_calls.json), and the [transcript worksheet](../assets/chapter_04/TRANSCRIPT_WORKSHEET.md).

Misconceptions: rejecting `..` alone solves path safety; result ID is optional; nonzero exit means the dispatcher crashed; a child build is safe merely because it is local. Pause before every side effect and ask which validation/authorization stage owns it.
