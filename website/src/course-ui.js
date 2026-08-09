export const ACTIVITY_KINDS = ["lesson", "lab", "exercise", "checkpoint"];

export const MINIMUM_EVIDENCE_LENGTH = 12;

export function activityKey(chapterId, kind) {
  return `${chapterId}:${kind}`;
}

export function activitySequence(chapters) {
  return chapters.flatMap((chapter) =>
    ACTIVITY_KINDS.map((kind) => ({ chapterId: chapter.id, kind })),
  );
}

export function adjacentActivity(chapters, chapterId, kind, offset) {
  const activities = activitySequence(chapters);
  const index = activities.findIndex(
    (activity) => activity.chapterId === chapterId && activity.kind === kind,
  );
  if (index < 0) return null;
  return activities[index + offset] || null;
}

export function evidenceRecordIsComplete(record) {
  return Boolean(
    record &&
      record.attested === true &&
      typeof record.note === "string" &&
      record.note.trim().length >= MINIMUM_EVIDENCE_LENGTH,
  );
}

export function readEvidenceRecords(serialized) {
  if (!serialized) return {};
  try {
    const parsed = JSON.parse(serialized);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isExternalHref(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

export function resolveCoursePath(sourcePath, href) {
  if (!href || href.startsWith("#") || isExternalHref(href)) return null;
  try {
    const resolved = new URL(href, `https://course.invalid/${sourcePath}`);
    return {
      path: decodeURIComponent(resolved.pathname.replace(/^\//, "")),
      search: resolved.search,
      hash: resolved.hash,
    };
  } catch {
    return null;
  }
}

export function rewriteCourseHref({ href, sourcePath, routeByPath, repositoryUrl }) {
  if (href?.startsWith("#") && href.length > 1) {
    const currentRoute = routeByPath.get(sourcePath);
    if (currentRoute) {
      return {
        href: `${currentRoute}?section=${encodeURIComponent(href.slice(1))}`,
        external: false,
        mapped: true,
      };
    }
  }

  const resolved = resolveCoursePath(sourcePath, href);
  if (!resolved) return { href, external: isExternalHref(href) };

  const mappedRoute = routeByPath.get(resolved.path);
  if (mappedRoute) {
    const section = resolved.hash.slice(1);
    return {
      href: section ? `${mappedRoute}?section=${encodeURIComponent(section)}` : mappedRoute,
      external: false,
      mapped: true,
    };
  }

  return {
    href: `${repositoryUrl}/blob/main/${resolved.path}${resolved.search}${resolved.hash}`,
    external: true,
    mapped: false,
  };
}
