# C++ Coding Agent Lab

Build a small, inspectable coding-agent harness in modern C++—from the first model request to a bounded tool loop that can diagnose, edit, build, and test a real project.

This repository is a finalized deterministic self-paced course package for experienced C++ developers. It combines a mission-based curriculum with hands-on labs, progressive runnable checkpoints, deterministic challenges, executable traces, assessments, a reference implementation, and an interactive learning website inspired by the clear progression and runnable-code philosophy of [Hello Algo](https://github.com/krahets/hello-algo). The planned live-provider and pilot-tested classroom modes were explicitly skipped and are not claimed by this release.

**[Open the interactive course →](https://buicongnguyen.github.io/cpp-coding-agent-lab/)**

## What you will build

Across nine chapters, you will create a C++17 agent harness that can:

- represent system, user, assistant, and tool-result messages;
- expose local capabilities through JSON Schema tool definitions;
- validate and safely dispatch file and process operations;
- feed tool results back into a bounded model loop;
- trace token use, latency, failures, and stop reasons;
- repair a deliberately broken CMake project in deterministic mode;
- isolate and verify a reviewable change to the agent source while keeping model authorship and human approval claims explicit.

The course teaches the mechanism directly. No agent framework is required, and every core exercise can run without an API key.

## Start here

1. Open the [published course website](https://buicongnguyen.github.io/cpp-coding-agent-lab/).
2. Follow the verified self-paced field-course track in the [learner path](course/LEARNER_PATH.md); the unpiloted workshop plan is retained for future facilitators.
3. Follow chapters 0–8 in order; each mission includes a lesson, lab, challenge, and evidence checkpoint.
4. Build and test the reference harness:

```powershell
cmake -S course/reference -B course/reference/build
cmake --build course/reference/build --config Debug
ctest --test-dir course/reference/build -C Debug --output-on-failure
```

5. Validate the teaching package:

```powershell
./course/verify_materials.ps1
```

6. Verify the no-drift learner-state chain and run the evaluation suite:

```powershell
node course/scripts/checkpoints.mjs check
node course/scripts/run-evals.mjs --build-dir course/reference/build
```

For the complete instructor delivery map, see [course/CURRICULUM_INDEX.md](course/CURRICULUM_INDEX.md).

## Course map

| Chapter | Focus | Primary artifact |
|---:|---|---|
| 0 | Environment and preflight | Deterministic API smoke test |
| 1 | The model boundary | Evidence of what a model can and cannot observe |
| 2 | Instructions and message roles | Controlled prompt experiment |
| 3 | Tool definitions | Valid `read_file` schema and tool request |
| 4 | Tool execution | Validated three-tool dispatcher |
| 5 | Bounded agent loop | Deterministic repair run |
| 6 | Context and cost | Annotated execution trace |
| 7 | Safety and evaluation | Red-team and recovery results |
| 8 | Self-modification | Isolated, reviewable source change with passing tests |

## Repository structure

```text
course/
  chapters/       lesson manuscripts with current web research
  labs/           student lab handouts
  assessments/    exercises, answer keys, and executable checks
  checkpoints/    generated runnable starters, solutions, and reviewed diffs
  reference/      canonical C++17 agent harness and tests
  fixture/        broken and solved CMake projects
  evals/          executable deterministic evaluation cases E1–E7
  instructor/     teaching runbooks and recovery notes
  slides/         70-slide PowerPoint deck, maintainer generation source, and outlines
  assets/         worksheets, policies, setup, and capstone review forms
  demos/          provenance-labeled captured and authored traces
website/          GitHub Pages learning portal
.github/workflows continuous validation and Pages deployment
```

## Run the learning website locally

```powershell
cd website
npm install
npm run dev
```

The website reads the course Markdown during its build, so lesson content is maintained in one place. A production build is available through `npm run build`.

The website also embeds the reference executable's deterministic repair trace. Learners can scrub through model requests, tool proposals, correlated results, failures, edits, and final verification without relying on a live provider.

## Deterministic release and retained live extension

Deterministic mode uses scripted model responses and is the default for labs, tests, and CI. It makes the message protocol, dispatcher, safety rules, and loop behavior reproducible.

The source retains an optional OpenRouter adapter and guarded capture workflow for future extension, but live mode is not validated or supported by this finalized release. Re-enabling it requires satisfying the skipped gates in [course/DELIVERY_GATES.md](course/DELIVERY_GATES.md). Never point the agent at an important working tree.

## Research and maintenance

The chapter research baseline was verified on 2026-08-09 and the cross-chapter maintenance sweep was refreshed on 2026-08-10. Each chapter cites current primary documentation where behavior can change. The maintenance schedule, review outcomes, and source ownership are recorded in [course/sources/RESEARCH_INDEX.md](course/sources/RESEARCH_INDEX.md). Live provider, pricing, and classroom checks remain date-of-delivery gates rather than claims embedded in the deterministic package.

## Contributing

Corrections, clearer explanations, additional deterministic scenarios, and portability improvements are welcome. Keep changes small, update the relevant lesson and lab together, and run both the teaching-package validator and reference tests before opening a pull request.
