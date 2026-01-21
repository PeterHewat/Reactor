import { initializeI18n, initializeTheme } from "@repo/utils";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeTranslations } from "./locales";

// Initialize theme (applies saved preference or system default)
const cleanupTheme = initializeTheme();

// Initialize i18n (loads translations and detects browser locale)
initializeTranslations();
initializeI18n();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Cleanup on hot module replacement (Vite)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupTheme();
  });
}
