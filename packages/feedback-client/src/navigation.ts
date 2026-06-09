const NAVIGATION_EVENT = "design-feedback:navigation";

let patched = false;

/** Patch the history API once so SPA navigations are observable. */
function ensurePatched(): void {
  if (patched) return;
  patched = true;
  const fire = () => window.dispatchEvent(new Event(NAVIGATION_EVENT));
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);
  history.pushState = (...args) => {
    originalPushState(...args);
    fire();
  };
  history.replaceState = (...args) => {
    originalReplaceState(...args);
    fire();
  };
  window.addEventListener("popstate", fire);
}

/** Subscribe to SPA navigation; returns an unsubscribe function. */
export function onNavigate(callback: () => void): () => void {
  ensurePatched();
  window.addEventListener(NAVIGATION_EVENT, callback);
  return () => window.removeEventListener(NAVIGATION_EVENT, callback);
}
