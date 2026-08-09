import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import jsonLanguage from "highlight.js/lib/languages/json";
import plaintextLanguage from "highlight.js/lib/languages/plaintext";
import powershellLanguage from "highlight.js/lib/languages/powershell";
import "highlight.js/styles/github-dark.css";
import { marked } from "marked";
import { courseData } from "./generated/course-data.js";
import "./styles.css";

const app = document.querySelector("#app");
const repositoryUrl =
  import.meta.env.VITE_REPO_URL || "https://github.com/buicongnguyen/cpp-coding-agent-lab";
const documentKinds = ["lesson", "lab", "exercise", "checkpoint"];
const kindLabels = {
  lesson: "Lesson",
  lab: "Lab",
  exercise: "Challenge",
  checkpoint: "Checkpoint",
};
const kindActions = {
  lesson: "Understand",
  lab: "Build",
  exercise: "Reason",
  checkpoint: "Prove",
};

hljs.registerLanguage("json", jsonLanguage);
hljs.registerLanguage("powershell", powershellLanguage);
hljs.registerLanguage("text", plaintextLanguage);
hljs.registerLanguage("plaintext", plaintextLanguage);

const legacyCompleted = JSON.parse(localStorage.getItem("agent-lab-progress") || "[]").map(Number);
const savedActivities = JSON.parse(localStorage.getItem("agent-lab-activity-progress") || "[]");

