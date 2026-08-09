# Chapter 4 — Tool execution and result messages

Last verified: 2026-08-09
Class time: 60 minutes  
Checkpoint: `04_tool_dispatch`

## What you'll learn and prove

| Main idea | Clearest formulation | Proof required |
|---|---|---|
| Dispatch pipeline | Parse, validate, authorize, execute, and normalize are distinct stages. | A rejected call fails before its first side effect. |
| Least capability | Expose task-specific operations instead of a general interpreter. | Unsupported actions cannot be encoded or dispatched. |
| Workspace confinement | Normalize and authorize paths against one fixed root. | Absolute, traversal, and symlink escape tests fail. |
| Process execution | Fixed executable/arguments, bounded output/time, and minimal environment reduce authority. | No shell parsing and no model credential in the child. |
| Result semantics | Tool execution status and child-program outcome are different facts. | Nonzero build exit is returned as usable evidence. |
| Correlation | Every result is joined to exactly one model call ID. | The next request contains the original call and matching result. |

The chapter's core transition is from *valid proposal* to *authorized effect*. Every model-controlled value should be considered untrusted until it passes the stage that owns its meaning.

## The failure: correct JSON, dangerous authority

Imagine a perfectly valid call: `run_command({"command":"cmake --build build && upload-secrets"})`. Schema validation could approve the string while the shell interprets multiple actions. The problem is not JSON. It is a capability that is broader than the course goal.

The Chapter 4 learner dispatcher exposes three tools:

- `read_file(path)` reads bounded UTF-8 content.
- `write_file(path, content)` writes a bounded file inside the workspace.
- `run_command(action)` accepts only `configure`, `build`, or `test`.

The canonical final solution also contains `list_files`, but the checkpoint chain keeps its schema and dispatch path locked until Chapter 8. That deliberate absence creates the capstone's vertical change; it is not an undocumented missing feature in this chapter.

The symbolic command enum is one of the course's most important design corrections. It removes shell syntax from model-controlled input. The harness maps each action to a fixed executable and argument vector, starts the process without a shell, enforces timeout/output limits, and reports the exit code.

## The dispatch pipeline

Treat every call as a pipeline:

```text
raw call → parse → shape validation → semantic validation
         → authorization → execution → result envelope → tool message
```

Each stage produces a distinct error. Unknown tool names return `unknown_tool`; malformed fields return `invalid_arguments`; escaped paths return `path_outside_workspace`; a missing parent can return `path_not_found`; a resolved non-file can return `not_a_file`; process timeouts return structured process evidence. Do not convert every problem into an exception string or hide the category from the next model call.

Error codes serve the model, tests, and human reviewer. The message explains the immediate problem; the stable code enables recovery logic and assertions. Do not expose absolute host paths or secret-bearing exception text merely to make an error verbose.

All tools use one application-level envelope:

```json
{"ok":true,"data":{"path":"src/calculator.cpp","content":"..."},"error":null}
```

or:

```json
{"ok":false,"data":null,"error":{"code":"path_outside_workspace","message":"..."}}
```

This envelope sits inside an API-specific tool-result message whose `tool_call_id` matches the assistant request. A process can execute successfully yet return a nonzero program exit code; in that case the tool envelope may be `ok: true` because observation succeeded, while `data.exit_code` is nonzero. The model must use the exit code as build/test evidence.

## Workspace confinement

Path checking is harder than rejecting `..`. Resolve the configured workspace, require a relative input, identify an existing parent for new files, canonicalize it, and verify that the resulting path remains beneath the workspace. Canonicalization must reject a symlink-mediated escape; the listing tool additionally skips symlink entries. Put size limits before allocating or writing. Report paths relative to the workspace so traces are portable.

These controls serve two different goals: authorization and stability. Confinement protects unrelated files. Read/write/list bounds prevent a large repository or generated file from exhausting memory and context.

Walk the authorization algorithm with three inputs:

1. `src/calculator.cpp`: relative input → combine with root → canonical existing path → component-prefix check passes.
2. `../private.txt`: lexical normalization leaves the configured root → component-prefix check fails before open.
3. `src/new.cpp`: file does not exist → canonicalize the existing parent → append the final filename → prefix check passes if the parent is in scope.

Compare path *components*, not string prefixes: `C:\work\app-old` must not be treated as a child of `C:\work\app`. On case-insensitive platforms, comparison rules must match filesystem semantics.

Canonicalization reduces traversal and symlink mistakes but does not eliminate every race between authorization and use. The workshop assumes a trusted, stable fixture. A hostile concurrent filesystem requires stronger primitives such as directory handles, no-follow/open-at-style operations, sandbox mounts, or another platform-specific strategy. State this limitation so students do not mistake a teaching boundary for a complete adversarial filesystem sandbox.

## Process execution

The Windows implementation calls `CreateProcessW`; the POSIX implementation uses `fork`/`exec`. Neither uses a command shell. Both capture combined output with a byte limit, enforce a deadline, and return `exit_code`, `timed_out`, `truncated`, and output. Both construct a small operating-system/toolchain environment allowlist, so the model key and arbitrary parent variables are absent from child processes.

