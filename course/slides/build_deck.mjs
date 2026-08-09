import { Presentation, PresentationFile } from "@oai/artifact-tool";
import path from "node:path";

// Maintainer generation source for the checked-in workshop deck.
// This imports the presentation runtime bundled with OpenAI Codex; it is not a
// standalone public npm build. See README.md for provenance and validation.

const W = 1280;
const H = 720;
const M = 56;
const INK = "#0B1220";
const MUTED = "#536174";
const PAPER = "#F7F8FA";
const LINE = "#CBD2DC";
const WHITE = "#FFFFFF";
const RED = "#D94C4C";
const GREEN = "#16856B";
const BLUE = "#246BCE";
const AMBER = "#D88917";
const MONO = "Consolas";
const SANS = "Aptos";

const chapters = [
  {
    number: 0,
    short: "ENVIRONMENT",
    title: "Environment and preflight",
    accent: "#246BCE",
    sources: [
      "https://openrouter.ai/docs/quickstart",
      "https://openrouter.ai/docs/guides/overview/models",
      "https://openrouter.ai/docs/api/reference/errors-and-debugging",
    ],
    slides: [
      { kind: "hero", eyebrow: "C++ CODING AGENT FIELD COURSE", title: "Build a coding agent you can inspect, constrain, and trust", subtitle: "A hands-on workshop in model boundaries, tool execution, evidence, safety, and evaluation", note: "Open with the end state: a repair trace whose claims can be checked." },
      { kind: "predict", title: "Who actually edits the file?", question: "A model returns a tool call that says write_file. Which component changes disk?", options: ["The model", "The harness", "The tool implementation"], reveal: "The tool implementation—only after the harness authorizes dispatch.", note: "Take a show-of-hands vote before revealing the answer." },
      { kind: "boundary", title: "Three components create two authority boundaries", nodes: ["MODEL\nproposes", "HARNESS\ndecides", "TOOLS\nact"], labels: ["network / data", "capability / OS"], caption: "Text crosses the first boundary. Authority is granted only at the second.", note: "Trace one request across both boundaries." },
      { kind: "fork", title: "Two modes share one contract", left: ["SCRIPTED", "deterministic", "offline", "required"], right: ["LIVE", "provider-backed", "variable", "optional"], center: "ModelClient → ModelResponse", caption: "Labs stay reproducible while the live path tests the same adapter boundary.", note: "Emphasize that live access is an extension, not a prerequisite." },
      { kind: "code", title: "A response is evidence only after you inspect its fields", code: '{\n  "model": "scripted/full-repair",\n  "message": { "role": "assistant" },\n  "finish_reason": "tool_calls",\n  "usage": { "input_tokens": 42, "output_tokens": 18 }\n}', callout: "Read four signals", bullets: ["Which model path ran?", "Did it answer or request tools?", "Why did generation stop?", "What usage was reported?"], note: "Point to the fields in order; do not explain the implementation yet." },
      { kind: "diagnostic", title: "Preflight failures belong to different layers", rows: [["KEY", "missing / malformed", "check environment"], ["HTTP", "401 / 429 / 5xx", "classify + retry policy"], ["SCHEMA", "unexpected body", "log redacted payload"], ["MODEL", "not tool-capable", "select supported model"]], question: "Exit check: what artifact proves preflight succeeded?", answer: "A saved, redacted response with model, finish reason, and usage.", note: "Ask learners to name the layer before proposing a fix." },
    ],
  },
  {
    number: 1,
    short: "MODEL BOUNDARY",
    title: "The model boundary",
    accent: "#7B56C2",
    sources: [
      "https://developers.openai.com/api/docs/guides/conversation-state",
      "https://developers.openai.com/api/docs/guides/function-calling",
      "https://www.nature.com/articles/s41586-026-10549-w",
    ],
    slides: [
      { kind: "predict", title: "Can the model know a secret file you just created?", question: "You create secret.txt locally and send only its filename. What exact bytes can the model report?", options: ["All bytes", "Likely content", "No grounded content"], reveal: "No grounded content—the bytes never crossed the model boundary.", note: "Create the file before class, but never send its contents." },
      { kind: "code", title: "The request contains a path, not the file", code: '{\n  "messages": [\n    { "role": "user",\n      "content": "What is in secret.txt?" }\n  ]\n}', callout: "What is absent?", bullets: ["No file bytes", "No filesystem handle", "No tool definition", "No prior observation"], note: "Reveal the serialized request and ask learners to locate the secret bytes." },
      { kind: "boundary", title: "A filename is not a filesystem capability", nodes: ["TEXT\nsecret.txt", "MODEL\ninference", "LOCAL DISK\nblocked"], labels: ["describes", "cannot cross"], caption: "Names can be guessed. Contents require an observation channel.", note: "Distinguish semantic reference from operating-system authority." },
      { kind: "trio", title: "Classify every model statement before trusting it", items: [["EVIDENCE", "Observed in a tool result or supplied input."], ["INFERENCE", "Derived from evidence; may still be wrong."], ["REQUEST", "A proposed action; nothing has executed yet."]], note: "Have learners classify three statements from the demo transcript." },
      { kind: "predict", title: "Will request B remember nonce A?", question: "Request A receives nonce 7F3A. Request B sends no history. What should B know?", options: ["The exact nonce", "A fuzzy memory", "Nothing grounded"], reveal: "Nothing grounded—independent calls do not inherit your local history.", note: "Run the two-call experiment with the scripted client." },
      { kind: "timeline", title: "Continuity comes from replayed causal history", steps: [["1", "USER", "task"], ["2", "ASSISTANT", "tool call"], ["3", "TOOL", "result"], ["4", "ASSISTANT", "next decision"]], caption: "The application rebuilds the conversation on every model request.", note: "Cover one message at a time and ask what breaks if it is removed." },
      { kind: "loop", title: "Reliable claims follow an evidence loop", steps: ["Observe", "Change", "Compile / test", "Claim"], caption: "A plausible sentence is not completion evidence.", note: "Connect each verb to a concrete trace event." },
      { kind: "exit", title: "The first grounded fact arrives in a tool result", statement: "Before read_file: secret.txt is only text.\nAfter read_file: its returned bytes become evidence.", question: "Mark the first event in the trace that crosses the boundary.", note: "Exit trace: learners circle the first tool-result event." },
    ],
  },
  {
    number: 2,
    short: "PROMPTS + ROLES",
    title: "Prompts and message roles",
    accent: "#B05A2A",
    sources: [
      "https://developers.openai.com/api/docs/guides/latest-model",
      "https://openrouter.ai/docs/agent-sdk/call-model/message-formats",
    ],
    slides: [
      { kind: "predict", correct: 1, title: "Which prompt leaves a trace you can audit?", question: "A: “Be careful and fix it.”\nB: “Read before write; run focused tests; cite final evidence.”", options: ["Prompt A", "Prompt B", "No difference"], reveal: "Prompt B turns behavior into observable checkpoints.", note: "Vote first; reveal by comparing two deterministic traces." },
      { kind: "timeline", title: "Message roles create a causal record", steps: [["SYSTEM", "policy", "stable"], ["USER", "objective", "task"], ["ASSISTANT", "decision", "call"], ["TOOL", "observation", "result"]], caption: "Role is not decoration; it tells the adapter how each message functions.", note: "Use one color verbally per role; the deck uses chapter accent for the active sequence." },
      { kind: "five", title: "A strong coding-agent prompt has five blocks", items: [["ROLE", "what the agent is"], ["OBJECTIVE", "what must change"], ["PROCESS", "how evidence is gathered"], ["BOUNDARY", "what is forbidden"], ["COMPLETION", "what proves done"]], note: "Map each block to a trace assertion." },
      { kind: "compare", title: "Replace vague intent with measurable behavior", leftTitle: "VAGUE", left: ["Be careful", "Do a good job", "Stop when done"], rightTitle: "TRACEABLE", right: ["Read before write", "Run the focused test", "Report latest exit code"], note: "Ask which right-side phrase can be tested automatically." },
      { kind: "experiment", title: "Change one prompt variable at a time", rows: [["VARIABLE", "BASELINE", "VARIANT"], ["System prompt", "generic", "evidence-first"], ["Model + scenario", "fixed", "fixed"], ["Tools + limits", "fixed", "fixed"], ["Seeded fixture", "same", "same"]], caption: "Otherwise the trace cannot explain the result.", note: "Keep provider/model configuration fixed during the comparison." },
      { kind: "metrics", title: "Score traces, not writing style", metrics: [["READ BEFORE WRITE", "yes / no"], ["FINAL TEST", "pass / absent"], ["TOOL CALLS", "count"], ["UNSUPPORTED CLAIMS", "count"]], note: "Do not collapse the result into a prose quality score." },
      { kind: "predict", title: "Can a strong prompt block direct ../ dispatch?", question: "The prompt says “stay inside workspace.” The harness dispatches read_file('../secret'). What happens?", options: ["Prompt blocks it", "Model refuses", "Code must reject it"], reveal: "Code must reject it. A prompt cannot enforce an already-issued call.", note: "Treat the answer as a security boundary, not a prompt-writing trick." },
      { kind: "layers", title: "Prompts guide; code permits", layers: [["PROMPT", "preferred process"], ["SCHEMA", "valid structure"], ["AUTHORIZATION", "allowed target"], ["ISOLATION", "bounded impact"], ["VERIFICATION", "evidence of outcome"]], question: "Exit check: which layer rejects ../?", answer: "Authorization after canonical path resolution.", note: "Close by locating every claim in an enforcement layer." },
    ],
  },
  {
    number: 3,
    short: "TOOL DEFINITIONS",
    title: "Tool definitions and wire format",
    accent: "#16856B",
    sources: [
      "https://developers.openai.com/api/docs/guides/function-calling",
      "https://json-schema.org/understanding-json-schema/reference/object",
      "https://openrouter.ai/docs/guides/features/tool-calling",
    ],
    slides: [
      { kind: "predict", title: "A tool call is a proposal, not an execution", question: 'The response contains tool_calls: [{ name: "read_file", ... }]. Has the file been read?', options: ["Yes", "Only by the provider", "No"], reveal: "No—the application must validate, authorize, execute, and return a result.", note: "Show unchanged-file evidence alongside the raw response." },
      { kind: "timeline", title: "Four objects complete one tool round trip", steps: [["1", "DEFINITION", "capability contract"], ["2", "CALL", "model proposal"], ["3", "EXECUTION", "local effect"], ["4", "RESULT", "correlated evidence"]], caption: "Conflating these objects hides where authority and failure live.", note: "Ask which object can change the machine." },
      { kind: "code", title: "A minimal schema makes intent machine-checkable", code: '{\n  "name": "read_file",\n  "parameters": {\n    "type": "object",\n    "properties": { "path": {"type":"string"} },\n    "required": ["path"],\n    "additionalProperties": false\n  }\n}', callout: "Four decisions", bullets: ["Stable tool name", "Object arguments", "Required path", "No surprise fields"], note: "Annotate one line at a time; defer authorization to the next chapter." },
      { kind: "compare", title: "Strict schemas reject missing and misspelled fields", leftTitle: "LOOSE", left: ["required omitted", "extra fields accepted", "errors surface late"], rightTitle: "STRICT", right: ["required: [path]", "additionalProperties: false", "errors surface at parse"], note: "Demonstrate path versus paht and compare failure location." },
      { kind: "boundary", title: "The wire adapter protects the core loop", nodes: ["PROVIDER JSON\nformat-specific", "ToolCall\n{id,name,args}", "AGENT CORE\nprovider-neutral"], labels: ["parse", "stable contract"], caption: "Provider quirks stop at one adapter boundary.", note: "Point out the single place provider field names are translated." },
      { kind: "predict", title: "Malformed arguments should fail before execution", question: 'Arguments are the string "{ path: }". What should the dispatcher do?', options: ["Guess the path", "Ask the shell", "Return a typed error"], reveal: "Return a typed, correlated error; do not execute or repair silently.", note: "Ask learners to name the error stage: parse, validate, authorize, or execute." },
      { kind: "matrix", title: "Schema validation cannot authorize a path", columns: ["QUESTION", "SCHEMA", "POLICY"], rows: [["Is path a string?", "YES", "—"], ["Is it under workspace?", "NO", "YES"], ["Does the file exist?", "NO", "runtime"], ["May this run mutate?", "NO", "YES"]], note: "The table separates structural validity from authority." },
      { kind: "exit", title: "Defer parallel calls until correlation is boring", statement: "Parallel reads may be safe. Parallel writes can conflict. Every result still needs one stable call ID.", question: "Exit check: what proves that raw tool_calls changed nothing?", note: "Have learners point to the unchanged file plus absence of a tool-result event." },
    ],
  },
  {
    number: 4,
    short: "TOOL EXECUTION",
    title: "Safe tool execution",
    accent: "#C33D62",
    sources: [
      "https://developers.openai.com/api/docs/guides/function-calling",
      "https://openrouter.ai/docs/guides/features/tool-calling",
      "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/",
      "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
      "https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw",
    ],
    slides: [
      { kind: "predict", title: "Valid JSON can still request a dangerous action", question: '{ "name":"run_command", "arguments": {"command":"rm -rf ..."} }', options: ["JSON blocks it", "Schema blocks it", "Capability policy must block it"], reveal: "Structure is valid; an allowlisted capability policy must refuse the action.", note: "Use a synthetic string only; never execute it." },
      { kind: "compare", title: "Narrow capabilities remove entire attack paths", leftTitle: "ARBITRARY COMMAND", left: ["free-form shell", "quoting ambiguity", "unbounded programs"], rightTitle: "TASK ENUM", right: ["configure", "build", "test"], note: "Show how an enum makes the command surface reviewable." },
      { kind: "flow", title: "Dispatch is a five-stage security pipeline", steps: ["Parse", "Validate", "Authorize", "Execute", "Envelope"], caption: "Each stage has a distinct failure class and test.", note: "Pause at each arrow and ask what can still go wrong." },
      { kind: "compare", title: "One result envelope carries success and failure", leftTitle: "SUCCESS", left: ["ok: true", "data: {...}", "meta: bounded"], rightTitle: "FAILURE", right: ["ok: false", "error.code", "error.message"], note: "Keep error details useful but redacted and bounded." },
      { kind: "correlation", title: "Call IDs preserve causal history", call: "call_17", result: "call_17", caption: "assistant.tool_call.id must equal tool_result.tool_call_id", note: "Change one ID in the demo and let validation fail." },
      { kind: "predict", correct: 1, title: "ok: true and exit_code: 1 can both be correct", question: "The process launched, output was captured, and the compiler exited 1. Is the tool envelope successful?", options: ["Contradiction", "Tool success; process failure", "Full task success"], reveal: "Tool success; process failure. The observation worked, and it observed a failing process.", note: "Separate transport/tool outcome from child-process outcome." },
      { kind: "layers", title: "Two success layers prevent false claims", layers: [["TASK", "repair accepted"], ["PROCESS", "exit code / tests"], ["TOOL", "operation observed"], ["DISPATCH", "authorized call"], ["PARSE", "valid arguments"]], question: "Where does exit_code live?", answer: "Process outcome inside a successful tool result.", note: "Read the stack bottom-up, then evaluate the final claim top-down." },
      { kind: "boundary", title: "Canonical paths turn workspace policy into code", nodes: ["WORKSPACE ROOT\ncanonical", "REQUESTED PATH\nresolve", "TARGET\nrelative or reject"], labels: ["join + normalize", "parent check"], caption: "Reject absolute paths, escapes, and symlink routes that leave the root.", note: "Use platform-specific path examples without assuming separators." },
      { kind: "five", title: "Process execution must be bounded by construction", items: [["DIRECT EXEC", "no shell interpolation"], ["TIMEOUT", "terminate late work"], ["OUTPUT CAP", "bound memory + context"], ["ENV FILTER", "remove provider keys"], ["WORKDIR", "fixed workspace"]], note: "Connect each bound to a concrete failure test." },
      { kind: "timeline", title: "A manual round trip proves every boundary", steps: [["1", "ASSISTANT", "call"], ["2", "PARSE", "args"], ["3", "AUTHORIZE", "path/task"], ["4", "EXECUTE", "bounded"], ["5", "TOOL", "result"], ["6", "ASSISTANT", "next claim"]], caption: "Acceptance: matched ID, bounded output, explicit exit code, no secret leakage.", note: "Use this as the lab acceptance checklist." },
    ],
  },
  {
    number: 5,
    short: "AGENT LOOP",
    title: "The bounded agent loop",
    accent: "#2F6F79",
    sources: [
      "https://developers.openai.com/api/docs/guides/function-calling",
      "https://openrouter.ai/docs/guides/features/tool-calling",
      "https://openrouter.ai/docs/api/reference/errors-and-debugging",
    ],
    slides: [
      { kind: "predict", correct: 1, title: "After the first read, the loop needs another decision", question: "read_file returns the source. What must happen before any edit?", options: ["Stop", "Call the model with the result", "Execute a guessed patch"], reveal: "Append the correlated result, then call the model with updated history.", note: "Ask learners to name the next history item." },
      { kind: "code", title: "The core loop has one small causal shape", code: 'repeat until limit:\n  response = model(history, tools)\n  append(response.message)\n  if no tool_calls: return response.text\n  for call in tool_calls:\n    result = dispatch(call)\n    append(result)', callout: "Three invariants", bullets: ["Append assistant before tool results", "Correlate every result", "Stop only on explicit conditions"], note: "This is pseudocode; implementation details remain in the lab." },
      { kind: "correlation", title: "History must preserve call before result", call: "assistant: call_23", result: "tool: call_23", caption: "Deleting or reordering either event breaks causality.", note: "Have learners spot an intentionally reordered transcript." },
      { kind: "four", title: "Four independent limits bound the run", items: [["ITERATIONS", "model turns"], ["TOOL CALLS", "total effects"], ["REPEAT", "consecutive same signature"], ["WALL CLOCK", "elapsed time"]], note: "Ask what failure each limit contains." },
      { kind: "predict", title: "A repeated read is not automatically a loop", question: "The agent reads main.cpp, edits it, then reads main.cpp again. Should the repeat limit fire?", options: ["Always", "Never", "Only without intervening progress"], reveal: "Only without progress; edits or new evidence reset the consecutive signature count.", note: "Contrast legitimate reinspection with thrashing." },
      { kind: "timeline", title: "Progress-sensitive repeat detection resets on change", steps: [["1", "READ A", "sig=A#1"], ["2", "READ A", "sig=A#2"], ["3", "WRITE", "reset"], ["4", "READ A", "sig=A#1"]], caption: "Count consecutive sameness, not lifetime frequency.", note: "Ask learners where the reset belongs." },
      { kind: "timeline", title: "Repair trace A turns compiler output into a targeted edit", steps: [["1", "INSPECT", "source"], ["2", "CONFIGURE", "build"], ["3", "COMPILE", "fails"], ["4", "EDIT", "syntax"]], caption: "The failing compiler output narrows the next action.", note: "Reveal the trace until the first edit only." },
      { kind: "timeline", title: "Repair trace B follows behavior evidence to passing tests", steps: [["5", "BUILD", "passes"], ["6", "TEST", "fails"], ["7", "EDIT", "behavior"], ["8", "TEST", "passes"]], caption: "Compilation is a gate, not the final proof.", note: "Ask why the first green build cannot end the task." },
      { kind: "four", title: "Pathologies need explicit terminal states", items: [["PREMATURE", "final text without tests"], ["THRASHING", "repeat limit"], ["EMPTY FINAL", "typed failure"], ["PROVIDER", "classified retry / stop"]], note: "Map each pathology to one observable trace ending." },
      { kind: "exit", title: "Completion text must agree with the latest evidence", statement: "“Fixed” is credible only when the latest build/test events support it—and their results are still in the trace.", question: "Exit check: underline the latest build and test evidence.", note: "Require learners to cite event IDs, not summarize from memory." },
    ],
  },
  {
    number: 6,
    short: "CONTEXT + COST",
    title: "Context, usage, and cost",
    accent: "#8B6B18",
    sources: [
      "https://developers.openai.com/api/docs/guides/conversation-state",
      "https://openrouter.ai/docs/cookbook/administration/usage-accounting",
      "https://openrouter.ai/docs/guides/best-practices/prompt-caching",
      "https://openrouter.ai/docs/guides/features/message-transforms",
    ],
    slides: [
      { kind: "predict", title: "One repair task contains three different counts", question: "A run has 4 model requests and 7 tool calls. How many turns, model calls, and tools?", options: ["All equal", "4 / 4 / 7", "1 / 4 / 7"], reveal: "Define the unit first: one task run, four model calls, seven tool calls.", note: "Accept alternate turn definitions only if learners state them explicitly." },
      { kind: "metrics", title: "Count events from the trace, not intuition", metrics: [["TASK RUNS", "1"], ["MODEL CALLS", "4"], ["TOOL CALLS", "7"], ["MESSAGES", "12"]], note: "These are illustrative trace counts, not provider billing data." },
      { kind: "stack", title: "Each request carries a growing causal history", levels: [["REQUEST 1", "system + user"], ["REQUEST 2", "+ assistant call + tool result"], ["REQUEST 3", "+ edit + build output"], ["REQUEST 4", "+ tests + final evidence"]], note: "Explain why total transmitted context can exceed final history length." },
      { kind: "predict", title: "Which old output can leave prompt context?", question: "Choose one to compact: task constraints, latest failing test, or superseded build log.", options: ["Task constraints", "Latest failing test", "Superseded build log"], reveal: "The superseded log can be summarized or removed from prompt context; keep it in the raw trace.", note: "Separate prompt retention from audit retention." },
      { kind: "layers", title: "Retain decisions and latest evidence before old bytes", layers: [["GOAL", "always"], ["CONSTRAINTS", "always"], ["LATEST EVIDENCE", "high"], ["CURRENT DIFF", "high"], ["SUPERSEDED LOGS", "compact"], ["RAW TRACE", "archive outside prompt"]], question: "What stays auditable after compaction?", answer: "The immutable raw trace.", note: "Use the hierarchy as a concrete compaction policy." },
      { kind: "four", title: "Every context strategy is finite and measurable", items: [["EXPLICIT HISTORY", "full control"], ["PROVIDER STATE", "delegated continuity"], ["COMPACTION", "smaller prompt"], ["CACHING", "reuse prefix"]], note: "Exit check: label usage as provider-reported or synthetic." },
    ],
  },
  {
    number: 7,
    short: "SAFETY + EVALS",
    title: "Safety architecture and evaluations",
    accent: "#B13535",
    sources: [
      "https://developers.openai.com/api/docs/guides/evaluation-best-practices",
      "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/",
      "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
      "https://openrouter.ai/docs/guides/features/input-output-logging",
    ],
    slides: [
      { kind: "predict", title: "The prompt says stay inside; the call says ../../private.txt", question: "Which component must decide?", options: ["The system prompt", "The model", "The dispatcher"], reveal: "The dispatcher resolves and rejects the path before any read.", note: "Run the direct-call test; do not rely on model refusal." },
      { kind: "code", title: "Enforcement turns policy into a deterministic rejection", code: '{\n  "ok": false,\n  "error": {\n    "code": "path_outside_workspace",\n    "message": "target rejected"\n  },\n  "tool_call_id": "call_escape"\n}', callout: "Evidence to keep", bullets: ["Typed code", "Matched call ID", "No file content", "Trace timestamp"], note: "Confirm the synthetic private file was never opened." },
      { kind: "matrix", title: "Threats differ by where they enter and what they affect", columns: ["THREAT", "ENTRY", "CONTROL"], rows: [["Injection", "repo text", "treat as data"], ["Excess agency", "broad tools", "least capability"], ["Bad output", "tool result", "validate + encode"], ["Secrets", "environment", "remove + redact"], ["Exhaustion", "loop/output", "hard limits"], ["False success", "final claim", "evidence gate"]], note: "Do not present the threat map as a single prompt problem." },
      { kind: "four", title: "Safety needs four reinforcing layers", items: [["CAPABILITY", "what exists"], ["AUTHORIZATION", "what is allowed now"], ["ISOLATION", "how far effects reach"], ["VERIFICATION", "what evidence proves outcome"]], note: "Ask which layer still matters after another fails." },
      { kind: "timeline", title: "Classify effects before granting authority", steps: [["1", "OBSERVE", "read/list"], ["2", "MUTATE", "write"], ["3", "EXECUTE", "build/test"], ["4", "EXTERNAL", "publish/delete"]], caption: "More consequential effects need stronger isolation, confirmation, and evidence.", note: "Use the sequence as a review ladder, not an automatic permission system." },
      { kind: "predict", correct: 1, title: "Can a malicious README steal a key with no route out?", question: "There is no upload tool and child processes do not inherit the provider key. What can the README directly exfiltrate?", options: ["The key", "Nothing through that path", "Any local file"], reveal: "It lacks the capability path—but continue testing for hidden channels and logging.", note: "Avoid claiming absolute safety; identify the blocked path and residual risks." },
      { kind: "five", title: "An evaluation is a reproducible evidence package", items: [["FIXTURE", "known state"], ["INPUT", "task/call"], ["ASSERTION", "observable"], ["CLASS", "failure type"], ["TRACE", "diagnosis"]], note: "Turn one safety requirement into all five parts." },
      { kind: "exit", title: "Red team and audit are paired roles", statement: "Operator proposes an attack. Auditor checks fixture, trace, effect, and classification. Both preserve the failed attempt.", question: "Exit evidence: which assertion proves the private file stayed unread?", note: "Close with an operator/auditor swap and one new evaluation." },
    ],
  },
  {
    number: 8,
    short: "CAPSTONE",
    title: "Self-modification capstone",
    accent: "#3D5F9B",
    sources: [
      "https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/",
      "https://git-scm.com/docs/git-diff",
      "https://git-scm.com/docs/git-worktree.html",
    ],
    slides: [
      { kind: "predict", correct: 1, title: "The running agent does not rewrite its own binary", question: "When the agent edits its repository, what changes first?", options: ["The running process", "Source files in an isolated worktree", "The provider model"], reveal: "Source files in an isolated worktree; a later build creates a new binary.", note: "Dispel the science-fiction framing before the capstone begins." },
      { kind: "timeline", title: "Self-change uses ordinary development mechanisms", steps: [["1", "ISOLATE", "worktree"], ["2", "READ", "source"], ["3", "EDIT", "narrow diff"], ["4", "BUILD", "new binary"], ["5", "TEST", "evidence"]], caption: "The current process remains the orchestrator of a separate candidate change.", note: "Identify which step can be discarded safely." },
      { kind: "five", title: "A feature is a vertical slice through the whole harness", items: [["SCHEMA", "definition"], ["ADAPTER", "wire format"], ["DISPATCH", "execution"], ["ENVELOPE", "result"], ["TRACE + TEST", "evidence"]], note: "Learners trace list_files through all five layers." },
      { kind: "predict", title: "Compilation is necessary—and insufficient", question: "The new list_files tool compiles. Is the feature complete?", options: ["Yes", "Only if model calls it", "No; behavior and safety need tests"], reveal: "No. A green build proves syntax/linkage, not behavior, boundary safety, or trace quality.", note: "Ask for the smallest focused test that adds evidence." },
      { kind: "ladder", title: "Evidence gets stronger as it climbs", levels: [["1", "DIFF", "intended scope"], ["2", "BUILD", "compiles"], ["3", "EXISTING TESTS", "no regressions"], ["4", "FOCUSED TEST", "new behavior"], ["5", "SAFETY TEST", "boundary holds"], ["6", "HUMAN DECISION", "keep / amend / discard"]], note: "Do not skip lower rungs; each answers a different question." },
      { kind: "rubric", title: "Ship only a narrow, evidenced change", criteria: [["SCOPE", "small diff; isolated workspace"], ["BEHAVIOR", "focused test passes"], ["SAFETY", "escape and misuse fail closed"], ["TRACE", "calls, results, limits visible"], ["DECISION", "keep, amend, or discard with reasons"]], close: "The goal is not autonomous magic. It is controlled engineering with evidence.", note: "Use the rubric for final review; reveal the reference solution only after learner diff review." },
    ],
  },
];

