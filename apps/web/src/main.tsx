import { initializeI18n, initializeTheme } from "@repo/utils";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeTranslations } from "./locales";

// ============================================================================
// CONVEX + CLERK SETUP (uncomment when ready)
// ============================================================================
// 1. Run `npx convex dev` from the repository root to scaffold Convex
// 2. Create a Clerk account and get your publishable key
// 3. Add environment variables to apps/web/.env.local:
//    VITE_CONVEX_URL=https://your-project.convex.cloud
//    VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
// 4. Uncomment the imports and providers below
// ============================================================================

// import { ClerkProvider, useAuth } from "@clerk/clerk-react";
// import { ConvexProviderWithClerk } from "convex/react-clerk";
// import { ConvexReactClient } from "convex/react";

// const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Initialize theme (applies saved preference or system default)
const cleanupTheme = initializeTheme();

// Initialize i18n (loads translations and detects browser locale)
initializeTranslations();
initializeI18n();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

// ============================================================================
// OPTION A: Without authentication (Convex only)
// ============================================================================
// createRoot(root).render(
//   <StrictMode>
//     <ConvexProvider client={convex}>
//       <App />
//     </ConvexProvider>
//   </StrictMode>,
// );

// ============================================================================
// OPTION B: With Clerk authentication (recommended for production)
// ============================================================================
// createRoot(root).render(
//   <StrictMode>
//     <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
//       <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
//         <App />
//       </ConvexProviderWithClerk>
//     </ClerkProvider>
//   </StrictMode>,
// );

// ============================================================================
// CURRENT: No backend (remove this block when enabling Convex)
// ============================================================================
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
