/* eslint-disable no-console -- CLI wizard */
import { printManualAction } from "./manual-action";
import { VERCEL_GITHUB_APP, VERCEL_LOGIN_CONNECTIONS } from "./platform-urls";
import type { GitHubRepo } from "./repo-identity";
import {
  formatVercelApiError,
  isVercelGitIntegrationError,
  isVercelInstallGitHubAppError,
  linkVercelProjectGit,
  listVercelGitNamespaces,
  parseVercelApiErrorDetails,
  searchVercelGitRepos,
  VercelApiError,
  type VercelGitNamespace,
  type VercelGitRepoSearchItem,
} from "./vercel-api";

/**
 * Normalizes Vercel `search-repo` owner fields (string or `{ name }` object).
 *
 * @param item - Repo search result from Vercel
 */
function vercelRepoOwnerSlug(item: VercelGitRepoSearchItem): string {
  const owner = item.owner;
  if (typeof owner === "string") {
    return owner;
  }
  if (owner && typeof owner === "object" && typeof owner.name === "string") {
    return owner.name;
  }
  if (typeof item.org === "string") {
    return item.org;
  }
  if (typeof item.namespace === "string") {
    return item.namespace;
  }
  return "";
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const GITHUB_APP_PROMPT_MS = 15_000;

/**
 * Returns whether a Git namespace list includes the repository owner org/user.
 *
 * @param namespaces - Namespaces from `listVercelGitNamespaces`
 * @param org - GitHub owner slug from `git remote`
 */
export function hasVercelGitNamespaceForOrg(
  namespaces: VercelGitNamespace[],
  org: string,
): boolean {
  const want = org.toLowerCase();
  return namespaces.some((ns) => ns.slug.toLowerCase() === want);
}

/**
 * Returns whether a Vercel repo search result includes the target repository.
 *
 * @param items - Repos from `searchVercelGitRepos`
 * @param github - Parsed GitHub remote
 */
export function vercelSearchIncludesRepo(
  items: VercelGitRepoSearchItem[],
  github: GitHubRepo,
): boolean {
  const repoLower = github.repo.toLowerCase();
  const orgLower = github.org.toLowerCase();
  const fullPath = `${orgLower}/${repoLower}`;

  return items.some((item) => {
    if (item.url) {
      const fromUrl = item.url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
      if (fromUrl) {
        const org = fromUrl[1]!.toLowerCase();
        const repo = fromUrl[2]!.replace(/\.git$/i, "").toLowerCase();
        if (org === orgLower && repo === repoLower) {
          return true;
        }
      }
    }

    const slug = (item.slug ?? item.name ?? "").toLowerCase();
    const owner = vercelRepoOwnerSlug(item).toLowerCase();
    if (owner && slug && !slug.includes("/")) {
      return owner === orgLower && slug === repoLower;
    }
    const path = slug.includes("/") ? slug : owner ? `${owner}/${slug}` : slug;
    return path === fullPath || path.endsWith(`/${repoLower}`);
  });
}

/**
 * Namespace id for `search-repo` — API may return `id` or `installationId`.
 *
 * @param ns - Git namespace from Vercel
 */
export function vercelGitNamespaceId(ns: VercelGitNamespace): string | number | undefined {
  return ns.id ?? ns.installationId;
}

export type VercelGitHubAccessState =
  | "ready"
  | "needs_login"
  | "needs_app_install"
  | "needs_repo_access";

/**
 * Diagnoses why Vercel cannot see a GitHub repository yet.
 *
 * @param token - Vercel API token
 * @param github - Parsed GitHub remote
 */
export async function diagnoseVercelGitHubAccess(
  token: string,
  github: GitHubRepo,
): Promise<VercelGitHubAccessState> {
  if (await canVercelAccessGitHubRepo(token, github)) {
    return "ready";
  }

  const namespaces = await listVercelGitNamespaces(token);
  if (!hasVercelGitNamespaceForOrg(namespaces, github.org)) {
    return "needs_login";
  }

  return "needs_repo_access";
}

/**
 * GitHub settings URL to grant the Vercel app access to repositories.
 *
 * @param github - Parsed GitHub remote
 */
export function githubVercelAppRepositoryAccessUrl(_github: GitHubRepo): string {
  return `https://github.com/settings/installations`;
}

export async function canVercelAccessGitHubRepo(
  token: string,
  github: GitHubRepo,
): Promise<boolean> {
  const namespaces = await listVercelGitNamespaces(token);

  for (const ns of namespaces) {
    const namespaceId = vercelGitNamespaceId(ns);
    if (namespaceId === undefined) {
      continue;
    }
    try {
      const repos = await searchVercelGitRepos(token, {
        query: github.repo,
        namespaceId,
      });
      if (vercelSearchIncludesRepo(repos, github)) {
        return true;
      }
    } catch {
      // namespace not searchable yet
    }
  }

  for (const query of [github.repo, `${github.org}/${github.repo}`]) {
    try {
      const repos = await searchVercelGitRepos(token, { query });
      if (vercelSearchIncludesRepo(repos, github)) {
        return true;
      }
    } catch {
      // integration not ready
    }
  }

  return false;
}

/**
 * Opens a URL in the default browser (best effort).
 *
 * @param url - HTTPS URL to open
 * @returns Whether a browser open command was launched successfully
 */
export async function openUrlInBrowser(url: string): Promise<boolean> {
  const commands: Array<[string, string[]]> =
    process.platform === "darwin"
      ? [["open", [url]]]
      : process.platform === "win32"
        ? [["cmd", ["/c", "start", "", url]]]
        : [["xdg-open", [url]]];

  for (const [cmd, args] of commands) {
    try {
      const proc = Bun.spawn([cmd, ...args], { stdout: "ignore", stderr: "ignore" });
      const code = await proc.exited;
      if (code === 0) {
        return true;
      }
    } catch {
      // try next launcher
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Prompts the user to complete a browser OAuth/install step and opens the URL when possible.
 *
 * @param title - ACTION REQUIRED heading
 * @param url - Dashboard or GitHub app URL
 */
async function promptBrowserAuth(title: string, url: string): Promise<void> {
  printManualAction(title, [
    `Open: ${url}`,
    "Complete authorization in the browser",
    "Return here — setup continues automatically when Vercel detects the connection",
  ]);
  const opened = await openUrlInBrowser(url);
  if (opened) {
    console.log("✓ Opened browser — complete the step, then wait…");
  } else {
    console.log(`  Open manually: ${url}`);
  }
}

/**
 * Polls until Vercel can access the target GitHub repository.
 *
 * @param token - Vercel API token
 * @param github - Parsed GitHub remote
 * @param options - Optional mid-wait callback (e.g. GitHub App install)
 * @returns Whether repo access appeared before timeout
 */
async function pollForGitRepoAccess(
  token: string,
  github: GitHubRepo,
  options?: { afterMs?: number; onMidWait?: () => Promise<void> },
): Promise<boolean> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const midAt = options?.afterMs ?? GITHUB_APP_PROMPT_MS;
  const started = Date.now();
  let midTriggered = false;
  let polls = 0;

  while (Date.now() < deadline) {
    if (!midTriggered && Date.now() - started >= midAt) {
      midTriggered = true;
      await options?.onMidWait?.();
    }

    if (await canVercelAccessGitHubRepo(token, github)) {
      console.log("");
      return true;
    }

    await sleep(POLL_INTERVAL_MS);
    polls += 1;
    if (polls % 10 === 0) {
      const elapsed = Math.round((Date.now() - started) / 1000);
      const state = await diagnoseVercelGitHubAccess(token, github);
      if (state === "needs_repo_access") {
        console.log(
          `\n  Still waiting (${elapsed}s) — Vercel is connected to GitHub but **${github.org}/${github.repo}** is not granted`,
        );
        console.log(
          `  Configure: ${githubVercelAppRepositoryAccessUrl(github)} → Vercel → Repository access → add **${github.repo}**`,
        );
      } else {
        console.log(
          `\n  Still waiting (${elapsed}s) — connect GitHub in Vercel **and** install the Vercel GitHub App`,
        );
      }
    } else {
      process.stdout.write(".");
    }
  }

  console.log("");
  return false;
}

/**
 * Ensures the Vercel account has GitHub connected for the repository owner org.
 *
 * @param token - Vercel API token
 * @param github - Parsed GitHub remote
 * @returns Whether GitHub is ready for API project linking
 */
export async function ensureVercelGitHubReady(token: string, github: GitHubRepo): Promise<boolean> {
  if (await canVercelAccessGitHubRepo(token, github)) {
    console.log(`✓ Vercel GitHub ready (${github.org}/${github.repo})`);
    return true;
  }

  await promptBrowserAuth("Connect GitHub to your Vercel account", VERCEL_LOGIN_CONNECTIONS);

  const ready = await pollForGitRepoAccess(token, github, {
    afterMs: GITHUB_APP_PROMPT_MS,
    onMidWait: async () => {
      console.log(
        "\n  Login connection alone is not enough — install the Vercel GitHub App for repo access",
      );
      await promptBrowserAuth(
        `Install the Vercel GitHub App, then grant access to ${github.repo}`,
        VERCEL_GITHUB_APP,
      );
      console.log(
        `  After install: ${githubVercelAppRepositoryAccessUrl(github)} → Vercel → Repository access → **${github.repo}**`,
      );
    },
  });

  if (ready) {
    console.log(`✓ Vercel GitHub ready (${github.org}/${github.repo})`);
    return true;
  }

  const state = await diagnoseVercelGitHubAccess(token, github);
  if (state === "needs_repo_access") {
    printManualAction(`Grant Vercel access to ${github.org}/${github.repo}`, [
      `Open: ${githubVercelAppRepositoryAccessUrl(github)}`,
      "Click **Configure** on the Vercel GitHub App",
      `Under Repository access, select **Only select repositories** and add **${github.repo}**`,
      "Re-run `bun run setup`",
    ]);
  } else {
    printManualAction("Vercel still cannot access your GitHub repository", [
      `Account → Login Connections: ${VERCEL_LOGIN_CONNECTIONS}`,
      `Install the Vercel GitHub App: ${VERCEL_GITHUB_APP}`,
      `Then grant access to **${github.org}/${github.repo}** via GitHub → Settings → Integrations → Applications`,
      "Re-run `bun run setup` after both steps",
    ]);
  }
  return false;
}

/**
 * Links a Vercel project to GitHub, guiding through GitHub App install when required.
 *
 * @param token - Vercel API token
 * @param teamId - Optional team scope
 * @param projectId - Vercel project ID
 * @param github - Parsed GitHub remote
 */
export async function linkVercelProjectToGitHub(
  token: string,
  teamId: string | undefined,
  projectId: string,
  github: GitHubRepo,
): Promise<void> {
  const repo = `${github.org}/${github.repo}`;

  const attemptLink = async (): Promise<void> => {
    await linkVercelProjectGit(token, teamId, projectId, repo);
  };

  try {
    await attemptLink();
    console.log(`✓ Linked GitHub ${repo} → project ${projectId}`);
    return;
  } catch (err) {
    if (!(err instanceof VercelApiError) || !isVercelInstallGitHubAppError(err)) {
      throw err;
    }
    const details = parseVercelApiErrorDetails(err);
    await promptBrowserAuth(
      "Install the Vercel GitHub App for this repository",
      details.link ?? VERCEL_GITHUB_APP,
    );
    if (!(await pollForGitRepoAccess(token, github))) {
      throw new VercelApiError(
        `Failed to link ${repo} after GitHub App install`,
        err.status,
        err.body,
      );
    }
    await attemptLink();
    console.log(`✓ Linked GitHub ${repo} → project ${projectId}`);
  }
}

/**
 * Whether an error from project create/link is a recoverable Git integration issue.
 *
 * @param err - Caught error from Vercel API
 */
export function isRecoverableVercelGitError(err: unknown): err is VercelApiError {
  return err instanceof VercelApiError && isVercelGitIntegrationError(err);
}

/**
 * Logs a short Vercel Git integration failure before a fallback path.
 *
 * @param err - Failed Vercel API response
 */
export function logVercelGitIntegrationWarning(err: VercelApiError): void {
  console.warn(`  ${formatVercelApiError(err)}`);
}