const state = {
  completedActivities: new Set(
    savedActivities.length
      ? savedActivities
      : legacyCompleted.flatMap((chapterId) =>
          documentKinds.map((kind) => `${chapterId}:${kind}`),
        ),
  ),
  mode: localStorage.getItem("agent-lab-mode") || "workshop",
  traceIndex: 0,
  mechanismStage: 0,
  theme:
    localStorage.getItem("agent-lab-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
};

marked.setOptions({ gfm: true });
document.documentElement.dataset.theme = state.theme;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseRoute() {
  const value = window.location.hash.replace(/^#\/?/, "");
  const parts = value.split("/").filter(Boolean);

  if (parts[0] === "chapter") {
    const chapterId = Number(parts[1]);
    const kind = documentKinds.includes(parts[2]) ? parts[2] : "lesson";
    if (Number.isInteger(chapterId) && courseData.chapters[chapterId]) {
      return { page: "chapter", chapterId, kind };
    }
  }

  if (parts[0] === "resources") {
    const resourceId = parts[1] || courseData.resources[0].id;
    const resource = courseData.resources.find((item) => item.id === resourceId);
    return { page: "resources", resource: resource || courseData.resources[0] };
  }

  return { page: "home" };
}

function sourceUrl(path) {
  return `${repositoryUrl}/blob/main/${path}`;
}

function activityKey(chapterId, kind) {
  return `${chapterId}:${kind}`;
}

function activityComplete(chapterId, kind) {
  return state.completedActivities.has(activityKey(chapterId, kind));
}

function chapterProgress(chapterId) {
  return documentKinds.filter((kind) => activityComplete(chapterId, kind)).length;
}

function chapterComplete(chapterId) {
  return chapterProgress(chapterId) === documentKinds.length;
}

function progressPercent() {
  const total = courseData.chapters.length * documentKinds.length;
  return Math.round((state.completedActivities.size / total) * 100);
}

function persistProgress() {
  localStorage.setItem(
    "agent-lab-activity-progress",
    JSON.stringify([...state.completedActivities].sort()),
  );
}

function nextActivity() {
  for (const chapter of courseData.chapters) {
    for (const kind of documentKinds) {
      if (!activityComplete(chapter.id, kind)) return { chapterId: chapter.id, kind };
    }
  }
  return { chapterId: 0, kind: "lesson" };
}

function displayTime(chapter) {
  return state.mode === "workshop" ? chapter.time : chapter.selfPacedTime;
}

function chapterHref(id, kind = "lesson") {
  return `#/chapter/${id}/${kind}`;
}

function shellTemplate() {
  return `
    <header class="topbar">
      <button class="icon-button mobile-only" type="button" data-action="toggle-sidebar" aria-label="Open course navigation">☰</button>
      <a class="brand" href="#/" aria-label="C++ Coding Agent Lab home">
        <span class="brand-mark" aria-hidden="true">C<span>++</span></span>
        <span class="brand-copy"><strong>Agent Lab</strong><small>C++ field course</small></span>
      </a>
      <div class="topbar-actions">
        <button class="search-trigger" type="button" data-action="open-search">
          <span aria-hidden="true">⌕</span>
          <span>Search course</span>
          <kbd>/</kbd>
        </button>
        <button class="icon-button" type="button" data-action="toggle-theme" aria-label="Toggle color theme">◐</button>
        <a class="github-link" href="${repositoryUrl}" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </header>
    <div class="app-shell">
      <aside class="sidebar" id="course-sidebar" aria-label="Course navigation">
        <div class="sidebar-progress">
          <div class="progress-copy"><span>Your field log</span><strong data-progress-label>${state.completedActivities.size}/36</strong></div>
          <div class="progress-track" aria-hidden="true"><span data-progress-bar style="width:${progressPercent()}%"></span></div>
          <small>${progressPercent()}% · ${state.mode === "workshop" ? "one-day workshop" : "self-paced course"}</small>
        </div>
        <nav id="course-nav"></nav>
        <div class="sidebar-note">
          <span>Deterministic first</span>
          <p>Every required lab works without an API key.</p>
        </div>
      </aside>
      <main id="main-content" tabindex="-1"></main>
      <aside class="page-toc" id="page-toc" aria-label="On this page"></aside>
    </div>
    <button class="sidebar-scrim" type="button" data-action="close-sidebar" aria-label="Close navigation"></button>
    <dialog class="search-dialog" id="search-dialog">
      <div class="search-box">
        <div class="search-heading">
          <div><span class="eyebrow">Course index</span><h2>Find a concept</h2></div>
          <button class="icon-button" type="button" data-action="close-search" aria-label="Close search">×</button>
        </div>
        <label class="search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input id="search-input" type="search" placeholder="Try “tool result”, “timeout”, or “JSON Schema”" autocomplete="off" />
        </label>
        <div class="search-results" id="search-results" aria-live="polite">
          <p class="search-empty">Search all lessons, labs, exercises, checkpoints, and course resources.</p>
        </div>
      </div>
    </dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;
}

function renderSidebar(route) {
  const nav = document.querySelector("#course-nav");
  nav.innerHTML = `
    <div class="nav-section-label">Build path</div>
    <a class="nav-home ${route.page === "home" ? "is-current" : ""}" href="#/">
      <span class="nav-number">⌂</span><span><strong>Course overview</strong><small>Start here</small></span>
    </a>
    <ol class="chapter-nav">
      ${courseData.chapters
        .map((chapter) => {
          const progress = chapterProgress(chapter.id);
          const complete = chapterComplete(chapter.id);
          return `
          <li>
            <a class="chapter-link ${route.page === "chapter" && route.chapterId === chapter.id ? "is-current" : ""}"
              href="${chapterHref(chapter.id)}" ${route.page === "chapter" && route.chapterId === chapter.id ? 'aria-current="page"' : ""}>
              <span class="nav-number ${complete ? "is-complete" : ""}">${complete ? "✓" : String(chapter.id).padStart(2, "0")}</span>
              <span><strong>${escapeHtml(chapter.shortTitle)}</strong><small>${progress}/4 evidence · ${displayTime(chapter)} min</small></span>
            </a>
          </li>`;
        })
        .join("")}
    </ol>
    <div class="nav-section-label nav-resources-label">Reference</div>
    <a class="nav-home ${route.page === "resources" ? "is-current" : ""}" href="#/resources/course-guide">
      <span class="nav-number">→</span><span><strong>Course resources</strong><small>Learning path, guides, research</small></span>
    </a>
  `;
}

const mechanismStages = [
  {
    label: "Context",
    title: "Construct the model's world",
    copy: "The harness chooses the system instructions, message history, and tool definitions. If evidence is absent here, the model cannot observe it.",
    boundary: "No local authority yet",
  },
  {
    label: "Proposal",
    title: "Receive text or a typed request",
    copy: "The model emits tokens. A tool call is still only structured data with a name, arguments, and correlation ID.",
    boundary: "A proposal is not execution",
  },
  {
    label: "Policy",
    title: "Validate and authorize",
    copy: "The dispatcher checks shape, meaning, workspace scope, command allowlists, byte limits, and the current run budget before any effect.",
    boundary: "The harness owns authority",
  },
  {
    label: "Evidence",
    title: "Return an observation to the loop",
    copy: "A local tool runs and produces a correlated result. That evidence joins history so the next model decision can react to what actually happened.",
    boundary: "Fresh proof controls stopping",
  },
];

function parseDetail(event) {
  try {
    return JSON.parse(event.detail || "{}");
  } catch {
    return { raw: event.detail || "" };
  }
}

function tracePresentation(event) {
  const detail = parseDetail(event);
  if (event.kind === "model_request") {
    return {
      actor: "HARNESS",
      title: `Send context for iteration ${event.iteration}`,
      summary: `${detail.message_count ?? "?"} messages · ${detail.tool_definition_count ?? "?"} capability contracts`,
    };
  }
  if (event.kind === "model_response") {
    return {
      actor: "MODEL",
      title: detail.finish_reason === "tool_calls" ? "Propose a tool call" : "Return a final answer",
      summary: `${detail.tool_call_count ?? 0} call(s) · ${event.usage?.prompt_tokens ?? 0} prompt tokens`,
    };
  }
  if (event.kind === "tool_request") {
    const action = detail.action || detail.path || event.tool || "request";
    return {
      actor: "POLICY",
      title: `Authorize ${event.tool || "tool"}`,
      summary: `${action} · correlation ${event.tool_call_id || "n/a"}`,
    };
  }
  if (event.kind === "tool_result") {
    const data = detail.data || {};
    const result = Number.isInteger(data.exit_code)
      ? `exit ${data.exit_code}${data.timed_out ? " · timed out" : ""}`
      : data.path || `${data.bytes_written ?? data.bytes ?? 0} bytes`;
    return {
      actor: "TOOL",
      title: detail.ok === false ? "Return a structured failure" : `Observe ${event.tool || "result"}`,
      summary: `${result} · ${event.elapsed_ms ?? 0} ms elapsed`,
    };
  }
  return {
    actor: "LOOP",
    title: event.kind.replaceAll("_", " "),
    summary: `Iteration ${event.iteration ?? "–"} · ${event.elapsed_ms ?? 0} ms`,
  };
}

function traceExplorerTemplate(location = "home") {
  const trace = courseData.repairTrace || [];
  const index = Math.min(state.traceIndex, Math.max(0, trace.length - 1));
  const event = trace[index] || { kind: "empty", detail: "{}" };
  const presentation = tracePresentation(event);
  const detail = parseDetail(event);
  const windowStart = Math.max(0, Math.min(index - 2, trace.length - 5));
  const visible = trace.slice(windowStart, windowStart + 5);

  return `
    <div class="trace-explorer" data-trace-location="${location}">
      <div class="trace-rail" aria-label="Repair trace events">
        ${visible
          .map((item, offset) => {
            const absoluteIndex = windowStart + offset;
            const itemPresentation = tracePresentation(item);
            return `<button type="button" class="trace-event ${absoluteIndex === index ? "is-active" : ""}" data-action="set-trace" data-index="${absoluteIndex}">
              <span>${String(absoluteIndex + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(itemPresentation.actor)}</strong>
              <small>${escapeHtml(itemPresentation.title)}</small>
            </button>`;
          })
          .join("")}
      </div>
      <div class="trace-inspector">
        <div class="trace-inspector-topline"><span>${escapeHtml(presentation.actor)}</span><span>event ${index + 1}/${trace.length}</span></div>
        <h3>${escapeHtml(presentation.title)}</h3>
        <p>${escapeHtml(presentation.summary)}</p>
        <pre><code>${escapeHtml(JSON.stringify(detail, null, 2).slice(0, 1800))}</code></pre>
        <div class="trace-controls">
          <button type="button" data-action="trace-previous" ${index === 0 ? "disabled" : ""}>← Previous</button>
          <div class="trace-progress"><span style="width:${trace.length ? ((index + 1) / trace.length) * 100 : 0}%"></span></div>
          <button type="button" data-action="trace-next" ${index >= trace.length - 1 ? "disabled" : ""}>Next event →</button>
        </div>
      </div>
    </div>`;
}

function homeTemplate() {
  const next = nextActivity();
  const activeStage = mechanismStages[state.mechanismStage];
  return `
    <div class="home-page">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">C++17 · deterministic first · agent under glass</span>
          <h1>Build an agent.<br /><em>Interrogate every move.</em></h1>
          <p class="hero-lede">A field course for experienced C++ developers who want to understand the machinery beneath coding assistants: what the model sees, who grants authority, why the loop continues, and what evidence makes a repair real.</p>
          <div class="mode-switch" role="group" aria-label="Choose learning mode">
            <button type="button" class="${state.mode === "workshop" ? "is-active" : ""}" data-action="select-mode" data-mode="workshop"><strong>One-day workshop</strong><small>390 min · instructor led</small></button>
            <button type="button" class="${state.mode === "self-paced" ? "is-active" : ""}" data-action="select-mode" data-mode="self-paced"><strong>Self-paced field course</strong><small>11–13 hr · full depth</small></button>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" href="${chapterHref(next.chapterId, next.kind)}">${state.completedActivities.size ? "Continue the mission" : "Enter chapter 0"} <span>→</span></a>
            <a class="button button-secondary" href="#/resources/learner-path">See how the course works</a>
          </div>
          <div class="hero-facts" aria-label="Course facts">
            <span><strong>9</strong> system upgrades</span>
            <span><strong>36</strong> evidence steps</span>
            <span><strong>0</strong> required API keys</span>
          </div>
        </div>
        <div class="system-card" aria-label="Course build target">
          <div class="system-card-header"><span>BUILD TARGET</span><small>course_agent.cpp</small></div>
          <div class="system-orbit">
            <div class="orbit-node orbit-model"><span>MODEL</span><strong>proposes</strong></div>
            <div class="orbit-node orbit-harness"><span>HARNESS</span><strong>decides</strong></div>
            <div class="orbit-node orbit-tools"><span>TOOLS</span><strong>observe + act</strong></div>
            <div class="orbit-pulse"></div>
          </div>
          <div class="system-readout">
            <span><small>CAPABILITY</small><strong>read · write · build · test</strong></span>
            <span><small>CONTROL</small><strong>schema · policy · budget · eval</strong></span>
            <span><small>FINAL PROOF</small><strong>fresh passing verification</strong></span>
          </div>
          <div class="terminal-caption"><span class="status-dot"></span> The model proposes. Your C++ harness owns every effect.</div>
        </div>
      </section>

      <section class="promise-strip" aria-label="Course approach">
        <div><span>01</span><strong>Predict</strong><p>Commit to a mental model before revealing the trace.</p></div>
        <div><span>02</span><strong>Build</strong><p>Add one capability and one control to a compact C++ harness.</p></div>
        <div><span>03</span><strong>Prove</strong><p>Earn completion with tests, correlated results, and fresh evidence.</p></div>
      </section>

      <section class="section-block mechanism-section">
        <div class="section-heading">
          <div><span class="eyebrow">Interactive mental model</span><h2>Four boundaries. No magic jump.</h2></div>
          <p>Select a stage to see who owns the data, the decision, and the authority. This responsibility map is the spine of all nine chapters.</p>
        </div>
        <div class="mechanism-lab">
          <div class="mechanism-stage-list" role="tablist" aria-label="Agent mechanism stages">
            ${mechanismStages
              .map(
                (stage, index) => `<button type="button" role="tab" aria-selected="${index === state.mechanismStage}" class="${index === state.mechanismStage ? "is-active" : ""}" data-action="set-mechanism-stage" data-index="${index}"><span>0${index + 1}</span><strong>${escapeHtml(stage.label)}</strong></button>`,
              )
              .join("")}
          </div>
          <div class="mechanism-stage-detail" role="tabpanel">
            <span class="eyebrow">${escapeHtml(activeStage.boundary)}</span>
            <h3>${escapeHtml(activeStage.title)}</h3>
            <p>${escapeHtml(activeStage.copy)}</p>
            <div class="boundary-meter"><span style="width:${25 * (state.mechanismStage + 1)}%"></span></div>
          </div>
        </div>
      </section>

      <section class="section-block trace-section">
        <div class="section-heading">
          <div><span class="eyebrow">Real deterministic evidence</span><h2>Scrub through a repair run.</h2></div>
          <p>This is not a staged animation. Every event comes from the tested C++ reference executable as it finds a compile defect, repairs it, discovers a behavioral failure, and verifies the second fix.</p>
        </div>
        ${traceExplorerTemplate("home")}
      </section>

      <section class="section-block journey-section">
        <div class="section-heading">
          <div><span class="eyebrow">The build campaign</span><h2>Nine system upgrades. One governed agent.</h2></div>
          <p>Every chapter begins with a failure and ends with evidence. Complete the lesson, lab, challenge, and checkpoint to close each mission.</p>
        </div>
        <div class="journey-list">
          ${courseData.chapters
            .map((chapter) => {
              const progress = chapterProgress(chapter.id);
              const complete = chapterComplete(chapter.id);
              return `
              <a class="journey-row" href="${chapterHref(chapter.id)}">
                <span class="journey-number ${complete ? "is-complete" : ""}">${complete ? "✓" : String(chapter.id).padStart(2, "0")}</span>
                <span class="journey-name"><small>${escapeHtml(chapter.eyebrow)}</small><strong>${escapeHtml(chapter.shortTitle)}</strong></span>
                <span class="journey-outcome"><strong>${escapeHtml(chapter.mission)}</strong><small>${escapeHtml(chapter.upgrade)}</small></span>
                <span class="journey-time">${progress}/4 · ${displayTime(chapter)} min</span>
                <span class="journey-arrow">→</span>
              </a>`;
            })
            .join("")}
        </div>
      </section>

      <section class="closing-cta">
        <div><span class="eyebrow">Your first mission</span><h2>Make the machine observable before making it autonomous.</h2></div>
        <a class="button button-primary" href="${chapterHref(0)}">Run the preflight <span>→</span></a>
      </section>
    </div>
  `;
}

function renderMarkdown(document) {
  const parsed = marked.parse(document.markdown);
  const clean = DOMPurify.sanitize(parsed, {
    ADD_ATTR: ["target", "rel"],
  });
  const container = documentFactory("div", "markdown-body");
  container.innerHTML = clean;

  const firstHeading = container.querySelector(":scope > h1");
  firstHeading?.remove();

  const usedIds = new Set();
  container.querySelectorAll("h2, h3").forEach((heading) => {
    let id = slugify(heading.textContent) || "section";
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${id}-${suffix++}`;
    }
    usedIds.add(id);
    heading.id = id;
    heading.innerHTML += `<button class="heading-anchor" type="button" data-action="scroll-section" data-section="${id}" aria-label="Scroll to ${escapeHtml(heading.textContent)}">#</button>`;
  });

  container.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (/^https?:\/\//.test(href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  });

  container.querySelectorAll("table").forEach((table) => {
    const wrapper = documentFactory("div", "table-scroll");
    table.before(wrapper);
    wrapper.append(table);
  });

  container.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (code) {
      hljs.highlightElement(code);
      const copyButton = documentFactory("button", "copy-code");
      copyButton.type = "button";
      copyButton.dataset.action = "copy-code";
      copyButton.textContent = "Copy";
      pre.append(copyButton);
    }
  });

  const answerHeading = [...container.querySelectorAll(":scope > h2")].find((heading) =>
    /answer key/i.test(heading.textContent),
  );
  if (answerHeading) {
    const details = documentFactory("details", "answer-key");
    const summary = documentFactory("summary", "answer-key-summary");
    summary.innerHTML = `<span>Reveal answer key</span><small>Check your reasoning after attempting every question.</small>`;
    details.append(summary);
    answerHeading.before(details);
    let current = answerHeading.nextSibling;
    answerHeading.remove();
    while (current) {
      const next = current.nextSibling;
      details.append(current);
      current = next;
    }
  }

  return container;
}