function box(slide, name, x, y, w, h, fill = WHITE, stroke = LINE, radius = true) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: stroke, width: stroke === "none" ? 0 : 1 },
  });
}

function textBox(slide, name, text, x, y, w, h, size = 22, color = INK, bold = false, align = "left", face = SANS) {
  const sh = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  sh.text = text;
  sh.text.style = { fontSize: size, color, bold, alignment: align, typeface: face, verticalAlignment: "middle" };
  return sh;
}

function line(slide, name, x, y, w, h = 0, color = LINE, width = 2, arrow = false) {
  const cfg = {
    geometry: "straightConnector1",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: color, width },
  };
  if (arrow) cfg.line.endArrowType = "triangle";
  return slide.shapes.add(cfg);
}

function circle(slide, name, x, y, d, fill, stroke = fill) {
  return slide.shapes.add({ geometry: "ellipse", name, position: { left: x, top: y, width: d, height: d }, fill, line: { style: "solid", fill: stroke, width: 1 } });
}

function addChrome(slide, chapter, title, globalIndex, localIndex, kind) {
  slide.background.fill = kind === "hero" ? INK : PAPER;
  if (kind === "hero") return;
  textBox(slide, `eyebrow-${globalIndex}`, `CH ${chapter.number}  /  ${chapter.short}`, M, 25, 490, 25, 14, chapter.accent, true);
  textBox(slide, `title-${globalIndex}`, title, M, 60, 1168, 58, 38, INK, true);
  line(slide, `header-rule-${globalIndex}`, M, 132, 1168, 0, chapter.accent, 3);
  textBox(slide, `footer-${globalIndex}`, `${String(globalIndex).padStart(2, "0")}   •   ${chapter.title}`, M, 680, 1168, 20, 12, MUTED, false, "right");
}

