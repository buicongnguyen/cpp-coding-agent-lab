import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const courseRoot = path.join(repositoryRoot, "course");
const outputDirectory = path.join(repositoryRoot, "website/src/generated");
const outputPath = path.join(outputDirectory, "course-data.js");

const chapterDefinitions = [
  {
    id: 0,
    slug: "environment",
    file: "00_environment.md",
    checkpoint: "00_api_smoke",
    shortTitle: "Environment & preflight",
    eyebrow: "Orient",
    time: 25,
    outcome: "Prove the toolchain and deterministic model path before adding complexity.",
    selfPacedTime: 50,
    mission: "Make the finished agent observable before you are asked to trust it.",
    upgrade: "A reproducible model boundary and preflight executable",
    failure: "Provider, compiler, and harness failures look identical",
    proof: "A deterministic preflight succeeds and one controlled failure is classified",
  },
  {
    id: 1,
    slug: "model-boundary",
    file: "01_model_boundary.md",
    checkpoint: "01_messages",
    shortTitle: "The model boundary",
    eyebrow: "Observe",
    time: 40,
    outcome: "Explain exactly what the model can know and where observations come from.",
    selfPacedTime: 65,
    mission: "Catch a confident model claiming knowledge it was never given.",
    upgrade: "Typed message history with explicit evidence provenance",
    failure: "A plausible guess is mistaken for a workspace observation",
    proof: "The outgoing request proves whether the hidden nonce was present",
  },
  {
    id: 2,
    slug: "prompts-and-roles",
    file: "02_prompts_and_roles.md",
    checkpoint: "02_prompt_lab",
    shortTitle: "Instructions & roles",
    eyebrow: "Direct",
    time: 40,
    outcome: "Build causal message history and run a controlled instruction experiment.",
    selfPacedTime: 70,
    mission: "Change one instruction variable and measure what actually changes.",
    upgrade: "Role-aware messages and a repeatable prompt experiment",
    failure: "Prompt folklore replaces controlled comparison",
    proof: "Four variants run against one unchanged task and produce an evidence table",
  },
  {
    id: 3,
    slug: "tool-definitions",
    file: "03_tool_definitions.md",
    checkpoint: "03_tool_schema",
    shortTitle: "Tool definitions",
    eyebrow: "Describe",
    time: 45,
    outcome: "Expose a precise, constrained read capability through JSON Schema.",
    selfPacedTime: 75,
    mission: "Give the model a vocabulary for action without giving it authority.",
    upgrade: "Provider-neutral tool definitions and defensive call parsing",
    failure: "A valid-looking JSON object is treated as an executed action",
    proof: "A raw tool request pauses at the harness boundary and passes schema tests",
  },
  {
    id: 4,
    slug: "tool-execution",
    file: "04_tool_execution.md",
    checkpoint: "04_tool_dispatch",
    shortTitle: "Tool execution",
    eyebrow: "Act",
    time: 60,
    outcome: "Validate, authorize, execute, and correlate three local tools safely.",
    selfPacedTime: 95,
    mission: "Turn a model proposal into a controlled local effect with no hidden jump.",
    upgrade: "A five-stage dispatcher for read, write, list, build, and test",
    failure: "Correct JSON crosses the authority boundary unchecked",
    proof: "Allowed calls succeed while path escape, free-form commands, and bad IDs fail",
  },
  {
    id: 5,
    slug: "agent-loop",
    file: "05_agent_loop.md",
    checkpoint: "05_agent_loop",
    shortTitle: "The bounded loop",
    eyebrow: "Iterate",
    time: 60,
    outcome: "Assemble the feedback loop and repair a project with hard stop conditions.",
    selfPacedTime: 105,
    mission: "Close the loop, then prove that it cannot run forever or declare false success.",
    upgrade: "A bounded model → tool → evidence state machine",
    failure: "One successful tool call is mistaken for a working agent",
    proof: "The deterministic trace repairs two defects and stops on fresh passing evidence",
  },
  {
    id: 6,
    slug: "context-and-cost",
    file: "06_context_and_cost.md",
    checkpoint: "06_trace_and_limits",
    shortTitle: "Context & cost",
    eyebrow: "Measure",
    time: 30,
    outcome: "Read a trace, track growth, and choose explicit context budgets.",
    selfPacedTime: 60,
    mission: "Account for every message, token category, and repeated byte in a run.",
    upgrade: "Structured tracing, usage accounting, and explicit context policy",
    failure: "Conversation growth is invisible until cost or context limits fail",
    proof: "Trace totals reconcile and the latest verifier remains exact after compaction",
  },
  {
    id: 7,
    slug: "safety-and-evals",
    file: "07_safety_and_evals.md",
    checkpoint: "07_safe_agent",
    shortTitle: "Safety & evals",
    eyebrow: "Constrain",
    time: 30,
    outcome: "Turn policy into enforcement and test it with deterministic adversarial cases.",
    selfPacedTime: 75,
    mission: "Attack the harness and make every control show its work.",
    upgrade: "A threat-to-control matrix backed by deterministic evaluations",
    failure: "A cooperative prompt is mistaken for a security boundary",
    proof: "Allowed cases pass, forbidden effects fail, and recovery is visible in the trace",
  },
  {
    id: 8,
    slug: "self-modification",
    file: "08_self_modification.md",
    checkpoint: "08_capstone_solution",
    shortTitle: "Self-modification",
    eyebrow: "Prove",
    time: 50,
    outcome: "Make, review, build, and verify a bounded change to the agent itself.",
    selfPacedTime: 110,
    mission: "Let the agent change its own source without surrendering review or proof.",
    upgrade: "A complete proposal → edit → diff → build → test governance chain",
    failure: "Generated code is accepted because it looks plausible",
    proof: "A focused diff and fresh tests demonstrate a bounded vertical capability",
  },
];

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? fallback;
}

