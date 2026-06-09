import { describe, expect, test } from "bun:test";
import {
  isVercelCustomEnvironmentLimitError,
  isVercelGitIntegrationError,
  isVercelGitLoginConnectionError,
  isVercelInstallGitHubAppError,
  mergeVercelProjectEnvironments,
  parseVercelApiErrorDetails,
  resolveVercelEnvironmentId,
  VERCEL_PRE_RELEASE_ENV_SLUG,
  VercelApiError,
  type VercelProjectDetails,
} from "./vercel-api";

const project: VercelProjectDetails = {
  id: "prj_test",
  name: "foobar-web",
  customEnvironments: [
    { id: "env_prod", slug: "production", type: "production" },
    { id: "env_prev", slug: "preview", type: "preview" },
    { id: "env_dev", slug: "development", type: "development" },
  ],
};

describe("resolveVercelEnvironmentId", () => {
  test("returns preview environment id", () => {
    expect(resolveVercelEnvironmentId(project, "preview")).toBe("env_prev");
  });

  test("prefers built-in preview over pre-release custom environment", () => {
    const withPreRelease: VercelProjectDetails = {
      ...project,
      customEnvironments: [
        ...(project.customEnvironments ?? []),
        { id: "env_prerelease", slug: VERCEL_PRE_RELEASE_ENV_SLUG, type: "custom" },
      ],
    };
    expect(resolveVercelEnvironmentId(withPreRelease, "preview")).toBe("env_prev");
  });

  test("falls back to pre-release when built-in preview is missing", () => {
    const preReleaseOnly: VercelProjectDetails = {
      id: "prj_test",
      name: "foobar-web",
      customEnvironments: [
        { id: "env_prod", slug: "production", type: "production" },
        { id: "env_prerelease", slug: VERCEL_PRE_RELEASE_ENV_SLUG, type: "custom" },
      ],
    };
    expect(resolveVercelEnvironmentId(preReleaseOnly, "preview")).toBe("env_prerelease");
  });

  test("returns production environment id", () => {
    expect(resolveVercelEnvironmentId(project, "production")).toBe("env_prod");
  });
});

describe("parseVercelApiErrorDetails", () => {
  test("extracts action and link from Git login connection errors", () => {
    const err = new VercelApiError(
      "failed",
      400,
      JSON.stringify({
        error: {
          code: "bad_request",
          message:
            "Failed to link PeterHewat/Reactor. You need to add a Login Connection to your GitHub account first.",
          action: "Add a Login Connection",
          link: "https://vercel.com/account/login-connections",
        },
      }),
    );
    const details = parseVercelApiErrorDetails(err);
    expect(details.action).toBe("Add a Login Connection");
    expect(details.link).toBe("https://vercel.com/account/login-connections");
    expect(isVercelGitLoginConnectionError(err)).toBe(true);
    expect(isVercelGitIntegrationError(err)).toBe(true);
    expect(isVercelInstallGitHubAppError(err)).toBe(false);
  });

  test("detects Install GitHub App errors", () => {
    const err = new VercelApiError(
      "failed",
      400,
      JSON.stringify({
        error: {
          code: "repo_not_found",
          message: "To link a GitHub repository, you need to install the GitHub integration first.",
          action: "Install GitHub App",
          link: "https://github.com/apps/vercel",
        },
      }),
    );
    expect(isVercelInstallGitHubAppError(err)).toBe(true);
    expect(isVercelGitIntegrationError(err)).toBe(true);
  });
});

describe("isVercelCustomEnvironmentLimitError", () => {
  test("detects Hobby plan custom environment limit", () => {
    const err = new VercelApiError(
      "failed",
      403,
      '{"error":{"message":"Cannot create more than 0 custom environments."}}',
    );
    expect(isVercelCustomEnvironmentLimitError(err)).toBe(true);
  });
});

describe("mergeVercelProjectEnvironments", () => {
  test("prefers environments from custom-environments API", () => {
    const merged = mergeVercelProjectEnvironments(
      { id: "prj_x", name: "web" },
      project.customEnvironments!,
    );
    expect(resolveVercelEnvironmentId(merged, "preview")).toBe("env_prev");
  });
});