function addNotes(slide, chapter, item) {
  const sources = chapter.sources.map((url) => `- ${url}`).join("\n");
  const note = [
    item.note || "Facilitate the prediction, then connect the reveal to a trace event.",
    "",
    `[Sources]\n${sources}`,
  ].join("\n");
  slide.speakerNotes.textFrame.setText(note);
  slide.speakerNotes.setVisible(true);
}

function drawHero(slide, chapter, item) {
  box(slide, "hero-accent", 840, 0, 440, 720, chapter.accent, "none", false);
  textBox(slide, "hero-eyebrow", item.eyebrow, M, 52, 690, 34, 16, "#9CB5D9", true);
  textBox(slide, "hero-title", item.title, M, 178, 720, 230, 58, WHITE, true);
  textBox(slide, "hero-subtitle", item.subtitle, M, 455, 680, 120, 24, "#DCE4EF");
  line(slide, "hero-path", 900, 138, 250, 0, WHITE, 3);
  for (let i = 0; i < 5; i += 1) circle(slide, `hero-node-${i}`, 890 + i * 62, 128, 20, i === 4 ? AMBER : WHITE);
  textBox(slide, "hero-mark", "MODEL\n→ HARNESS\n→ TOOL\n→ TEST\n→ EVIDENCE", 895, 210, 300, 300, 28, WHITE, true);
  textBox(slide, "hero-footer", "FACILITATOR DECK  •  9 CHAPTERS  •  HANDS-ON C++", M, 661, 680, 24, 13, "#9CB5D9", true);
}

