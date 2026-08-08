# Contributing

Thank you for improving the C++ Coding Agent Lab.

## Before changing content

- Read `course/CONTENT_TRACEABILITY.md` to understand the source brief.
- Read `course/LOGIC_REVIEW.md` and `course/CHAPTER_IDEA_REVIEW.md` before changing the course sequence.
- Prefer primary technical sources and record time-sensitive sources in `course/sources/RESEARCH_INDEX.md`.
- Keep deterministic mode sufficient to complete every required learning outcome.

## Before submitting code

Run the course validator and C++ tests:

```powershell
./course/verify_materials.ps1
cmake -S course/reference -B course/reference/build
cmake --build course/reference/build --config Debug
ctest --test-dir course/reference/build -C Debug --output-on-failure
```

Then build the website:

```powershell
cd website
npm ci
npm run check
```

Do not commit generated build directories, local run workspaces, API keys, or `.env` files.

