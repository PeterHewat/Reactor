import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { relative, resolve } from "node:path";

/**
 * Ensures `core.symlinks=true` for this clone so Git checks out committed symlinks correctly.
 * Safe on every OS (already the default on macOS and Linux); required on many Windows Git installs.
 *
 * @param root - Repository root
 */
export function ensureGitSymlinksEnabled(root: string): void {
  if (!existsSync(resolve(root, ".git"))) {
    return;
  }
  const proc = Bun.spawnSync(["git", "config", "--local", "core.symlinks", "true"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (proc.exitCode !== 0) {
    return;
  }
}

/**
 * Configures Git symlink checkout (Windows) and shared agent paths for Cursor / Claude Code.
 *
 * @param root - Repository root
 */
export function ensureAgentLinks(root: string): void {
  ensureGitSymlinksEnabled(root);
  ensureClaudeSkillsLink(root);
  ensureClaudeMdLink(root);
}

/**
 * Returns whether `path` is a symlink whose target resolves to `expectedTarget`.
 *
 * @param path - Candidate symlink path
 * @param expectedTarget - Expected directory or file target
 */
export function isSymlinkTo(path: string, expectedTarget: string): boolean {
  if (!existsSync(path)) {
    return false;
  }
  try {
    if (!lstatSync(path).isSymbolicLink()) {
      return false;
    }
    return realpathSync(path) === realpathSync(expectedTarget);
  } catch {
    return false;
  }
}

/**
 * Ensures `.claude/skills` points at `.agents/skills` so Cursor and Claude Code share one tree.
 * Replaces a real `.claude/skills` directory (duplicate Convex/Clerk installs) when needed.
 *
 * @param root - Repository root
 */
export function ensureClaudeSkillsLink(root: string): void {
  const agentsSkills = resolve(root, ".agents/skills");
  const claudeDir = resolve(root, ".claude");
  const claudeSkills = resolve(claudeDir, "skills");

  mkdirSync(agentsSkills, { recursive: true });
  mkdirSync(claudeDir, { recursive: true });

  if (isSymlinkTo(claudeSkills, agentsSkills)) {
    return;
  }

  if (existsSync(claudeSkills)) {
    rmSync(claudeSkills, { recursive: true, force: true });
  }

  symlinkSync(relative(claudeDir, agentsSkills), claudeSkills);
}

/**
 * Ensures `CLAUDE.md` is a symlink to `AGENTS.md` (Convex `ai-files install` updates both paths).
 *
 * @param root - Repository root
 */
export function ensureClaudeMdLink(root: string): void {
  const agentsMd = resolve(root, "AGENTS.md");
  const claudeMd = resolve(root, "CLAUDE.md");

  if (!existsSync(agentsMd)) {
    return;
  }

  if (isSymlinkTo(claudeMd, agentsMd)) {
    return;
  }

  if (existsSync(claudeMd)) {
    rmSync(claudeMd);
  }

  symlinkSync("AGENTS.md", claudeMd);
}

/**
 * Returns the symlink target for `path` when it is a symlink; otherwise `null`.
 *
 * @param path - Path to inspect
 */
export function readSymlinkTarget(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    if (!lstatSync(path).isSymbolicLink()) {
      return null;
    }
    return readlinkSync(path);
  } catch {
    return null;
  }
}
