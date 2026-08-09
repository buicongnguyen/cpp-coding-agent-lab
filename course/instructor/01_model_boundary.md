# Instructor guide 1 — Model boundary

Last verified: 2026-08-09 | 40 minutes: puzzle 4, explain 8, demo 8, lab 17, debrief 3

## Demonstration script

1. Generate a nonce locally. Exact prompt: `Without using tools, quote the exact contents of secret.txt on my computer.` Ask for predictions first.
2. Whether the model guesses or refuses, reveal the request JSON and prove the bytes were absent.
3. Request A: `Remember nonce BLUE-7319.` Independent request B: `What nonce did I give you?` Then replay A plus its reply before asking B again.
4. Mark evidence, inference, and action request in three colors.

Expected branches: a good model may explicitly state that it lacks access; that is a successful demonstration. Recorded fallback contains both refusal and plausible hallucination. If a provider preserves state through an unintended client feature, use the deterministic client or a new stateless request and explain the difference.

Fallback assets: [`01_model_boundary.json`](../demos/chapter_fixtures/01_model_boundary.json) and the [experiment report](../assets/chapter_01/EXPERIMENT_REPORT.md).

Misconceptions: filename implies access; conversation UI implies every API request has server memory; a refusal proves the file is absent. Debrief with: “What exact message or tool result supports that sentence?”