function drawPredict(slide, chapter, item) {
  textBox(slide, "prediction-label", "PREDICT BEFORE THE REVEAL", M, 165, 420, 28, 16, chapter.accent, true);
  textBox(slide, "prediction-question", item.question, M, 202, 740, 190, 31, INK, true);
  const x = 842, y0 = 176, gap = 104;
  const correct = item.correct ?? 2;
  item.options.forEach((opt, i) => {
    circle(slide, `vote-dot-${i}`, x, y0 + i * gap, 48, i === correct ? chapter.accent : WHITE, chapter.accent);
    textBox(slide, `vote-num-${i}`, String.fromCharCode(65 + i), x, y0 + i * gap, 48, 48, 20, i === correct ? WHITE : chapter.accent, true, "center");
    textBox(slide, `vote-opt-${i}`, opt, x + 66, y0 + i * gap, 300, 48, 22, INK, i === correct);
  });
  box(slide, "reveal-band", M, 520, 1168, 112, "#EAF0F9", "none", false);
  textBox(slide, "reveal-label", "REVEAL", M + 28, 540, 110, 26, 15, chapter.accent, true);
  textBox(slide, "reveal-text", item.reveal, M + 150, 532, 970, 62, 24, INK, true);
}

function drawBoundary(slide, chapter, item) {
  const xs = [70, 459, 848];
  line(slide, "boundary-arrow-1", 324, 310, 165, 0, chapter.accent, 3, true);
  line(slide, "boundary-arrow-2", 713, 310, 165, 0, chapter.accent, 3, true);
  item.nodes.forEach((n, i) => {
    box(slide, `boundary-node-${i}`, xs[i], 220, 300, 180, i === 1 ? "#EAF0F9" : WHITE, i === 1 ? chapter.accent : LINE);
    textBox(slide, `boundary-node-text-${i}`, n, xs[i] + 22, 245, 256, 126, 25, INK, true, "center");
  });
  textBox(slide, "boundary-label-1", item.labels[0], 337, 260, 140, 32, 15, MUTED, true, "center");
  textBox(slide, "boundary-label-2", item.labels[1], 727, 260, 140, 32, 15, MUTED, true, "center");
  textBox(slide, "boundary-caption", item.caption, 145, 470, 990, 82, 26, INK, true, "center");
}

