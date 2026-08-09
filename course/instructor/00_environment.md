# Instructor guide 0 — Environment and preflight

Last verified: 2026-08-09 | 25 minutes: hook 3, explain 6, demo 6, lab 8, check 2

## Demonstration script

1. Run deterministic `agent_preflight`. Ask learners to predict which fields appear before pressing Enter.
2. Point to `messages`, `complete`, and `ModelResponse`; draw model/harness/tool boxes.
3. Exact live prompt if credentials are available: `Reply with exactly: preflight ready.` Show the returned model, finish reason, and usage.
4. Remove the key from a separate terminal process and rerun `--live` to show a friendly configuration failure. Never reveal the real value.

Expected branches: deterministic response is fixed; live wording/model/usage vary. Recorded fallback: retain deterministic output and a redacted 401/429 example. If network or provider fails, classify it and continue offline—do not debug accounts during class.

Fallback assets: [`00_preflight.json`](../demos/chapter_fixtures/00_preflight.json), [`sanitized_response.json`](../assets/chapter_00/sanitized_response.json), and the [troubleshooting card](../assets/chapter_00/TROUBLESHOOTING.md).

Common misconceptions: “the model ran the executable” (the client returned a message); “HTTP 200 proves a valid semantic response” (parsing/contract checks remain); “free alias is reproducible” (routing can change).

Capture artifacts: console output and redacted request/response JSON. Before class, rebuild on the classroom OS and confirm the backup model.
