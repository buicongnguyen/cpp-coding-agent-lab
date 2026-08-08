import { courseData } from "../src/generated/course-data.js";

const requiredDocumentKinds = ["lesson", "lab", "exercise", "checkpoint"];
const errors = [];

if (courseData.chapters.length !== 9) {
  errors.push(`Expected 9 chapters, found ${courseData.chapters.length}.`);
}

for (const [index, chapter] of courseData.chapters.entries()) {
  if (chapter.id !== index) {
    errors.push(`Expected chapter id ${index}, found ${chapter.id}.`);
  }

  for (const kind of requiredDocumentKinds) {
    const document = chapter.documents[kind];
    if (!document?.markdown?.trim()) {
      errors.push(`Chapter ${chapter.id} is missing ${kind} content.`);
    }
    if (!document?.path?.startsWith("course/")) {
      errors.push(`Chapter ${chapter.id} ${kind} has an invalid source path.`);
    }
  }

  const sourceCount = (chapter.documents.lesson.markdown.match(/https?:\/\//g) ?? []).length;
  if (sourceCount < 2) {
    errors.push(`Chapter ${chapter.id} has only ${sourceCount} external research links.`);
  }
}

if (courseData.resources.length < 3) {
  errors.push("Expected at least three course resources.");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Course data check passed: 9 complete chapters with researched lessons.");
}

