# C++ Coding Agent Lab

Build a small, inspectable coding-agent harness in modern C++—from the first model request to a bounded tool loop that can diagnose, edit, build, and test a real project.

This repository is an open course package for experienced C++ developers. It combines a mission-based curriculum with hands-on labs, deterministic challenges, executable traces, assessments, a reference implementation, and an interactive learning website inspired by the clear progression and runnable-code philosophy of [Hello Algo](https://github.com/krahets/hello-algo).

**[Open the interactive course →](https://buicongnguyen.github.io/cpp-coding-agent-lab/)**

## What you will build

Across nine chapters, you will create a C++17 agent harness that can:

- represent system, user, assistant, and tool-result messages;
- expose local capabilities through JSON Schema tool definitions;
- validate and safely dispatch file and process operations;
- feed tool results back into a bounded model loop;
- trace token use, latency, failures, and stop reasons;
- repair a deliberately broken CMake project in deterministic mode;
- make a reviewable change to its own source and prove the result still works.

The course teaches the mechanism directly. No agent framework is required, and every core exercise can run without an API key.

## Start here

1. Open the [published course website](https://buicongnguyen.github.io/cpp-coding-agent-lab/).
2. Choose the one-day workshop or self-paced field-course track in the [learner path](course/LEARNER_PATH.md).
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
| 8 | Self-modification | Reviewed, building agent-generated change |

## Repository structure

```text
course/
  chapters/       lesson manuscripts with current web research
  labs/           student lab handouts
  assessments/    exercises, answer keys, and executable checks
  checkpoints/    cumulative learner-state manifests
  reference/      canonical C++17 agent harness and tests
  fixture/        broken and solved CMake projects
  evals/          deterministic evaluation cases
  instructor/     teaching runbooks and recovery notes
  slides/         concise slide outlines
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

## Deterministic and live modes

Deterministic mode uses scripted model responses and is the default for labs, tests, and CI. It makes the message protocol, dispatcher, safety rules, and loop behavior reproducible.

Live mode is optional. Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`, copy the buggy fixture to a disposable workspace, then follow the live-mode instructions in [course/README.md](course/README.md). Never point the workshop agent at an important working tree.

## Research and maintenance

The course research was verified on 2026-08-08. Each chapter cites current primary documentation where behavior can change. The maintenance schedule and source ownership are recorded in [course/sources/RESEARCH_INDEX.md](course/sources/RESEARCH_INDEX.md).

## Contributing

Corrections, clearer explanations, additional deterministic scenarios, and portability improvements are welcome. Keep changes small, update the relevant lesson and lab together, and run both the teaching-package validator and reference tests before opening a pull request.
