import { afterEach, describe, expect, it, vi } from "vitest";
import { loadWebEnv, requireWebEnv } from "./env";

describe("loadWebEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns convex URL when set", () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://test-project.convex.cloud");
    expect(loadWebEnv().convexUrl).toBe("https://test-project.convex.cloud");
  });

  it("does not throw when VITE_CONVEX_URL is missing", () => {
    vi.stubEnv("VITE_CONVEX_URL", "");
    expect(loadWebEnv().convexUrl).toBeUndefined();
  });
});

describe("requireWebEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns convex URL when set", () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://test-project.convex.cloud");
    expect(requireWebEnv().convexUrl).toBe("https://test-project.convex.cloud");
  });

  it("throws when VITE_CONVEX_URL is missing", () => {
    vi.stubEnv("VITE_CONVEX_URL", "");
    expect(() => requireWebEnv()).toThrow("Missing required environment variable: VITE_CONVEX_URL");
  });
});
