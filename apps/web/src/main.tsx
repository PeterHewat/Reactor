import { ErrorBoundary } from "@repo/ui-web";
import { initializeI18n, initializeTheme } from "@repo/utils";
import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeTranslations } from "./locales";
import { reportError } from "./report-error";

// Convex + Clerk: see convex/README.md and docs/setup.md#scaffold-backend-convex-cli

const cleanupTheme = initializeTheme();

requestAnimationFrame(() => {
  document.documentElement.classList.add("theme-transition");
});

initializeTranslations();
initializeI18n();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary onError={reportError}>
      <App />
      <Analytics />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupTheme();
  });
}
