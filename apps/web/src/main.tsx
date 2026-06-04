import { initializeI18n, initializeTheme } from "@repo/utils";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeTranslations } from "./locales";
import { AppProviders } from "./providers/app-providers";
import { router } from "./router";

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
    <AppProviders>
      <RouterProvider router={router} />
      <SpeedInsights />
    </AppProviders>
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupTheme();
  });
}
