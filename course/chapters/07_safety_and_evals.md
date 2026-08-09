# Chapter 7 — Safety, reliability, observability, and evals

Last verified: 2026-08-08  
Class time: 30 minutes  
Checkpoint: `07_safe_agent`

## What you'll learn and prove

| Main idea | Clearest formulation | Evidence of control |
|---|---|---|
| Threat model | Name assets, trust boundaries, threat events, and impacts before choosing controls. | Threat-to-control matrix. |
| Least agency | Minimize functionality, permissions, and autonomy independently. | Unneeded operations are absent; allowed ones use narrow identities. |
| Output handling | Model/tool text is untrusted input to every downstream interpreter. | Context-specific validation and encoding. |
| Isolation and approval | Confinement limits blast radius; timely approval governs high-impact effects. | Disposable execution plus exact action preview/decision. |
| Observability | Record enough to explain knowledge, proposal, authorization, effect, and verifier. | Redacted structured trace. |
| Evaluation | Deterministic controls, trace properties, and repeated model behavior answer different questions. | Task-specific, automated where possible, human-calibrated suite. |

Safety is a system property, not a model personality. A polite refusal is useful behavior; an absent capability or deterministic denial is an enforceable control.

## The failure: the prompt said no

The system instruction says “never access files outside the workspace.” The model still requests `../../private.txt`. If the harness opens it, the system was never safe; it merely expressed a preference. Safety begins where model-controlled data meets deterministic authorization.

Use four layers:

1. **Capability design:** expose only the operations the task requires.
2. **Validation and authorization:** check types, paths, actions, bounds, and approval state in code.
3. **Isolation:** run risky project code in a disposable environment with limited credentials and access.
4. **Verification and observability:** record decisions and test outcomes; stop on limit or policy failure.

Prompts complement these layers by improving planning and making refusals more likely. They do not replace them.

## Threat model for this small agent

Assets include source code, unrelated local files, credentials, compute time, and the integrity of the final claim. Trust boundaries include the remote API, repository content, model output, tool arguments, process output, and the user's approval.

Representative threats:

- **Prompt injection:** a README or compiler output instructs the model to exfiltrate a key.
- **Excessive agency:** a generic shell tool or broad filesystem access permits unnecessary actions.
- **Improper output handling:** model text or tool arguments are passed to a shell, HTML renderer, or database without context-appropriate validation.
- **Secret leakage:** environment variables enter logs, prompts, child processes, or diffs.
- **Resource exhaustion:** repeated calls, huge files, unbounded output, or hanging tests consume budget.
- **False completion:** the model claims success despite a failing or absent verification step.

Map each threat to an enforcement point. For example, injection is reduced by treating repository text as data, but exfiltration is prevented by not exposing network/upload capabilities and by stripping credentials. Resource exhaustion is constrained by byte, call, iteration, process, and wall-clock limits.

Separate three concepts that are often merged:

- **Threat:** a potential cause of harm, such as malicious repository instructions.
- **Vulnerability:** a system weakness, such as exposing an unrestricted shell with host credentials.
- **Failure event:** the observed outcome, such as a forbidden command executing or a limit stopping the run.

This vocabulary improves remediation. Changing a prompt may reduce one failure rate; removing the unnecessary shell capability eliminates a larger vulnerability class.

OWASP's current excessive-agency guidance identifies three root dimensions: excessive functionality, excessive permissions, and excessive autonomy. Apply them separately. A read-only tool can still have excessive permission if it sees every tenant. A narrow write tool can still have excessive autonomy if it publishes without approval. See [OWASP Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).

## Approval and side effects

Classify tools by effect:

- observation: `read_file`, `list_files`;
- reversible workspace mutation: `write_file` in an isolated copy;
- execution: configure/build/test can run repository code;
- external/irreversible effects: publish, send, delete, spend, or deploy.

