import { useEffect, useRef, useState } from "react";
import { formatTime } from "../format";
import type { Comment } from "../types";

type Props = {
  pagePath: string;
  comments: Comment[]; // already filtered by showResolved
  numbers: Map<string, number>;
  foundById: Map<string, boolean>;
  highlightId: string | null;
  showResolved: boolean;
  showMarkers: boolean;
  onToggleResolvedVisibility: (value: boolean) => void;
  onToggleMarkers: (value: boolean) => void;
  onResolveToggle: (comment: Comment) => void;
  onEdit: (comment: Comment, body: string) => Promise<void>;
  onDelete: (comment: Comment) => void;
  onCopyExport: () => void;
  onDownloadExport: () => void;
  onClose: () => void;
};

export function CommentsPanel(props: Props) {
  const { comments, foundById } = props;
  const general = comments.filter((c) => c.type === "page-general");
  const positioned = comments.filter((c) => c.type === "page-position");
  const componentFound = comments.filter((c) => c.type === "component" && foundById.get(c.id));
  const componentMissing = comments.filter((c) => c.type === "component" && !foundById.get(c.id));

  return (
    <div className="dfb-panel">
      <div className="dfb-panel-header">
        <h2>Comments on {props.pagePath}</h2>
        <button type="button" className="dfb-btn" onClick={props.onClose}>
          Close
        </button>
      </div>
      <div className="dfb-panel-sub">
        <span>{comments.length} shown</span>
        <label>
          <input
            type="checkbox"
            checked={props.showResolved}
            onChange={(e) => props.onToggleResolvedVisibility(e.target.checked)}
          />
          Show resolved
        </label>
        <label>
          <input
            type="checkbox"
            checked={props.showMarkers}
            onChange={(e) => props.onToggleMarkers(e.target.checked)}
          />
          Markers
        </label>
      </div>
      <div className="dfb-panel-body">
        {comments.length === 0 && <div className="dfb-empty">No comments on this page yet.</div>}
        <Group title="General page comments" items={general} {...props} />
        <Group title="Page-position comments" items={positioned} {...props} />
        <Group title="Component comments" items={componentFound} {...props} />
        <Group title="Component comments — component missing" items={componentMissing} missing {...props} />
      </div>
      <div className="dfb-panel-footer">
        <button type="button" className="dfb-btn dfb-btn--primary dfb-btn--wide" onClick={props.onCopyExport}>
          Copy Feedback for AI Agent
        </button>
        <button type="button" className="dfb-btn dfb-btn--wide" onClick={props.onDownloadExport}>
          Download Feedback
        </button>
      </div>
    </div>
  );
}

function Group({ title, items, missing, ...props }: Props & { title: string; items: Comment[]; missing?: boolean }) {
  if (items.length === 0) return null;
  return (
    <>
      <div className="dfb-group-title">{title}</div>
      {items.map((comment) => (
        <CommentCard key={comment.id} comment={comment} missing={!!missing} {...props} />
      ))}
    </>
  );
}

function CommentCard({ comment, missing, ...props }: Props & { comment: Comment; missing: boolean }) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const highlighted = props.highlightId === comment.id;

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlighted]);

  const saveEdit = async () => {
    if (!editBody.trim() || busy) return;
    setBusy(true);
    try {
      await props.onEdit(comment, editBody.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const numberClass =
    comment.type === "page-position"
      ? "dfb-comment-num dfb-comment-num--page-position"
      : comment.type === "page-general"
        ? "dfb-comment-num dfb-comment-num--page-general"
        : "dfb-comment-num";

  return (
    <div
      ref={ref}
      className={[
        "dfb-comment",
        comment.status === "resolved" ? "dfb-comment--resolved" : "",
        highlighted ? "dfb-comment--highlight" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="dfb-comment-top">
        <span className={numberClass}>{props.numbers.get(comment.id) ?? "•"}</span>
        <span className="dfb-comment-meta">
          <span className="dfb-author">{comment.authorName}</span> · {formatTime(comment.createdAt)}
        </span>
        <span className={`dfb-chip dfb-chip--${comment.status}`}>{comment.status}</span>
      </div>

      {comment.type === "component" && !missing && comment.componentName && (
        <div className="dfb-comment-target">
          Component: <code>{comment.componentName}</code>
        </div>
      )}
      {missing && (
        <div className="dfb-missing">
          Component not currently found on this page. Originally attached to: {comment.componentName ?? "unknown"}.
        </div>
      )}
      {comment.type === "page-position" && comment.clientX != null && comment.clientY != null && (
        <div className="dfb-comment-target">
          Position: {Math.round(comment.clientX)}, {Math.round(comment.clientY)}
          {comment.componentName && (
            <>
              {" · near "}
              <code>{comment.componentName}</code>
            </>
          )}
        </div>
      )}

      {editing ? (
        <div className="dfb-field">
          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} autoFocus />
        </div>
      ) : (
        <div className="dfb-comment-body">{comment.body}</div>
      )}

      <div className="dfb-comment-actions">
        {editing ? (
          <>
            <button
              type="button"
              className="dfb-btn dfb-btn--primary"
              onClick={saveEdit}
              disabled={busy || !editBody.trim()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="dfb-btn"
              onClick={() => {
                setEditing(false);
                setEditBody(comment.body);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="dfb-btn" onClick={() => props.onResolveToggle(comment)}>
              {comment.status === "open" ? "Resolve" : "Reopen"}
            </button>
            <button type="button" className="dfb-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="dfb-btn dfb-btn--danger" onClick={() => props.onDelete(comment)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
