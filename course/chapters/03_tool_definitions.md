# Chapter 3 — Tool definitions and tool requests

Last verified: 2026-08-08  
Class time: 45 minutes  
Checkpoint: `03_tool_schema`

## Main ideas reviewed

| Main idea | Clearest formulation | Boundary to remember |
|---|---|---|
| Four protocol objects | Definition advertises, call proposes, execution acts, result reports. | None of the first two causes a side effect. |
| Schema design | Describe the smallest useful argument language with explicit types and required fields. | Shape validity is not permission. |
| Adapter parsing | Convert provider wire data once into provider-neutral typed objects. | Preserve IDs, content, and call order. |
| Tool choice | The API/harness can allow, forbid, require, or narrow tool selection. | Forced selection is a test aid, not general autonomy. |
| Parallelism | Multiple calls require ordering, conflict, and correlation rules. | The workshop disables it until sequential behavior is correct. |

The conceptual sequence is “describe → receive → inspect.” Execution deliberately begins in Chapter 4. This separation lets students prove that tool calling is a message protocol rather than remote procedure execution by the model.

## The failure: a call is not an execution

The response contains `read_file({"path":"src/calculator.cpp"})`, yet no disk access appears in the operating-system trace. Nothing is broken. A model-generated tool call is structured assistant output. The harness must validate it, choose whether it is permitted, execute an implementation, and return a correlated result.

Keep four objects separate:

1. A **tool definition** advertises a name, description, and input schema.
2. A **tool call** is a model-generated ID, name, and JSON argument payload.
3. A **tool execution** is local program behavior controlled by the harness.
4. A **tool result message** carries structured output and the originating call ID back to the model.

Confusing any pair creates bugs. A schema does not install a C++ function. Receiving a syntactically valid call does not authorize it. Executing correctly without returning the right call ID breaks the conversation.

## Design the narrowest contract

Begin with `read_file`. Its conceptual schema is:

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "UTF-8 path relative to the workshop workspace"
    }
  },
  "required": ["path"],
  "additionalProperties": false
}
```

Every field has a reason. `type: object` fixes the top-level shape. `required` prevents silent defaults. `additionalProperties: false` turns misspellings into errors rather than ignored intent. The description specifies relative paths but does not enforce that rule; the C++ dispatcher must enforce it.

Good tool descriptions explain when to use the tool, the input unit, and important limitations. They should not contain security theater such as “this tool can never be abused.” A model reads the description as planning context; code remains the authority.

### Schema keyword versus application responsibility

| Requirement | Schema can express it? | Application must still check? |
|---|---:|---:|
| `path` is a string | yes | yes, do not trust the provider alone |
| `path` is required | yes | yes |
| no misspelled extra fields | yes, with `additionalProperties: false` | yes |
| action is one of three names | yes, with `enum` | yes |
| normalized path stays in workspace | not portably in this schema | yes |
| current user approved the write | no | yes |
| file is below the byte limit | no | yes |

The repeated “yes” in the last column is intentional. Even when a provider offers constrained or strict generation, model output remains untrusted input at the local execution boundary.

## Parse defensively

Provider responses may contain assistant text, zero calls, one call, or multiple calls. A call's `arguments` may arrive as serialized JSON text. The adapter converts the provider wire response into a provider-neutral `ModelResponse`, but conversion must reject missing IDs, unknown shapes, malformed arguments, and unexpected types with useful errors.

The reference JSON parser is deliberately dependency-free for workshop portability. That makes limits and error reporting especially important. Production applications should normally use a maintained JSON library, enforce input-size and nesting limits, and test unusual Unicode and number cases.

For the first experiment, stop after printing the tool call. Show:

- the call ID;
- tool name;
- parsed arguments;
- `finish_reason` or equivalent indicator;
- proof that the target file was not touched.

This paused state makes the protocol boundary visible before dispatch adds side effects.

## Tool choice and parallelism

APIs may allow automatic choice, no tools, a required call, or a named tool. Use forced choice only for narrowly scoped demonstrations and schema tests. In a real repair loop, automatic choice lets the model finish with text when no action is needed.

Parallel tool calls complicate correlation, authorization, ordering, conflicting writes, and explanation. The workshop sends `parallel_tool_calls: false` where supported. A production design may add concurrency only after defining deterministic conflict and result-ordering rules.

Current official OpenAI documentation states that `parallel_tool_calls: false` constrains a response to zero or one function call. It also recommends strict mode for reliable schema adherence, with requirements that object schemas disallow additional properties and mark all properties required; optional values are represented through nullable types. Those details are provider/API-specific. The course definitions already use strict object shapes, but the dispatcher validates locally whether or not a remote strict mode is available. See [function calling and strict mode](https://developers.openai.com/api/docs/guides/function-calling).

If parallelism is later enabled, classify calls by effect. Two immutable reads may commute. Two writes to the same file conflict. A build after a write depends on that write. Preserve the model's call IDs and record the actual execution order; never assume array position alone is sufficient correlation.

## Schema validation is necessary, not sufficient

JSON Schema answers questions such as “Is `path` a string?” It does not answer:

- Is the normalized path inside the allowed workspace?
- Is the operation read-only or mutating?
- Is the file too large?
- Does this user/session have approval?
- Is a symlink redirecting access?

Those are authorization and execution questions for Chapter 4. Keep validation stages explicit: parse, shape-check, semantic-check, authorize, execute, envelope.

## Build the definition from use cases

Before writing JSON, list positive and negative examples. A valid call reads `src/calculator.cpp`. Missing `path`, numeric `path`, misspelled `pth`, an extra property, and a top-level array are invalid shapes. `../private.txt` is a valid *shape* but invalid *authority*. This table prevents schema design from absorbing rules it cannot reliably enforce.

Descriptions should be operational. Compare:

- Weak: “Reads stuff.”
- Better: “Read a UTF-8 text file at a path relative to the workshop workspace. Use it to inspect source or configuration before making claims or edits.”

The better description helps tool selection and sets expectations about encoding and scope. It still does not promise that every relative path is permitted or exists.

The other course definitions follow the same pattern. `write_file` requires `path` and `content`. `list_files` requires a relative directory path. `run_command` requires an `action` whose enum is limited to `configure`, `build`, and `test`. Enums improve both planning and validation: the model sees the available capability and cannot invent a fourth command that the dispatcher accidentally interprets.

## Inspect the provider-neutral types

The adapter produces a `ModelResponse` containing assistant content, a vector of `ToolCall`, finish reason, model name, and usage. `ToolCall` contains a non-empty ID, a function name, and parsed `Json` arguments. The rest of the application should not reach back into provider JSON paths such as `choices[0]`. That boundary localizes provider drift.

The assistant may include content and tool calls together. Preserve both even when the course loop prioritizes calls. Dropping assistant messages, reconstructing them from selected fields, or inventing IDs can make the next request invalid. Store the exact structured meaning needed to serialize the assistant turn back.

Argument parsing deserves focused errors. These are different cases:

- no `arguments` field;
- `arguments` is not the provider-documented string/object form;
- string is not valid JSON;
- parsed JSON is valid but not an object;
- object violates the advertised contract.

An adapter can own the first four and the dispatcher the last. Whatever split you choose, test and document it so failures do not become “tool did nothing.”

### Wire-to-type example

An OpenAI-compatible Chat Completions assistant turn may conceptually contain:

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [{
    "id": "call_read_1",
    "type": "function",
    "function": {
      "name": "read_file",
      "arguments": "{\"path\":\"src/calculator.cpp\"}"
    }
  }]
}
```

