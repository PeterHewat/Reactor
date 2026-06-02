import { PRODUCT_NAME } from "@repo/config/product";
import type { TranslationDictionary } from "@repo/utils";

/**
 * English translations — the canonical source of truth for all translation keys.
 */
const en = {
  common: {
    welcome: "Welcome",
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    noResults: "No results found",
  },
  theme: {
    light: "Light",
    dark: "Dark",
    system: "System",
    toggle: "Toggle theme",
  },
  language: {
    select: "Select language",
    current: "Current language: {{language}}",
  },
  nav: {
    main: "Main navigation",
    tasks: "Tasks",
  },
  auth: {
    login: "Log in",
    logout: "Log out",
  },
  home: {
    title: PRODUCT_NAME,
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewRepository: "View repository on GitHub",
    features: {
      title: "Features",
      react: "React 19 with TanStack Router file routes",
      convex: "Convex sample tasks API (enable with env)",
      clerk: "Clerk authentication when configured",
      tailwind: "Tailwind CSS v4 with shared tokens",
      i18n: "Internationalization (en, es, fr, de)",
      themes: "Light and dark themes",
    },
  },
  backend: {
    setupTitle: "Finish cloud setup",
    setupBody:
      "Wire Convex and Clerk to run the tasks demo. Follow the steps below, then use bun run dev:full.",
    stepConvex:
      "Set CLERK_JWT_ISSUER_DOMAIN in Convex (Clerk JWT template Issuer), then bun run dev:convex and VITE_CONVEX_URL",
    stepClerk:
      "Clerk: JWT templates → Convex preset (copy Issuer); API keys → React → VITE_CLERK_PUBLISHABLE_KEY",
    stepEnv: "See docs/getting-started.md §2–3 on GitHub",
    setupGuide: "Open setup guide on GitHub (README)",
    setupGuideLocal: "See README in your repository for cloud setup",
    backHome: "Back to home",
  },
  tasks: {
    title: "Tasks",
    subtitle: "Sample vertical slice: Convex mutations and Clerk auth",
    newPlaceholder: "What needs to be done?",
    add: "Add task",
    empty: "No tasks yet. Add one above.",
    listLabel: "Your tasks",
    toggleComplete: "Mark “{{title}}” complete",
    delete: "Delete “{{title}}”",
  },
  errors: {
    notFound: "Page not found",
    notFoundHint: "The page you requested does not exist.",
    unauthorized: "You are not authorized to view this page",
    serverError: "Server error. Please try again later.",
    networkError: "Network error. Please check your connection.",
  },
} as const satisfies TranslationDictionary;

export default en;