function drawFork(slide, chapter, item) {
  const panels = [[M, item.left], [690, item.right]];
  panels.forEach(([x, data], i) => {
    box(slide, `fork-panel-${i}`, x, 190, 534, 310, WHITE, i === 0 ? BLUE : AMBER);
    textBox(slide, `fork-head-${i}`, data[0], x + 28, 215, 478, 50, 28, i === 0 ? BLUE : AMBER, true);
    textBox(slide, `fork-body-${i}`, data.slice(1).map((s) => `• ${s}`).join("\n"), x + 28, 288, 478, 155, 23, INK);
  });
  box(slide, "fork-contract", 445, 530, 390, 70, INK, "none");
  textBox(slide, "fork-contract-text", item.center, 465, 540, 350, 50, 21, WHITE, true, "center", MONO);
  textBox(slide, "fork-caption", item.caption, 180, 615, 920, 42, 20, MUTED, false, "center");
}

function drawCode(slide, chapter, item) {
  box(slide, "code-frame", M, 175, 700, 440, "#101827", "#101827");
  textBox(slide, "code-text", item.code, M + 30, 195, 640, 398, 18, "#D8E3F2", false, "left", MONO);
  textBox(slide, "code-callout", item.callout, 805, 190, 375, 52, 27, chapter.accent, true);
  textBox(slide, "code-bullets", item.bullets.map((b) => `• ${b}`).join("\n"), 805, 265, 375, 270, 23, INK);
  box(slide, "code-evidence", 805, 560, 375, 55, "#EAF0F9", "none", false);
  textBox(slide, "code-evidence-text", "Inspect the bytes before trusting the claim.", 825, 568, 335, 40, 17, INK, true, "center");
}

