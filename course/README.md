# C++ coding-agent workshop package

Choose a delivery route before starting: [one-day workshop or self-paced field course](LEARNER_PATH.md). Both routes use the same chapters and evidence gates; only pacing and facilitation differ.

This directory is the executable course package generated from `Course_Chapter_Production_Plan.md`.

Start with [`CURRICULUM_INDEX.md`](CURRICULUM_INDEX.md) for the complete chapter-by-chapter delivery map. The design corrections that were applied before production are recorded in [`LOGIC_REVIEW.md`](LOGIC_REVIEW.md), [`CHAPTER_IDEA_REVIEW.md`](CHAPTER_IDEA_REVIEW.md) records the second main-idea clarity review, and [`CONTENT_TRACEABILITY.md`](CONTENT_TRACEABILITY.md) maps the supplied brief to the delivered artifacts.

## Package map

- `reference/` — canonical C++17 agent harness and tests.
- `fixture/` — buggy calculator project and clean solution.
- `evals/` — executable deterministic evaluation cases E1–E7.
- `checkpoints/` — generated learner starters, instructor solutions, and reviewed diffs.
- `chapters/` — chapter manuscripts.
- `labs/` — student lab handouts.
- `instructor/` — demonstrations, timing, hints, and recovery notes.
- `slides/` — the 70-slide facilitator deck, maintainer generation source, and chapter outlines.
- `assessments/` — questions, answer keys, and executable checks.
- `assets/` and `demos/` — worksheets, raw fixtures, and provenance-labeled traces.
- `scripts/` — checkpoint materialization, deterministic evaluation, capstone capture, and a guarded 15-run live-gate harness.
- `sources/` — research-maintenance index.
- `WRAP_UP.md`, `PILOT.md`, and `DELIVERY_GATES.md` — exit check and honest release gates.

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

Verify or materialize the progressive learner states:

```powershell
node course/scripts/checkpoints.mjs check
node course/scripts/checkpoints.mjs materialize 05_agent_loop starter
```

After building the reference, run the named E1–E7 evaluation cases:

```powershell
node course/scripts/run-evals.mjs --build-dir course/reference/build
```

## Run deterministic mode

Copy `course/fixture/buggy_calculator` to a disposable directory, then run:

```powershell
./course/reference/build/coding_agent --mock --workspace <copy> --scenario full-repair
```

## Run live mode

Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and optionally `COURSE_AGENT_SYSTEM_PROMPT`. Then run:

```powershell
./course/reference/build/coding_agent --live --workspace <disposable-workspace> --prompt "Build, test, and repair this project."
```

The examples above run from the repository root and show a single-config macOS/Linux path. On Windows PowerShell use `.\course\reference\build\coding_agent.exe` for a single-config generator or `.\course\reference\build\Debug\coding_agent.exe` for a multi-config generator.

Live mode is intentionally optional. Never point the workshop agent at an important working tree.

Before an instructor enables live mode, use [`assets/chapter_00/MODEL_SELECTION.md`](assets/chapter_00/MODEL_SELECTION.md) for the dated candidate record and [`assets/chapter_00/LIVE_GATE_RUNBOOK.md`](assets/chapter_00/LIVE_GATE_RUNBOOK.md) for the E1–E5 × three-trial evidence workflow. A no-cost dry run validates the complete execution plan:

```powershell
./course/scripts/run-live-gates.ps1 -DryRun -Trials 3
```
