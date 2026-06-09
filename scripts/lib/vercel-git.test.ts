import { describe, expect, test } from "bun:test";
import { hasVercelGitNamespaceForOrg, vercelSearchIncludesRepo } from "./vercel-git";
import type { GitHubRepo } from "./repo-identity";
import type { VercelGitNamespace } from "./vercel-api";

const github: GitHubRepo = {
  org: "PeterHewat",
  repo: "Reactor",
  repoUrl: "https://github.com/PeterHewat/Reactor",
};

const namespaces: VercelGitNamespace[] = [
  { slug: "PeterHewat", provider: "github", installationId: 1 },
  { slug: "acme-corp", provider: "github", installationId: 2 },
];

describe("hasVercelGitNamespaceForOrg", () => {
  test("matches owner slug case-insensitively", () => {
    expect(hasVercelGitNamespaceForOrg(namespaces, "peterhewat")).toBe(true);
    expect(hasVercelGitNamespaceForOrg(namespaces, "PeterHewat")).toBe(true);
  });

  test("returns false when org is missing", () => {
    expect(hasVercelGitNamespaceForOrg(namespaces, "other-org")).toBe(false);
    expect(hasVercelGitNamespaceForOrg([], "PeterHewat")).toBe(false);
  });
});

describe("vercelSearchIncludesRepo", () => {
  test("matches owner and slug fields", () => {
    expect(vercelSearchIncludesRepo([{ owner: "PeterHewat", slug: "Reactor" }], github)).toBe(true);
  });

  test("matches full path in slug", () => {
    expect(vercelSearchIncludesRepo([{ slug: "PeterHewat/Reactor" }], github)).toBe(true);
  });

  test("returns false when repo is missing", () => {
    expect(vercelSearchIncludesRepo([{ owner: "PeterHewat", slug: "Other" }], github)).toBe(false);
  });
});
