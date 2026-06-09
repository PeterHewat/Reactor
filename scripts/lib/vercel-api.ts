const VERCEL_API = "https://api.vercel.com";

export type VercelAuthContext = {
  teamId: string | undefined;
  userId: string;
};

export type VercelProject = {
  id: string;
  name: string;
  rootDirectory?: string | null;
};

export type VercelDeploymentTarget = "production" | "preview";

export type VercelProjectEnvironment = {
  id: string;
  slug: string;
  type: "production" | "preview" | "development" | "custom";
};

/** Custom environment slug for `preview.*` hostnames when the project has no Git link. */
export const VERCEL_PRE_RELEASE_ENV_SLUG = "pre-release";

export type VercelProjectDetails = {
  id: string;
  name: string;
  customEnvironments?: VercelProjectEnvironment[];
};

export type VercelProjectDomain = {
  name: string;
  customEnvironmentId?: string | null;
};

export type VercelDomainConfig = {
  configuredBy?: string | null;
  misconfigured?: boolean;
  recommendedIPv4?: Array<{ rank: number; value: string[] }>;
  recommendedCNAME?: Array<{ rank: number; value: string }>;
};

export type CreateVercelProjectInput = {
  name: string;
  rootDirectory: string;
  framework?: string | null;
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  gitRepository?: { type: "github"; repo: string };
};

/**
 * Error from a failed Vercel REST API call.
 */
export class VercelApiError extends Error {
  /** HTTP status from Vercel. */
  readonly status: number;
  /** Raw response body. */
  readonly body: string;