async function readCourseFile(relativePath) {
  return readFile(path.join(courseRoot, relativePath), "utf8");
}

const chapters = [];

for (const definition of chapterDefinitions) {
  const documentPaths = {
    lesson: `chapters/${definition.file}`,
    lab: `labs/${definition.file}`,
    exercise: `assessments/${definition.file}`,
    checkpoint: `checkpoints/${definition.checkpoint}/README.md`,
  };

  const entries = await Promise.all(
    Object.entries(documentPaths).map(async ([kind, relativePath]) => {
      const markdown = await readCourseFile(relativePath);
      return [
        kind,
        {
          kind,
          path: `course/${relativePath.replaceAll("\\", "/")}`,
          title: extractTitle(markdown, definition.shortTitle),
          markdown,
        },
      ];
    }),
  );

  chapters.push({
    ...definition,
    documents: Object.fromEntries(entries),
  });
}

const resourceDefinitions = [
  { id: "learner-path", title: "Choose your learning path", path: "LEARNER_PATH.md" },
  { id: "course-guide", title: "Course guide", path: "README.md" },
  { id: "curriculum", title: "Curriculum delivery index", path: "CURRICULUM_INDEX.md" },
  { id: "research", title: "Research maintenance index", path: "sources/RESEARCH_INDEX.md" },
  { id: "logic-review", title: "Curriculum logic review", path: "LOGIC_REVIEW.md" },
  { id: "idea-review", title: "Chapter idea review", path: "CHAPTER_IDEA_REVIEW.md" },
];

const resources = [];

for (const definition of resourceDefinitions) {
  const markdown = await readCourseFile(definition.path);
  resources.push({
    ...definition,
    path: `course/${definition.path}`,
    markdown,
  });
}

const repairTraceText = await readCourseFile("demos/full_repair_trace.jsonl");
const repairTrace = repairTraceText
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid repair trace event ${index + 1}: ${error.message}`);
    }
  });

const courseData = {
  generatedAt: new Date().toISOString(),
  chapters,
  resources,
  repairTrace,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/generate-course-data.mjs. Do not edit.\nexport const courseData = ${JSON.stringify(courseData)};\n`,
  "utf8",
);

console.log(`Generated ${chapters.length} chapters and ${resources.length} resources.`);
