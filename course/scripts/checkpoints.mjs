#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const courseDirectory = path.resolve(scriptDirectory, "..");
const checkpointsDirectory = path.join(courseDirectory, "checkpoints");
const manifestPath = path.join(checkpointsDirectory, "manifest.json");

function fail(message) {
  throw new Error(message);
}

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function portableBytes(value) {
  if (value.includes(0)) return value;
  return Buffer.from(normalizeText(value.toString("utf8")), "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1) fail("Unsupported checkpoint manifest schema");
  if (!Array.isArray(manifest.checkpoints) || manifest.checkpoints.length !== 9) {
    fail("The checkpoint manifest must contain exactly nine ordered checkpoints");
  }

  const ids = new Set();
  manifest.checkpoints.forEach((checkpoint, index) => {
    if (checkpoint.order !== index) fail(`Checkpoint ${checkpoint.id ?? index} has a non-sequential order`);
    if (!/^0[0-8]_[a-z0-9_]+$/.test(checkpoint.id)) fail(`Invalid checkpoint id: ${checkpoint.id}`);
    if (!checkpoint.id.startsWith(`${String(index).padStart(2, "0")}_`)) {
      fail(`Checkpoint ${checkpoint.id} does not match its order ${index}`);
    }
    if (ids.has(checkpoint.id)) fail(`Duplicate checkpoint id: ${checkpoint.id}`);
    ids.add(checkpoint.id);
    if (checkpoint.testLabel !== null && !/^checkpoint-0[0-8]$/.test(checkpoint.testLabel)) {
      fail(`Invalid CTest label for ${checkpoint.id}: ${checkpoint.testLabel}`);
    }
    if (!Array.isArray(checkpoint.focusFiles) || checkpoint.focusFiles.length === 0) {
      fail(`Checkpoint ${checkpoint.id} must name at least one focus file`);
    }
    const directory = path.join(checkpointsDirectory, checkpoint.id);
    if (!fs.existsSync(path.join(directory, "README.md"))) fail(`Missing checkpoint README: ${checkpoint.id}`);
  });
  return manifest;
}

function listFiles(directory, prefix = "") {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "out" || entry.name.startsWith("build")) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(absolute, relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result.sort();
}

function readWorkspace(directory) {
  const workspace = new Map();
  for (const relative of listFiles(directory)) {
    workspace.set(relative, fs.readFileSync(path.join(directory, ...relative.split("/"))));
  }
  return workspace;
}

function cloneWorkspace(workspace) {
  return new Map([...workspace].map(([relative, content]) => [relative, Buffer.from(content)]));
}

function textFile(workspace, relative) {
  const content = workspace.get(relative);
  if (!content) fail(`Checkpoint transform could not find ${relative}`);
  return normalizeText(content.toString("utf8"));
}

function setTextFile(workspace, relative, content) {
  workspace.set(relative, Buffer.from(normalizeText(content), "utf8"));
}

function replaceExactly(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) fail(`Checkpoint transform did not find ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) fail(`Checkpoint transform found ${label} more than once`);
  return `${source.slice(0, first)}${after}${source.slice(first + before.length)}`;
}

function replaceFunction(source, signature, body, label = signature) {
  const signatureAt = source.indexOf(signature);
  if (signatureAt < 0) fail(`Checkpoint transform did not find ${label}`);
  if (source.indexOf(signature, signatureAt + signature.length) >= 0) {
    fail(`Checkpoint transform found ${label} more than once`);
  }
  const open = source.indexOf("{", signatureAt + signature.length);
  if (open < 0) fail(`Checkpoint transform found no body for ${label}`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1] ?? "";
    if (lineComment) {
      if (current === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === "\\") escaped = true;
      else if (current === quote) quote = "";
      continue;
    }
    if (current === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (current === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
      continue;
    }
    if (current === "{") depth += 1;
    if (current === "}") {
      depth -= 1;
      if (depth === 0) return `${source.slice(0, open + 1)}\n${body}\n${source.slice(index)}`;
    }
  }
  fail(`Checkpoint transform found an unterminated body for ${label}`);
}

function lockApiSmoke(workspace) {
  const relative = "src/scripted_model_client.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceExactly(
    source,
    'responses.push_back(final_response("Mock model is ready.", 10));',
    'responses.push_back(final_response("Checkpoint 00 starter: make the smoke response match the release gate.", 10));',
    "the deterministic smoke response"));
}

function lockMessages(workspace) {
  const relative = "src/types.cpp";
  let source = textFile(workspace, relative);
  source = replaceFunction(source, "Json message_to_json(const Message& message)",
    '    (void)message;\n    throw std::runtime_error("TODO checkpoint 01: serialize message history");');
  source = replaceFunction(source, "Message assistant_message_from_json(const Json& value)",
    '    (void)value;\n    throw std::runtime_error("TODO checkpoint 01: parse assistant messages");');
  source = replaceFunction(source, "ModelResponse model_response_from_json(const Json& value)",
    '    (void)value;\n    throw std::runtime_error("TODO checkpoint 01: parse model responses");');
  setTextFile(workspace, relative, source);
}

function lockSystemPrompt(workspace) {
  const relative = "src/main.cpp";
  const source = textFile(workspace, relative);
  const start = source.indexOf('const char* default_system_prompt = R"PROMPT(');
  const endMarker = ')PROMPT";';
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) fail("Checkpoint transform could not find the default system prompt");
  const replacement = 'const char* default_system_prompt = R"PROMPT(TODO checkpoint 02: define goal, evidence policy, action boundary, and completion evidence.)PROMPT";';
  setTextFile(workspace, relative, `${source.slice(0, start)}${replacement}${source.slice(end + endMarker.length)}`);
}

function lockToolSchema(workspace) {
  const relative = "src/tool_dispatcher.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceFunction(source, "Json ToolDispatcher::definitions() const",
    "    // TODO checkpoint 03: publish strict schemas for the executable tools.\n    return Json::array();"));
}

function lockToolDispatch(workspace) {
  const relative = "src/tool_dispatcher.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceFunction(source, "Json ToolDispatcher::execute(const ToolCall& call) const",
    '    (void)call;\n    return tool_failure("checkpoint_incomplete", "TODO checkpoint 04: implement the fail-closed dispatcher pipeline.");'));
}

function lockAgentLoop(workspace) {
  const relative = "src/agent_loop.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceFunction(source,
    "LoopResult AgentLoop::run(\n    const std::string& system_prompt,\n    const std::string& user_prompt,\n    TraceSink trace,\n    CancelCheck cancelled) const",
    "    (void)system_prompt;\n    (void)user_prompt;\n    (void)trace;\n    (void)cancelled;\n    LoopResult result;\n    result.stop_reason = \"checkpoint_incomplete\";\n    return result;",
    "AgentLoop::run"));
}

function lockTraceAndLimits(workspace) {
  const relative = "src/agent_loop.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceFunction(source, "Json trace_event_to_json(const TraceEvent& event)",
    '    Json result = Json::object();\n    result["kind"] = event.kind;\n    result["detail"] = event.detail;\n    // TODO checkpoint 06: include iteration, call correlation, usage, elapsed time, and stop evidence.\n    return result;'));
}

function lockCanonicalSafety(workspace) {
  const relative = "src/tool_dispatcher.cpp";
  const source = textFile(workspace, relative);
  setTextFile(workspace, relative, replaceFunction(source,
    "std::filesystem::path ToolDispatcher::resolve_inside_workspace(const std::string& relative_path) const",
    `    if (relative_path.empty()) throw ToolRequestError("invalid_arguments", "Path must not be empty");
    const std::filesystem::path supplied(relative_path);
    if (supplied.is_absolute() || supplied.has_root_name()) {
        throw ToolRequestError("path_outside_workspace", "Absolute paths are not allowed");
    }
    const std::filesystem::path candidate = (workspace_ / supplied).lexically_normal();
    if (!is_component_prefix(workspace_, candidate)) {
        throw ToolRequestError("path_outside_workspace", "Path is outside the workshop workspace");
    }
    // TODO checkpoint 07: canonicalize existing paths and parents so symlinks cannot escape.
    return candidate;`));
}

function lockListFiles(workspace, lockedFeatures) {
  const relative = "src/tool_dispatcher.cpp";
  let source = textFile(workspace, relative);

  if (!lockedFeatures.has("tool_schema")) {
    const start = source.indexOf("    Json list_properties = Json::object();");
    const end = source.indexOf("\n\n    return tools;", start);
    if (start < 0 || end < 0) fail("Checkpoint transform could not remove the list_files schema");
    source = `${source.slice(0, start)}    // list_files is intentionally absent until checkpoint 08.${source.slice(end)}`;
  }
  if (!lockedFeatures.has("tool_dispatch")) {
    source = replaceExactly(
      source,
      '        if (call.name == "list_files") return list_files(call.arguments);\n',
      "",
      "the list_files dispatch branch");
  }
  source = replaceFunction(source, "Json ToolDispatcher::list_files(const Json& arguments) const",
    '    (void)arguments;\n    return tool_failure("unknown_tool", "list_files is introduced in checkpoint 08.");');
  setTextFile(workspace, relative, source);

  const testsRelative = "tests/test_main.cpp";
  let tests = textFile(workspace, testsRelative);
  tests = replaceExactly(
    tests,
    'check(definitions.is_array() && definitions.size() == 4, "Expected four final-state tool definitions");',
    'check(definitions.is_array() && definitions.size() == 3, "Expected three pre-capstone tool definitions");',
    "the pre-capstone schema count");
  tests = replaceExactly(
    tests,
    'check(names == std::set<std::string>({"list_files", "read_file", "run_command", "write_file"}), "Tool definition names drifted");',
    'check(names == std::set<std::string>({"read_file", "run_command", "write_file"}), "Tool definition names drifted");',
    "the pre-capstone schema names");
  const listTestStart = tests.indexOf('    const course_agent::Json list = tools.execute({"list-1", "list_files"');
  const listTestEndMarker = '    check(over_list.at("data").at("count").as_number() == 2.0, "Over-limit listing returned too many files");\n\n';
  const listTestEnd = tests.indexOf(listTestEndMarker, listTestStart);
  if (listTestStart < 0 || listTestEnd < 0) fail("Checkpoint transform could not gate the list_files boundary tests");
  tests = `${tests.slice(0, listTestStart)}    // list_files boundary tests are unlocked by checkpoint 08.\n\n${tests.slice(listTestEnd + listTestEndMarker.length)}`;
  tests = replaceExactly(
    tests,
    'check(definitions.is_array() && definitions.size() == 4, "Expected four tool definitions");',
    'check(definitions.is_array() && definitions.size() == 3, "Expected three pre-capstone tool definitions");',
    "the pre-capstone dispatcher schema count");
  setTextFile(workspace, testsRelative, tests);
}

