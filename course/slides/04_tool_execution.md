# Slide outline 4 — Tool execution

Last verified: 2026-08-08 | Target: 10 slides

1. **Prediction:** valid JSON containing a dangerous command string.
2. **Capability correction:** arbitrary command → `configure|build|test` enum.
3. **Dispatch pipeline:** parse → validate → authorize → execute → envelope.
4. **One envelope:** paired success/failure JSON excerpts.
5. **Correlation:** matching assistant call ID and tool-result ID.
6. **Prediction:** is `ok:true, exit_code:1` contradictory?
7. **Two layers of success:** tool observation versus child process outcome.
8. **Workspace boundary:** canonical parent, relative result, symlink refusal.
9. **Bounded process:** direct exec, timeout, output cap, secret removal.
10. **Manual round trip:** six-event sequence and acceptance checklist.

Do not put the complete dispatcher on slides; reveal one stage at a time.