function drawDiagnostic(slide, chapter, item) {
  const y0 = 184, rh = 72;
  item.rows.forEach((r, i) => {
    if (i > 0) line(slide, `diag-rule-${i}`, M, y0 + i * rh, 1168, 0, LINE, 1);
    textBox(slide, `diag-a-${i}`, r[0], M + 10, y0 + i * rh, 160, rh, 18, chapter.accent, true);
    textBox(slide, `diag-b-${i}`, r[1], M + 200, y0 + i * rh, 380, rh, 20, INK);
    textBox(slide, `diag-c-${i}`, r[2], M + 650, y0 + i * rh, 500, rh, 20, MUTED);
  });
  box(slide, "diag-exit", M, 500, 1168, 140, INK, "none", false);
  textBox(slide, "diag-question", item.question, M + 26, 516, 1116, 42, 20, "#A8BBD7", true);
  textBox(slide, "diag-answer", item.answer, M + 26, 562, 1116, 60, 24, WHITE, true);
}

function drawTrio(slide, chapter, item) {
  const xs = [M, 453, 850];
  item.items.forEach((it, i) => {
    textBox(slide, `trio-index-${i}`, `0${i + 1}`, xs[i], 190, 90, 45, 18, chapter.accent, true);
    line(slide, `trio-rule-${i}`, xs[i], 242, 340, 0, chapter.accent, 3);
    textBox(slide, `trio-title-${i}`, it[0], xs[i], 270, 340, 50, 25, INK, true);
    textBox(slide, `trio-body-${i}`, it[1], xs[i], 338, 340, 170, 21, MUTED);
  });
}

function drawTimeline(slide, chapter, item) {
  const n = item.steps.length;
  const left = 125, right = 1155, y = 336;
  line(slide, "timeline-line", left, y, right - left, 0, LINE, 3);
  item.steps.forEach((s, i) => {
    const x = n === 1 ? 640 : left + i * ((right - left) / (n - 1));
    circle(slide, `timeline-dot-${i}`, x - 10, y - 10, 20, chapter.accent);
    textBox(slide, `timeline-label-${i}`, s[0], x - 80, 252, 160, 32, 15, chapter.accent, true, "center");
    textBox(slide, `timeline-title-${i}`, s[1], x - 95, 372, 190, 35, 19, INK, true, "center");
    textBox(slide, `timeline-body-${i}`, s[2], x - 95, 412, 190, 62, 16, MUTED, false, "center");
  });
  if (item.caption) textBox(slide, "timeline-caption", item.caption, 150, 525, 980, 72, 24, INK, true, "center");
}

function drawLoop(slide, chapter, item) {
  const pts = [[165, 235], [775, 235], [775, 465], [165, 465]];
  line(slide, "loop-arrow-1", 355, 280, 420, 0, chapter.accent, 3, true);
  line(slide, "loop-arrow-2", 965, 320, 0, 145, chapter.accent, 3, true);
  line(slide, "loop-arrow-3", 355, 510, 420, 0, chapter.accent, 3, false);
  line(slide, "loop-arrow-4", 165, 320, 0, 145, chapter.accent, 3, false);
  item.steps.forEach((s, i) => {
    box(slide, `loop-node-${i}`, pts[i][0], pts[i][1], 190, 90, i === 3 ? chapter.accent : WHITE, chapter.accent);
    textBox(slide, `loop-text-${i}`, s, pts[i][0] + 12, pts[i][1] + 12, 166, 66, 22, i === 3 ? WHITE : INK, true, "center");
  });
  textBox(slide, "loop-caption", item.caption, 405, 338, 470, 100, 25, INK, true, "center");
}

