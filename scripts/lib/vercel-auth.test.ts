import { describe, expect, it } from "vitest";
import { isVercelClassicTokenRequired, parseVercelTokenAddJson } from "./vercel-auth";
import { vercelGitNamespaceId } from "./vercel-git";
import type { VercelGitNamespace } from "./vercel-api";

describe("parseVercelTokenAddJson", () => {
  it("reads bearerToken from JSON", () => {
    expect(parseVercelTokenAddJson(JSON.stringify({ bearerToken: "tok_abc" }))).toBe("tok_abc");
  });
});

describe("isVercelClassicTokenRequired", () => {
  it("detects OAuth-only session errors", () => {
    expect(isVercelClassicTokenRequired("classic personal access token required")).toBe(true);
  });
});

describe("vercelGitNamespaceId", () => {
  it("falls back to installationId", () => {
    const ns: VercelGitNamespace = {
      slug: "PeterHewat",
      provider: "github",
      installationId: 12345,
    };
    expect(vercelGitNamespaceId(ns)).toBe(12345);
  });
});
