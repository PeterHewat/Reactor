import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Available theme modes.
 * - `light`: Force light theme
 * - `dark`: Force dark theme
 * - `system`: Follow system preference
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme (what's actually applied to the DOM).
 */
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  /** User's theme preference */
  mode: ThemeMode;
  /** Resolved theme based on mode and system preference */
  resolvedTheme: ResolvedTheme;
  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Update resolved theme (called when system preference changes) */
  updateResolvedTheme: () => void;
}

/**
 * Get the system's preferred color scheme.
 *
 * @returns The system's preferred theme
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Resolve the theme based on mode and system preference.
 *
 * @param mode - The theme mode to resolve
 * @returns The resolved theme
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply theme to the document root element.
 * Adds/removes the `dark` class on the `<html>` element.
 *
 * @param theme - The theme to apply
 */
export function applyThemeToDOM(theme: ResolvedTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Zustand store for theme management.
 *
 * Persists user preference to localStorage and syncs with system preference.
 *
 * @example
 * // In a component
 * const { mode, resolvedTheme, setMode } = useThemeStore();
 *
 * // Toggle between light and dark
 * setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
 *
 * // Follow system preference
 * setMode('system');
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      resolvedTheme: resolveTheme("system"),

      setMode: (mode: ThemeMode) => {
        const resolvedTheme = resolveTheme(mode);
        applyThemeToDOM(resolvedTheme);
        set({ mode, resolvedTheme });
      },

      updateResolvedTheme: () => {
        const { mode } = get();
        const resolvedTheme = resolveTheme(mode);
        applyThemeToDOM(resolvedTheme);
        set({ resolvedTheme });
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration from localStorage
        if (state) {
          const resolvedTheme = resolveTheme(state.mode);
          applyThemeToDOM(resolvedTheme);
          state.resolvedTheme = resolvedTheme;
        }
      },
    },
  ),
);

/**
 * Initialize theme system.
 * Sets up system preference listener and applies initial theme.
 * Call this once at app startup.
 *
 * @returns Cleanup function to remove event listener
 *
 * @example
 * // In main.tsx or App.tsx
 * useEffect(() => {
 *   return initializeTheme();
 * }, []);
 */
export function initializeTheme(): () => void {
  // Apply initial theme
  const { mode, updateResolvedTheme } = useThemeStore.getState();
  applyThemeToDOM(resolveTheme(mode));

  // Listen for system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    updateResolvedTheme();
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
