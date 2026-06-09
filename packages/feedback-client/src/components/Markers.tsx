import { findComponentElement } from "../anchoring";
import type { Comment } from "../types";

type Props = {
  comments: Comment[];
  numbers: Map<string, number>;
  foundById: Map<string, boolean>;
  tick: number;
  onMarkerClick: (commentId: string) => void;
};

type MarkerPosition = {
  x: number;
  y: number;
  fallback: boolean;
};

/**
 * Marker placement priority:
 *  1. live DOM rect of the matched component (component comments)
 *  2. normalized viewport coordinates
 *  3. none — the comment only appears in the panel
 */
function positionFor(comment: Comment, found: boolean): MarkerPosition | null {
  if (comment.type === "page-general") return null;

  if (comment.type === "component" && found) {
    const el = findComponentElement(comment.componentTag);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Skip markers for components scrolled out of view.
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
        return null;
      }
      return {
        x: Math.min(Math.max(rect.right - 10, 16), window.innerWidth - 16),
        y: Math.min(Math.max(rect.top + 10, 16), window.innerHeight - 16),
        fallback: false,
      };
    }
  }

  if (comment.normalizedX != null && comment.normalizedY != null) {
    return {
      x: Math.min(Math.max(comment.normalizedX * window.innerWidth, 16), window.innerWidth - 16),
      y: Math.min(Math.max(comment.normalizedY * window.innerHeight, 16), window.innerHeight - 16),
      fallback: comment.type === "component",
    };
  }
  return null;
}

export function Markers({ comments, numbers, foundById, tick, onMarkerClick }: Props) {
  void tick; // positions recompute whenever the parent bumps the tick

  return (
    <div className="dfb-markers">
      {comments.map((comment) => {
        const position = positionFor(comment, foundById.get(comment.id) ?? false);
        if (!position) return null;
        const classes = [
          "dfb-marker",
          comment.type === "page-position" ? "dfb-marker--page-position" : "",
          position.fallback ? "dfb-marker--fallback" : "",
          comment.status === "resolved" ? "dfb-marker--resolved" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={comment.id}
            type="button"
            className={classes}
            style={{ left: position.x, top: position.y }}
            title={`${comment.authorName}: ${comment.body.slice(0, 120)}`}
            onClick={() => onMarkerClick(comment.id)}
          >
            {numbers.get(comment.id)}
          </button>
        );
      })}
    </div>
  );
}