const featureLocks = new Map([
  ["api_smoke", lockApiSmoke],
  ["messages", lockMessages],
  ["system_prompt", lockSystemPrompt],
  ["tool_schema", lockToolSchema],
  ["tool_dispatch", lockToolDispatch],
  ["agent_loop", lockAgentLoop],
  ["trace_and_limits", lockTraceAndLimits],
  ["canonical_safety", lockCanonicalSafety],
]);

function stagedWorkspace(canonical, manifest, checkpointIndex, variant) {
  if (variant !== "starter" && variant !== "solution") fail(`Unknown checkpoint variant: ${variant}`);
  const firstLocked = variant === "starter" ? checkpointIndex : checkpointIndex + 1;
  const locked = manifest.checkpoints.slice(firstLocked).map((checkpoint) => checkpoint.feature);
  const lockedFeatures = new Set(locked);
  const workspace = cloneWorkspace(canonical);
  for (const feature of locked) {
    if (feature === "list_files") continue;
    const transform = featureLocks.get(feature);
    if (!transform) fail(`No transform registered for ${feature}`);
    transform(workspace);
  }
  if (lockedFeatures.has("list_files")) lockListFiles(workspace, lockedFeatures);
  return { workspace, locked };
}

function workspaceHash(workspace) {
  const digest = crypto.createHash("sha256");
  for (const [relative, content] of [...workspace].sort(([left], [right]) => left.localeCompare(right))) {
    digest.update(relative);
    digest.update("\0");
    digest.update(sha256(portableBytes(content)));
    digest.update("\n");
  }
  return digest.digest("hex");
}

