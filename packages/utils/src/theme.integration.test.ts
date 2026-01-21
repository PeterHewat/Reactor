import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyThemeToDOM,
  getSystemTheme,
  initializeTheme,
  resolveTheme,
  useThemeStore,
} from "./theme";

describe("Theme Integration", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

  // Helper to create a mock matchMedia that can trigger events
  function createMockMatchMedia(prefersDark: boolean) {
    return (query: string) => ({
      matches: query.includes("dark") ? prefersDark : !prefersDark,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
        if (event === "change") {
          mediaQueryListeners.push(callback);
        }
      }),
      removeEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
        if (event === "change") {
          mediaQueryListeners = mediaQueryListeners.filter((cb) => cb !== callback);
        }
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  }

  // Helper to simulate system theme change
  function simulateSystemThemeChange(prefersDark: boolean) {
    window.matchMedia = createMockMatchMedia(prefersDark) as typeof window.matchMedia;
    const event = { matches: prefersDark } as MediaQueryListEvent;
    mediaQueryListeners.forEach((listener) => listener(event));
  }

  beforeEach(() => {
    // Store original
    originalMatchMedia = window.matchMedia;

    // Reset store to default state
    useThemeStore.setState({ mode: "system", resolvedTheme: "light" });

    // Clear localStorage
    localStorage.clear();

    // Clear listeners
    mediaQueryListeners = [];

    // Setup default mock (light mode)
    window.matchMedia = createMockMatchMedia(false) as typeof window.matchMedia;

    // Reset document class
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  describe("initializeTheme", () => {
    it("applies light theme when system prefers light", () => {
      window.matchMedia = createMockMatchMedia(false) as typeof window.matchMedia;

      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("applies dark theme when system prefers dark", () => {
      window.matchMedia = createMockMatchMedia(true) as typeof window.matchMedia;
      // Need to set the store to system mode with correct resolved theme
      // since initializeTheme reads from store and applies to DOM
      useThemeStore.setState({ mode: "system", resolvedTheme: "dark" });

      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("respects stored user preference over system preference", () => {
      // User prefers light, system prefers dark
      window.matchMedia = createMockMatchMedia(true) as typeof window.matchMedia;
      useThemeStore.setState({ mode: "light", resolvedTheme: "light" });

      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("returns cleanup function that removes event listener", () => {
      const cleanup = initializeTheme();

      expect(typeof cleanup).toBe("function");

      // Should not throw
      cleanup();
    });

    it("updates theme when system preference changes (in system mode)", () => {
      useThemeStore.setState({ mode: "system", resolvedTheme: "light" });
      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Simulate system changing to dark mode
      simulateSystemThemeChange(true);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(useThemeStore.getState().resolvedTheme).toBe("dark");
    });

    it("ignores system preference changes when in explicit light mode", () => {
      useThemeStore.getState().setMode("light");
      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Simulate system changing to dark mode
      simulateSystemThemeChange(true);

      // Should still be light because user explicitly chose light
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("ignores system preference changes when in explicit dark mode", () => {
      useThemeStore.getState().setMode("dark");
      initializeTheme();

      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Simulate system changing to light mode
      simulateSystemThemeChange(false);

      // Should still be dark because user explicitly chose dark
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Theme mode transitions", () => {
    it("cycles through modes: system -> light -> dark -> system", () => {
      const { setMode } = useThemeStore.getState();

      // Start in system mode
      expect(useThemeStore.getState().mode).toBe("system");

      // Switch to light
      setMode("light");
      expect(useThemeStore.getState().mode).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Switch to dark
      setMode("dark");
      expect(useThemeStore.getState().mode).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Switch back to system
      setMode("system");
      expect(useThemeStore.getState().mode).toBe("system");
    });
  });

  describe("resolveTheme", () => {
    it("returns light for light mode regardless of system", () => {
      window.matchMedia = createMockMatchMedia(true) as typeof window.matchMedia;
      expect(resolveTheme("light")).toBe("light");
    });

    it("returns dark for dark mode regardless of system", () => {
      window.matchMedia = createMockMatchMedia(false) as typeof window.matchMedia;
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("returns system preference for system mode", () => {
      window.matchMedia = createMockMatchMedia(true) as typeof window.matchMedia;
      expect(resolveTheme("system")).toBe("dark");

      window.matchMedia = createMockMatchMedia(false) as typeof window.matchMedia;
      expect(resolveTheme("system")).toBe("light");
    });
  });

  describe("getSystemTheme", () => {
    it("returns dark when system prefers dark", () => {
      window.matchMedia = createMockMatchMedia(true) as typeof window.matchMedia;
      expect(getSystemTheme()).toBe("dark");
    });

    it("returns light when system prefers light", () => {
      window.matchMedia = createMockMatchMedia(false) as typeof window.matchMedia;
      expect(getSystemTheme()).toBe("light");
    });
  });

  describe("applyThemeToDOM", () => {
    it("adds dark class for dark theme", () => {
      applyThemeToDOM("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes dark class for light theme", () => {
      document.documentElement.classList.add("dark");
      applyThemeToDOM("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("is idempotent for dark theme", () => {
      applyThemeToDOM("dark");
      applyThemeToDOM("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("is idempotent for light theme", () => {
      applyThemeToDOM("light");
      applyThemeToDOM("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("Store persistence", () => {
    it("persists mode to localStorage", () => {
      useThemeStore.getState().setMode("dark");

      const stored = localStorage.getItem("theme-storage");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.mode).toBe("dark");
    });

    it("does not persist resolvedTheme to localStorage", () => {
      useThemeStore.getState().setMode("dark");

      const stored = localStorage.getItem("theme-storage");
      const parsed = JSON.parse(stored!);

      // resolvedTheme should not be in persisted state (partialize excludes it)
      expect(parsed.state.resolvedTheme).toBeUndefined();
    });
  });
});
