import { createRoot } from "react-dom/client";
import { App } from "./App";
import { css } from "./styles";
import type { FeedbackConfig } from "./types";

declare global {
  interface Window {
    __DESIGN_FEEDBACK_CONFIG__?: FeedbackConfig;
  }
}

function mount(): void {
  const config = window.__DESIGN_FEEDBACK_CONFIG__;
  if (!config?.projectKey || !config?.apiUrl) {
    console.warn("[design-feedback] window.__DESIGN_FEEDBACK_CONFIG__ is missing; feedback UI not mounted.");
    return;
  }
  if (document.querySelector("[data-feedback-ui]")) return; // already mounted (HMR / double inject)

  const style = document.createElement("style");
  style.setAttribute("data-feedback-ui-style", "");
  style.textContent = css;
  document.head.appendChild(style);

  const host = document.createElement("div");
  host.setAttribute("data-feedback-ui", "");
  document.body.appendChild(host);

  createRoot(host).render(<App config={config} />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