function fileHashes(workspace) {
  return Object.fromEntries([...workspace]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([relative, content]) => [relative, sha256(portableBytes(content))]));
}

function workspacesEqual(left, right) {
  if (left.size !== right.size) return false;
  for (const [relative, content] of left) {
    if (!right.has(relative) || !content.equals(right.get(relative))) return false;
  }
  return true;
}

function splitLines(content) {
  const lines = normalizeText(content.toString("utf8")).split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

function lineOperations(before, after) {
  const left = splitLines(before);
  const right = splitLines(after);
  const rows = left.length + 1;
  const columns = right.length + 1;
  const table = Array.from({ length: rows }, () => new Uint32Array(columns));
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      table[leftIndex][rightIndex] = left[leftIndex] === right[rightIndex]
        ? table[leftIndex + 1][rightIndex + 1] + 1
        : Math.max(table[leftIndex + 1][rightIndex], table[leftIndex][rightIndex + 1]);
    }
  }

  const operations = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length || rightIndex < right.length) {
    if (leftIndex < left.length && rightIndex < right.length && left[leftIndex] === right[rightIndex]) {
      operations.push({ type: " ", line: left[leftIndex] });
      leftIndex += 1;
      rightIndex += 1;
    } else if (rightIndex < right.length && (leftIndex === left.length || table[leftIndex][rightIndex + 1] >= table[leftIndex + 1][rightIndex])) {
      operations.push({ type: "+", line: right[rightIndex] });
      rightIndex += 1;
    } else {
      operations.push({ type: "-", line: left[leftIndex] });
      leftIndex += 1;
    }
  }
  return operations;
}

