#!/usr/bin/env node

import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const courseRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(courseRoot, "..");
const outputArgument = process.argv[2];
const outputPath = path.resolve(outputArgument ?? path.join(courseRoot, "demos", "capstone_trace.jsonl"));
const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "coding-agent-capstone-"));
const materializedRoot = path.join(temporaryRoot, "materialized");
const checkpointRoot = path.join(materializedRoot, "08_capstone_solution");
const starter = path.join(checkpointRoot, "starter");
const patched = path.join(checkpointRoot, "patched");
const patchPath = path.join(courseRoot, "checkpoints", "08_capstone_solution", "answer.patch");
const events = [];
const started = Date.now();

function portable(value) {
  return String(value)
    .replaceAll(temporaryRoot, "<WORKSPACE>")
    .replaceAll(temporaryRoot.replaceAll("\\", "/"), "<WORKSPACE>")
    .replaceAll(repositoryRoot, "<REPOSITORY>")
    .replaceAll(repositoryRoot.replaceAll("\\", "/"), "<REPOSITORY>")
    .replaceAll(os.homedir(), "<HOME>")
    .replaceAll(os.homedir().replaceAll("\\", "/"), "<HOME>");
}

function record(kind, detail, status = "ok") {
  events.push({
    sequence: events.length + 1,
    kind,
    status,
    elapsed_ms: Date.now() - started,
    detail: typeof detail === "string" ? portable(detail) : detail,
  });
}

function run(command, args, cwd, expected = [0]) {
  const began = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 240_000,
    windowsHide: true,
  });
  const output = portable(`${result.stdout ?? ""}${result.stderr ?? ""}`.trim());
  const ok = !result.error && expected.includes(result.status);
  record("process_result", {
    command: [command, ...args].map(portable),
    cwd: portable(cwd),
    exit_code: result.status,
    duration_ms: Date.now() - began,
    output,
  }, ok ? "ok" : "error");
  if (!ok) throw new Error(`${command} failed with exit ${result.status}: ${output}`);
  return result;
}

try {
  record("metadata", {
    provenance: "captured_deterministic_capstone",
    checkpoint: "08_capstone_solution",
    task: "Apply the checked-in bounded list_files answer patch, inspect the diff, build, and test.",
    limitation: "This fallback does not run a model, generate a patch, or attest a human review.",
    generated_at: new Date().toISOString(),
  });

  run(process.execPath, [path.join(scriptDirectory, "checkpoints.mjs"), "materialize", "08_capstone_solution", "starter", materializedRoot], repositoryRoot);
  const starterSource = readFileSync(path.join(starter, "src", "tool_dispatcher.cpp"), "utf8");
  if (starterSource.includes('if (call.name == "list_files")')) throw new Error("Capstone starter already dispatches list_files");
  record("baseline_inspection", {
    list_files_published: false,
    list_files_dispatched: false,
    decision: "safe_to_apply_reviewed_answer_patch",
  });

  cpSync(starter, patched, { recursive: true });
  const patch = readFileSync(patchPath);
  record("change_proposal", {
    patch: "course/checkpoints/08_capstone_solution/answer.patch",
    sha256: createHash("sha256").update(patch).digest("hex"),
    origin: "checked_in_instructor_answer_patch",
  });
  run("git", ["apply", "--check", patchPath], patched);
  run("git", ["apply", patchPath], patched);
  run("git", ["-c", "core.autocrlf=input", "-c", "core.safecrlf=false", "diff", "--no-index", "--stat", starter, patched], repositoryRoot, [0, 1]);
  record("review_gate", {
    decision: "continue_automated_fallback",
    basis: "checked-in patch hash plus git apply --check",
    scope: "schema, dispatcher, bounded sorted listing, focused tests",
    limitation: "No human review occurred during this capture; the live capstone requires a separate keep/amend/discard decision.",
  });

  const build = path.join(patched, "build");
  const configureArguments = ["-S", patched, "-B", build];
  if (process.platform === "win32") configureArguments.push("-G", "Ninja");
  run("cmake", configureArguments, repositoryRoot);
  run("cmake", ["--build", build, "--config", "Debug", "--parallel"], repositoryRoot);
  run("ctest", ["--test-dir", build, "-C", "Debug", "--output-on-failure"], repositoryRoot);
  record("completion", {
    completed: true,
    technical_evidence_level: 5,
    outcome: "deterministic_answer_patch_fallback",
    evidence: "answer patch applied; full deterministic CTest suite passed after the edit",
    limitation: "This is fallback validation, not evidence of model-authored self-modification or human approval.",
  });

  writeFileSync(outputPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  console.log(`Captured deterministic capstone trace: ${outputPath}`);
} catch (error) {
  record("capture_failure", { message: portable(error.message) }, "error");
  writeFileSync(outputPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  console.error(`Capstone capture failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  const resolvedTemp = path.resolve(os.tmpdir());
  const resolvedTarget = path.resolve(temporaryRoot);
  if (resolvedTarget.startsWith(`${resolvedTemp}${path.sep}`) && existsSync(resolvedTarget)) {
    rmSync(resolvedTarget, { recursive: true, force: true });
  }
}
