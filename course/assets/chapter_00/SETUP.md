# Chapter 0 setup and preflight

Complete installation before class; classroom time is for verification and the API boundary.

## Required baseline

- Git 2.x, CMake 3.24 or newer, and a C++17 compiler.
- Windows: Visual Studio Build Tools 2022 or newer with Desktop development with C++.
- macOS: current Xcode Command Line Tools.
- Linux: GCC 11+ or Clang 14+, Make or Ninja.
- Optional live track: an OpenRouter account and `OPENROUTER_API_KEY` set only in the current user/session environment.

Never paste the key into source, a `.env` committed to Git, a prompt, a screenshot, or a trace. Deterministic mode is sufficient for core completion.

The dated public-catalog review in [`MODEL_SELECTION.md`](MODEL_SELECTION.md) currently selects `openai/gpt-5.4-mini` as the primary candidate and `google/gemini-2.5-flash` as the independent fallback candidate. Catalog presence is not a successful live test: instructors must run the authenticated preflight and the 15-run E1–E5 gate before promoting either candidate for delivery.

## Build and verify

From `course/reference`:

```text
cmake -S . -B build
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure
```

Executable locations vary by generator. Multi-config generators usually place them in `build/Debug`; single-config generators usually use `build`.

Run the deterministic preflight first. Choose the path created by your generator:

```text
# single-config macOS/Linux
./build/agent_preflight

# single-config Windows PowerShell
.\build\agent_preflight.exe

# multi-config Windows PowerShell
.\build\Debug\agent_preflight.exe
```

Expected evidence: exit code 0, C++ standard at least 201703, non-empty scripted assistant content, model metadata, and no credential value.

Optional live check:

```text
./build/agent_preflight --live                 # single-config macOS/Linux
.\build\agent_preflight.exe --live            # single-config Windows PowerShell
.\build\Debug\agent_preflight.exe --live      # multi-config Windows PowerShell
```

Record only OS, compiler/CMake versions, requested and returned model, HTTP status category, finish reason, token counts, and elapsed time. Do not record headers or the key.

After preflight, follow [`LIVE_GATE_RUNBOOK.md`](LIVE_GATE_RUNBOOK.md) to capture the required three trials for each live-capable E1–E5 case. The runner writes only under ignored `course/run/` and refuses release-mode execution without a key, model, and exactly three trials.

## Platform notes

- If `cmake` is missing, repair installation/PATH before diagnosing the agent.
- On Windows, use a Developer PowerShell when `cl` is installed but not discoverable.
- On macOS, accept the Xcode license and run `xcode-select --install` if no compiler is available.
- On Linux, install build tools through the distribution package manager before the workshop; the lab must not depend on an in-class network download.
- If deterministic tests pass but live preflight fails, classify the problem as credential, transport, provider, model-selection, or response-schema—not as a compiler failure.

## Evidence record

```text
OS / version:
Compiler / version:
CMake / version:
Deterministic preflight exit:
CTest result:
Live attempted? yes/no:
Requested model (no secrets):
Returned model (if any):
Failure category (if any):
```