function unifiedFileDiff(relative, before, after) {
  const operations = lineOperations(before, after);
  const changes = operations.flatMap((operation, index) => operation.type === " " ? [] : [index]);
  if (changes.length === 0) return "";

  const context = 3;
  const ranges = [];
  for (const change of changes) {
    const start = Math.max(0, change - context);
    const end = Math.min(operations.length - 1, change + context);
    const current = ranges.at(-1);
    if (current && start <= current.end + 1) current.end = Math.max(current.end, end);
    else ranges.push({ start, end });
  }

  const oldBefore = new Uint32Array(operations.length + 1);
  const newBefore = new Uint32Array(operations.length + 1);
  operations.forEach((operation, index) => {
    oldBefore[index + 1] = oldBefore[index] + (operation.type === "+" ? 0 : 1);
    newBefore[index + 1] = newBefore[index] + (operation.type === "-" ? 0 : 1);
  });

  const output = [`--- a/${relative}`, `+++ b/${relative}`];
  for (const range of ranges) {
    const selected = operations.slice(range.start, range.end + 1);
    const oldCount = selected.filter((operation) => operation.type !== "+").length;
    const newCount = selected.filter((operation) => operation.type !== "-").length;
    const oldStart = oldBefore[range.start] + (oldCount === 0 ? 0 : 1);
    const newStart = newBefore[range.start] + (newCount === 0 ? 0 : 1);
    output.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    output.push(...selected.map((operation) => `${operation.type}${operation.line}`));
  }
  return `${output.join("\n")}\n`;
}

function workspaceDiff(before, after) {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  let patch = "";
  for (const relative of paths) {
    const left = before.get(relative) ?? Buffer.from("");
    const right = after.get(relative) ?? Buffer.from("");
    if (left.equals(right)) continue;
    patch += unifiedFileDiff(relative, left, right);
  }
  return patch;
}

