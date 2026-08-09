# Chapter 8 — Self-modification capstone

Last verified: 2026-08-08  
Class time: 50 minutes  
Checkpoint: `08_capstone_solution`

## What you'll learn and prove

| Main idea | Clearest formulation | Completion evidence |
|---|---|---|
| Meaning of self-modification | The running tool edits repository source used by a later build; it does not mutate loaded machine code. | Trace separates current process from later executable. |
| Isolated baseline | Begin from a known green copy/worktree and record its identity. | Baseline commit/hash plus passing tests. |
| Vertical feature slice | A capability spans schema, dispatch, policy, result, trace, tests, and guidance. | Requirement-to-file/test map. |
| Human diff review | Review scope and safety before accepting model claims. | Focused diff with no generated files or secrets. |
| Evidence ladder | Compile, regression tests, focused tests, safety tests, scenario, then human decision. | Every rung occurs after the latest edit. |
| Failure taxonomy | Classify the layer that failed so the next change targets the right cause. | Planning/protocol/policy/implementation/verification/reporting/infrastructure label. |

The capstone combines every earlier boundary. Its value is not that code writes code; ordinary generators already do that. Its value is that students can explain and govern the complete proposal-to-verification chain.

## The puzzle: can the agent safely change itself?

“Self-modification” sounds exotic, but the mechanism is ordinary. The agent process reads its C++ repository, proposes a write, and asks the compiler/tests to evaluate a later build. The running binary does not mutate its own machine code. The educational challenge is maintaining isolation, reviewability, and verification when the target happens to implement the agent.

The capstone adds `list_files` if the learner implementation does not yet have it, or makes a comparable narrow improvement approved by the instructor. Success requires more than a plausible edit.

## Capstone protocol

1. Start from a clean, isolated copy or Git worktree.
2. Record a baseline build and test result.
3. State one narrow requirement and explicit non-goals.
4. Let the agent inspect relevant files.
5. Permit workspace-scoped edits only.
6. Stop before accepting completion and inspect the diff.
7. Build and run deterministic tests.
8. Run one focused behavior check.
9. Review the trace for forbidden or unsupported actions.
10. Keep, amend, or discard the isolated change deliberately.

The instructor solution demonstrates the full ladder: compiles, existing tests pass, a new unit test covers the behavior, the executable demonstrates it, safety tests remain green, and the diff is focused.

Before execution, write a capstone contract:

```text
Goal: add or correct bounded list_files behavior.
In scope: tool definition, dispatcher branch, result fields, focused tests.
Non-goals: broad refactor, new dependency, network access, Git mutation,
           symlink traversal, arbitrary ignore rules.
Required evidence: reviewed diff, build 0, regression tests 0,
                   exact-limit and N+1 tests, escape/symlink checks.
Stop conditions: policy denial, iteration/tool/time budget, baseline failure.
```

This contract lets the reviewer distinguish useful initiative from scope drift.

## Specify a tool end to end

Adding `list_files` crosses every layer:

- tool definition: relative `path`, no extra fields;
- adapter: serialize the definition and parse the call;
- dispatcher: validate the path and traverse within the workspace;
- result: bounded sorted relative paths plus `count` and accurate `truncated`;
- trace: record the call and full envelope;
- tests: empty/small directory, exact limit, over-limit, escape path, and symlink behavior;
- prompt: tell the model when directory discovery is useful.

This checklist exposes partial implementations. A schema without dispatch is advertising a nonexistent capability. Dispatch without a schema is unreachable. A feature without limits can destabilize context. A feature without a test is not durable evidence.

## Review the diff as a human

Ask:

- Does the change implement the requirement and nothing broader?
- Are validation and authorization present at the execution boundary?
- Are error cases structured and correlated?
- Are limits explicit and tested at their boundaries?
- Did secrets, absolute local paths, or generated files enter the diff?
- Does the final report cite actual build/test results?

Do not reward a larger diff for appearing sophisticated. Small, explained changes reduce the review surface.

## Failure taxonomy

Classify the result rather than calling it simply “failed”:

- **planning failure:** irrelevant inspection or misunderstood goal;
- **protocol failure:** malformed/missing tool correlation;
- **policy failure:** forbidden action was attempted or executed;
- **implementation failure:** code does not compile or meet behavior;
- **verification failure:** no recent authoritative test evidence;
- **reporting failure:** final claim contradicts the trace;
- **infrastructure failure:** provider, network, or toolchain unavailable.

This taxonomy indicates where to improve: prompt, adapter, dispatcher, loop, tests, or environment.

## Prepare the isolated baseline

Isolation is useful only if the starting state is known. Create a fresh worktree or copy, record its path, confirm no important uncommitted files are present, and run the deterministic suite. Capture the baseline commit or content hash. If baseline tests fail, stop and repair the environment or use the supplied clean checkpoint; otherwise later attribution is impossible.

The agent receives only the isolated workspace path. Its file dispatcher cannot reach the main working tree. Build outputs stay within the copy. A worktree shares Git object storage, so repository operations still deserve care; the workshop tool set does not expose Git mutation commands.

A Git worktree is isolation of working files, not a security sandbox. Worktrees share the repository's object database and configuration, and code executed by the build still runs with the current OS identity unless separately contained. Use a disposable copy or container when the repository itself is untrusted. The [Git worktree documentation](https://git-scm.com/docs/git-worktree.html) describes linked working trees; it should not be read as a claim of process or credential isolation.

State the requirement and non-goals together. For `list_files`, non-goals include following symlinks, listing directories as results, arbitrary ignore-language support, changing the provider adapter, and refactoring unrelated JSON code. This narrows the search and makes diff review objective.

## Plan before write