function drawExit(slide, chapter, item) {
  textBox(slide, "exit-statement", item.statement, 105, 200, 1070, 180, 32, INK, true, "center");
  line(slide, "exit-rule", 270, 420, 740, 0, chapter.accent, 4);
  box(slide, "exit-box", 160, 485, 960, 120, "#EAF0F9", "none", false);
  textBox(slide, "exit-question", item.question, 200, 510, 880, 70, 23, chapter.accent, true, "center");
}

function drawFive(slide, chapter, item) {
  const n = item.items.length;
  const gap = 18, w = (1168 - gap * (n - 1)) / n;
  item.items.forEach((it, i) => {
    const x = M + i * (w + gap);
    line(slide, `five-rule-${i}`, x, 218, w, 0, chapter.accent, 4);
    textBox(slide, `five-title-${i}`, it[0], x, 252, w, 62, 20, INK, true);
    textBox(slide, `five-body-${i}`, it[1], x, 330, w, 170, 17, MUTED);
    textBox(slide, `five-num-${i}`, String(i + 1).padStart(2, "0"), x, 540, w, 42, 15, chapter.accent, true);
  });
}

function drawCompare(slide, chapter, item) {
  const cols = [[M, item.leftTitle, item.left, "#F7E9E9", RED], [680, item.rightTitle, item.right, "#E5F3EF", GREEN]];
  cols.forEach(([x, title, bullets, fill, color], i) => {
    box(slide, `compare-panel-${i}`, x, 180, 544, 410, fill, "none", false);
    textBox(slide, `compare-title-${i}`, title, x + 30, 212, 484, 50, 19, color, true);
    textBox(slide, `compare-body-${i}`, bullets.map((b) => `• ${b}`).join("\n"), x + 30, 292, 484, 235, 25, INK, i === 1);
  });
}

function drawExperiment(slide, chapter, item) {
  const widths = [300, 410, 410];
  const xs = [M, M + widths[0], M + widths[0] + widths[1]];
  item.rows.forEach((r, ri) => {
    const y = 180 + ri * 78;
    r.forEach((c, ci) => {
      if (ri === 0) box(slide, `exp-head-${ci}`, xs[ci], y, widths[ci], 62, chapter.accent, chapter.accent, false);
      else line(slide, `exp-line-${ri}-${ci}`, xs[ci], y + 62, widths[ci], 0, LINE, 1);
      textBox(slide, `exp-cell-${ri}-${ci}`, c, xs[ci] + 16, y, widths[ci] - 32, 62, ri === 0 ? 16 : 20, ri === 0 ? WHITE : INK, ri === 0 || ci === 0);
    });
  });
  textBox(slide, "exp-caption", item.caption, M, 590, 1168, 45, 20, MUTED, true, "center");
}

function drawMetrics(slide, chapter, item) {
  const xs = [M, 354, 652, 950];
  item.metrics.forEach((m, i) => {
    line(slide, `metric-rule-${i}`, xs[i], 220, 242, 0, chapter.accent, 4);
    textBox(slide, `metric-label-${i}`, m[0], xs[i], 255, 242, 90, 18, MUTED, true);
    textBox(slide, `metric-value-${i}`, m[1], xs[i], 360, 242, 150, 38, INK, true);
  });
}

function drawLayers(slide, chapter, item) {
  const n = item.layers.length;
  const y0 = 172, maxW = 930, minW = 470, h = 58, gap = 10;
  item.layers.forEach((l, i) => {
    const w = maxW - i * ((maxW - minW) / Math.max(1, n - 1));
    const x = (W - w) / 2;
    box(slide, `layer-${i}`, x, y0 + i * (h + gap), w, h, i === 0 ? chapter.accent : WHITE, i === 0 ? chapter.accent : LINE, false);
    textBox(slide, `layer-name-${i}`, l[0], x + 18, y0 + i * (h + gap), 220, h, 17, i === 0 ? WHITE : chapter.accent, true);
    textBox(slide, `layer-body-${i}`, l[1], x + 250, y0 + i * (h + gap), w - 268, h, 18, i === 0 ? WHITE : INK);
  });
  if (item.question) textBox(slide, "layer-question", `${item.question}  ${item.answer || ""}`, 120, 620, 1040, 42, 18, MUTED, true, "center");
}

function drawMatrix(slide, chapter, item) {
  const cols = item.columns.length;
  const widths = cols === 3 ? [440, 340, 388] : Array(cols).fill(1168 / cols);
  const xs = [M];
  for (let i = 1; i < cols; i += 1) xs.push(xs[i - 1] + widths[i - 1]);
  item.columns.forEach((c, i) => {
    box(slide, `matrix-head-${i}`, xs[i], 168, widths[i], 58, chapter.accent, chapter.accent, false);
    textBox(slide, `matrix-head-text-${i}`, c, xs[i] + 14, 168, widths[i] - 28, 58, 15, WHITE, true);
  });
  const rowH = Math.min(62, 380 / item.rows.length);
  item.rows.forEach((r, ri) => r.forEach((c, ci) => {
    const y = 226 + ri * rowH;
    if ((ri + ci) % 2 === 0) box(slide, `matrix-bg-${ri}-${ci}`, xs[ci], y, widths[ci], rowH, "#EEF1F5", "none", false);
    textBox(slide, `matrix-${ri}-${ci}`, c, xs[ci] + 14, y, widths[ci] - 28, rowH, ci === 0 ? 16 : 17, ci === 0 ? INK : MUTED, ci === 0);
    line(slide, `matrix-line-${ri}-${ci}`, xs[ci], y + rowH, widths[ci], 0, LINE, 1);
  }));
}

function drawFlow(slide, chapter, item) {
  const n = item.steps.length, gap = 35, w = (1168 - gap * (n - 1)) / n;
  item.steps.forEach((s, i) => {
    const x = M + i * (w + gap);
    if (i < n - 1) line(slide, `flow-arrow-${i}`, x + w, 335, gap, 0, chapter.accent, 3, true);
    box(slide, `flow-node-${i}`, x, 260, w, 150, i === 2 ? chapter.accent : WHITE, chapter.accent);
    textBox(slide, `flow-num-${i}`, String(i + 1).padStart(2, "0"), x + 15, 275, w - 30, 30, 14, i === 2 ? WHITE : chapter.accent, true);
    textBox(slide, `flow-text-${i}`, s, x + 15, 315, w - 30, 70, 20, i === 2 ? WHITE : INK, true, "center");
  });
  textBox(slide, "flow-caption", item.caption, 160, 500, 960, 70, 24, INK, true, "center");
}

