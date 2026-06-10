import { describe, expect, it } from "vitest";
import { formatCliAuthStatus, mergeCaptureOutput, parseCliVersion } from "./setup-cli";

describe("mergeCaptureOutput", () => {
  it("merges stderr when stdout is empty (convex login status)", () => {
    expect(
      mergeCaptureOutput({
        stdout: "",
        stderr: "Status: Logged in\nTeams: 1 team accessible",
      }),
    ).toContain("Logged in");
  });
});

describe("formatCliAuthStatus", () => {
  it("emphasizes missing login", () => {
    expect(formatCliAuthStatus(false)).toBe("NOT logged in");
    expect(formatCliAuthStatus(true)).toBe("logged in");
  });
});

describe("parseCliVersion", () => {
  it("parses gh version output", () => {
    expect(parseCliVersion("gh version 2.93.0 (2026-05-27)\nhttps://github.com/cli/cli")).toBe(
      "2.93.0",
    );
  });

  it("parses Vercel CLI output", () => {
    expect(parseCliVersion("Vercel CLI 54.11.0 (Node.js 24.16.0)")).toBe("54.11.0");
  });

  it("parses a bare semver line", () => {
    expect(parseCliVersion("1.40.0")).toBe("1.40.0");
  });

  it("parses Clerk CLI output", () => {
    expect(parseCliVersion("clerk 0.9.2")).toBe("0.9.2");
  });

  it("returns undefined for empty output", () => {
    expect(parseCliVersion("")).toBeUndefined();
    expect(parseCliVersion("   ")).toBeUndefined();
  });
});
