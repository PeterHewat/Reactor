import { describe, expect, test } from "bun:test";
import {
  isVercelCustomEnvironmentLimitError,
  mergeVercelProjectEnvironments,
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
