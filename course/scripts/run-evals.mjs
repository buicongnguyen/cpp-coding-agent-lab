#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const courseRoot = path.resolve(scriptDirectory, "..");

function usage() {
  console.error("Usage: node course/scripts/run-evals.mjs --build-dir PATH [--config Debug|Release] [--report PATH]");
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if ((argument === "--build-dir" || argument === "--config" || argument === "--report") && argv[index + 1]) {
      result[argument.slice(2).replace("-", "_")] = argv[++index];
    } else {
      usage();
      process.exit(64);
    }
  }
  if (!result.build_dir) {
    usage();
    process.exit(64);
  }
  return result;
}

function findTestExecutable(root) {
  const expected = process.platform === "win32" ? "agent_tests.exe" : "agent_tests";
  const matches = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name === expected) matches.push(candidate);
    }
  }
  visit(root);
  matches.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  if (!matches.length) throw new Error(`Could not find ${expected} below ${root}. Build the reference project first.`);
  return matches[0];
}

const options = parseArguments(process.argv.slice(2));
const buildDirectory = path.resolve(options.build_dir);
if (!existsSync(buildDirectory)) throw new Error(`Build directory does not exist: ${buildDirectory}`);

const cachePath = path.join(buildDirectory, "CMakeCache.txt");
if (!existsSync(cachePath)) throw new Error(`CMake cache does not exist: ${cachePath}`);
const cache = readFileSync(cachePath, "utf8");
function cacheValue(name) {
  const match = cache.match(new RegExp(`^${name}:[^=]*=(.*)$`, "m"));
  return match?.[1]?.trim() ?? "";
}
const cmakeCommand = cacheValue("CMAKE_COMMAND");
const ctestName = process.platform === "win32" ? "ctest.exe" : "ctest";
const adjacentCtest = cmakeCommand ? path.join(path.dirname(cmakeCommand), ctestName) : "";
const ctestCommand = adjacentCtest && existsSync(adjacentCtest) ? adjacentCtest : ctestName;
const configuration = options.config || cacheValue("CMAKE_BUILD_TYPE") || "Release";

function portableOutput(value) {
  const nativeBuildDirectory = buildDirectory;
  const genericBuildDirectory = buildDirectory.replaceAll("\\", "/");
  return String(value ?? "")
    .replaceAll(nativeBuildDirectory, "<BUILD_DIR>")
    .replaceAll(genericBuildDirectory, "<BUILD_DIR>");
}

const casesPath = path.join(courseRoot, "evals", "cases.json");
const cases = JSON.parse(readFileSync(casesPath, "utf8"));
if (!Array.isArray(cases) || cases.length < 5) throw new Error("evals/cases.json must contain at least five cases.");

const ids = new Set();
for (const item of cases) {
  if (!/^E\d+$/.test(item.id ?? "")) throw new Error(`Invalid evaluation ID: ${item.id}`);
  if (ids.has(item.id)) throw new Error(`Duplicate evaluation ID: ${item.id}`);
  ids.add(item.id);
  if (!item.name || !item.input || !Array.isArray(item.assertions) || item.assertions.length === 0) {
    throw new Error(`${item.id} must define name, input, and one or more assertions.`);
  }
}

const executable = findTestExecutable(buildDirectory);
const catalogRun = spawnSync(ctestCommand, [
  "--test-dir", buildDirectory,
  "--build-config", configuration,
  "--show-only=json-v1",
], {
  cwd: buildDirectory,
  encoding: "utf8",
  timeout: 30_000,
  windowsHide: true,
});
if (catalogRun.error || catalogRun.status !== 0) {
  throw new Error(`Could not inspect the CTest catalog: ${catalogRun.error?.message ?? `${catalogRun.stdout ?? ""}${catalogRun.stderr ?? ""}`}`);
}

let catalog;
try {
  catalog = JSON.parse(catalogRun.stdout);
} catch (error) {
  throw new Error(`CTest returned an invalid JSON catalog: ${error.message}`);
}

const registeredTests = new Map((catalog.tests ?? []).map((test) => [test.name, test]));
for (const item of cases) {
  const testName = `eval-${item.id}`;
  const registered = registeredTests.get(testName);
  if (!registered) throw new Error(`${item.id} has no registered CTest implementation named ${testName}.`);
  const command = registered.command ?? [];
  if (path.basename(command[0] ?? "") !== path.basename(executable)
      || command[1] !== "--case" || command[2] !== item.id || command.length !== 3) {
    throw new Error(`${testName} must invoke agent_tests --case ${item.id}; catalog command was ${JSON.stringify(command)}.`);
  }
}

const results = [];
for (const item of cases) {
  const started = Date.now();
  const run = spawnSync(ctestCommand, [
    "--test-dir", buildDirectory,
    "--build-config", configuration,
    "--tests-regex", `^eval-${item.id}$`,
    "--output-on-failure",
  ], {
    cwd: buildDirectory,
    encoding: "utf8",
    timeout: 180_000,
    windowsHide: true,
  });
  const durationMs = Date.now() - started;
  const passed = run.status === 0 && !run.error;
  results.push({
    id: item.id,
    name: item.name,
    passed,
    duration_ms: durationMs,
    exit_code: run.status,
    output: portableOutput(`${run.stdout ?? ""}${run.stderr ?? ""}`).trim().slice(0, 8_192),
  });
  console.log(`${passed ? "PASS" : "FAIL"} ${item.id} ${item.name} (${durationMs} ms)`);
}

const report = {
  schema_version: 1,
  provenance: "captured_reference_tests",
  generated_at: new Date().toISOString(),
  mode: "deterministic",
  runner: path.basename(ctestCommand),
  executable: path.basename(executable),
  passed: results.every((item) => item.passed),
  cases: results,
};

if (options.report) {
  const reportPath = path.resolve(options.report);
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report: ${reportPath}`);
}

if (!report.passed) process.exitCode = 1;
