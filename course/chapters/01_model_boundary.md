# Chapter 1 — The “dumb model” problem

Last verified: 2026-08-09
Class time: 40 minutes  
Checkpoint: `01_messages`

## What you'll learn and prove

| Main idea | Clearest formulation | Common confusion to remove |
|---|---|---|
| Observation boundary | A model can use only content made available through the selected request, state, or tool mechanism. | Naming a path is not reading it. |
| Evidence versus inference | Evidence has provenance; inference is a fallible conclusion drawn from it. | A plausible answer is not an observation. |
| Conversation state | State is supplied, referenced, or stored by an API/application; it is not magical unlimited memory. | “Stateless model” does not mean every modern API is stateless. |
| Freshness | Evidence can become stale after a write or external change. | A previous passing test does not verify a later edit. |
| Hallucination control | Design claims and actions so deterministic evidence can confirm or falsify them. | A stronger prompt alone cannot create missing access. |

The chapter's central question is therefore not “Is the model smart?” It is “What information was actually available when this sentence or action was generated?”

## The failure: a confident guess about a file

Create `secret.txt` with a random phrase after the model was trained. Ask, “What exactly is in my local `secret.txt`?” A fluent answer may sound like a read operation, but no file bytes crossed the API boundary. The honest answer is that the content is unavailable. This experiment is not a trick about intelligence. It identifies the model's observation boundary.

An LLM call consumes the request context supplied by the application. A filename inside a user message is text, not a filesystem capability. A model can infer common project layouts, recognize likely code, or invent plausible contents; none of those activities is observation. A coding agent becomes useful only when the harness deliberately supplies relevant bytes or offers a constrained tool that can obtain them.

## Evidence, inference, and action

Use three labels while reading model output:

- **Evidence:** present in a message or tool result in the current context.
- **Inference:** a conclusion drawn from evidence, with uncertainty.
- **Action request:** a structured proposal for the harness to evaluate.

“The compiler reports a missing semicolon on line 4” can be evidence if the compiler output was returned. “The header probably declares the function” is inference until a file is read. `read_file({"path":"include/calculator.hpp"})` is an action request, not proof that the file was read.

Use a four-question evidence test for every important statement:

1. **Provenance:** which exact message or tool result contains the supporting information?
2. **Freshness:** did that evidence occur after the latest relevant mutation?
3. **Completeness:** was output truncated, filtered, summarized, or limited to one file?
4. **Falsifiability:** what compiler, test, or additional observation could show the conclusion is wrong?

For example, “division is wrong because `static_cast<int>` truncates” has file provenance and is a reasonable inference. It is not yet a verified repair. A focused test using `5.0 / 2.0` can falsify or confirm the behavioral conclusion in the actual build.

The harness should preserve that distinction in its trace. Each tool call has an ID; each result names that ID. Without correlation, the model could associate a compiler result with the wrong request, especially if more than one call is present.

## Stateless calls and application-owned history

Run two independent requests. In the first, tell the model a nonce such as `BLUE-7319`. In the second, ask for it without resending the first exchange. With a stateless chat-completions call, the provider receives only the second request, so the earlier value is absent. Now resend a message vector containing the original user message, assistant reply, and new question. The value is available because the application supplied history.

This reveals a crucial responsibility: “the conversation” may be an application data structure. Our `std::vector<Message>` is the source of truth in the workshop. Every iteration serializes the relevant history. Later APIs may store or reference state server-side, but the model still works from context made available through that API's mechanism.

History also explains why agents can recover. After a tool fails, the harness appends a structured error result. On the next model call, the model can inspect that evidence and choose another path. If the application forgets the result, recovery becomes guessing.

### Three current ways context may be carried

The phrase “send the whole conversation every time” is correct for this workshop's explicit Chat Completions implementation, but it is not universal. Current APIs commonly expose at least three patterns:

| Pattern | Application sends | Main engineering consequence |
|---|---|---|
| Explicit history | The relevant ordered message array on every call | Maximum visibility and portability; repeated input grows. |
| Chained response | New input plus a previous-response identifier | Simpler continuation; provider retention and billing rules matter. |
| Durable conversation | A conversation identifier whose items include messages, calls, and outputs | State can span sessions or jobs; lifecycle, access, and deletion need governance. |

