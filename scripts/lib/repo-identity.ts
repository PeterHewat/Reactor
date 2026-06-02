/** Upstream template repository (GitHub "Use this template" source). */
export const TEMPLATE_UPSTREAM = { org: "PeterHewat", repo: "Reactor" } as const;

export const TEMPLATE_PRODUCT_NAME = "Reactor";
export const TEMPLATE_REPO_PLACEHOLDER = "https://github.com/YOUR_ORG/YOUR_REPO";
export const TEMPLATE_REPO_SLUG = `${TEMPLATE_UPSTREAM.org}/${TEMPLATE_UPSTREAM.repo}`;

export type GitHubRepo = {
  org: string;
  repo: string;
  repoUrl: string;
};

/**
 * Parses a GitHub repository from `git remote` style URLs.
 *
 * @param raw - Remote URL (HTTPS or SSH)
 * @returns Normalized repo metadata, or null when not GitHub
 */
export function parseGitHubRemote(raw: string): GitHubRepo | null {
  const trimmed = raw.trim();
  const match =
    trimmed.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i) ??
    trimmed.match(/github\.com[/:]([^/]+)\/([^/]+)/i);
  if (!match) {
    return null;
  }

  const org = match[1]!;
  const repo = match[2]!.replace(/\.git$/i, "");
  if (!org || !repo) {
    return null;
  }

  return {
    org,
    repo,
    repoUrl: `https://github.com/${org}/${repo}`,
  };
}

/**
 * Converts a repository slug to a display product name (`my-app` → `My App`).
 *
 * @param slug - Repository name segment from the GitHub URL
 */
export function slugToProductName(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Whether this checkout should be rebranded away from the upstream template defaults.
 *
 * @param github - Parsed remote repository
 */
export function shouldRebrandFromTemplate(github: GitHubRepo): boolean {
  return (
    github.org.toLowerCase() !== TEMPLATE_UPSTREAM.org.toLowerCase() ||
    github.repo.toLowerCase() !== TEMPLATE_UPSTREAM.repo.toLowerCase()
  );
}

/**
 * Product display name derived from a GitHub repository slug.
 *
 * @param github - Parsed remote repository
 */
export function productNameFromRepo(github: GitHubRepo): string {
  return slugToProductName(github.repo);
}
