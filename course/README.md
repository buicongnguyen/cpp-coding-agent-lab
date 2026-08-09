# C++ coding-agent workshop package

Choose a delivery route before starting: [one-day workshop or self-paced field course](LEARNER_PATH.md). Both routes use the same chapters and evidence gates; only pacing and facilitation differ.

This directory is the executable course package generated from `Course_Chapter_Production_Plan.md`.

Start with [`CURRICULUM_INDEX.md`](CURRICULUM_INDEX.md) for the complete chapter-by-chapter delivery map. The design corrections that were applied before production are recorded in [`LOGIC_REVIEW.md`](LOGIC_REVIEW.md), [`CHAPTER_IDEA_REVIEW.md`](CHAPTER_IDEA_REVIEW.md) records the second main-idea clarity review, and [`CONTENT_TRACEABILITY.md`](CONTENT_TRACEABILITY.md) maps the supplied brief to the delivered artifacts.

## Package map

- `reference/` — canonical C++17 agent harness and tests.
- `fixture/` — buggy calculator project and clean solution.
- `evals/` — deterministic evaluation cases and runner instructions.
- `checkpoints/` — learner checkpoint manifests.
- `chapters/` — chapter manuscripts.
- `labs/` — student lab handouts.
- `instructor/` — demonstrations, timing, hints, and recovery notes.
- `slides/` — concise slide outlines.
- `assessments/` — questions, answer keys, and executable checks.
- `sources/` — research-maintenance index.

## Build the reference implementation on Windows

Use a Developer PowerShell or set `CMAKE_COMMAND` to an installed CMake executable.

```powershell
cmake -S course/reference -B course/reference/build
cmake --build course/reference/build --config Debug
ctest --test-dir course/reference/build -C Debug --output-on-failure
```

The tests do not require an API key or network access.

Validate the teaching-package structure with:

```powershell
./course/verify_materials.ps1
```

## Run deterministic mode

Copy `course/fixture/buggy_calculator` to a disposable directory, then run:

```powershell
coding_agent --mock --workspace <copy> --scenario full-repair
```

## Run live mode

Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and optionally `COURSE_AGENT_SYSTEM_PROMPT`. Then run:

```powershell
coding_agent --live --workspace <disposable-workspace> --prompt "Build, test, and repair this project."
```

Live mode is intentionally optional. Never point the workshop agent at an important working tree.
