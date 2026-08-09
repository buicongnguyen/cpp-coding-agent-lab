# Choose your learning path

Last verified: 2026-08-09

This course supports two ways through the same nine-chapter build. Both end with the same tested C++ agent; they differ in pacing and how much explanation happens before the lab.

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

1. Start in a disposable workspace.
2. Find the files named by the checkpoint manifest.
3. Predict which test or trace property should fail before the change.
4. Implement the smallest vertical slice.
5. Run the focused check, then the full reference suite.
6. Compare the result with the canonical implementation only after recording your own reasoning.

## What “done” means

A completed course run leaves four durable artifacts:

- a building and tested C++17 harness;
- a deterministic JSONL trace that another person can reconstruct;
- a safety evaluation showing both allowed and denied actions;
- a focused capstone diff with verification newer than the final edit.

The agent is intentionally not production-ready. The educational result is that you can explain who stores state, who grants authority, what causes each side effect, why the loop continues, and what evidence justifies the final claim.