function drawCorrelation(slide, chapter, item) {
  line(slide, "corr-arrow", 520, 350, 240, 0, chapter.accent, 4, true);
  box(slide, "corr-call", 120, 230, 400, 240, WHITE, chapter.accent);
  box(slide, "corr-result", 760, 230, 400, 240, "#EAF0F9", chapter.accent);
  textBox(slide, "corr-call-label", "ASSISTANT TOOL CALL", 150, 260, 340, 35, 16, chapter.accent, true, "center");
  textBox(slide, "corr-call-id", item.call, 150, 325, 340, 70, 28, INK, true, "center", MONO);
  textBox(slide, "corr-result-label", "TOOL RESULT", 790, 260, 340, 35, 16, chapter.accent, true, "center");
  textBox(slide, "corr-result-id", item.result, 790, 325, 340, 70, 28, INK, true, "center", MONO);
  textBox(slide, "corr-caption", item.caption, 180, 530, 920, 64, 24, INK, true, "center");
}

function drawFour(slide, chapter, item) {
  const pts = [[M, 180], [670, 180], [M, 405], [670, 405]];
  item.items.forEach((it, i) => {
    const [x, y] = pts[i];
    textBox(slide, `four-num-${i}`, String(i + 1).padStart(2, "0"), x, y, 60, 32, 14, chapter.accent, true);
    line(slide, `four-rule-${i}`, x, y + 45, 530, 0, chapter.accent, 3);
    textBox(slide, `four-title-${i}`, it[0], x, y + 65, 530, 42, 22, INK, true);
    textBox(slide, `four-body-${i}`, it[1], x, y + 112, 530, 65, 18, MUTED);
  });
}

function drawStack(slide, chapter, item) {
  item.levels.forEach((l, i) => {
    const x = M + i * 55, y = 180 + i * 92, w = 1168 - i * 110;
    box(slide, `stack-${i}`, x, y, w, 72, i === item.levels.length - 1 ? chapter.accent : WHITE, i === item.levels.length - 1 ? chapter.accent : LINE, false);
    textBox(slide, `stack-title-${i}`, l[0], x + 20, y, 210, 72, 16, i === item.levels.length - 1 ? WHITE : chapter.accent, true);
    textBox(slide, `stack-body-${i}`, l[1], x + 250, y, w - 270, 72, 19, i === item.levels.length - 1 ? WHITE : INK);
  });
}

function drawLadder(slide, chapter, item) {
  const n = item.levels.length, h = 58, gap = 9;
  item.levels.forEach((l, i) => {
    const w = 550 + i * 100, x = (W - w) / 2, y = 574 - i * (h + gap);
    box(slide, `ladder-${i}`, x, y, w, h, i === n - 1 ? chapter.accent : WHITE, chapter.accent, false);
    textBox(slide, `ladder-num-${i}`, l[0], x + 16, y, 55, h, 15, i === n - 1 ? WHITE : chapter.accent, true);
    textBox(slide, `ladder-name-${i}`, l[1], x + 75, y, 220, h, 18, i === n - 1 ? WHITE : INK, true);
    textBox(slide, `ladder-body-${i}`, l[2], x + 315, y, w - 330, h, 17, i === n - 1 ? WHITE : MUTED);
  });
}

function drawRubric(slide, chapter, item) {
  const y0 = 170, rowH = 74;
  item.criteria.forEach((c, i) => {
    textBox(slide, `rubric-num-${i}`, String(i + 1).padStart(2, "0"), M, y0 + i * rowH, 70, rowH, 14, chapter.accent, true);
    textBox(slide, `rubric-label-${i}`, c[0], M + 90, y0 + i * rowH, 250, rowH, 20, INK, true);
    textBox(slide, `rubric-body-${i}`, c[1], M + 350, y0 + i * rowH, 818, rowH, 20, MUTED);
    line(slide, `rubric-line-${i}`, M, y0 + (i + 1) * rowH, 1168, 0, LINE, 1);
  });
  box(slide, "rubric-close", M, 570, 1168, 75, INK, "none", false);
  textBox(slide, "rubric-close-text", item.close, M + 28, 580, 1112, 55, 23, WHITE, true, "center");
}

function drawSlide(slide, chapter, item, globalIndex, localIndex) {
  const drawers = {
    hero: drawHero,
    predict: drawPredict,
    boundary: drawBoundary,
    fork: drawFork,
    code: drawCode,
    diagnostic: drawDiagnostic,
    trio: drawTrio,
    timeline: drawTimeline,
    loop: drawLoop,
    exit: drawExit,
    five: drawFive,
    compare: drawCompare,
    experiment: drawExperiment,
    metrics: drawMetrics,
    layers: drawLayers,
    matrix: drawMatrix,
    flow: drawFlow,
    correlation: drawCorrelation,
    four: drawFour,
    stack: drawStack,
    ladder: drawLadder,
    rubric: drawRubric,
  };
  if (item.kind === "hero") {
    addChrome(slide, chapter, item.title, globalIndex, localIndex, item.kind);
    drawers[item.kind](slide, chapter, item);
  } else {
    slide.background.fill = PAPER;
    drawers[item.kind](slide, chapter, item);
    // Add the Codex Grid title/footer hierarchy last so technical diagrams never
    // obscure repeated deck chrome in PowerPoint renderers.
    addChrome(slide, chapter, item.title, globalIndex, localIndex, item.kind);
  }
  addNotes(slide, chapter, item);
}

async function main() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  let globalIndex = 0;
  for (const chapter of chapters) {
    chapter.slides.forEach((item, localIndex) => {
      const slide = presentation.slides.add();
      globalIndex += 1;
      drawSlide(slide, chapter, item, globalIndex, localIndex + 1);
    });
  }

  const expectedCounts = [6, 8, 8, 8, 10, 10, 6, 8, 6];
  chapters.forEach((chapter, i) => {
    if (chapter.slides.length !== expectedCounts[i]) throw new Error(`Chapter ${i} has ${chapter.slides.length} slides; expected ${expectedCounts[i]}.`);
  });
  if (globalIndex !== 70) throw new Error(`Deck has ${globalIndex} slides; expected 70 from chapter targets.`);

  const output = path.resolve(process.argv[2] || "Coding_Agent_Workshop.pptx");
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(output);
  console.log(`Wrote ${globalIndex} slides to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
