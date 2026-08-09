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
    upgrade: "A five-stage dispatcher for read, write, configure, build, and test",
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
    proof: "Trace totals reconcile and the latest verifier remains exact after a proposed retention policy",
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

const workshopDelivery = {
  0: {
    focus: "Classify the boundary, run preflight, and leave with one controlled failure you can explain.",
    lessonSections: [
      "What you'll learn and prove",
      "The puzzle: who repaired the code?",
      "Why two execution modes",
      "Read the preflight, not just the answer",
      "What you should now be able to explain",
    ],
  },
  1: {
    focus: "Separate observation from inference, then prove what crossed the model boundary.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: a confident guess about a file",
      "Evidence, inference, and action",
      "Design the secret-file experiment carefully",
      "What you should now be able to explain",
    ],
  },
  2: {
    focus: "Run one controlled instruction experiment and defend which behavior belongs in policy.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: four prompts, four different agents",
      "A five-block system instruction",
      "Controlled prompt experiment",
      "Prompt versus policy",
      "What you should now be able to explain",
    ],
  },
  3: {
    focus: "Design a narrow contract, inspect the raw call, and stop before execution.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: a call is not an execution",
      "Design the narrowest contract",
      "Parse defensively",
      "A complete paused experiment",
      "What you should now be able to explain",
    ],
  },
  4: {
    focus: "Trace proposal through validation, authorization, execution, and correlated evidence.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: correct JSON, dangerous authority",
      "The dispatch pipeline",
      "Workspace confinement",
      "Manual round trip",
      "Test the policy without a model",
      "What you should now be able to explain",
    ],
  },
  5: {
    focus: "Reconstruct the feedback loop and prove both progress and bounded stopping.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: one tool call is not an agent",
      "Loop invariants",
      "Stopping is a feature",
      "Walk through the repair fixture",
      "Progress, verification, and stopping policy",
      "What you should now be able to explain",
    ],
  },
  6: {
    focus: "Read the trace as a ledger and choose an explicit retention and budget policy.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: “three turns” produced eleven requests",
      "Why history grows",
      "Read the JSONL trace as a ledger",
      "Budgeting before a run",
      "What you should now be able to explain",
    ],
  },
  7: {
    focus: "Map each threat to an enforced control and a deterministic adversarial case.",
    lessonSections: [
      "What you'll learn and prove",
      "The failure: the prompt said no",
      "Threat model for this small agent",
      "Evals, not vibes",
      "Build a control matrix",
      "What you should now be able to explain",
    ],
  },
  8: {
    focus: "Govern one self-change from proposal through focused diff and fresh verification.",
    lessonSections: [
      "What you'll learn and prove",
      "The puzzle: can the agent safely change itself?",
      "Capstone protocol",
      "Review the diff as a human",
      "Evidence ladder and review gate",
      "What you should now be able to explain",
    ],
  },
};

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? fallback;
}

function extractH2Titles(markdown) {
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
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
      const allSections = extractH2Titles(markdown);
      const requiredWorkshopSections =
        kind === "lesson"
          ? workshopDelivery[definition.id].lessonSections
          : kind === "lab"
            ? ["Goal and constraints", "Tasks", "Acceptance criteria"]
            : kind === "exercise"
              ? ["Questions"]
              : allSections;
      return [
        kind,
        {
          kind,
          path: `course/${relativePath.replaceAll("\\", "/")}`,
          title: extractTitle(markdown, definition.shortTitle),
          markdown,
          requiredWorkshopSections,
        },
      ];
    }),
  );

  chapters.push({
    ...definition,
    workshopFocus: workshopDelivery[definition.id].focus,
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
  { id: "wrap-up", title: "Course wrap-up and rubric", path: "WRAP_UP.md" },
  { id: "delivery-gates", title: "Delivery gates", path: "DELIVERY_GATES.md" },
  { id: "completion-matrix", title: "Production completion matrix", path: "PLAN_COMPLETION_MATRIX.md" },
  { id: "pilot", title: "Pilot protocol and evidence record", path: "PILOT.md" },
  { id: "assets", title: "Learner and instructor assets", path: "assets/README.md" },
  { id: "demos", title: "Demonstration and trace catalog", path: "demos/README.md" },
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
