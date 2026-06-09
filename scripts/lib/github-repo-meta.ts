import type { GitHubRepo } from "./repo-identity";

/**
 * Fetches the GitHub repository About description via `gh api` (best effort).
 *
 * @param github - Parsed GitHub remote
 */
export async function fetchGitHubRepoDescription(github: GitHubRepo): Promise<string | null> {
  const proc = Bun.spawn(
    ["gh", "api", `repos/${github.org}/${github.repo}`, "--jq", ".description"],
    {
      stdout: "pipe",
      stderr: "ignore",
    },
  );
  const code = await proc.exited;
  if (code !== 0) {
    return null;
  }
  const text = (await new Response(proc.stdout).text()).trim();
  if (!text || text === "null") {
    return null;
  }
  return text;
}
