import { vi } from "vitest";

/**
 * Mock implementation of matchMedia for testing.
 */
export interface MockMatchMedia {
  /** The current matches value */
  matches: boolean;
  /** The media query string */
  media: string;
  /** Callback for deprecated addListener */
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;
  /** Add event listener */
  addEventListener: ReturnType<typeof vi.fn>;
  /** Remove event listener */
  removeEventListener: ReturnType<typeof vi.fn>;
  /** Deprecated: Add listener */
  addListener: ReturnType<typeof vi.fn>;
  /** Deprecated: Remove listener */
  removeListener: ReturnType<typeof vi.fn>;
  /** Dispatch event */
  dispatchEvent: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock matchMedia function.
 *
 * @param defaultMatches - Whether the media query should match by default
 * @returns A mock matchMedia function
 *
 * @example
 * // Mock dark mode preference
 * const mockMM = mockMatchMedia(true);
 * window.matchMedia = mockMM;
 *
 * // Now window.matchMedia("(prefers-color-scheme: dark)").matches === true
 */
export function mockMatchMedia(defaultMatches = false): (query: string) => MockMatchMedia {
  return (query: string): MockMatchMedia => ({
    matches: defaultMatches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    dispatchEvent: vi.fn(),
  });
}

/**
 * Setup matchMedia mock on the window object.
 * Call this in your test setup file (setupTests.ts).
 *
 * @param defaultMatches - Whether the media query should match by default
 *
 * @example
 * // In setupTests.ts
 * import { setupMatchMedia } from "@repo/test-utils";
 *
 * setupMatchMedia();
 */
export function setupMatchMedia(defaultMatches = false): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia(defaultMatches),
  });
}
