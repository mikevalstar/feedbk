import { useState } from "react";
import type { Draft, Identity } from "../types";

type Props = {
  draft: Draft;
  identity: Identity;
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
};

const TITLES: Record<Draft["type"], string> = {
  component: "Comment on component",
  "page-position": "Comment on page position",
  "page-general": "Comment on this page",
};

export function CommentForm({ draft, identity, onSubmit, onCancel }: Props) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(body.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save comment");
      setSaving(false);
    }
  };

  return (
    <div className="dfb-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="dfb-modal" onSubmit={submit}>
        <h2>{TITLES[draft.type]}</h2>
        <p className="dfb-modal-sub">
          Commenting as {identity.name} ({identity.email}) on {window.location.pathname}
        </p>

        {draft.type === "component" && draft.component && (
          <div className="dfb-context">
            Component: <strong>{draft.component.componentName}</strong>
            <br />
            Tag: <code>{draft.component.componentTag}</code>
            {draft.component.textSnippet && (
              <>
                <br />
                &ldquo;{draft.component.textSnippet.slice(0, 80)}
                {draft.component.textSnippet.length > 80 ? "…" : ""}&rdquo;
              </>
            )}
          </div>
        )}
        {draft.type === "page-position" && draft.coords && (
          <div className="dfb-context">
            Position: {Math.round(draft.coords.clientX)}, {Math.round(draft.coords.clientY)} (normalized{" "}
            {draft.coords.normalizedX.toFixed(3)}, {draft.coords.normalizedY.toFixed(3)})
          </div>
        )}
        {draft.type === "page-general" && (
          <div className="dfb-context">This comment applies to the whole page.</div>
        )}

        <div className="dfb-field">
          <label htmlFor="dfb-comment-body">Feedback</label>
          <textarea
            id="dfb-comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What should change here?"
            autoFocus
          />
        </div>
        {error && <div className="dfb-error">{error}</div>}
        <div className="dfb-modal-actions">
          <button type="button" className="dfb-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="dfb-btn dfb-btn--primary" disabled={!body.trim() || saving}>
            {saving ? "Saving…" : "Add comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
