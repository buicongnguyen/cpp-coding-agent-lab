# Instructor guide 2 — Prompts and roles

Last verified: 2026-08-09 | 40 minutes: contrast 5, explain 8, demo 8, lab 16, debrief 3

## Demonstration script

1. Prediction slide: compare `Fix the project` with the five-block reference system instruction.
2. Exact user task for all trials: `Repair the calculator with the smallest appropriate change and verify it.`
3. Run two deterministic traces and, if available, three live trials. Fill metrics—read before write, final test, tool count, unsupported claim—rather than judging tone.
4. Directly dispatch `read_file("../outside.txt")` while the strongest prompt is active. Show the code-level rejection.

Expected branches: live models may follow the same prompt differently; report frequency, not certainty. Recorded fallback uses scripted traces. If prompt variants accidentally change more than one factor, stop and normalize configuration before interpreting results.

Fallback assets: [`02_prompt_roles.json`](../demos/chapter_fixtures/02_prompt_roles.json), the [prompt worksheet](../assets/chapter_02/PROMPT_WORKSHEET.md), and the labeled deterministic outputs in `../assets/chapter_02/`.

Misconceptions: system role is an access-control list; longer prompt is automatically better; one successful sample proves reliability. Ask learners to translate every vague phrase into a trace assertion or code control.
