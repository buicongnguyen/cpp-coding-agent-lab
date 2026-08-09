# Controlled prompt comparison

Keep the user request, case ID, model/mode, sampling settings, and repository state fixed. Change only the system prompt. Deterministic outputs test the comparison workflow; live claims require repeated labeled trials.

| Prompt | Tone | Unsupported assumptions | Evidence requested | Proposed actions | Boundary language | Completion evidence | Calls/tokens/time |
|---|---|---|---|---|---|---|---|
| helpful partner | | | | | | | |
| grumpy reviewer | | | | | | | |
| standards lawyer | | | | | | | |
| evidence-first agent | | | | | | | |

Choose one measurable failure. Create v2 by changing one sentence or policy dimension. Rerun the same case(s), then record an observed difference without saying the prompt guarantees it.

Prompt v1 hash/name: __________  Prompt v2 hash/name: __________

Changed dimension: ______________________________________________

Observed difference and trial count: ______________________________

Enforcement audit: which desired behavior belongs in prompt guidance, tool schema, dispatcher policy, loop policy, or evaluator?
