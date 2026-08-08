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
  exercise: "Exercise",
  checkpoint: "Checkpoint",
};

hljs.registerLanguage("json", jsonLanguage);
hljs.registerLanguage("powershell", powershellLanguage);
hljs.registerLanguage("text", plaintextLanguage);
hljs.registerLanguage("plaintext", plaintextLanguage);

const state = {
  completed: new Set(
    JSON.parse(localStorage.getItem("agent-lab-progress") || "[]").map(Number),
  ),
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

function progressPercent() {
  return Math.round((state.completed.size / courseData.chapters.length) * 100);
}

function persistProgress() {
  localStorage.setItem("agent-lab-progress", JSON.stringify([...state.completed].sort()));
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
          <div class="progress-copy"><span>Your progress</span><strong data-progress-label>${progressPercent()}%</strong></div>
          <div class="progress-track" aria-hidden="true"><span data-progress-bar style="width:${progressPercent()}%"></span></div>
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
        .map(
          (chapter) => `
          <li>
            <a class="chapter-link ${route.page === "chapter" && route.chapterId === chapter.id ? "is-current" : ""}"
              href="${chapterHref(chapter.id)}" ${route.page === "chapter" && route.chapterId === chapter.id ? 'aria-current="page"' : ""}>
              <span class="nav-number ${state.completed.has(chapter.id) ? "is-complete" : ""}">${state.completed.has(chapter.id) ? "✓" : String(chapter.id).padStart(2, "0")}</span>
              <span><strong>${escapeHtml(chapter.shortTitle)}</strong><small>${escapeHtml(chapter.eyebrow)} · ${chapter.time} min</small></span>
            </a>
          </li>`,
        )
        .join("")}
    </ol>
    <div class="nav-section-label nav-resources-label">Reference</div>
    <a class="nav-home ${route.page === "resources" ? "is-current" : ""}" href="#/resources/course-guide">
      <span class="nav-number">→</span><span><strong>Course resources</strong><small>Guides, research, reviews</small></span>
    </a>
  `;
}

function homeTemplate() {
  const completeCount = state.completed.size;
  return `
    <div class="home-page">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">One day · C++17 · framework-free</span>
          <h1>Build the loop.<br /><em>See every decision.</em></h1>
          <p class="hero-lede">Create a coding agent from first principles: messages, tool contracts, guarded execution, feedback, evaluation, and a capstone self-change you can actually verify.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="${chapterHref(completeCount < 9 ? Math.min(completeCount, 8) : 0)}">${completeCount ? "Continue learning" : "Start chapter 0"} <span>→</span></a>
            <a class="button button-secondary" href="${repositoryUrl}" target="_blank" rel="noreferrer">Explore the code ↗</a>
          </div>
          <div class="hero-facts" aria-label="Course facts">
            <span><strong>9</strong> chapters</span>
            <span><strong>9</strong> guided labs</span>
            <span><strong>0</strong> keys required</span>
          </div>
        </div>
        <div class="terminal-figure" aria-label="Example agent execution trace">
          <div class="terminal-bar"><span></span><span></span><span></span><small>repair-run.trace</small></div>
          <div class="terminal-body">
            <div class="trace-line"><span class="trace-index">01</span><span class="trace-model">MODEL</span><code>request build()</code></div>
            <div class="trace-line"><span class="trace-index">02</span><span class="trace-policy">POLICY</span><code>workspace ✓ command ✓</code></div>
            <div class="trace-line"><span class="trace-index">03</span><span class="trace-tool">TOOL</span><code>exit 1 · expected ';'</code></div>
            <div class="trace-line"><span class="trace-index">04</span><span class="trace-model">MODEL</span><code>read_file(src/calculator.cpp)</code></div>
            <div class="trace-line"><span class="trace-index">05</span><span class="trace-tool">TOOL</span><code>42 lines returned</code></div>
            <div class="trace-line trace-active"><span class="trace-index">06</span><span class="trace-model">MODEL</span><code>write minimal patch...</code></div>
          </div>
          <div class="terminal-caption"><span class="status-dot"></span> Nothing happens offstage.</div>
        </div>
      </section>

      <section class="promise-strip" aria-label="Course approach">
        <div><span>01</span><strong>Understand</strong><p>Trace the exact boundary between model, harness, and machine.</p></div>
        <div><span>02</span><strong>Implement</strong><p>Build one protocol layer at a time in a compact C++ codebase.</p></div>
        <div><span>03</span><strong>Prove</strong><p>Use deterministic failures, current tests, and structured evidence.</p></div>
      </section>

      <section class="section-block journey-section">
        <div class="section-heading">
          <div><span class="eyebrow">The learning path</span><h2>Nine chapters. One working harness.</h2></div>
          <p>Each step adds one capability and one control. Lessons explain the contract; labs make it concrete; exercises test the reasoning.</p>
        </div>
        <div class="journey-list">
          ${courseData.chapters
            .map(
              (chapter) => `
              <a class="journey-row" href="${chapterHref(chapter.id)}">
                <span class="journey-number ${state.completed.has(chapter.id) ? "is-complete" : ""}">${state.completed.has(chapter.id) ? "✓" : String(chapter.id).padStart(2, "0")}</span>
                <span class="journey-name"><small>${escapeHtml(chapter.eyebrow)}</small><strong>${escapeHtml(chapter.shortTitle)}</strong></span>
                <span class="journey-outcome">${escapeHtml(chapter.outcome)}</span>
                <span class="journey-time">${chapter.time} min</span>
                <span class="journey-arrow">→</span>
              </a>`,
            )
            .join("")}
        </div>
      </section>

      <section class="section-block mechanism-section">
        <div class="section-heading compact-heading">
          <div><span class="eyebrow">The mechanism</span><h2>A feedback system—not a magic box.</h2></div>
          <p>The harness owns every transition. The model proposes; policy decides; tools return evidence; the next decision sees that evidence.</p>
        </div>
        <div class="mechanism-flow" aria-label="Agent feedback loop">
          <div class="flow-node"><span>1</span><strong>Goal + history</strong><small>Causal input</small></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node"><span>2</span><strong>Model proposal</strong><small>Text or tool call</small></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node flow-node-accent"><span>3</span><strong>Policy gate</strong><small>Validate + authorize</small></div>
          <div class="flow-arrow">→</div>
          <div class="flow-node"><span>4</span><strong>Local action</strong><small>Read, write, build</small></div>
          <div class="flow-return">↖ <span>correlated result</span> ↙</div>
        </div>
      </section>

      <section class="closing-cta">
        <div><span class="eyebrow">Ready when you are</span><h2>Start with evidence, not an API key.</h2></div>
        <a class="button button-primary" href="${chapterHref(0)}">Prove the environment <span>→</span></a>
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
  const complete = state.completed.has(chapter.id);

  return `
    <div class="chapter-page">
      <header class="chapter-header">
        <div class="chapter-kicker"><span>Chapter ${String(chapter.id).padStart(2, "0")}</span><span>${escapeHtml(chapter.eyebrow)}</span><span>${chapter.time} minutes</span></div>
        <h1>${escapeHtml(chapter.shortTitle)}</h1>
        <p>${escapeHtml(chapter.outcome)}</p>
        <div class="chapter-tools">
          <button class="completion-button ${complete ? "is-complete" : ""}" type="button" data-action="toggle-complete" data-chapter="${chapter.id}">
            <span>${complete ? "✓" : "○"}</span>${complete ? "Chapter complete" : "Mark chapter complete"}
          </button>
          <a href="${sourceUrl(document.path)}" target="_blank" rel="noreferrer">View source ↗</a>
        </div>
      </header>
      <nav class="document-tabs" aria-label="Chapter materials">
        ${documentKinds
          .map(
            (tabKind) => `<a href="${chapterHref(chapter.id, tabKind)}" class="${kind === tabKind ? "is-current" : ""}" ${kind === tabKind ? 'aria-current="page"' : ""}>
              <span>${kindLabels[tabKind]}</span><small>${tabKind === "lesson" ? "Read" : tabKind === "lab" ? "Build" : tabKind === "exercise" ? "Check" : "State"}</small>
            </a>`,
          )
          .join("")}
      </nav>
      <article class="article-card" id="article-content">
        <div class="article-label"><span>${kindLabels[kind]}</span><span>${escapeHtml(document.title)}</span></div>
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

  if (action === "toggle-complete") {
    const chapterId = Number(trigger.dataset.chapter);
    if (state.completed.has(chapterId)) state.completed.delete(chapterId);
    else state.completed.add(chapterId);
    persistProgress();
    renderRoute();
    showToast(state.completed.has(chapterId) ? "Chapter marked complete" : "Chapter reopened");
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
