import { useEffect, useState } from "react";
import { listPages } from "../api";
import { formatTime } from "../format";
import type { FeedbackConfig, PageSummary } from "../types";

type Props = {
  config: FeedbackConfig;
  currentPath: string;
  onClose: () => void;
};

/**
 * "All pages with comments": every page in the project that has feedback,
 * with counts and a link. Links do a full navigation so they work no matter
 * how the host app routes.
 */
export function PagesModal({ config, currentPath, onClose }: Props) {
  const [pages, setPages] = useState<PageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPages(config)
      .then(setPages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pages"));
  }, [config]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close; Close button is the accessible path
    <div className="dfb-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dfb-modal dfb-modal--wide">
        <h2>All pages with comments</h2>
        <p className="dfb-modal-sub">Every page in “{config.projectKey}” that has feedback. Click a page to open it.</p>

        {error && <div className="dfb-error">{error}</div>}
        {!error && pages === null && <div className="dfb-empty">Loading…</div>}
        {pages !== null && pages.length === 0 && <div className="dfb-empty">No comments anywhere yet.</div>}

        {pages !== null && pages.length > 0 && (
          <ul className="dfb-pages-list">
            {pages.map((page) => {
              const isCurrent = page.pagePath === currentPath;
              return (
                <li key={page.pagePath}>
                  <a
                    className={isCurrent ? "dfb-page-row dfb-page-row--current" : "dfb-page-row"}
                    href={page.pagePath}
                    onClick={(e) => {
                      if (isCurrent) {
                        e.preventDefault();
                        onClose();
                      }
                    }}
                  >
                    <span className="dfb-page-path">{page.pagePath}</span>
                    <span className="dfb-page-counts">
                      {page.open} open
                      {page.resolved > 0 ? ` · ${page.resolved} resolved` : ""}
                      {" · "}
                      {formatTime(page.lastUpdatedAt)}
                    </span>
                    <span className="dfb-page-go">{isCurrent ? "current page" : "open →"}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <div className="dfb-modal-actions">
          <button type="button" className="dfb-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