This is still a workshop sandbox, not a security boundary against hostile native build scripts. CMake configuration and tests execute project code. Use a disposable container, VM, or isolated worktree for untrusted repositories and require approval for risky actions in real products.

Direct process creation solves one specific problem: no command shell interprets `&&`, pipes, substitutions, or redirection from model input. It does **not** make the child program harmless. The fixed CMake or CTest executable can run repository-controlled scripts and binaries with the child's OS permissions. Therefore process safety has two layers:

- **Invocation safety:** fixed executable, fixed argument arrays, fixed working directory, bounded deadline/output, and sanitized environment.
- **Workload isolation:** disposable filesystem, restricted identity, resource limits, and network controls appropriate to trust level.

Microsoft's `CreateProcessW` documentation also makes low-level details such as mutable command-line buffers, handle inheritance, environment blocks, and working directories explicit. The reference implementation encapsulates those details in the platform runner so tool policy does not duplicate them. See [CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw).

## Manual round trip

Before adding autonomy, perform one call by hand:

1. Send messages and the `read_file` definition.
2. Capture the assistant tool call.
3. Dispatch the call and print the envelope.
4. Append the assistant message unchanged.
5. Append a `tool` message with the same call ID.
6. Call the model again and inspect its evidence-based answer.

Repeat with a rejected `../outside.txt` path. A good system prompt may discourage the call, but the lab directly invokes the dispatcher so enforcement is proven independently of model behavior.

## Read and write semantics

`read_file` resolves the path, confirms a regular permitted file, checks its size, reads bytes, and returns path/content/size. Decide and document encoding. The workshop treats course sources as UTF-8 text; a production tool should distinguish binary files or return an explicit unsupported-type error.

`write_file` is more consequential. Validate the entire content size before opening the destination. Resolve an existing parent for a new file and ensure its canonical target remains inside the workspace. Return bytes written and relative path. The workshop writes the complete file because it keeps the protocol simple; production editing often disallows every symlink component, uses patches, expected-content hashes, atomic replacement, and approval to avoid redirection or concurrent overwrite.

Repository discovery is deliberately postponed. A broad listing capability changes what the model can observe and needs its own schema, confinement, ordering, symlink, and output-limit tests. Chapter 8 adds that complete slice to the same dispatcher. Until then, an attempted `list_files` call returns `unknown_tool`, which is the correct fail-closed behavior for an unavailable capability.

## Authorization before side effects

Separate “does this call make sense?” from “may this call execute now?” A path may be valid and inside the workspace but still target a protected file. A write may be permitted only after user approval. A test action may be auto-approved for the course fixture but require container isolation for an unfamiliar repository.

One extension point is an authorization callback that receives normalized tool name, validated arguments, effect class, and human-readable preview. It returns allow, deny, or require approval. Keep this decision in the trace, but do not log sensitive content merely to explain it.

Validation must complete before prompting for approval. Users should approve an exact normalized action, not ambiguous raw JSON. Execute that same action after approval; do not reparse mutable text and accidentally authorize one thing while performing another.

Classify effects before choosing an approval rule:

| Effect class | Course example | Default course treatment | Production question |
|---|---|---|---|
| Read-only observation | read workspace text | automatic inside limits | Is the data sensitive or cross-tenant? |
| Reversible local change | write in disposable fixture | allowed for lab | Is there a diff, backup, or expected-content check? |
| Code execution | configure/build/test | fixed actions on trusted fixture | Is repository code isolated from host/network/secrets? |
| External or irreversible | publish/delete/send/spend | not exposed | What exact human approval and downstream authorization apply? |

This is least capability in concrete form: the safest implementation of an unnecessary tool is to omit it.

## Correlation and multiple calls

The workshop disables parallel requests, yet a response parser can still encounter multiple tool calls. If sequential execution is permitted, preserve the order, apply limits to each call, and append exactly one result per ID. A failure in the first call should not silently erase later proposals. Choose whether to stop the batch or return explicit “not executed” results and document the rule.

Never generate a fresh result ID. The provider-supplied call ID is the join key between proposal and observation. Duplicate IDs in one response are invalid. Unknown result IDs are invalid. These are protocol-integrity checks, not model judgment.

## Process evidence in detail

The runner reports one combined bounded output stream for portability. Production systems may preserve stdout/stderr separately and timestamp chunks. It also reports whether termination was caused by the deadline and whether bytes were truncated. A truncated compiler log is not equivalent to a complete one; the agent may need a narrower diagnostic action or targeted file inspection.

Direct process invocation avoids shell metacharacter interpretation but does not make every argument harmless. Fixed argument vectors and a fixed working directory further reduce ambiguity. The reference child receives an explicit operating-system/toolchain environment allowlist, so arbitrary parent credentials—including the model key—are omitted. This still does not isolate the child's filesystem or network identity; stronger isolation needs a restricted identity and sandbox boundary.

On timeout, terminate the process, wait for cleanup, and return structured evidence. Process trees complicate cleanup; the workshop implementation is adequate for a small fixture, while production sandboxes need job objects, process groups, or container-level termination.

