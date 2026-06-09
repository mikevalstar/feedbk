/**
 * All feedback-UI styling, injected at runtime as a <style> tag.
 * Everything is dfb- prefixed and kept high in z-index so it floats over hosts.
 */
export const css = `
[data-feedback-ui], [data-feedback-ui] * { box-sizing: border-box; }
[data-feedback-ui] {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #1f2430;
}
[data-feedback-ui] button { font: inherit; cursor: pointer; }

/* ---- floating pencil button ---- */
.dfb-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
  width: 52px; height: 52px; border-radius: 50%;
  border: none; background: #4f46e5; color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 18px rgba(31, 36, 48, 0.35);
  transition: transform 120ms ease, background 120ms ease;
}
.dfb-fab:hover { transform: scale(1.06); background: #4338ca; }
/* keep the pencil reachable while the panel is open */
.dfb-fab--shifted { right: 410px; }
.dfb-menu--shifted { right: 410px; }
.dfb-fab svg { width: 22px; height: 22px; }
.dfb-fab-badge {
  position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px;
  border-radius: 10px; background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700; padding: 0 5px;
  display: flex; align-items: center; justify-content: center;
}

/* ---- pencil menu ---- */
.dfb-menu {
  position: fixed; right: 20px; bottom: 82px; z-index: 2147483000;
  width: 270px; background: #fff; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(31, 36, 48, 0.28);
  border: 1px solid #e6e8ef; overflow: hidden; padding: 6px;
}
.dfb-menu-header {
  padding: 8px 10px 6px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: #8a8fa3;
}
.dfb-menu-item {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 8px 10px; border: none; background: none; border-radius: 8px;
  text-align: left; color: #1f2430;
}
.dfb-menu-item:hover { background: #eef0ff; }
.dfb-menu-item .dfb-mi-icon { width: 17px; text-align: center; flex: none; }
.dfb-menu-item .dfb-mi-state { margin-left: auto; color: #8a8fa3; font-size: 12px; }
.dfb-menu-sep { height: 1px; background: #edeef4; margin: 5px 8px; }

/* ---- pick mode ---- */
.dfb-pick-hint {
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
  z-index: 2147483001; background: #1f2430; color: #fff;
  padding: 9px 16px; border-radius: 999px; font-size: 13px;
  box-shadow: 0 8px 24px rgba(31, 36, 48, 0.4);
  display: flex; align-items: center; gap: 10px; pointer-events: none;
  max-width: 90vw;
}
.dfb-pick-hint kbd {
  background: #3a4154; border-radius: 4px; padding: 1px 6px;
  font-size: 11px; font-family: inherit;
}
.dfb-highlight {
  position: fixed; z-index: 2147482998; pointer-events: none;
  border: 2px solid #4f46e5; border-radius: 4px;
  background: rgba(79, 70, 229, 0.10);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
}
.dfb-highlight-label {
  position: absolute; top: -24px; left: -2px;
  background: #4f46e5; color: #fff; font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px; white-space: nowrap;
}

/* ---- markers ---- */
.dfb-markers { position: fixed; inset: 0; z-index: 2147482997; pointer-events: none; }
.dfb-marker {
  position: absolute; transform: translate(-50%, -50%);
  width: 26px; height: 26px; border-radius: 50% 50% 50% 4px;
  border: 2px solid #fff; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  box-shadow: 0 3px 10px rgba(31, 36, 48, 0.35);
  background: #4f46e5; padding: 0;
}
.dfb-marker--page-position { background: #0d9488; }
.dfb-marker--copy { background: #c026d3; }
.dfb-marker--fallback { opacity: 0.75; border-style: dashed; }
.dfb-marker--resolved { background: #9aa0b4; }
.dfb-marker:hover { transform: translate(-50%, -50%) scale(1.15); }

/* ---- panel ---- */
.dfb-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 2147483002;
  width: 390px; max-width: 96vw; background: #fff;
  border-left: 1px solid #e6e8ef; box-shadow: -12px 0 36px rgba(31, 36, 48, 0.18);
  display: flex; flex-direction: column;
}
.dfb-panel-header {
  padding: 14px 16px; border-bottom: 1px solid #edeef4;
  display: flex; align-items: center; gap: 10px;
}
.dfb-panel-header h2 { margin: 0; font-size: 15px; flex: 1; }
.dfb-panel-sub { padding: 8px 16px; color: #6b7186; font-size: 12px; border-bottom: 1px solid #edeef4; display: flex; gap: 14px; flex-wrap: wrap; }
.dfb-panel-sub label { display: flex; gap: 5px; align-items: center; cursor: pointer; }
.dfb-panel-body { flex: 1; overflow-y: auto; padding: 12px 16px 20px; }
.dfb-panel-footer { padding: 12px 16px; border-top: 1px solid #edeef4; display: flex; gap: 8px; }
.dfb-group-title {
  margin: 16px 0 8px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: #8a8fa3;
}
.dfb-empty { color: #8a8fa3; font-size: 13px; padding: 18px 0; text-align: center; }

/* ---- comment card ---- */
.dfb-comment {
  border: 1px solid #e6e8ef; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;
  background: #fff; transition: box-shadow 150ms ease, border-color 150ms ease;
}
.dfb-comment--highlight { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25); }
.dfb-comment--resolved { opacity: 0.72; background: #fafafc; }
.dfb-comment-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.dfb-comment-num {
  flex: none; width: 20px; height: 20px; border-radius: 50% 50% 50% 3px;
  background: #4f46e5; color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.dfb-comment-num--page-position { background: #0d9488; }
.dfb-comment-num--page-general { background: #b45309; border-radius: 50%; }
.dfb-comment-num--copy { background: #c026d3; }
.dfb-comment-meta { font-size: 12px; color: #6b7186; flex: 1; min-width: 0; }
.dfb-comment-meta .dfb-author { color: #1f2430; font-weight: 600; }
.dfb-chip {
  flex: none; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; border-radius: 999px; padding: 2px 8px;
}
.dfb-chip--open { background: #ecfdf5; color: #047857; }
.dfb-chip--resolved { background: #f1f2f6; color: #6b7186; }
.dfb-comment-target { font-size: 12px; color: #6b7186; margin-bottom: 6px; }
.dfb-comment-target code {
  background: #f4f5f9; border-radius: 4px; padding: 1px 5px; font-size: 11px;
}
.dfb-missing {
  font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 6px; padding: 6px 8px; margin-bottom: 6px;
}
.dfb-comment-body { white-space: pre-wrap; word-wrap: break-word; margin-bottom: 8px; }
.dfb-comment-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.dfb-btn {
  border: 1px solid #d9dce6; background: #fff; border-radius: 7px;
  padding: 4px 10px; font-size: 12px; color: #1f2430;
}
.dfb-btn:hover { background: #f4f5f9; }
.dfb-btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.dfb-btn--primary:hover { background: #4338ca; }
.dfb-btn--danger:hover { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
.dfb-btn--wide { flex: 1; padding: 7px 10px; }

/* ---- modal / form ---- */
.dfb-overlay {
  position: fixed; inset: 0; z-index: 2147483003;
  background: rgba(15, 18, 28, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 18px;
}
.dfb-modal {
  background: #fff; border-radius: 14px; width: 440px; max-width: 100%;
  max-height: 88vh; overflow-y: auto;
  box-shadow: 0 24px 70px rgba(15, 18, 28, 0.4); padding: 20px;
}
.dfb-modal h2 { margin: 0 0 4px; font-size: 17px; }
.dfb-modal-sub { color: #6b7186; font-size: 13px; margin: 0 0 14px; }
.dfb-field { margin-bottom: 12px; }
.dfb-field label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #3a4154; }
.dfb-field input, .dfb-field textarea {
  width: 100%; border: 1px solid #d9dce6; border-radius: 8px;
  padding: 8px 10px; font: inherit; color: inherit; background: #fff;
}
.dfb-field input:focus, .dfb-field textarea:focus {
  outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.18);
}
.dfb-field textarea { min-height: 96px; resize: vertical; }
.dfb-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.dfb-context {
  font-size: 12px; color: #6b7186; background: #f4f5f9;
  border-radius: 8px; padding: 8px 10px; margin-bottom: 14px;
}
.dfb-context code { background: #e8eaf2; border-radius: 4px; padding: 1px 5px; font-size: 11px; }
.dfb-error { color: #b91c1c; font-size: 12px; margin-top: 8px; }
.dfb-quote {
  margin: 0 0 6px; padding: 4px 10px; border-left: 3px solid #c026d3;
  background: #fdf4ff; border-radius: 0 6px 6px 0; font-style: italic;
  color: #3a4154; word-wrap: break-word;
}
.dfb-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
.dfb-menu-item:disabled:hover { background: none; }

/* ---- pages modal ---- */
.dfb-modal--wide { width: 580px; }
.dfb-pages-list { list-style: none; margin: 0; padding: 0; max-height: 56vh; overflow-y: auto; }
.dfb-page-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  border: 1px solid #e6e8ef; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;
  text-decoration: none; color: #1f2430; background: #fff;
  transition: border-color 120ms ease, background 120ms ease;
}
.dfb-page-row:hover { border-color: #4f46e5; background: #f7f7ff; }
.dfb-page-row--current { background: #eef0ff; border-color: #c7cafc; }
.dfb-page-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px; font-weight: 600; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dfb-page-counts { font-size: 12px; color: #6b7186; white-space: nowrap; }
.dfb-page-go { font-size: 12px; font-weight: 600; color: #4f46e5; white-space: nowrap; }
.dfb-page-row--current .dfb-page-go { color: #6b7186; }

/* ---- toast ---- */
.dfb-toast {
  position: fixed; bottom: 86px; left: 50%; transform: translateX(-50%);
  z-index: 2147483004; background: #1f2430; color: #fff;
  padding: 10px 18px; border-radius: 10px; font-size: 13px;
  box-shadow: 0 10px 30px rgba(15, 18, 28, 0.4); max-width: 90vw;
}

/* ---- manual copy fallback ---- */
.dfb-copy-textarea {
  width: 100%; min-height: 260px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; border: 1px solid #d9dce6; border-radius: 8px; padding: 10px;
}
`;
