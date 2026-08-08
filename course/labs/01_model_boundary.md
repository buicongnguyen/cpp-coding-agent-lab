# Lab 1 — Prove what the model can observe

Last verified: 2026-08-08 | Time: 25 minutes | Start: `checkpoints/01_messages`

## Goal and constraints

Produce evidence that local filenames do not grant file access and that application-supplied history changes available context. Do not score the model on whether it hallucinates; score whether the answer is supported by supplied context.

## Tasks

1. Create a random phrase in a temporary file inside the lab workspace. Do not include it in a message.
2. Ask a model what the file contains. Label every claim as evidence, inference, or unsupported.
3. Send request A containing a random nonce. Send independent request B asking for the nonce; omit A from its message vector.
4. Send request C with A, its assistant reply, and the new question in causal order.
5. Compare B and C. Draw the exact bytes/messages that made the nonce available.
6. Inspect the deterministic `full-repair` script and identify the first point at which file content becomes evidence.

**Five-minute checkpoint:** pairs can explain why a responsible refusal and a hallucinated guess both demonstrate that no read occurred.

## Acceptance criteria

- The secret phrase is absent from the first request and trace.
- The report distinguishes unsupported output from observation.
- The second independent call does not rely on hidden memory in the explanation.
- The replayed-history call identifies the earlier user message as its evidence source.

## Hints

1. Conceptual: a path is a string until the harness turns it into an authorized read.
2. Location: inspect the `std::vector<Message>` supplied to `complete`.
3. Near-solution: build two different vectors—B contains only its question; C contains A, assistant A, and C's question.

## Stretch

Add a trace assertion that a final claim about a file must be preceded by a successful `read_file` result for that path.