Treat `truncated: true` as a qualification on every conclusion. Exit code 1 plus a truncated tail proves failure but may hide the cause. Exit code 0 usually proves the invoked program reported success, yet a truncated log still cannot support claims about every printed warning. The model should request a narrower diagnostic or the harness should provide structured build/test summaries rather than silently assuming omitted text is irrelevant.

## Read one tool result as three separate verdicts

A tool result often contains three verdicts that must not be collapsed into a single `success` flag:

| Verdict | Question | Example evidence |
|---|---|---|
| Authorization | Was this exact normalized effect permitted? | approval record, policy rule, normalized relative path |
| Harness execution | Did the dispatcher obtain a bounded observation? | `ok`, timeout state, truncation state, correlation ID |
| Workload outcome | Did the invoked build or test report the desired result? | process exit code and captured diagnostic |

Consider an approved `build` call whose child process exits with code 1. Authorization succeeded: the policy allowed the fixed build action. Harness execution also succeeded: the process runner started the child, bounded it, captured output, and returned an envelope. The workload failed: the compiler rejected the program. Returning `ok: false` for this entire sequence would throw away the distinction the next model turn needs. Conversely, an exit code of 0 does not prove that an unapproved action should have run. Authorization always precedes the evidence produced by execution.

The distinction becomes especially important when reviewing traces. A human should be able to point to the exact approved parameters, the actual dispatched parameters, and the resulting process record. If those cannot be joined, the trace cannot prove that the approved effect was the one performed. The reference implementation therefore records the call ID, authorization state, status, duration, and structured detail rather than relying on a friendly summary.

Use three authorization values in that trace: `allowed` when a validated effect crossed the policy boundary, `rejected` for an explicit approval denial or an unmet required approval, and `not_evaluated` when validation stopped the request before policy was consulted. Do not infer authorization from the result envelope. A permitted compiler invocation can return a nonzero exit code; conversely, a malformed request never becomes an authorized effect at all.

Treat the child environment as part of the dispatched parameters. Removing only the model-provider key is too narrow because developer machines commonly contain other credentials. The reference runner now constructs an allowlist of the toolchain and operating-system variables required to launch CMake and the compiler; arbitrary parent variables are omitted. The direct unit test inserts a sentinel secret into the parent and proves that the child cannot read it. This is an authority reduction, not complete isolation: a permitted build still runs repository-controlled code with the child's filesystem and network identity. A disposable workspace or container remains necessary for untrusted projects.

Finally, test negative ordering, not merely negative outcomes. A rejected absolute path, traversal, symlink escape, malformed argument object, or denied approval must leave the target unchanged. That assertion demonstrates “rejected before side effect.” A test that checks only the returned error code could pass even if the implementation wrote first and complained afterward. For every effectful path, pair the expected envelope with a filesystem or process observation that proves no earlier stage leaked authority.

## Test the policy without a model

Unit tests should instantiate `ToolDispatcher` over a temporary workspace and invoke calls directly. Cover valid read/write, unknown name (including the not-yet-enabled `list_files`), missing/extra/wrong-type arguments, absolute and relative escape, large content, symlink cases where supported, every action enum, nonzero exit, timeout, and output truncation. Model trials then test tool *selection*, not enforcement. The exact/over-limit listing cases become Chapter 8's focused acceptance tests.

This split is diagnostically powerful. If a direct escape test fails, fix C++ policy. If direct tests pass but live behavior wastes calls, improve descriptions/prompts/evals. If the provider changes call shape, fix the adapter. Each layer has its own evidence.

## Review checkpoint

Choose one successful and one rejected call and reconstruct the pipeline on paper. For each stage, write the input type, output type, and whether any side effect could already have occurred. The rejected call must fail before its first side effect. Then match the result ID to the original proposal and explain every envelope field.

Run the same rejected path with the system instruction removed. The outcome must remain unchanged. Run a known failing build and confirm the opposite nuance: the tool executed successfully, the process returned evidence, and the build itself failed. If learners can explain both cases, they understand authorization failure versus observed program failure.

Retain these two traces side by side. They become the canonical examples for later evals: one asserts prevention before side effect, while the other asserts faithful reporting of an allowed action's unsuccessful outcome.

Both examples must use the same envelope and correlation rules.
Reviewers should reproduce both outcomes independently.

## Current ecosystem

The wire protocol is described in [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling) and the [official OpenAI function-calling guide](https://developers.openai.com/api/docs/guides/function-calling). Security concepts align with OWASP guidance on [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) and [improper output handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/). Recheck API fields and platform-specific process behavior; keep least privilege, deterministic validation, and correlation provider-neutral.

## What you should now be able to explain

- Every stage between receiving a tool call and returning its result.
- Why a nonzero build exit can appear inside a successful tool envelope.
- Why an enum action and direct process API are safer than model-supplied shell text.
- What workspace confinement and size/timeout limits each protect.

Retest process behavior and tool wire fields two weeks and two days before delivery.