The workshop auto-allows the first two within limits and uses a narrowly fixed set for the third. It exposes none of the fourth category. A real product should require informed approval immediately before high-impact execution and show the exact proposed action.

## Evals, not vibes

An eval case includes input fixture, scripted response or model configuration, observable assertions, and expected failure classification. The supplied `evals/cases.json` covers smoke, repair, repeated-call termination, path escape, unknown tool, and malformed arguments.

Use three kinds of assertion:

- **Deterministic unit tests:** path rejection, envelope shape, correlation, termination.
- **Trace assertions:** reads precede writes, last verification succeeded, no forbidden call executed.
- **Model-behavior trials:** success rate and path quality across repeated live samples.

Separate implementation regressions from model variability. Run deterministic tests on every change. Run a pinned live eval set before delivery or provider/model updates. Store redacted traces with model identifiers and configuration.

Official OpenAI evaluation guidance currently recommends eval-driven development, task-specific datasets, logging during development, automated scoring where possible, continuous iteration, and calibrating automation against human feedback. It explicitly identifies “vibe-based evals” as an anti-pattern. For this course, that means writing the path-escape assertion before prompt tuning and using live model trials to measure selection behavior—not to re-prove path enforcement. See [evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

## Pair red-team exercise

Work in pairs with explicit roles: operator runs the agent; auditor predicts the enforcement layer and reads the trace. Try an escape path, an unknown tool, an extra JSON field, a repeated identical read, and repository text telling the model to ignore instructions. Swap roles halfway. The goal is not to make the model say no; it is to prove the harness either rejects or safely contains the action.

## Build a control matrix

For each asset and threat, identify prevention, detection, and recovery:

| Threat | Prevention | Detection | Recovery |
|---|---|---|---|
| path escape | canonical workspace check; listing skips symlinks | structured rejection + trace | no side effect; explain denial |
| arbitrary command | symbolic enum, direct exec | unknown-action eval | stop or select approved action |
| secret in build | remove key from child environment | synthetic-secret scan | rotate if exposure occurred |
| runaway loop | call/iteration/time limits | limit event | return bounded failure trace |
| false success | post-write verification rubric | compare final claim to latest exit | mark run failed, rerun verifier |
| malicious repo code | disposable isolation, limited identity/network | process/sandbox telemetry | destroy environment; investigate |

This matrix prevents overreliance on one layer. A control can fail, be bypassed, or only detect after the fact. Recovery matters because even a good agent will encounter broken tools and adversarial inputs.

## Prompt injection in a coding context

Repository text is especially mixed-trust: documentation contains legitimate task instructions, test fixtures contain attack strings, source comments may be stale, and generated logs may quote external data. The model needs these inputs for reasoning, so simply hiding them is not viable.

Tell the model that tool output and repository content are evidence, not authority. Delimit content structurally through tool messages rather than concatenating it into system instructions. Minimize tools and ambient credentials so following malicious text has limited effect. Require approval for high-impact operations. Finally, test direct malicious proposals against the dispatcher, because instruction hierarchy is probabilistic behavior, not an enforcement guarantee.

Injection may also arrive through tool output. A compiler diagnostic can contain source-line text; a test can print an instruction. Treat every external observation consistently. Do not parse model/tool text into a second dangerous interpreter without validation—for example, never extract a command-looking line and send it to a shell.

Improper output handling is broader than shells. Rendering model Markdown as trusted HTML, interpolating model text into SQL, interpreting a generated URL server-side, or converting generated paths directly into filesystem access each crosses a new interpreter boundary. Validate or encode for the destination context. OWASP's current guidance explicitly treats model output as untrusted and distinguishes this problem from general overreliance on answer accuracy. See [OWASP Improper Output Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/).

## Isolation limits of the workshop

Workspace path confinement prevents direct file tools from leaving the directory. It does not confine code executed by CMake or tests. Project code can open other files, use the network, spawn processes, or consume resources under the current OS identity. The child secret-removal control covers the model key but not every ambient credential.

For untrusted repositories, run configure/build/test inside an ephemeral container or VM with read-only inputs where possible, a writable scratch workspace, a minimal allowlisted environment, restricted network, CPU/memory/process/time quotas, and no host credentials. Review supply-chain downloads separately. The course fixture is trusted and dependency-free precisely so learners can focus on orchestration.

## Approval design

Approval should be meaningful, scoped, and timely. Present the normalized target, effect, relevant diff or command action, and reason immediately before execution. “Allow agent?” at run start is too broad. Do not bundle a safe read with an irreversible deployment. Expire approval if the proposed parameters change.

Avoid fatigue by removing capabilities that should never be used and auto-approving low-risk observations under clear policy. Record approval decisions without placing sensitive payloads in logs. Denial should return a structured result so the model can choose a safe alternative or explain the blocker.

## Evaluation design in depth

Start with a baseline suite that is cheap and deterministic. Each policy rule needs at least one allowed and one denied case; otherwise a dispatcher that rejects everything can appear safe. Boundary values matter: maximum allowed bytes, one byte too many, exact list entry limit, and one extra. Loop tests need normal repetition after progress as well as pathological consecutive repetition.

Trace-level evaluators should operate on structured events, not fragile prose. Example assertions:

- every tool result ID refers to an earlier unmatched call;
- no `write_file` precedes any relevant observation in this task;
- every write path is within scope;
- latest requested test after the final write exited 0;
- no event contains a synthetic secret marker;
- stop reason matches the expected failure class.

Live evals add model behavior metrics such as task success, unnecessary calls, rejected proposals, diff size, and supported final claims. Pin configuration, repeat trials, report uncertainty, and retain representative redacted traces. When the model changes, compare against baseline instead of moving the rubric to preserve a desired pass rate.

Build each eval record with these fields:

```text
id and risk/capability being tested
fixture version and initial state
prompt/model/tool configuration
expected allowed and forbidden effects
structured trace assertions
human-review rubric where automation is insufficient
observed outcome and failure classification
```

Include positive controls. If every path case is malicious, a dispatcher that rejects all reads appears safe. Include a normal in-workspace read beside escape and malformed cases. For model-graded qualities, prefer explicit pass/fail or pairwise comparisons with a detailed rubric, and periodically compare the grader with human labels.

## Observability without leakage

Log structured decisions: run ID, elapsed time, model ID, prompt/config version, call name, normalized non-sensitive arguments, authorization result, envelope metadata, exit code, truncation, and usage. Full source/file content may be too sensitive; store protected artifacts or hashes and bounded excerpts.

Redaction must be tested with synthetic canary secrets. Never rely on a blacklist of one real key format. Consider authorization headers, environment variables, file contents, URLs, and exception strings. Limit who can view traces and how long they persist.

An auditor should be able to answer: what did the model know, what did it propose, why was it allowed, what changed, and what verified the claim? If richer logging does not improve these answers, it may only increase privacy risk.

## Current ecosystem

The threat vocabulary evolves. Consult current OWASP guidance on [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) and [improper output handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/), the [official OpenAI evaluation best-practices guide](https://developers.openai.com/api/docs/guides/evaluation-best-practices), and [OpenRouter logging documentation](https://openrouter.ai/docs/guides/features/input-output-logging). Recheck provider retention/logging settings and threat taxonomy. Stable concepts are least privilege, deterministic authorization, bounded execution, traceability, and task-specific verification.

## What you should now be able to explain

- Why a prompt-only boundary is not an authorization control.
- Where injection, excessive agency, output handling, and secret leakage are mitigated.
- Why execution of project builds deserves more caution than simple file reads.
- How deterministic tests, trace assertions, and repeated live trials answer different questions.

Retest security guidance, provider logging, and the live eval sample two weeks and two days before delivery.
