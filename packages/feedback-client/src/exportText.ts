import type { Comment, FeedbackConfig } from "./types";

/**
 * Builds the "Copy Feedback for AI Agent" text block.
 * Format is documented in docs/export-format.md — keep them in sync.
 */
export function buildExportText(
  config: FeedbackConfig,
  pagePath: string,
  url: string,
  comments: Comment[],
  foundById: Map<string, boolean>,
): string {
  const general = comments.filter((c) => c.type === "page-general");
  const positioned = comments.filter((c) => c.type === "page-position");
  const componentFound = comments.filter((c) => c.type === "component" && foundById.get(c.id));
  const componentMissing = comments.filter((c) => c.type === "component" && !foundById.get(c.id));
  const open = comments.filter((c) => c.status === "open").length;
  const resolved = comments.filter((c) => c.status === "resolved").length;

  const lines: string[] = [
    "# Design Feedback Export",
    "",
    "You are a coding agent working on this application.",
    "",
    "Apply the following design-review feedback for the page below.",
    "",
    "Use component names, component metadata, and coordinates as hints. If a referenced component no longer exists, infer the most likely current component or page area from the comment text and page context. Do not remove unrelated functionality. Make focused changes that address the feedback.",
    "",
    `Project: ${config.projectKey}`,
    `Page: ${pagePath}`,
    `URL: ${url}`,
    `Exported: ${new Date().toISOString()}`,
    "",
    "Summary:",
    `- Total comments: ${comments.length}`,
    `- Open comments: ${open}`,
    `- Resolved comments: ${resolved}`,
  ];

  const sections: Array<[title: string, items: Comment[], found: boolean | null]> = [
    ["General Page Comments", general, null],
    ["Page-Position Comments", positioned, null],
    ["Component Comments - Found", componentFound, true],
    ["Component Comments - Missing", componentMissing, false],
  ];

  for (const [title, items, found] of sections) {
    lines.push("", `## ${title}`);
    if (items.length === 0) {
      lines.push("", "(none)");
      continue;
    }
    for (const comment of items) {
      lines.push("", ...commentBlock(comment, found));
    }
  }

  return lines.join("\n");
}

function commentBlock(comment: Comment, found: boolean | null): string[] {
  const lines: string[] = [
    `### Comment ${comment.id}`,
    `Status: ${comment.status}`,
    `Author: ${comment.authorName} <${comment.authorEmail}>`,
    `Created: ${comment.createdAt}`,
  ];
  if (comment.updatedAt !== comment.createdAt) {
    lines.push(`Updated: ${comment.updatedAt}`);
  }
  lines.push(`Page: ${comment.pagePath}`);

  if (comment.type === "component") {
    const nameLabel = found === false ? "Original Component" : "Component";
    if (comment.componentName) lines.push(`${nameLabel}: ${comment.componentName}`);
    if (comment.componentTag) lines.push(`Component Tag: ${comment.componentTag}`);
    lines.push(`Component Found: ${found ? "yes" : "no"}`);
  }

  if (comment.type === "page-position" && comment.componentName) {
    // Best-effort guess captured at click time — the comment is anchored to
    // the position, but this tells the agent which component it landed on.
    lines.push(`Nearest Component: ${comment.componentName}`);
    if (comment.componentTag) lines.push(`Component Tag: ${comment.componentTag}`);
  }

  if (comment.clientX != null && comment.clientY != null) {
    lines.push("Position:", `- clientX/clientY: ${comment.clientX}, ${comment.clientY}`);
    if (comment.normalizedX != null && comment.normalizedY != null) {
      lines.push(`- normalizedX/normalizedY: ${round3(comment.normalizedX)}, ${round3(comment.normalizedY)}`);
    }
  }

  if (found === false) {
    lines.push("", "Note:", "The original component was not found on the page when this export was generated.");
  }

  lines.push("", "Feedback:", comment.body);
  return lines;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
