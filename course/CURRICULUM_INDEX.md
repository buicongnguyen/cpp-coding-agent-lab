# Curriculum delivery index

Last verified: 2026-08-09

This is the instructor's front door to the executed course. Each row links the manuscript, hands-on lab, instructor runbook, chapter deck outline, assessment, and materialized learner state. The canonical C++ implementation is in `reference/`; `scripts/checkpoints.mjs` generates runnable starters and solutions without maintaining duplicate source trees.

| Chapter | Manuscript | Lab | Instructor | Slides | Assessment | Checkpoint |
|---|---|---|---|---|---|---|
| 0. Environment and preflight | [Read](chapters/00_environment.md) | [Lab](labs/00_environment.md) | [Guide](instructor/00_environment.md) | [Slides](slides/00_environment.md) | [Check](assessments/00_environment.md) | [State](checkpoints/00_api_smoke/README.md) |
| 1. The dumb-model problem | [Read](chapters/01_model_boundary.md) | [Lab](labs/01_model_boundary.md) | [Guide](instructor/01_model_boundary.md) | [Slides](slides/01_model_boundary.md) | [Check](assessments/01_model_boundary.md) | [State](checkpoints/01_messages/README.md) |
| 2. Instructions and roles | [Read](chapters/02_prompts_and_roles.md) | [Lab](labs/02_prompts_and_roles.md) | [Guide](instructor/02_prompts_and_roles.md) | [Slides](slides/02_prompts_and_roles.md) | [Check](assessments/02_prompts_and_roles.md) | [State](checkpoints/02_prompt_lab/README.md) |
| 3. Tool definitions | [Read](chapters/03_tool_definitions.md) | [Lab](labs/03_tool_definitions.md) | [Guide](instructor/03_tool_definitions.md) | [Slides](slides/03_tool_definitions.md) | [Check](assessments/03_tool_definitions.md) | [State](checkpoints/03_tool_schema/README.md) |
| 4. Tool execution | [Read](chapters/04_tool_execution.md) | [Lab](labs/04_tool_execution.md) | [Guide](instructor/04_tool_execution.md) | [Slides](slides/04_tool_execution.md) | [Check](assessments/04_tool_execution.md) | [State](checkpoints/04_tool_dispatch/README.md) |
| 5. Agent loop | [Read](chapters/05_agent_loop.md) | [Lab](labs/05_agent_loop.md) | [Guide](instructor/05_agent_loop.md) | [Slides](slides/05_agent_loop.md) | [Check](assessments/05_agent_loop.md) | [State](checkpoints/05_agent_loop/README.md) |
| 6. Context and cost | [Read](chapters/06_context_and_cost.md) | [Lab](labs/06_context_and_cost.md) | [Guide](instructor/06_context_and_cost.md) | [Slides](slides/06_context_and_cost.md) | [Check](assessments/06_context_and_cost.md) | [State](checkpoints/06_trace_and_limits/README.md) |
| 7. Safety and evals | [Read](chapters/07_safety_and_evals.md) | [Lab](labs/07_safety_and_evals.md) | [Guide](instructor/07_safety_and_evals.md) | [Slides](slides/07_safety_and_evals.md) | [Check](assessments/07_safety_and_evals.md) | [State](checkpoints/07_safe_agent/README.md) |
| 8. Self-modification | [Read](chapters/08_self_modification.md) | [Lab](labs/08_self_modification.md) | [Guide](instructor/08_self_modification.md) | [Slides](slides/08_self_modification.md) | [Check](assessments/08_self_modification.md) | [State](checkpoints/08_capstone_solution/README.md) |

Facilitate from [`slides/Coding_Agent_Workshop.pptx`](slides/Coding_Agent_Workshop.pptx), then close the day with [`WRAP_UP.md`](WRAP_UP.md). Before delivery, run `verify_materials.ps1`, `node scripts/checkpoints.mjs check`, the reference tests, E1–E7, and deterministic `agent_preflight`; then review [`DELIVERY_GATES.md`](DELIVERY_GATES.md) and `sources/RESEARCH_INDEX.md`. Retest live-provider examples two weeks and two days before class.
