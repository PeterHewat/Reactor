import type { TranslationDictionary } from "@repo/utils";

/**
 * English translations.
 */
const en: TranslationDictionary = {
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
  home: {
    title: "Reactor",
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewOnGitHub: "View on GitHub",
    features: {
      title: "Features",
      react: "React 19 with latest features",
      convex: "Convex for real-time backend",
      clerk: "Clerk for authentication",
      tailwind: "Tailwind CSS for styling",
      i18n: "Internationalization support",
      themes: "Light and dark themes",
    },
  },
  errors: {
    notFound: "Page not found",
    unauthorized: "You are not authorized to view this page",
    serverError: "Server error. Please try again later.",
    networkError: "Network error. Please check your connection.",
  },
};

export default en;
