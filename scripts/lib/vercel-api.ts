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

export type VercelDomainConfig = {
  configuredBy?: string | null;
  misconfigured?: boolean;
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
export async function listVercelProjects(token: string, teamId?: string): Promise<VercelProject[]> {
  const { projects } = await vercelRequest<{ projects: VercelProject[] }>(token, "/v9/projects", {
    teamId,
  });
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
): Promise<VercelProject | null> {
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
): Promise<VercelProject> {
  const { id, name } = await vercelRequest<{ id: string; name: string }>(token, "/v11/projects", {
    method: "POST",
    teamId,
    body: {
      name: input.name,
      rootDirectory: input.rootDirectory,
      framework: input.framework ?? null,
      installCommand: input.installCommand,
      buildCommand: input.buildCommand,
      outputDirectory: input.outputDirectory,
      sourceFilesOutsideRootDirectory: true,
      gitRepository: input.gitRepository,
    },
  });
  return { id, name, rootDirectory: input.rootDirectory };
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
 * Adds a custom domain to a Vercel project.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Project ID
 * @param domain - Hostname to add
 */
export async function addVercelProjectDomain(
  token: string,
  teamId: string | undefined,
  projectId: string,
  domain: string,
): Promise<void> {
  await vercelRequest(token, `/v10/projects/${projectId}/domains`, {
    method: "POST",
    teamId,
    body: { name: domain },
  });
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
