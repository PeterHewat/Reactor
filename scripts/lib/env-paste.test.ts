import { describe, expect, it } from "vitest";
import { normalizeEnvPaste } from "./env-paste";

describe("normalizeEnvPaste", () => {
  it("strips a matching KEY= prefix (case-insensitive)", () => {
    expect(
      normalizeEnvPaste("VITE_CLERK_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY=the-value"),
    ).toBe("the-value");
    expect(
      normalizeEnvPaste("VITE_CLERK_PUBLISHABLE_KEY", "vite_clerk_publishable_key=the-value"),
    ).toBe("the-value");
  });

  it("returns the value unchanged when no prefix is present", () => {
    expect(normalizeEnvPaste("VITE_CONVEX_URL", "https://foo.convex.cloud")).toBe(
      "https://foo.convex.cloud",
    );
  });
});
