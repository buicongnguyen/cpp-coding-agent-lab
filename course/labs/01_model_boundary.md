# Lab 1 — Prove what the model can observe

Last verified: 2026-08-09 | Time: 25 minutes | Start: `checkpoints/01_messages`

Materialize the learner state from the repository root with `node course/scripts/checkpoints.mjs materialize 01_messages starter`; work only in the generated `course/run/checkpoints/01_messages/starter` copy.

Configure that copy with `cmake -S . -B build` and build with `cmake --build build --config Debug` before running its focused CTest label.

## Goal and constraints

Produce evidence that local filenames do not grant file access and that application-supplied history changes available context. Do not score the model on whether it hallucinates; score whether the answer is supported by supplied context.

## Tasks

1. Create a random phrase in a temporary file inside the lab workspace. Do not read it or include it in a message.
2. Extend the `checkpoint-01` test in `tests/test_main.cpp` with request A containing a random nonce, independent request B asking for it but omitting A, and request C that contains A, an authored assistant reply, and the new question in causal order.
3. Serialize B and C with `message_to_json`. Assert that the nonce is absent from B's bytes and present in C only because A is included; run `ctest --test-dir build -C Debug -L checkpoint-01 --output-on-failure`.
4. Use the provenance-labeled Chapter 1 fixture and `assets/chapter_01/EXPERIMENT_REPORT.md` from the course repository to classify the example assistant claims as evidence, inference, or unsupported. These authored examples illustrate possible responses; the scripted client does not pretend to reason over arbitrary prompts.
5. Draw the exact messages that make the nonce available and mark the temporary file as unavailable evidence.
6. Inspect the later deterministic `full-repair` fixture trace and identify the first successful `read_file` result at which file content becomes evidence.

**Five-minute checkpoint:** pairs can explain why a responsible refusal and a hallucinated guess both demonstrate that no read occurred.

## Acceptance criteria

- The secret phrase is absent from the serialized B request and from every message unless the harness explicitly inserts it.
- The report distinguishes unsupported output from observation.
- The second independent call does not rely on hidden memory in the explanation.
- The replayed-history call identifies the earlier user message as its evidence source.

## Hints

1. Conceptual: a path is a string until the harness turns it into an authorized read.
2. Location: inspect the `std::vector<Message>` supplied to `complete`.
3. Near-solution: build two different vectors—B contains only its question; C contains A, an authored assistant A, and C's question—then search their serialized JSON strings for the nonce.

## Stretch

Add a trace assertion that a final claim about a file must be preceded by a successful `read_file` result for that path.
