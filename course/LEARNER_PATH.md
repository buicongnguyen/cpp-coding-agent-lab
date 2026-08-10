# Choose your learning path

Last verified: 2026-08-09

Release scope: the deterministic self-paced route is fully verified and supported. The one-day workshop route is retained as a facilitation plan only; its two-person pilot, measured activity ratio, and classroom/event-time gates were skipped by owner on 2026-08-10, so it is not claimed as pilot-tested or classroom-ready.

The repository retains two ways through the same nine-chapter build. Both use the same tested deterministic C++ agent; only the self-paced route is release-validated, while the workshop route differs in pacing and facilitation and remains unpiloted.

## One-day workshop

Choose this path when an instructor is guiding the room. Treat each chapter as a mission briefing followed by a build sprint.

1. Read the chapter mission and predict the failure.
2. Follow the instructor's short mechanism walkthrough.
3. Complete the timed lab with an operator and reviewer.
4. Run the proof command before moving on.
5. Use the full lesson later as reference and reinforcement.

The workshop is 390 instructional minutes, excluding lunch and breaks. Installation and account creation belong in prework; deterministic mode means a provider outage cannot block the core course.

## Self-paced field course

Choose this path when learning independently. Budget roughly 11–13 hours and complete all four activities in every chapter:

| Activity | Learner action | Evidence |
|---|---|---|
| Lesson | Explain the mechanism and its boundary | Written prediction or trace annotation |
| Lab | Build or inspect the chapter capability | Changed source, recorded experiment, or dispatcher result |
| Challenge | Answer concept and trace questions | Reasoning checked against the hidden answer key |
| Checkpoint | Run the chapter release gate | Current build, test, or trace output |

Do not mark a chapter complete because the prose feels familiar. Completion means you can point to current evidence produced after the latest relevant change.

## The repeating chapter rhythm

Every chapter follows the same learning loop:

```text
failure → prediction → mechanism → implementation → evidence → reflection
```

- **Failure** creates a concrete reason to learn the next boundary.
- **Prediction** makes the learner commit to a mental model before seeing the result.
- **Mechanism** connects messages, C++ state, policy, and local effects.
- **Implementation** adds one capability and one control.
- **Evidence** comes from deterministic tests or a structured trace.
- **Reflection** explains what the new layer guarantees—and what it still does not.

## How to use the reference implementation

The reference code is an executable map, not an answer to copy blindly. For each lab:

1. From the repository root, run `node course/scripts/checkpoints.mjs materialize <checkpoint> starter`; the generated disposable workspace appears under `course/run/checkpoints/`.
2. Read the checkpoint's `checkpoint.json` and named files before changing them.
3. Predict which test or trace property should fail before the change.
4. Implement the smallest vertical slice.
5. Run the focused check, then the full reference suite.
6. Compare the result with the canonical implementation only after recording your own reasoning.

Run `node course/scripts/checkpoints.mjs check` whenever the canonical source or checkpoint artifacts change. The website's evidence note is a local learning journal with explicit self-attestation; it does not inspect your filesystem or execute the proof command for you.

## What “done” means

A completed course run leaves four durable artifacts:

- a building and tested C++17 harness;
- a deterministic JSONL trace that another person can reconstruct;
- a safety evaluation showing both allowed and denied actions;
- a focused capstone diff with verification newer than the final edit.

The agent is intentionally not production-ready. The educational result is that you can explain who stores state, who grants authority, what causes each side effect, why the loop continues, and what evidence justifies the final claim.