  /**
   * @param message - Short error label
   * @param status - HTTP status
   * @param body - Response body text
   */
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Extracts a short human-readable message from a Vercel API error body.
 *
 * @param err - Failed Vercel API response
 */
/**
 * Whether Vercel rejected creating a custom environment due to plan limits (Hobby = 0).
 *
 * @param err - Failed Vercel API response
 */
export function isVercelCustomEnvironmentLimitError(err: VercelApiError): boolean {
  const message = formatVercelApiError(err).toLowerCase();
  return message.includes("cannot create more than 0 custom environments");
}

export function formatVercelApiError(err: VercelApiError): string {
  try {
    const parsed = JSON.parse(err.body) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    if (message) {
      return message;
    }
  } catch {
    // use message or raw body below
  }
  if (err.message && !err.message.startsWith("Vercel API ")) {
    return err.message;
  }
  return err.body.slice(0, 200);
}

/**
 * Performs an authenticated request to the Vercel API.
 *
 * @param token - Vercel API token
 * @param path - API path (e.g. `/v9/projects`)
 * @param options - Method, JSON body, optional team scope
 */
async function vercelRequest<T>(
  token: string,
  path: string,
  options?: { method?: string; body?: unknown; teamId?: string },
): Promise<T> {
  const url = new URL(path, VERCEL_API);
  if (options?.teamId) {
    url.searchParams.set("teamId", options.teamId);
  }
  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new VercelApiError(`Vercel API ${path} failed (${res.status})`, res.status, text);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/**
 * Resolves the Vercel user and preferred team scope for API calls.
 *
 * @param token - Vercel API token
 */
export async function getVercelAuthContext(token: string): Promise<VercelAuthContext> {
  const { user } = await vercelRequest<{ user: { id: string; defaultTeamId?: string } }>(
    token,
    "/v2/user",
  );
  return {
    userId: user.id,
    teamId: user.defaultTeamId,
  };
}

/**
 * Lists Vercel projects visible to the token.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 */
export async function listVercelProjects(
  token: string,
  teamId?: string,
): Promise<VercelProjectDetails[]> {
  const { projects } = await vercelRequest<{ projects: VercelProjectDetails[] }>(
    token,
    "/v9/projects",
    { teamId },
  );
  return projects ?? [];
}

/**
 * Finds a project by exact name.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param name - Project name
 */
export async function findVercelProjectByName(
  token: string,
  teamId: string | undefined,
  name: string,
): Promise<VercelProjectDetails | null> {
  const projects = await listVercelProjects(token, teamId);
  return projects.find((p) => p.name === name) ?? null;
}

/**
 * Creates a Vercel project (monorepo subdirectory).
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param input - Project configuration
 */
export async function createVercelProject(
  token: string,
  teamId: string | undefined,
  input: CreateVercelProjectInput,
): Promise<VercelProjectDetails> {
  const created = await vercelRequest<VercelProjectDetails>(token, "/v11/projects", {
    method: "POST",
    teamId,
    body: {
      name: input.name,
      rootDirectory: input.rootDirectory,
      framework: input.framework ?? null,
      installCommand: input.installCommand,
      buildCommand: input.buildCommand,
      outputDirectory: input.outputDirectory,
      ...(input.gitRepository ? { gitRepository: input.gitRepository } : {}),
    },
  });
  return {
    id: created.id,
    name: created.name,
    customEnvironments: created.customEnvironments,
  };
}

/**
 * Upserts one encrypted environment variable on a project.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param key - Variable name
 * @param value - Variable value
 * @param targets - Deployment targets
 */
export async function upsertVercelProjectEnv(
  token: string,
  teamId: string | undefined,
  projectId: string,
  key: string,
  value: string,
  targets: Array<"production" | "preview" | "development">,
): Promise<void> {
  await vercelRequest(token, `/v10/projects/${projectId}/env?upsert=true`, {
    method: "POST",
    teamId,
    body: {
      key,
      value,
      type: "encrypted",
      target: targets,
    },
  });
}

/**
 * Resolves the Vercel environment id for production or preview deployments.
 *
 * @param project - Project payload including `customEnvironments`
 * @param target - Deployment target
 */
export function resolveVercelEnvironmentId(
  project: VercelProjectDetails,
  target: VercelDeploymentTarget,
): string | undefined {
  if (target === "preview") {
    return (
      project.customEnvironments?.find((env) => env.type === "preview")?.id ??
      project.customEnvironments?.find((env) => env.slug === VERCEL_PRE_RELEASE_ENV_SLUG)?.id
    );
  }
  return project.customEnvironments?.find((env) => env.type === target)?.id;
}

/**
 * Ensures a branchless custom environment for `preview.*` domains (GitHub Actions deploys).
 *
 * Built-in Preview is not returned by `/custom-environments` and the dashboard ties it to Git
 * branches — this env is created without `branchMatcher` for `vercel deploy --target=pre-release`.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 */
export async function ensurePreReleaseEnvironment(
  token: string,
  teamId: string | undefined,
  projectId: string,
): Promise<VercelProjectEnvironment> {
  const environments = await listVercelProjectEnvironments(token, teamId, projectId);
  const existing = environments.find((env) => env.slug === VERCEL_PRE_RELEASE_ENV_SLUG);
  if (existing) {
    return existing;
  }

  const created = await vercelRequest<{ id: string; slug: string; type?: string }>(
    token,
    `/v9/projects/${projectId}/custom-environments`,
    {
      method: "POST",
      teamId,
      body: {
        slug: VERCEL_PRE_RELEASE_ENV_SLUG,
        description: "Pre-release hostnames (preview-* tags via GitHub Actions, no Git link)",
        copyEnvVarsFrom: "preview",
      },
    },
  );

  return {
    id: created.id,
    slug: created.slug ?? VERCEL_PRE_RELEASE_ENV_SLUG,
    type: "custom",
  };
}

/**
 * Merges environment metadata from `/custom-environments` into project details.
 *
 * @param hint - Partial project payload
 * @param environments - Environments from the Vercel API (includes built-in Preview)
 */
export function mergeVercelProjectEnvironments(
  hint: VercelProjectDetails,
  environments: VercelProjectEnvironment[],
): VercelProjectDetails {
  return {
    id: hint.id,
    name: hint.name,
    customEnvironments: environments.length > 0 ? environments : hint.customEnvironments,
  };
}

/**
 * Lists project environments (Production, Preview, Development, and any custom envs).
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 */
export async function listVercelProjectEnvironments(
  token: string,
  teamId: string | undefined,
  projectId: string,
): Promise<VercelProjectEnvironment[]> {
  const { environments } = await vercelRequest<{ environments: VercelProjectEnvironment[] }>(
    token,
    `/v9/projects/${projectId}/custom-environments`,
    { teamId },
  );
  return environments ?? [];
}

/**
 * Returns project details with environment ids when the caller only has a partial payload.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param hint - Known project id/name; may already include `customEnvironments`
 */
export async function loadVercelProjectDetails(
  token: string,
  teamId: string | undefined,
  hint: VercelProjectDetails,
): Promise<VercelProjectDetails> {
  if (resolveVercelEnvironmentId(hint, "preview")) {
    return hint;
  }
  const environments = await listVercelProjectEnvironments(token, teamId, hint.id);
  return mergeVercelProjectEnvironments(hint, environments);
}

/**
 * Fetches one Vercel project with environment ids from `/custom-environments`.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 */
export async function getVercelProject(
  token: string,
  teamId: string | undefined,
  projectId: string,
): Promise<VercelProjectDetails> {
  const direct = await vercelRequest<VercelProjectDetails>(token, `/v9/projects/${projectId}`, {
    teamId,
  });
  const environments = await listVercelProjectEnvironments(token, teamId, projectId);
  return mergeVercelProjectEnvironments(
    {
      id: direct.id ?? projectId,
      name: direct.name ?? projectId,
      customEnvironments: direct.customEnvironments,
    },
    environments,
  );
}

/**
 * Reads one domain on a project.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname
 */
export async function getVercelProjectDomain(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domain: string,
): Promise<VercelProjectDomain> {
  return vercelRequest<VercelProjectDomain>(
    token,
    `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`,
    { teamId },
  );
}

/**
 * Removes a domain from a project.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname
 */
export async function removeVercelProjectDomain(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domain: string,
): Promise<void> {
  await vercelRequest(token, `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE",
    teamId,
  });
}

export type VercelProjectDomainOptions = {
  /** Preview or custom environment id; omit for Production */
  customEnvironmentId?: string;
  /** Preview branch for staging hostnames (e.g. `main`) */
  gitBranch?: string;
};

/**
 * Adds a custom domain to a Vercel project.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname to add
 * @param options - Production, preview environment, or git branch assignment
 */
export async function addVercelProjectDomain(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domain: string,
  options?: VercelProjectDomainOptions,
): Promise<void> {
  await vercelRequest(token, `/v10/projects/${projectId}/domains`, {
    method: "POST",
    teamId,
    body: {
      name: domain,
      ...(options?.customEnvironmentId ? { customEnvironmentId: options.customEnvironmentId } : {}),
      ...(options?.gitBranch ? { gitBranch: options.gitBranch } : {}),
    },
  });
}

/**
 * Adds a domain on the correct Vercel environment, reassigning when already attached elsewhere.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname
 * @param target - Production or Preview
 * @param project - Optional cached project payload
 */
/** Git branch that receives staging (preview.*) deploys when Production Branch is not `main`. */
export const VERCEL_STAGING_GIT_BRANCH = "main";

/**
 * Adds a domain on the correct Vercel environment, reassigning when already attached elsewhere.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname
 * @param target - Production or Preview (staging hostnames use git branch `main`)
 * @param project - Optional cached project payload
 */
export async function ensureVercelProjectDomain(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domain: string,
  target: VercelDeploymentTarget,
  _project?: VercelProjectDetails,
): Promise<void> {
  const domainOptions: VercelProjectDomainOptions | undefined =
    target === "preview" ? { gitBranch: VERCEL_STAGING_GIT_BRANCH } : undefined;

  try {
    await addVercelProjectDomain(token, teamId, projectId, domain, domainOptions);
    return;
  } catch (err) {
    if (!(err instanceof VercelApiError) || (err.status !== 400 && err.status !== 409)) {
      throw err;
    }
  }

  await removeVercelProjectDomain(token, teamId, projectId, domain);
  await addVercelProjectDomain(token, teamId, projectId, domain, domainOptions);
}

/**
 * Fetches DNS configuration hints for a domain.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param domain - Apex or subdomain hostname
 */
export async function getVercelDomainConfig(
  token: string,
  teamId: string | undefined,
  domain: string,
): Promise<VercelDomainConfig> {
  return vercelRequest<VercelDomainConfig>(token, `/v6/domains/${domain}/config`, { teamId });
}

/**
 * Returns the org ID stored in GitHub secrets (`VERCEL_ORG_ID`).
 *
 * @param auth - Resolved auth context
 */
export function vercelOrgId(auth: VercelAuthContext): string {
  return auth.teamId ?? auth.userId;
}
