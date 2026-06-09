import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeComponent, findComponentElement, findTaggedAncestor, isInsideFeedbackUi } from "./anchoring";
import * as api from "./api";
import { CommentForm } from "./components/CommentForm";
import { CommentsPanel } from "./components/CommentsPanel";
import { IdentityModal } from "./components/IdentityModal";
import { Markers } from "./components/Markers";
import { captureCoords } from "./coords";
import { buildExportText } from "./exportText";
import { clearIdentity, loadIdentity, saveIdentity } from "./identity";
import { onNavigate } from "./navigation";
import type { Comment, Draft, FeedbackConfig, Identity } from "./types";

type Mode = "idle" | "pick-component" | "pick-position";

type HoverInfo = {
  rect: { left: number; top: number; width: number; height: number };
  label: string;
};

export function App({ config }: { config: FeedbackConfig }) {
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity());
  const [identityOpen, setIdentityOpen] = useState(false);
  const afterIdentityRef = useRef<(() => void) | null>(null);

  const [pagePath, setPagePath] = useState(() => window.location.pathname);
  const [comments, setComments] = useState<Comment[]>([]);
  const [mode, setMode] = useState<Mode>("idle");
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const showToast = useCallback((message: string) => setToast(message), []);

  // --- SPA navigation: re-scope to the new pagePath ---
  useEffect(
    () =>
      onNavigate(() => {
        setPagePath(window.location.pathname);
        setMode("idle");
        setDraft(null);
        setMenuOpen(false);
        setHighlightId(null);
      }),
    [],
  );

  // --- load comments for the current page ---
  const refresh = useCallback(async () => {
    try {
      setComments(await api.listComments(config, pagePath));
    } catch (err) {
      showToast(`Could not load comments: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }, [config, pagePath, showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // --- keep marker positions / found-ness fresh ---
  useEffect(() => {
    let frame = 0;
    const bump = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations from our own UI, otherwise we'd loop forever.
      if (mutations.some((m) => !isInsideFeedbackUi(m.target instanceof Element ? m.target : m.target.parentElement))) {
        bump();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("scroll", bump, { capture: true, passive: true });
    window.addEventListener("resize", bump);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", bump, { capture: true });
      window.removeEventListener("resize", bump);
      cancelAnimationFrame(frame);
    };
  }, []);

  // --- toast auto-dismiss ---
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- pick modes: capture-phase listeners so the host app doesn't react ---
  useEffect(() => {
    if (mode === "idle") {
      setHover(null);
      return;
    }
    document.documentElement.style.cursor = "crosshair";

    const onMove = (event: MouseEvent) => {
      if (mode !== "pick-component") return;
      const target = event.target instanceof Element ? event.target : null;
      const el = findTaggedAncestor(target);
      if (!el) {
        setHover(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setHover({
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        label: describeComponent(el).componentName,
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (isInsideFeedbackUi(target)) return; // let our own buttons work
      event.preventDefault();
      event.stopPropagation();
      if (mode === "pick-component") {
        const el = findTaggedAncestor(target);
        if (!el) {
          showToast("No tagged component here — click a highlighted element.");
          return;
        }
        setDraft({ type: "component", coords: captureCoords(event), component: describeComponent(el) });
      } else {
        setDraft({ type: "page-position", coords: captureCoords(event), component: null });
      }
      setMode("idle");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode("idle");
    };

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.documentElement.style.cursor = "";
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [mode, showToast]);

  // --- derived state ---
  const foundById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const comment of comments) {
      if (comment.type === "component") {
        map.set(comment.id, !!findComponentElement(comment.componentTag));
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick forces re-evaluation as the DOM changes
  }, [comments, tick]);

  const visibleComments = useMemo(
    () => comments.filter((c) => showResolved || c.status === "open"),
    [comments, showResolved],
  );

  const numbers = useMemo(() => {
    const map = new Map<string, number>();
    visibleComments.forEach((comment, index) => map.set(comment.id, index + 1));
    return map;
  }, [visibleComments]);

  const openCount = comments.filter((c) => c.status === "open").length;

  // --- identity gating ---
  const requireIdentity = (action: () => void) => {
    if (identity) {
      action();
    } else {
      afterIdentityRef.current = action;
      setIdentityOpen(true);
    }
  };

  // --- actions ---
  const startMode = (next: Mode) => {
    setMenuOpen(false);
    setPanelOpen(false);
    setMode(next);
  };

  const submitComment = async (body: string) => {
    if (!draft || !identity) return;
    const created = await api.createComment(config, {
      pagePath,
      url: window.location.href,
      type: draft.type,
      body,
      authorName: identity.name,
      authorEmail: identity.email,
      ...(draft.coords ?? {}),
      ...(draft.component ?? {}),
    });
    setComments((prev) => [...prev, created]);
    setDraft(null);
    showToast("Comment added.");
  };

  const toggleResolve = async (comment: Comment) => {
    try {
      const updated = await api.updateComment(config, comment.id, {
        status: comment.status === "open" ? "resolved" : "open",
      });
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      showToast(`Update failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  };

  const editComment = async (comment: Comment, body: string) => {
    try {
      const updated = await api.updateComment(config, comment.id, { body });
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast("Comment updated.");
    } catch (err) {
      showToast(`Update failed: ${err instanceof Error ? err.message : "unknown error"}`);
      throw err;
    }
  };

  const removeComment = async (comment: Comment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.deleteComment(config, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      showToast("Comment deleted.");
    } catch (err) {
      showToast(`Delete failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  };

  const exportText = () => buildExportText(config, pagePath, window.location.href, comments, foundById);

  const copyExport = async () => {
    const text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Feedback copied to clipboard.");
    } catch {
      setManualCopyText(text);
    }
  };

  const downloadExport = () => {
    const text = exportText();
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `feedback-${config.projectKey}${pagePath.replace(/\//g, "_") || "_root"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Feedback downloaded.");
  };

  const onMarkerClick = (commentId: string) => {
    setPanelOpen(true);
    setHighlightId(commentId);
  };

  const changeIdentity = () => {
    setMenuOpen(false);
    clearIdentity();
    setIdentityOpen(true);
  };

  // --- render ---
  return (
    <>
      {/* floating pencil button */}
      <button
        type="button"
        className="dfb-fab"
        title="Design feedback"
        onClick={() => requireIdentity(() => setMenuOpen((open) => !open))}
      >
        <PencilIcon />
        {openCount > 0 && <span className="dfb-fab-badge">{openCount}</span>}
      </button>

      {menuOpen && (
        <div className="dfb-menu">
          <div className="dfb-menu-header">Add feedback</div>
          <button type="button" className="dfb-menu-item" onClick={() => startMode("pick-component")}>
            <span className="dfb-mi-icon">▣</span> Add component comment
          </button>
          <button type="button" className="dfb-menu-item" onClick={() => startMode("pick-position")}>
            <span className="dfb-mi-icon">✛</span> Add page-position comment
          </button>
          <button
            type="button"
            className="dfb-menu-item"
            onClick={() => {
              setMenuOpen(false);
              setDraft({ type: "page-general", coords: null, component: null });
            }}
          >
            <span className="dfb-mi-icon">▤</span> Add general page comment
          </button>
          <div className="dfb-menu-sep" />
          <button
            type="button"
            className="dfb-menu-item"
            onClick={() => {
              setMenuOpen(false);
              setPanelOpen(true);
            }}
          >
            <span className="dfb-mi-icon">☰</span> View page comments
            <span className="dfb-mi-state">{comments.length}</span>
          </button>
          <button type="button" className="dfb-menu-item" onClick={() => setShowMarkers((v) => !v)}>
            <span className="dfb-mi-icon">◉</span> Toggle markers
            <span className="dfb-mi-state">{showMarkers ? "on" : "off"}</span>
          </button>
          <button type="button" className="dfb-menu-item" onClick={() => setShowResolved((v) => !v)}>
            <span className="dfb-mi-icon">✓</span> Show resolved
            <span className="dfb-mi-state">{showResolved ? "yes" : "no"}</span>
          </button>
          <div className="dfb-menu-sep" />
          <button
            type="button"
            className="dfb-menu-item"
            onClick={() => {
              setMenuOpen(false);
              void copyExport();
            }}
          >
            <span className="dfb-mi-icon">⧉</span> Copy Feedback for AI Agent
          </button>
          <button
            type="button"
            className="dfb-menu-item"
            onClick={() => {
              setMenuOpen(false);
              downloadExport();
            }}
          >
            <span className="dfb-mi-icon">⬇</span> Download Feedback
          </button>
          <div className="dfb-menu-sep" />
          <button type="button" className="dfb-menu-item" onClick={changeIdentity}>
            <span className="dfb-mi-icon">👤</span> Change identity
            <span className="dfb-mi-state">{identity?.name ?? "not set"}</span>
          </button>
        </div>
      )}

      {/* pick-mode chrome */}
      {mode !== "idle" && (
        <div className="dfb-pick-hint">
          {mode === "pick-component"
            ? "Click a highlighted component to comment on it"
            : "Click anywhere on the page to drop a comment"}
          <kbd>Esc</kbd>
        </div>
      )}
      {mode === "pick-component" && hover && (
        <div
          className="dfb-highlight"
          style={{ left: hover.rect.left - 2, top: hover.rect.top - 2, width: hover.rect.width + 4, height: hover.rect.height + 4 }}
        >
          <div className="dfb-highlight-label">{hover.label}</div>
        </div>
      )}

      {/* markers */}
      {showMarkers && mode === "idle" && (
        <Markers
          comments={visibleComments}
          numbers={numbers}
          foundById={foundById}
          tick={tick}
          onMarkerClick={onMarkerClick}
        />
      )}

      {/* panel */}
      {panelOpen && (
        <CommentsPanel
          pagePath={pagePath}
          comments={visibleComments}
          numbers={numbers}
          foundById={foundById}
          highlightId={highlightId}
          showResolved={showResolved}
          showMarkers={showMarkers}
          onToggleResolvedVisibility={setShowResolved}
          onToggleMarkers={setShowMarkers}
          onResolveToggle={(comment) => void toggleResolve(comment)}
          onEdit={editComment}
          onDelete={(comment) => void removeComment(comment)}
          onCopyExport={() => void copyExport()}
          onDownloadExport={downloadExport}
          onClose={() => {
            setPanelOpen(false);
            setHighlightId(null);
          }}
        />
      )}

      {/* modals */}
      {identityOpen && (
        <IdentityModal
          initial={identity}
          onSave={(value) => {
            saveIdentity(value);
            setIdentity(value);
            setIdentityOpen(false);
            const next = afterIdentityRef.current;
            afterIdentityRef.current = null;
            next?.();
          }}
          onCancel={() => {
            setIdentityOpen(false);
            afterIdentityRef.current = null;
          }}
        />
      )}
      {draft && identity && (
        <CommentForm draft={draft} identity={identity} onSubmit={submitComment} onCancel={() => setDraft(null)} />
      )}
      {manualCopyText !== null && (
        <div className="dfb-overlay" onMouseDown={(e) => e.target === e.currentTarget && setManualCopyText(null)}>
          <div className="dfb-modal">
            <h2>Copy feedback manually</h2>
            <p className="dfb-modal-sub">Clipboard access failed — select the text below and copy it.</p>
            <textarea
              className="dfb-copy-textarea"
              readOnly
              value={manualCopyText}
              onFocus={(e) => e.target.select()}
              autoFocus
            />
            <div className="dfb-modal-actions">
              <button type="button" className="dfb-btn dfb-btn--primary" onClick={() => setManualCopyText(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="dfb-toast">{toast}</div>}
    </>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
