import { describe, expect, it } from "vitest";
import {
  normalizeRepoDefaultBranch,
  normalizeRepoUrl,
  repoBlobUrl,
  repoSetupGuideUrl,
} from "./repo-url";

describe("normalizeRepoUrl", () => {
  it("rejects placeholders", () => {
    expect(normalizeRepoUrl("https://github.com/YOUR_ORG/YOUR_REPO")).toBeUndefined();
  });

  it("normalizes trailing slash", () => {
    expect(normalizeRepoUrl("https://github.com/acme/app/")).toBe("https://github.com/acme/app");
  });
});

describe("repoBlobUrl", () => {
  it("uses custom default branch", () => {
    expect(repoBlobUrl("https://github.com/acme/app", "README.md", "develop")).toBe(
      "https://github.com/acme/app/blob/develop/README.md",
    );
  });
});

describe("repoSetupGuideUrl", () => {
  it("points at README on main by default", () => {
    expect(repoSetupGuideUrl("https://github.com/acme/app")).toContain("/blob/main/README.md");
  });
});

describe("normalizeRepoDefaultBranch", () => {
  it("falls back to main", () => {
    expect(normalizeRepoDefaultBranch(undefined)).toBe("main");
  });
});