Official OpenAI documentation currently describes both `previous_response_id` chaining and a Conversations API whose durable items may include messages, tool calls, and tool outputs. It also notes that prior input tokens in a chained response remain billed input and documents distinct retention behavior. These are API behaviors to recheck, not assumptions to transfer to OpenRouter. The stable lesson is that some application or API mechanism must make context available. See [conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

## Hallucination as an interface problem

Model quality matters, but application design determines whether unsupported claims can produce damage. Ask for citations from supplied evidence. Require inspection before edits. Treat prompt prose as guidance and tool policy as enforcement. Verify important outcomes with compilers and tests rather than with a model's declaration of success.

The right response to hallucination is not “write one perfect prompt.” It is to design an evidence loop:

1. Request a goal.
2. Let the model request bounded observations.
3. Return exact results.
4. Permit narrow changes.
5. Run deterministic verification.
6. Accept completion only when the trace contains the required evidence.

The scripted `full-repair` scenario embodies this sequence. It configures and builds to obtain a real diagnostic, reads the implicated source, repairs the compile error, reruns the build, runs tests, reads the failing test, repairs the behavioral defect, rebuilds, and runs tests again. The model's final text is not the acceptance criterion; the latest tool results are.

## Context is a constructed view, not the world

It is useful to think of a request as a temporary evidence room. The harness chooses which messages, tool definitions, summaries, and retrieved bytes enter that room. The model cannot look through the walls. It can reason richly over what is inside and use learned background knowledge, but learned knowledge is neither current local state nor permission.

This distinction clarifies several common coding-agent behaviors. A model may correctly predict that a CMake project contains `CMakeLists.txt`; that remains a guess until the listing is supplied. It may remember the standard signature of `std::accumulate`; that can help interpret observed code, but it cannot establish which overload a local file uses. It may say a build will pass after an edit; only a later build result establishes the actual outcome in this environment.

Observation has freshness as well as provenance. If the agent reads `calculator.cpp`, writes a new version, then reasons from the old read result, the content was once evidence but is no longer authoritative. A robust trace lets reviewers ask not only “Was this observed?” but “Was it observed after the latest mutation?” The capstone rubric uses the same idea for tests: a passing test before an edit does not verify the edit.

## Design the secret-file experiment carefully

Use an unpredictable nonce, created after the request scenario is prepared. Search the outgoing JSON to prove the nonce is absent. Record the filename, request, model output, and local file separately. If the model guesses the phrase incorrectly, classify it as unsupported. If it refuses, classify the response as responsible but still unsupported about the actual contents. If it somehow returns the exact value, investigate leakage before celebrating: perhaps shell history, pasted prompt content, a connected tool, or provider-managed state made it available.

Avoid asking students to deliberately coerce a model into falsehood. The lesson is epistemic: which claim is supported by which event? A perfectly calibrated model makes the same boundary easier to see.

Use this results table so the conclusion stays precise:

| Observed response | What it establishes | What it does not establish |
|---|---|---|
| Correct refusal | The generated response acknowledges an access limitation. | The actual file contents or universal future behavior. |
| Incorrect guess | The answer lacks support and happened to be wrong. | Intent to deceive or a fixed hallucination rate. |
| Exact match | Something may have exposed the value. | Legitimate local access; investigate leakage or state first. |
| Tool request | The model selected a possible observation. | That authorization or execution occurred. |

Current research, including the cited 2026 Nature paper, should motivate careful evaluation rather than a classroom-wide numerical hallucination claim. Task definitions and scoring can change whether guessing or abstaining is rewarded; the course response is to make provenance and verification part of the interface. See [the Nature article](https://www.nature.com/articles/s41586-026-10549-w).

For the history experiment, use a high-entropy nonce and new request identifiers. The first request should contain the value; the second independent vector should not. In the replayed vector, show the entire causal sequence. If a UI or SDK automatically preserves history, it is unsuitable for this specific experiment because it hides the construction we are trying to observe.

## History as an integrity-sensitive data structure

Messages are not merely chat transcript decoration. Their order and contents drive later behavior. Do not append a tool result for a call that was never recorded. Do not replace a failed tool output with a cleaner explanation. Do not store assistant text as a user message to “make the model listen.” Each shortcut corrupts the provenance needed for reasoning and audit.

Assign a simple invariant: before another model call, every recorded tool result must identify exactly one preceding assistant call, and every executed call must have exactly one result, including structured failures. This invariant is introduced here as a history idea and enforced mechanically in later chapters.

History also needs an ownership rule. Provider response fields are immutable evidence; the harness may add new messages but should not rewrite old assistant calls or tool results to improve the story. If context is later summarized, retain the original trace and label the summary as derived data. This preserves a chain from final claim back to raw observation.

## When inference is still useful

The evidence discipline does not forbid inference. Agents must infer which file to inspect, what compiler output suggests, and which small edit might work. The requirement is that high-impact conclusions remain falsifiable. Phrase uncertainty when evidence is incomplete, request the narrowest next observation, and use deterministic tools to close the loop. This turns hallucination from a vague model defect into a governable interface risk.

## Review checkpoint

Take one paragraph of a model's diagnosis and annotate every factual noun phrase with its provenance: user message, file result, compiler result, general language knowledge, or unsupported. Then order the evidence events by freshness. A diagnosis passes this checkpoint when its key claim points to current context and proposes a test that could disprove it. This small review practice scales to later agent traces and prevents fluent language from hiding a missing observation.

Keep the annotated paragraph as an assessment artifact. It provides a baseline for Chapter 5, where learners repeat the exercise on an autonomous multi-step trace and compare whether tool feedback improved the support for each claim.

## A useful negative result

If a live model refuses to invent the secret, the experiment still succeeds. Record that it correctly stated its limitation, then ask a deliberately leading question: “I think the file says `hello`; confirm it.” The learning goal is not to force a hallucination. It is to prove that no observation occurred and to separate a responsible response from an observable fact.

## Current ecosystem

Modern APIs support tool calling and, in some cases, provider-managed conversation state. These features change how context is transported, not the authority boundary: the application still defines tools and executes approved actions. The [official OpenAI function-calling guide](https://developers.openai.com/api/docs/guides/function-calling) explicitly separates model-generated calls from application execution. Current hallucination research should be described cautiously; performance changes across tasks and models. See the [2026 Nature study](https://www.nature.com/articles/s41586-026-10549-w) as a current research reference rather than a universal rate.

Stable concept: no local content is available merely because its path appears in a prompt. Recheck claims about current model behavior and state APIs before delivery.

## What you should now be able to explain

- Why a filename in a prompt is not evidence of file contents.
- How evidence, inference, and action requests differ.
- Why replaying message history changes what the model can use.
- Why a compiler/test trace is stronger completion evidence than assistant prose.

Retest the live experiments two weeks and two days before delivery.
