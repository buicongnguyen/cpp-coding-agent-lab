# Learner checkpoints

The nine checkpoints form one deterministic chain over the canonical code in `../reference`. The dependency-free materializer creates a runnable learner starter and instructor solution for any stage without maintaining 18 drifting source copies.

```powershell
# Verify the manifest, generated diffs, checksums, chain, and capstone invariant.
node course/scripts/checkpoints.mjs check

# Create both variants under course/run/checkpoints/05_agent_loop/.
node course/scripts/checkpoints.mjs materialize 05_agent_loop

# Create all 18 workspaces, or select just one variant.
node course/scripts/checkpoints.mjs materialize all
node course/scripts/checkpoints.mjs materialize 08_capstone_solution starter

# Build a materialized workspace with the same CMake flow as the reference.
cmake -S course/run/checkpoints/05_agent_loop/solution -B course/run/checkpoints/05_agent_loop/solution/build
cmake --build course/run/checkpoints/05_agent_loop/solution/build --config Debug
```

Each checkpoint directory contains generated `checkpoint.json`, `answer.patch`, and `from_previous.patch` evidence. `manifest.json` is the ordered source of truth; `integrity.json` binds it to every canonical file, the shared `buggy_calculator` fixture, and every materialized workspace. The materializer places that fixture beside `starter` and `solution`, matching the canonical test harness's relative layout. Run `generate` only after an intentional manifest, fixture, or canonical-reference change, then commit the reviewed artifacts.

For checkpoints 01–08, a starter is byte-for-byte the previous instructor solution. The current answer patch unlocks exactly one feature while later features remain fail-closed. Checkpoint 08 is deliberate: its starter does not publish or dispatch `list_files`, while its solution is byte-for-byte the canonical reference.

The canonical `agent_tests` binary is a cumulative final-course suite, so an early materialized solution can build while still failing tests for features that remain locked. Use the checkpoint-specific CTest label in `checkpoint.json` plus the documented release gate; Chapter 2 remains an observational prompt experiment with no automated CTest gate. The complete suite becomes the final checkpoint gate. To inspect or apply the instructor change, use the checkpoint's `answer.patch` against its starter.

| Checkpoint | Learner milestone |
|---|---|
| `00_api_smoke` | Build and obtain one deterministic response |
| `01_messages` | Represent and serialize message history |
| `02_prompt_lab` | Load and compare system prompts |
| `03_tool_schema` | Generate tool definitions and inspect a call |
| `04_tool_dispatch` | Execute validated workspace tools |
| `05_agent_loop` | Run the bounded model/tool loop |
| `06_trace_and_limits` | Trace usage and stop reasons |
| `07_safe_agent` | Pass safety and recovery evaluations |
| `08_capstone_solution` | Add and verify `list_files` |
