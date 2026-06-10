import { describe, expect, it } from "vitest";
import { hasGhActionsScopes, parseGhTokenScopes } from "./gh-secrets";

describe("parseGhTokenScopes", () => {
  it("parses scopes from gh auth status output", () => {
    expect(
      parseGhTokenScopes(
        "github.com\n  ✓ Logged in\n  - Token scopes: 'admin:public_key', 'gist', 'read:org', 'repo'",
      ),
    ).toEqual(["admin:public_key", "gist", "read:org", "repo"]);
  });

  it("returns empty array when scopes line is missing", () => {
    expect(parseGhTokenScopes("github.com\n  ✓ Logged in")).toEqual([]);
  });
});

describe("hasGhActionsScopes", () => {
  it("requires repo and workflow", () => {
    expect(hasGhActionsScopes(["repo", "workflow"])).toBe(true);
    expect(hasGhActionsScopes(["repo", "gist"])).toBe(false);
    expect(hasGhActionsScopes(["workflow"])).toBe(false);
  });
});
