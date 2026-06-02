import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMarketingEnv } from "./env";

describe("loadMarketingEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns repo URL when set", () => {
    vi.stubEnv("PUBLIC_REPO_URL", "https://github.com/acme/app");
    expect(loadMarketingEnv().repoUrl).toBe("https://github.com/acme/app");
  });

  it("does not throw when PUBLIC_REPO_URL is missing", () => {
    vi.stubEnv("PUBLIC_REPO_URL", "");
    expect(loadMarketingEnv().repoUrl).toBeUndefined();
  });

  it("returns default branch when set", () => {
    vi.stubEnv("PUBLIC_REPO_DEFAULT_BRANCH", "develop");
    expect(loadMarketingEnv().repoDefaultBranch).toBe("develop");
  });
});