function expectedArtifacts(manifest, canonical, fixture) {
  const expected = new Map();
  const records = [];
  const staged = manifest.checkpoints.map((checkpoint, index) => ({
    checkpoint,
    starter: stagedWorkspace(canonical, manifest, index, "starter"),
    solution: stagedWorkspace(canonical, manifest, index, "solution"),
  }));

  staged.forEach((entry, index) => {
    const answerPatch = workspaceDiff(entry.starter.workspace, entry.solution.workspace);
    const previousPatch = index === 0
      ? "# Checkpoint 00 is the baseline; there is no previous instructor solution.\n"
      : workspaceDiff(staged[index - 1].solution.workspace, entry.solution.workspace);
    if (!answerPatch) fail(`Checkpoint ${entry.checkpoint.id} has an empty answer diff`);
    if (index > 0 && !previousPatch) fail(`Checkpoint ${entry.checkpoint.id} has an empty prior-checkpoint diff`);

    const metadata = {
      schemaVersion: 1,
      order: entry.checkpoint.order,
      id: entry.checkpoint.id,
      title: entry.checkpoint.title,
      feature: entry.checkpoint.feature,
      testLabel: entry.checkpoint.testLabel,
      focusFiles: entry.checkpoint.focusFiles,
      releaseGate: entry.checkpoint.releaseGate,
      materialize: {
        both: `node course/scripts/checkpoints.mjs materialize ${entry.checkpoint.id}`,
        starter: `node course/scripts/checkpoints.mjs materialize ${entry.checkpoint.id} starter`,
        solution: `node course/scripts/checkpoints.mjs materialize ${entry.checkpoint.id} solution`
      },
      verify: {
        configure: "cmake -S . -B build",
        build: "cmake --build build --config Debug",
        test: entry.checkpoint.testLabel
          ? `ctest --test-dir build -C Debug -L ${entry.checkpoint.testLabel} --output-on-failure`
          : null
      },
      starter: {
        sha256: workspaceHash(entry.starter.workspace),
        lockedFeatures: entry.starter.locked
      },
      solution: {
        sha256: workspaceHash(entry.solution.workspace),
        lockedFeatures: entry.solution.locked,
        canonicalReference: index === manifest.checkpoints.length - 1
      },
      answerDiff: {
        path: "answer.patch",
        sha256: sha256(answerPatch)
      },
      previousCheckpointDiff: {
        path: "from_previous.patch",
        sha256: sha256(previousPatch),
        from: index === 0 ? null : staged[index - 1].checkpoint.id
      }
    };

    const prefix = `${entry.checkpoint.id}/`;
    expected.set(`${prefix}checkpoint.json`, stableJson(metadata));
    expected.set(`${prefix}answer.patch`, answerPatch);
    expected.set(`${prefix}from_previous.patch`, previousPatch);
    records.push({
      order: entry.checkpoint.order,
      id: entry.checkpoint.id,
      feature: entry.checkpoint.feature,
      starterSha256: metadata.starter.sha256,
      solutionSha256: metadata.solution.sha256,
      starterEqualsPreviousSolution: index === 0 ? null : metadata.starter.sha256 === records[index - 1].solutionSha256,
      answerPatchSha256: metadata.answerDiff.sha256,
      previousPatchSha256: metadata.previousCheckpointDiff.sha256
    });
  });

  const integrity = {
    schemaVersion: 1,
    hashNormalization: "UTF-8 text line endings are normalized to LF; binary files are hashed byte-for-byte.",
    manifestSha256: sha256(portableBytes(fs.readFileSync(manifestPath))),
    canonical: {
      path: "../reference",
      sha256: workspaceHash(canonical),
      files: fileHashes(canonical)
    },
    sharedFixture: {
      path: "../fixture",
      sha256: workspaceHash(fixture),
      files: fileHashes(fixture)
    },
    checkpoints: records
  };
  expected.set("integrity.json", stableJson(integrity));
  return { expected, staged, integrity };
}