function documentFactory(tag, className) {
  const element = window.document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function chapterTemplate(chapter, kind) {
  const document = chapter.documents[kind];
  const previous = courseData.chapters[chapter.id - 1];
  const next = courseData.chapters[chapter.id + 1];
  const done = activityComplete(chapter.id, kind);
  const progress = chapterProgress(chapter.id);
  const activityDescriptions = {
    lesson: "Explain the boundary and predict the chapter failure before touching code.",
    lab: "Use the reference harness and disposable fixture to produce the required artifact.",
    exercise: "Read the trace, defend the mechanism, then reveal the answer key.",
    checkpoint: "Run the release gate and record evidence newer than the latest change.",
  };

  return `
    <div class="chapter-page">
      <header class="chapter-header">
        <div class="chapter-kicker"><span>Mission ${String(chapter.id).padStart(2, "0")}</span><span>${escapeHtml(chapter.eyebrow)}</span><span>${displayTime(chapter)} minutes · ${state.mode === "workshop" ? "workshop" : "self-paced"}</span></div>
        <h1>${escapeHtml(chapter.shortTitle)}</h1>
        <p>${escapeHtml(chapter.mission)}</p>
        <div class="chapter-tools">
          <span class="mission-progress"><strong>${progress}/4</strong> evidence steps complete</span>
          <a href="${sourceUrl(document.path)}" target="_blank" rel="noreferrer">View source ↗</a>
        </div>
      </header>
      <section class="mission-brief" aria-label="Chapter mission brief">
        <div><span>System upgrade</span><strong>${escapeHtml(chapter.upgrade)}</strong></div>
        <div><span>Failure to defeat</span><strong>${escapeHtml(chapter.failure)}</strong></div>
        <div><span>Proof to collect</span><strong>${escapeHtml(chapter.proof)}</strong></div>
      </section>
      <nav class="document-tabs" aria-label="Chapter materials">
        ${documentKinds
          .map(
            (tabKind) => `<a href="${chapterHref(chapter.id, tabKind)}" class="${kind === tabKind ? "is-current" : ""}" ${kind === tabKind ? 'aria-current="page"' : ""}>
              <span>${activityComplete(chapter.id, tabKind) ? "✓ " : ""}${kindLabels[tabKind]}</span><small>${kindActions[tabKind]}</small>
            </a>`,
          )
          .join("")}
      </nav>
      ${chapter.id === 5 && (kind === "lesson" || kind === "lab") ? `<section class="chapter-trace-lab"><div class="chapter-trace-heading"><span class="eyebrow">Flight recorder</span><h2>Reconstruct the bounded loop</h2><p>Step through the executable trace while reading this chapter. Identify what caused each transition and what evidence justified continuing.</p></div>${traceExplorerTemplate("chapter")}</section>` : ""}
      <article class="article-card" id="article-content">
        <div class="article-label"><span>${kindLabels[kind]}</span><span>${escapeHtml(document.title)}</span></div>
        <div class="activity-brief">
          <div><span class="eyebrow">${kindActions[kind]} · evidence step ${documentKinds.indexOf(kind) + 1} of 4</span><p>${escapeHtml(activityDescriptions[kind])}</p></div>
          <button class="completion-button ${done ? "is-complete" : ""}" type="button" data-action="toggle-activity" data-chapter="${chapter.id}" data-kind="${kind}">
            <span>${done ? "✓" : "○"}</span>${done ? "Evidence recorded" : "Record this evidence"}
          </button>
        </div>
        <div id="markdown-mount"></div>
      </article>
      <nav class="chapter-pagination" aria-label="Chapter pagination">
        ${previous ? `<a href="${chapterHref(previous.id)}"><small>← Previous</small><strong>${escapeHtml(previous.shortTitle)}</strong></a>` : `<span></span>`}
        ${next ? `<a class="next-link" href="${chapterHref(next.id)}"><small>Next →</small><strong>${escapeHtml(next.shortTitle)}</strong></a>` : `<a class="next-link" href="#/resources/course-guide"><small>Finish →</small><strong>Course resources</strong></a>`}
      </nav>
    </div>
  `;
}

function resourcesTemplate(resource) {
  return `
    <div class="resources-page">
      <header class="resource-header">
        <span class="eyebrow">Reference library</span>
        <h1>Course resources</h1>
        <p>Delivery guides, source maintenance, and the reasoning behind the final curriculum.</p>
      </header>
      <nav class="resource-tabs" aria-label="Course resources">
        ${courseData.resources
          .map(
            (item) => `<a class="${item.id === resource.id ? "is-current" : ""}" href="#/resources/${item.id}">${escapeHtml(item.title)}</a>`,
          )
          .join("")}
      </nav>
      <article class="article-card" id="article-content">
        <div class="article-label"><span>Resource</span><a href="${sourceUrl(resource.path)}" target="_blank" rel="noreferrer">View source ↗</a></div>
        <div id="markdown-mount"></div>
      </article>
    </div>
  `;
}

function buildToc(container) {
  const toc = document.querySelector("#page-toc");
  const headings = [...container.querySelectorAll("h2, h3")].filter(
    (heading) => !heading.closest("details"),
  );
  if (!headings.length) {
    toc.innerHTML = "";
    toc.classList.add("is-empty");
    return;
  }
  toc.classList.remove("is-empty");
  toc.innerHTML = `
    <span class="toc-label">On this page</span>
    <nav>${headings
      .map(
        (heading) => `<button class="toc-${heading.tagName.toLowerCase()}" type="button" data-action="scroll-section" data-section="${heading.id}">${escapeHtml(heading.textContent.replace(/#$/, "").trim())}</button>`,
      )
      .join("")}</nav>
    <button class="toc-top" type="button" data-action="scroll-top">Back to top ↑</button>
  `;
}

function renderRoute() {
  const route = parseRoute();
  renderSidebar(route);
  const main = document.querySelector("#main-content");
  const toc = document.querySelector("#page-toc");

  if (route.page === "home") {
    main.innerHTML = homeTemplate();
    toc.innerHTML = "";
    toc.classList.add("is-empty");
    window.document.title = "C++ Coding Agent Lab";
  } else if (route.page === "chapter") {
    const chapter = courseData.chapters[route.chapterId];
    const document = chapter.documents[route.kind];
    main.innerHTML = chapterTemplate(chapter, route.kind);
    const rendered = renderMarkdown(document);
    main.querySelector("#markdown-mount").append(rendered);
    buildToc(rendered);
    window.document.title = `${kindLabels[route.kind]} · ${chapter.shortTitle} · Agent Lab`;
  } else {
    main.innerHTML = resourcesTemplate(route.resource);
    const rendered = renderMarkdown(route.resource);
    main.querySelector("#markdown-mount").append(rendered);
    buildToc(rendered);
    window.document.title = `${route.resource.title} · Agent Lab`;
  }

  document.body.classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function plainSearchText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const searchIndex = [
  ...courseData.chapters.flatMap((chapter) =>
    documentKinds.map((kind) => ({
      title: chapter.documents[kind].title,
      meta: `Chapter ${chapter.id} · ${kindLabels[kind]}`,
      href: chapterHref(chapter.id, kind),
      text: plainSearchText(chapter.documents[kind].markdown),
    })),
  ),
  ...courseData.resources.map((resource) => ({
    title: resource.title,
    meta: "Course resource",
    href: `#/resources/${resource.id}`,
    text: plainSearchText(resource.markdown),
  })),
];

