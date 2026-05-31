import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicRepoUrl, repoSetupGuideUrl } from "./repo-url";

describe("repo-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined for placeholder PUBLIC_REPO_URL", () => {
    vi.stubEnv("PUBLIC_REPO_URL", "https://github.com/YOUR_ORG/YOUR_REPO");
    expect(getPublicRepoUrl()).toBeUndefined();
    expect(repoSetupGuideUrl()).toBeUndefined();
  });

  it("builds README blob URL when configured", () => {
    vi.stubEnv("PUBLIC_REPO_URL", "https://github.com/acme/app/");
    expect(repoSetupGuideUrl()).toBe("https://github.com/acme/app/blob/main/README.md");
  });
});