function writeGeneratedArtifacts(expected) {
  for (const [relative, content] of expected) {
    const destination = path.join(checkpointsDirectory, ...relative.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
}

function compareGeneratedArtifacts(expected) {
  const errors = [];
  for (const [relative, content] of expected) {
    const destination = path.join(checkpointsDirectory, ...relative.split("/"));
    if (!fs.existsSync(destination)) errors.push(`missing generated artifact ${relative}`);
    else if (normalizeText(fs.readFileSync(destination, "utf8")) !== normalizeText(content)) {
      errors.push(`stale generated artifact ${relative}`);
    }
  }
  if (errors.length) fail(`${errors.join("\n")}\nRun: node course/scripts/checkpoints.mjs generate`);
}

function assertSafeDestination(destination) {
  const resolved = path.resolve(destination);
  const root = path.parse(resolved).root;
  const protectedPaths = new Set([root, path.resolve(courseDirectory), path.resolve(checkpointsDirectory), path.resolve(os.homedir())]);
  if (protectedPaths.has(resolved)) fail(`Refusing to replace broad output path: ${resolved}`);
}

function writeWorkspace(workspace, destination) {
  assertSafeDestination(destination);
  fs.rmSync(destination, { recursive: true, force: true });
  for (const [relative, content] of workspace) {
    const file = path.join(destination, ...relative.split("/"));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

function selectCheckpoint(manifest, id) {
  const index = manifest.checkpoints.findIndex((checkpoint) => checkpoint.id === id);
  if (index < 0) fail(`Unknown checkpoint '${id}'. Use 'list' to see valid ids.`);
  return index;
}

function selfTest(manifest, canonical, fixture, staged, integrity) {
  if (!fixture.has("buggy_calculator/CMakeLists.txt")) {
    fail("The shared buggy_calculator fixture is missing");
  }
  for (let index = 1; index < staged.length; index += 1) {
    if (!workspacesEqual(staged[index].starter.workspace, staged[index - 1].solution.workspace)) {
      fail(`${staged[index].checkpoint.id} starter drifted from the prior solution`);
    }
  }
  const finalSolution = staged.at(-1).solution.workspace;
  if (!workspacesEqual(finalSolution, canonical)) {
    fail("Checkpoint 08 solution does not exactly match the canonical reference");
  }
  const capstoneStarter = textFile(staged.at(-1).starter.workspace, "src/tool_dispatcher.cpp");
  if (capstoneStarter.includes('if (call.name == "list_files")')) {
    fail("Checkpoint 08 starter still dispatches list_files");
  }
  if (capstoneStarter.includes('function_tool(\n        "list_files"')) {
    fail("Checkpoint 08 starter still publishes the list_files schema");
  }
  if (!capstoneStarter.includes("list_files is introduced in checkpoint 08")) {
    fail("Checkpoint 08 starter does not fail closed for list_files");
  }
  if (!integrity.checkpoints.every((record, index) => index === 0 || record.starterEqualsPreviousSolution)) {
    fail("Integrity record reports a broken checkpoint chain");
  }
  const manifestFeatures = new Set(manifest.checkpoints.map((checkpoint) => checkpoint.feature));
  if (manifestFeatures.size !== manifest.checkpoints.length) fail("Checkpoint features must be unique");
}

function usage() {
  console.log(`Checkpoint materializer

Usage:
  node course/scripts/checkpoints.mjs generate
  node course/scripts/checkpoints.mjs check
  node course/scripts/checkpoints.mjs list
  node course/scripts/checkpoints.mjs materialize <checkpoint-id|all> [starter|solution|both] [output-directory]

Materialized workspaces default to course/run/checkpoints/<id>/<variant>, with the shared fixture at <id>/fixture.`);
}

function main() {
  const manifest = loadManifest();
  const canonicalDirectory = path.resolve(checkpointsDirectory, manifest.canonicalSource);
  const canonical = readWorkspace(canonicalDirectory);
  const fixtureDirectory = path.resolve(checkpointsDirectory, manifest.sharedFixture);
  const fixture = readWorkspace(fixtureDirectory);
  for (const checkpoint of manifest.checkpoints) {
    for (const relative of checkpoint.focusFiles) {
      if (!canonical.has(relative)) fail(`${checkpoint.id} focus file is missing from the canonical reference: ${relative}`);
    }
  }
  const { expected, staged, integrity } = expectedArtifacts(manifest, canonical, fixture);
  const [command = "help", checkpointArgument, variantArgument = "both", outputArgument] = process.argv.slice(2);

  if (command === "generate") {
    writeGeneratedArtifacts(expected);
    selfTest(manifest, canonical, fixture, staged, integrity);
    console.log(`Generated checkpoint metadata for ${manifest.checkpoints.length} checkpoints.`);
    return;
  }
  if (command === "check") {
    compareGeneratedArtifacts(expected);
    selfTest(manifest, canonical, fixture, staged, integrity);
    console.log(`Checkpoint chain verified: 9 stages, 18 deterministic workspaces, canonical capstone solution.`);
    return;
  }
  if (command === "list") {
    for (const checkpoint of manifest.checkpoints) console.log(`${checkpoint.id}\t${checkpoint.title}`);
    return;
  }
  if (command === "materialize") {
    if (!checkpointArgument) fail("materialize requires a checkpoint id or 'all'");
    if (!["starter", "solution", "both"].includes(variantArgument)) fail(`Unknown variant: ${variantArgument}`);
    const indexes = checkpointArgument === "all"
      ? manifest.checkpoints.map((_, index) => index)
      : [selectCheckpoint(manifest, checkpointArgument)];
    const outputRoot = path.resolve(outputArgument ?? path.resolve(checkpointsDirectory, manifest.defaultOutput));
    const variants = variantArgument === "both" ? ["starter", "solution"] : [variantArgument];
    for (const index of indexes) {
      for (const variant of variants) {
        const destination = path.join(outputRoot, manifest.checkpoints[index].id, variant);
        writeWorkspace(staged[index][variant].workspace, destination);
        console.log(`${manifest.checkpoints[index].id}/${variant}\t${destination}`);
      }
      const fixtureDestination = path.join(outputRoot, manifest.checkpoints[index].id, "fixture");
      writeWorkspace(fixture, fixtureDestination);
      console.log(`${manifest.checkpoints[index].id}/fixture\t${fixtureDestination}`);
    }
    return;
  }
  usage();
  if (command !== "help" && command !== "--help" && command !== "-h") process.exitCode = 64;
}

try {
  main();
} catch (error) {
  console.error(`checkpoints: ${error.message}`);
  process.exitCode = 1;
}