function searchSnippet(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return `${text.slice(0, 150)}…`;
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 90);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function updateSearch(query) {
  const resultsContainer = document.querySelector("#search-results");
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 2) {
    resultsContainer.innerHTML = `<p class="search-empty">Type at least two characters to search the complete course.</p>`;
    return;
  }

  const terms = normalized.split(/\s+/).filter(Boolean);
  const results = searchIndex
    .map((item) => {
      const haystack = `${item.title} ${item.text}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...item, score };
    })
    .filter((item) => item.score === terms.length)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 12);

  if (!results.length) {
    resultsContainer.innerHTML = `<p class="search-empty">No result for “${escapeHtml(query)}”. Try a shorter or more specific term.</p>`;
    return;
  }

  resultsContainer.innerHTML = results
    .map(
      (result) => `
        <a class="search-result" href="${result.href}" data-action="search-result">
          <span>${escapeHtml(result.meta)}</span>
          <strong>${escapeHtml(result.title)}</strong>
          <p>${escapeHtml(searchSnippet(result.text, terms[0]))}</p>
        </a>`,
    )
    .join("");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function openSearch() {
  const dialog = document.querySelector("#search-dialog");
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => document.querySelector("#search-input").focus(), 20);
}

app.innerHTML = shellTemplate();
renderRoute();

window.addEventListener("hashchange", renderRoute);

document.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  const action = trigger.dataset.action;

  if (action === "toggle-sidebar") document.body.classList.toggle("sidebar-open");
  if (action === "close-sidebar") document.body.classList.remove("sidebar-open");
  if (action === "open-search") openSearch();
  if (action === "close-search") document.querySelector("#search-dialog").close();
  if (action === "search-result") document.querySelector("#search-dialog").close();
  if (action === "scroll-section") {
    document.getElementById(trigger.dataset.section)?.scrollIntoView({ behavior: "smooth" });
  }
  if (action === "scroll-top") {
    document.querySelector("#main-content")?.scrollIntoView({ behavior: "smooth" });
  }

  if (action === "toggle-theme") {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem("agent-lab-theme", state.theme);
  }

  if (action === "select-mode") {
    state.mode = trigger.dataset.mode === "self-paced" ? "self-paced" : "workshop";
    localStorage.setItem("agent-lab-mode", state.mode);
    renderRoute();
    showToast(state.mode === "workshop" ? "One-day workshop selected" : "Self-paced field course selected");
  }

  if (action === "set-mechanism-stage") {
    state.mechanismStage = Number(trigger.dataset.index);
    renderRoute();
  }

  if (action === "set-trace") {
    state.traceIndex = Number(trigger.dataset.index);
    renderRoute();
  }

  if (action === "trace-previous") {
    state.traceIndex = Math.max(0, state.traceIndex - 1);
    renderRoute();
  }

  if (action === "trace-next") {
    state.traceIndex = Math.min(courseData.repairTrace.length - 1, state.traceIndex + 1);
    renderRoute();
  }

  if (action === "toggle-activity") {
    const chapterId = Number(trigger.dataset.chapter);
    const kind = trigger.dataset.kind;
    const key = activityKey(chapterId, kind);
    if (state.completedActivities.has(key)) state.completedActivities.delete(key);
    else state.completedActivities.add(key);
    persistProgress();
    renderRoute();
    showToast(state.completedActivities.has(key) ? "Evidence step recorded" : "Evidence step reopened");
  }

  if (action === "copy-code") {
    const code = trigger.closest("pre")?.querySelector("code")?.textContent || "";
    await navigator.clipboard.writeText(code);
    trigger.textContent = "Copied";
    showToast("Code copied");
    window.setTimeout(() => (trigger.textContent = "Copy"), 1400);
  }
});

document.querySelector("#search-input").addEventListener("input", (event) => {
  updateSearch(event.target.value);
});

document.querySelector("#search-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

document.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape") document.body.classList.remove("sidebar-open");
});
