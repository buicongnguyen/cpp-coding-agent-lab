import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ACTIVITY_KINDS,
  adjacentActivity,
  evidenceRecordIsComplete,
  rewriteCourseHref,
} from "../src/course-ui.js";
import { courseData } from "../src/generated/course-data.js";

const chapters = [{ id: 0 }, { id: 1 }];

const mainSource = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
assert.match(mainSource, /localStorage\.getItem\("agent-lab-mode"\) \|\| "self-paced"/);
assert.match(mainSource, /One-day workshop plan/);
assert.match(mainSource, /390 min design · unpiloted/);
assert.match(mainSource, /11–13 hr · verified release/);

assert.deepEqual(adjacentActivity(chapters, 0, "lesson", 1), {
  chapterId: 0,
  kind: "lab",
});
assert.deepEqual(adjacentActivity(chapters, 0, "checkpoint", 1), {
  chapterId: 1,
  kind: "lesson",
});
assert.deepEqual(adjacentActivity(chapters, 1, "lesson", -1), {
  chapterId: 0,
  kind: "checkpoint",
});
assert.equal(adjacentActivity(chapters, 0, ACTIVITY_KINDS[0], -1), null);

assert.equal(evidenceRecordIsComplete({ note: "cmake test passed", attested: true }), true);
assert.equal(evidenceRecordIsComplete({ note: "cmake test passed", attested: false }), false);
assert.equal(evidenceRecordIsComplete({ note: "too short", attested: true }), false);

const routeByPath = new Map([
  ["course/chapters/00_environment.md", "#/chapter/0/lesson"],
]);
const repositoryUrl = "https://github.com/example/course";

assert.deepEqual(
  rewriteCourseHref({
    href: "chapters/00_environment.md",
    sourcePath: "course/CURRICULUM_INDEX.md",
    routeByPath,
    repositoryUrl,
  }),
  { href: "#/chapter/0/lesson", external: false, mapped: true },
);
assert.deepEqual(
  rewriteCourseHref({
    href: "#why-two-execution-modes",
    sourcePath: "course/chapters/00_environment.md",
    routeByPath,
    repositoryUrl,
  }),
  {
    href: "#/chapter/0/lesson?section=why-two-execution-modes",
    external: false,
    mapped: true,
  },
);
assert.equal(
  rewriteCourseHref({
    href: "../reference/CMakeLists.txt",
    sourcePath: "course/chapters/00_environment.md",
    routeByPath,
    repositoryUrl,
  }).href,
  "https://github.com/example/course/blob/main/course/reference/CMakeLists.txt",
);
assert.equal(
  rewriteCourseHref({
    href: "https://example.com/reference",
    sourcePath: "course/README.md",
    routeByPath,
    repositoryUrl,
  }).href,
  "https://example.com/reference",
);

const actualRoutes = new Map([
  ...courseData.chapters.flatMap((chapter) =>
    ACTIVITY_KINDS.map((kind) => [
      chapter.documents[kind].path,
      `#/chapter/${chapter.id}/${kind}`,
    ]),
  ),
  ...courseData.resources.map((resource) => [
    resource.path,
    `#/resources/${resource.id}`,
  ]),
]);
const curriculum = courseData.resources.find((resource) => resource.id === "curriculum");
const curriculumLinks = [...curriculum.markdown.matchAll(/\]\(([^)\s]+)\)/g)].map(
  (match) => match[1],
);
const mappedCurriculumLinks = curriculumLinks.filter(
  (href) =>
    rewriteCourseHref({
      href,
      sourcePath: curriculum.path,
      routeByPath: actualRoutes,
      repositoryUrl,
    }).mapped,
);
// Nine chapters expose four SPA activities each, and the instructor footer links
// the wrap-up and delivery-gate resources directly into the course application.
assert.equal(
  mappedCurriculumLinks.length,
  courseData.chapters.length * ACTIVITY_KINDS.length + 2,
);

console.log("Course UI checks passed: ordered activities, attested evidence, and link routing.");
