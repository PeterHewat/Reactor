import { afterEach, describe, expect, it, vi } from "vitest";
import { getRepoUrl, repoSetupGuideUrl } from "./repo-url";

vi.mock("../env", () => ({
  loadWebEnv: vi.fn(),
}));

import { loadWebEnv } from "../env";

describe("repo-url", () => {
  afterEach(() => {
    vi.mocked(loadWebEnv).mockReset();
  });

  it("returns undefined for placeholder VITE_REPO_URL", () => {
    vi.mocked(loadWebEnv).mockReturnValue({
      repoUrl: "https://github.com/YOUR_ORG/YOUR_REPO",
    } as ReturnType<typeof loadWebEnv>);
    expect(getRepoUrl()).toBeUndefined();
    expect(repoSetupGuideUrl()).toBeUndefined();
  });

  it("builds README blob URL when configured", () => {
    vi.mocked(loadWebEnv).mockReturnValue({
      repoUrl: "https://github.com/acme/app",
    } as ReturnType<typeof loadWebEnv>);
    expect(repoSetupGuideUrl()).toBe("https://github.com/acme/app/blob/main/README.md");
  });
});
