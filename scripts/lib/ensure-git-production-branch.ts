/* eslint-disable no-console -- CLI wizard */
import { readSpawnPipe } from "./spawn-io";
import { VERCEL_PRODUCTION_GIT_BRANCH } from "./vercel-api";

/**
 * Runs a git command in the repository root.
 *
 * @param root - Repository root
 * @param args - Git subcommand and arguments
 */
async function runGit(
  root: string,
  args: string[],
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["git", ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    readSpawnPipe(proc.stdout),
    readSpawnPipe(proc.stderr),
    proc.exited,
  ]);
  return { ok: code === 0, stdout: stdout.trim(), stderr: stderr.trim() };
}

/**
 * Returns whether `origin` has the Vercel production tracking branch.
 *
 * @param root - Repository root
 */
export async function gitProductionBranchExists(root: string): Promise<boolean> {
  const result = await runGit(root, [
    "ls-remote",
    "--heads",
    "origin",
    VERCEL_PRODUCTION_GIT_BRANCH,
  ]);
  return result.ok && result.stdout.length > 0;
}

/**
 * Creates an empty `production` branch on `origin` without changing the local checkout.
 *
 * @param root - Repository root
 */
export async function ensureGitProductionBranch(root: string): Promise<boolean> {
  if (await gitProductionBranchExists(root)) {
    console.log(`✓ Git branch \`${VERCEL_PRODUCTION_GIT_BRANCH}\` exists on origin`);
    return true;
  }

  console.log(`\n→ Creating empty \`${VERCEL_PRODUCTION_GIT_BRANCH}\` branch on origin`);

  const tree = await runGit(root, ["hash-object", "-t", "tree", "/dev/null"]);
  if (!tree.ok || !tree.stdout) {
    console.warn("○ Could not create empty tree for production branch");
    return false;
  }

  const commit = await runGit(root, ["commit-tree", "-m", "init", tree.stdout]);
  if (!commit.ok || !commit.stdout) {
    console.warn("○ Could not create empty commit for production branch");
    return false;
  }

  const push = await runGit(root, [
    "push",
    "origin",
    `${commit.stdout}:refs/heads/${VERCEL_PRODUCTION_GIT_BRANCH}`,
  ]);
  if (!push.ok) {
    console.warn(
      `○ Could not push \`${VERCEL_PRODUCTION_GIT_BRANCH}\`: ${push.stderr || "unknown error"}`,
    );
    return false;
  }

  console.log(`✓ Created and pushed \`${VERCEL_PRODUCTION_GIT_BRANCH}\` branch`);
  return true;
}
