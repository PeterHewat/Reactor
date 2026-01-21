import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyThemeToDOM,
  getSystemTheme,
  resolveTheme,
  useThemeStore,
  type ResolvedTheme,
  type ThemeMode,
} from "./theme";

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe("theme utilities", () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({ mode: "system", resolvedTheme: "light" });
    // Clear localStorage
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSystemTheme", () => {
    it("returns dark when system prefers dark", () => {
      mockMatchMedia(true);
      expect(getSystemTheme()).toBe("dark");
    });

    it("returns light when system prefers light", () => {
      mockMatchMedia(false);
      expect(getSystemTheme()).toBe("light");
    });
  });

  describe("resolveTheme", () => {
    it("returns light for light mode", () => {
      expect(resolveTheme("light")).toBe("light");
    });

    it("returns dark for dark mode", () => {
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("returns system preference for system mode", () => {
      mockMatchMedia(true);
      expect(resolveTheme("system")).toBe("dark");

      mockMatchMedia(false);
      expect(resolveTheme("system")).toBe("light");
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
  });

  describe("useThemeStore", () => {
    it("has default mode of system", () => {
      expect(useThemeStore.getState().mode).toBe("system");
    });

    it("setMode updates mode and resolvedTheme", () => {
      useThemeStore.getState().setMode("dark");
      expect(useThemeStore.getState().mode).toBe("dark");
      expect(useThemeStore.getState().resolvedTheme).toBe("dark");
    });

    it("setMode applies theme to DOM", () => {
      useThemeStore.getState().setMode("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      useThemeStore.getState().setMode("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("updateResolvedTheme updates based on current mode", () => {
      mockMatchMedia(true); // System prefers dark
      useThemeStore.getState().setMode("system");
      useThemeStore.getState().updateResolvedTheme();
      expect(useThemeStore.getState().resolvedTheme).toBe("dark");
    });

    it("cycles through all theme modes", () => {
      const modes: ThemeMode[] = ["light", "dark", "system"];
      const expectedResolved: ResolvedTheme[] = ["light", "dark", "light"];

      mockMatchMedia(false); // System prefers light

      modes.forEach((mode, index) => {
        useThemeStore.getState().setMode(mode);
        expect(useThemeStore.getState().mode).toBe(mode);
        expect(useThemeStore.getState().resolvedTheme).toBe(expectedResolved[index]);
      });
    });
  });

  describe("persistence", () => {
    it("persists mode to localStorage", () => {
      useThemeStore.getState().setMode("dark");

      // Check localStorage
      const stored = localStorage.getItem("theme");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored ?? "{}");
      expect(parsed.state.mode).toBe("dark");
    });

    it("does not persist resolvedTheme to localStorage", () => {
      useThemeStore.getState().setMode("dark");

      const stored = localStorage.getItem("theme");
      const parsed = JSON.parse(stored ?? "{}");
      // resolvedTheme should not be in storage (partialize excludes it)
      expect(parsed.state.resolvedTheme).toBeUndefined();
    });
  });
});
