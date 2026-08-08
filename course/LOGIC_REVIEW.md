# Logic review of the course-production plan

Reviewed: 2026-08-08

## Outcome

The plan had a sound learning progression, but several requirements conflicted with reliable one-day delivery. The issues below were corrected in `Course_Chapter_Production_Plan.md` before production began.

| Issue | Why it mattered | Resolution |
|---|---|---|
| Toolchain setup was inside a 25-minute chapter | Compiler, CMake, account, or network installation can consume the workshop | Installation and account creation are mandatory prework; Chapter 0 verifies and teaches the boundary |
| Every core lab depended on a live model | Provider outages and nondeterminism could prevent course completion | Added deterministic scripted-model mode; live mode is an experiment using the same interface |
| Nine checkpoint copies could drift | Independent fixes would make later chapters disagree with earlier code | One canonical reference implementation generates or validates checkpoint manifests |
| `run_command(command)` accepted free-form text while the safety text recommended argv execution | Parsing a model-generated command reintroduced shell injection and portability ambiguity | Changed the schema to `run_command(action)` with `configure`, `build`, and `test` mapped to fixed argv arrays |
| About 100 slides were planned for a lab-heavy day | The presentation load contradicted the active-learning format | Reduced chapter targets to 6–10 facilitator slides |
| Chapter 7 introduced four large disciplines in 30 minutes | Safety, reliability, tracing, and evaluation cannot be learned for the first time together | Threaded the topics through earlier chapters and made Chapter 7 their consolidation exercise |
| A final response was defined only as “no tool calls” | An empty malformed response could be accepted as success | Final output must also contain non-empty assistant content |
| The minimum standard allowed an unresolved build failure | That contradicted the course promise of a working agent | Deterministic mode must pass core tests and produce a successful fixture build; only the optional live run may end in a diagnosed provider/model failure |
| Pair roles appeared only in the capstone | Learners would not know how collaboration was meant to work | Added operator/reviewer roles beginning in Chapter 7 and a role switch during the capstone |
| “Resend the whole conversation” was phrased as universal | Current APIs can persist or chain conversation state | Scoped the claim to the workshop’s Chat Completions implementation and retained a current-ecosystem comparison |

## Implementation rules derived from the review

1. Network-free tests are the release gate.
2. The live OpenRouter adapter implements the same typed `ModelClient` interface as the scripted adapter.
3. Model-produced values are parsed, validated, and authorized before execution.
4. The child process never receives `OPENROUTER_API_KEY`.
5. The model selects a symbolic command action; it never supplies a shell command.
6. The course fixture and its clean solution are separate.
7. Chapter examples are captured from executable code or clearly labeled as illustrative.
8. Every chapter must ship with a manuscript, lab, slide outline, instructor guide, and assessment.

