# Logic review of the course-production plan

Reviewed: 2026-08-09

## Outcome

The plan had a sound learning progression, but several requirements conflicted with reliable one-day delivery. The issues below were corrected in `Course_Chapter_Production_Plan.md` before production began.

| Issue | Why it mattered | Resolution |
|---|---|---|
| Toolchain setup was inside a 25-minute chapter | Compiler, CMake, account, or network installation can consume the workshop | Installation and account creation are mandatory prework; Chapter 0 verifies and teaches the boundary |
| Every core lab depended on a live model | Provider outages and nondeterminism could prevent course completion | Added deterministic scripted-model mode; live mode is an experiment using the same interface |
| Nine checkpoint copies could drift | Independent fixes would make later chapters disagree with earlier code | A manifest-driven materializer derives every runnable starter, solution, answer patch, and prior-step patch from one canonical reference and verifies hashes/chain identity |
| `run_command(command)` accepted free-form text while the safety text recommended argv execution | Parsing a model-generated command reintroduced shell injection and portability ambiguity | Changed the schema to `run_command(action)` with `configure`, `build`, and `test` mapped to fixed argv arrays |
| About 100 slides were planned for a lab-heavy day | The presentation load contradicted the active-learning format | Reduced chapter targets to 6–10 facilitator slides |
| Chapter 7 introduced four large disciplines in 30 minutes | Safety, reliability, tracing, and evaluation cannot be learned for the first time together | Threaded the topics through earlier chapters and made Chapter 7 their consolidation exercise |
| A final response was defined only as “no tool calls” | An empty malformed response could be accepted as success | Final output must also contain non-empty assistant content |
| The minimum standard allowed an unresolved build failure | That contradicted the course promise of a working agent | Deterministic mode must pass core tests and produce a successful fixture build; only the optional live run may end in a diagnosed provider/model failure |
| Pair roles appeared only in the capstone | Learners would not know how collaboration was meant to work | Added operator/reviewer roles beginning in Chapter 7 and a role switch during the capstone |
| “Resend the whole conversation” was phrased as universal | Current APIs can persist or chain conversation state | Scoped the claim to the workshop’s Chat Completions implementation and retained a current-ecosystem comparison |
| Full self-paced manuscripts conflicted with a lab-heavy one-day schedule | Reading every detail in class would erase build time, while cutting the detail made independent study too shallow | The website now has a concise workshop briefing view and an optional-depth control; self-paced mode retains the complete manuscript |
| Click-only website progress looked like executable verification | A local toggle could not prove that a command or lab actually ran | Progress now requires an editable evidence note and explicit self-attestation, clearly labeled as learner-recorded rather than machine-validated |
| Slide outlines were being counted as a delivered deck | An outline cannot be projected or visually quality-checked | The exact 70-slide chapter allocation is delivered as a rendered PowerPoint deck with retained maintainer generation source; outlines remain speaker-preparation inputs |
| A file-shaped eval suite had no execution path | Named cases could be claimed without running their assertions | E1–E7 map to named CTest labels and a dependency-free case runner |
| Reduced manuscript targets were interpreted as maximums | Chapters 0 and 6 needed more self-paced explanation than their live briefing | Targets are minimum production baselines; the workshop view controls delivery depth rather than deleting reference material |

## Implementation rules derived from the review

1. Network-free tests are the release gate.
2. The live OpenRouter adapter implements the same typed `ModelClient` interface as the scripted adapter.
3. Model-produced values are parsed, validated, and authorized before execution.
4. Child processes receive an allowlisted toolchain environment; tests prove arbitrary parent secrets are absent. This does not claim network or OS isolation.
5. The model selects a symbolic command action; it never supplies a shell command.
6. The course fixture and its clean solution are separate.
7. Chapter examples are captured from executable code or clearly labeled as illustrative.
8. Every chapter must ship with a manuscript, lab, deck section/outline, instructor guide, assessment, runnable checkpoint state, and provenance-labeled demo fixture.
9. Protocol completion, task success, and stop reason remain distinct; source writes invalidate earlier build/test evidence.
