import type { ComponentTarget } from "./types";

/**
 * Anchoring logic for component comments, driven entirely by the `data-ref`
 * attribute that vite-plugin-component-tagger stamps on component root
 * elements: "src/components/BookCard.tsx#L12-14".
 *
 * Marker placement priority (do not reorder casually — documented in CLAUDE.md):
 *   1. live element matched here, 2. normalized coordinates, 3. panel-only.
 */

const FEEDBACK_UI_SELECTOR = "[data-feedback-ui]";

export function isInsideFeedbackUi(el: Element | null): boolean {
  return !!el?.closest(FEEDBACK_UI_SELECTOR);
}

function escapeAttrValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** The file-path part of a data-ref, e.g. "src/components/BookCard.tsx". */
export function filePathFromTag(componentTag: string): string {
  return componentTag.split("#")[0] ?? componentTag;
}

/** Derive a component name from a data-ref the same way the tagger does (capitalized basename). */
export function componentNameFromTag(componentTag: string): string {
  const filePath = filePathFromTag(componentTag);
  const fileName = filePath.split("/").pop() ?? filePath;
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

/**
 * Find the live DOM element for a stored component tag.
 * Exact data-ref match first; the line numbers in data-ref drift as files are
 * edited, so fall back to matching any element tagged from the same file.
 */
export function findComponentElement(componentTag: string | null): Element | null {
  if (!componentTag) return null;

  const exact = document.querySelector(`[data-ref="${escapeAttrValue(componentTag)}"]`);
  if (exact && !isInsideFeedbackUi(exact)) return exact;

  const filePath = filePathFromTag(componentTag);
  if (filePath) {
    const byPath = document.querySelector(`[data-ref^="${escapeAttrValue(filePath)}#"]`);
    if (byPath && !isInsideFeedbackUi(byPath)) return byPath;
  }
  return null;
}

/** Nearest tagged component at/above the given element, ignoring the feedback UI itself. */
export function findTaggedAncestor(el: Element | null): Element | null {
  if (!el || isInsideFeedbackUi(el)) return null;
  return el.closest("[data-ref]");
}

export function buildDomPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && parts.length < 10) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      parts.unshift(`${part}#${current.id}`);
      break;
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }
    parts.unshift(part);
    current = parent;
  }
  return parts.join(" > ");
}

export function textSnippet(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Everything we persist about a picked component, derived from its data-ref. */
export function describeComponent(el: Element): ComponentTarget {
  const dataRef = el.getAttribute("data-ref") ?? "";
  const filePath = filePathFromTag(dataRef);
  const lineMatch = /#L(\d+)-(\d+)$/.exec(dataRef);
  return {
    componentName: componentNameFromTag(dataRef),
    componentTag: dataRef,
    componentMetadata: JSON.stringify({
      source: "vite-plugin-component-tagger",
      dataRef,
      filePath,
      lineStart: lineMatch ? Number(lineMatch[1]) : null,
      lineEnd: lineMatch ? Number(lineMatch[2]) : null,
    }),
    domPath: buildDomPath(el),
    textSnippet: textSnippet(el),
  };
}