Notice the two JSON layers: the response is JSON, while `arguments` is itself a JSON-encoded string in this wire format. The adapter parses the outer response, checks the function-call fields, parses the inner string, and produces `ToolCall{id, name, Json arguments}`. If the inner parse fails, no dispatcher action should occur.

After execution, the harness must include the original assistant call and a tool message whose correlation ID is `call_read_1`. Other APIs may name the correlation field differently or represent calls as response items. The stable invariant is one result connected to the exact proposal that caused it.

## Schema evolution and compatibility

Once a prompt, model, and eval suite depend on a tool definition, changing it is an API change. Adding a required field breaks recorded calls. Renaming an enum value changes model behavior and dispatch. Loosening `additionalProperties` may make misspelled arguments silently pass. Version fixtures and rerun adapter, dispatcher, and live behavior tests together.

Avoid giant multifunction tools such as `workspace({"operation":..., "options":...})` in a teaching harness. They reduce definition count but create nested conditional schemas and broad authorization. A small set of effect-specific tools makes traces legible. At production scale, tool grouping may be justified, but permissions and audit events should remain specific.

## A complete paused experiment

Start with system context explaining that the model may request `read_file`, then ask it to inspect `src/calculator.cpp`. Send the single definition. On response, print a normalized record:

```json
{
  "id": "call_read_1",
  "name": "read_file",
  "arguments": {"path":"src/calculator.cpp"}
}
```

Now verify three negative facts: no dispatcher method was invoked, no tool message exists in history, and file metadata/content did not change. The model has selected a possible next action, but the harness has not crossed the authority boundary. This snapshot is the cleanest preparation for Chapter 4.

## Tests worth retaining

Contract tests should assert names are unique, descriptions are non-empty, parameter roots are objects, required arrays name real properties, and extra properties are explicitly addressed. Adapter fixtures should cover text-only completion, one call, malformed argument JSON, missing ID, and multiple calls even though parallel execution is disabled. These tests detect provider-adapter regressions without spending tokens or invoking local tools.

## Review checkpoint

Review a definition as if another team must implement it without asking questions. Can they tell whether a path is relative, whether content is UTF-8, which fields are mandatory, and whether unknown fields fail? Now review it as an attacker: which valid-shaped inputs could still be harmful? Put those cases in the Chapter 4 policy-test list rather than claiming the schema solves them.

Finally, verify round-trip integrity. Serialize the definition, parse a recorded assistant call, normalize the argument object, and serialize the assistant call back into history with the same ID. A pretty-printed JSON difference is harmless; loss of identity, types, or role is not. Keep the recorded fixture alongside the schema so a future provider-adapter change has an offline compatibility target.

At handoff, the learner should be able to show the advertised schema, one normalized call, three rejected shape examples, and proof that no filesystem function ran. This evidence closes the contract lesson before side effects are introduced.

The reviewer must also confirm that the call ID survives parsing unchanged and that each rejected case fails for the expected contract reason rather than because the fixture is accidentally malformed elsewhere.

## Current ecosystem

OpenRouter and OpenAI currently document function/tool definitions based on JSON Schema, assistant tool-call arrays, and correlated tool results. Exact wire fields, tool-choice modes, parallel-call behavior, and finish reasons can change or vary by model. Use [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling), the [official OpenAI function-calling guide](https://developers.openai.com/api/docs/guides/function-calling), and the [JSON Schema object reference](https://json-schema.org/understanding-json-schema/reference/object). Stable concept: a tool definition is a contract offered to the model; execution is separate application behavior.

## What you should now be able to explain

- The difference among a definition, call, execution, and result.
- Why `required` and `additionalProperties: false` improve a teaching schema.
- Why syntactic validity does not imply authorization.
- Why the course begins with one printed, unexecuted call and disables parallel calls.

Retest provider wire fields and selected-model tool support two weeks and two days before delivery.