Have learners predict the likely touched files and tests. A reasonable plan inspects tool definitions, dispatch routing, existing path resolution, limit configuration, result envelopes, and current unit-test style. The agent may discover that the canonical solution already has the tool; in that case choose the focused truncation correction or add the missing boundary test rather than manufacture a rewrite.

Require evidence before each claim. “There is no list tool” needs inspected definitions. “Paths are safe” needs policy code and tests. “Results are deterministic” needs sorting. “Truncation is accurate” needs exact-limit and over-limit executions.

When a live agent proposes a whole-file write, compare it to the latest read and current disk state. A patch-based production tool would reduce overwrite risk. In this course, complete-file writes stay small and isolated, and human diff review catches unintended changes.

## Boundary-test design

Create temporary workspace files with known names. For a configured maximum `N`:

- zero eligible files → empty array, count 0, not truncated;
- fewer than `N` → all sorted paths, not truncated;
- exactly `N` → all `N`, not truncated;
- `N+1` → exactly `N` returned, truncated true;
- symlink entry → excluded and not traversed;
- nested regular files → workspace-relative normalized paths;
- escape/absolute input → structured rejection.

The exact-limit case catches a subtle implementation that stops when count reaches `N` and assumes more data exists. Correct code must observe an additional eligible entry before reporting truncation. The reference sorts the returned subset, so output order is stable for that subset. When more than `N` files exist, the selected subset may still depend on traversal order; do not claim it is the globally first lexical `N`. A production contract requiring deterministic global selection needs a specified traversal/selection algorithm and a resource bound for discovering candidates.

## Evidence ladder and review gate

Use the ladder in order:

1. **Diff parses as the intended change.** No generated files, credentials, or unrelated formatting churn.
2. **Compilation/link succeeds.** The code is structurally compatible.
3. **Existing tests pass.** No detected regression.
4. **Focused new tests pass.** The requirement and boundaries are exercised.
5. **Safety tests pass.** Escape, symlink, limits, and command policy remain enforced.
6. **Executable scenario succeeds.** The feature participates in a real agent trace.
7. **Human review accepts.** Claims, scope, and evidence agree.

Failure at a rung stops promotion but preserves evidence. The agent may make another bounded attempt if budgets allow. Do not skip directly from plausible diff to live use.

Use `git diff` as a change view, then inspect both content and file status. A text diff may not highlight every operational concern: generated binaries, file-mode changes, renamed files, or untracked files need explicit checks. The official [Git diff documentation](https://git-scm.com/docs/git-diff) describes multiple comparison forms; instructors should state exactly which baseline and worktree are being compared.

Verification commands must run in the same isolated workspace represented by the diff. A green test from another build directory or stale executable is not evidence for this change. Record the working directory, executable path, and elapsed order in the trace.

## Evaluate the final report

A good final report names the modified files, summarizes behavior, lists exact verification actions and outcomes, and calls out remaining limitations. Compare each sentence to the trace. If the report says “all tests” but only the focused executable ran, correct the claim. If it omits a rejected policy attempt, the code may still pass while the reporting rubric fails.

The reviewer makes one of three explicit decisions:

- **Keep:** requirement, scope, evidence, and safety meet the rubric.
- **Amend:** the direction is sound, but a known small correction or test is required.
- **Discard:** change is unsafe, unjustified, overly broad, or not recoverable within the capstone.

This decision belongs to the human-controlled workflow, not to the model that authored the change.

## Extensions after the course

Once the small vertical slice is understood, learners can explore patch tools with expected hashes, read-only search, explicit approval services, Git-aware diff capture, containerized execution, resumable job state, and task-specific evaluators. Add one capability at a time and extend the threat model and eval matrix with it.

Do not begin by adding dozens of tools or a framework abstraction that hides message history. The pedagogical asset is the ability to trace every proposal, decision, action, and verifier. Production sophistication should preserve that explainability.

## Capstone review checkpoint

Present the diff and trace to someone who did not operate the agent. Without verbal repair, that reviewer must identify the requirement, changed layers, rejected actions, and newest verification result. If the reviewer cannot, improve the artifacts or final report before considering the change complete. Then repeat the focused boundary test once outside the agent loop; independent reproduction protects against a trace that looks plausible but was produced in a stale or different workspace.

Archive the accepted diff, test output, and failure classification with the checkpoint manifest. Do not archive credentials, full provider headers, or generated build trees as course evidence.

## From teaching harness to production

The reference agent deliberately omits production concerns such as multi-user authorization, container orchestration, durable job state, rich approvals, incremental streaming, repository-scale indexing, patch-based editing, distributed tracing, and supply-chain controls. The transferable architecture remains: model proposes; orchestrator controls; narrow tools act; deterministic systems verify.

OWASP's current agentic-application guidance is a useful maintenance source because it focuses on actionable design and deployment controls. Treat the threat taxonomy as evolving: preserve the stable principles—least privilege, complete mediation, isolation, approval, traceability, and recovery—while rechecking current named threat categories before each course delivery. See the [OWASP agentic applications guide](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/).

## Current ecosystem

Git worktrees provide an efficient isolated working directory linked to one repository; `git diff` supplies a reviewable change view. Consult [Git worktree](https://git-scm.com/docs/git-worktree.html), [Git diff](https://git-scm.com/docs/git-diff), and the current [OWASP guide to securing agentic applications](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/). Recheck current coding-agent security recommendations. Stable concept: isolate, inspect, deterministically verify, and require human approval before consequential use.

## What you should now be able to explain

- Why this capstone is normal repository editing rather than runtime code mutation.
- Every layer that must change when adding a tool.
- The evidence ladder from compilation to focused behavior and safety tests.
- How diff review and a failure taxonomy make agent output governable.

Retest the capstone on a clean isolated copy two weeks and two days before delivery.
