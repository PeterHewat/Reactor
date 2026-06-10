/* eslint-disable no-console -- CLI output */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ensureClaudeSkillsLink } from "./agent-links";

const CONVEX_SKILLS_MARKER = ".agents/skills/convex/SKILL.md";

const CLERK_SETUP_SKILLS = ["clerk-react-patterns", "clerk-testing", "clerk-backend-api"] as const;

/**
 * Cursor installs to `.agents/skills/`; Claude Code reads the same tree via `.claude/skills` → `.agents/skills`.
 */
const CLERK_SETUP_AGENT = "cursor";

/**
 * Returns whether one Clerk skill is present under `.agents/skills/`.
 *
 * @param root - Repository root
 * @param skill - Skill directory name
 */
function clerkSkillInstalled(root: string, skill: string): boolean {
  return existsSync(resolve(root, `.agents/skills/${skill}/SKILL.md`));
}

/**
 * Returns whether all Reactor Clerk skills are installed for Cursor / Claude Code.
 *
 * @param root - Repository root
 */
export function areClerkAgentSkillsInstalled(root: string): boolean {
  return CLERK_SETUP_SKILLS.every((skill) => clerkSkillInstalled(root, skill));
}

/**
 * Runs `bunx skills add` for the Reactor Clerk skill subset (Cursor target only).
 *
 * @param root - Repository root
 */
async function runClerkSkillsAdd(root: string): Promise<number> {
  const args = [
    "bunx",
    "skills",
    "add",
    "clerk/skills",
    "-y",
    "-a",
    CLERK_SETUP_AGENT,
    ...CLERK_SETUP_SKILLS.flatMap((skill) => ["--skill", skill]),
  ];
  console.log(`\n→ ${args.join(" ")}`);
  const proc = Bun.spawn(args, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

/**
 * Installs Convex agent skills when not already present (best effort; optional).
 *
 * @param root - Repository root
 * @returns Process exit code (0 = success)
 */
export async function runConvexAgentSkillsIfNeeded(root: string): Promise<number> {
  ensureClaudeSkillsLink(root);

  if (existsSync(resolve(root, CONVEX_SKILLS_MARKER))) {
    console.log("\n○ Convex agent skills already installed — skip");
    return 0;
  }
  console.log("\n→ bunx convex ai-files install");
  const proc = Bun.spawn(["bunx", "convex", "ai-files", "install"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) ?? 1;
}

/**
 * Installs Reactor-relevant Clerk agent skills (best effort; optional).
 *
 * @param root - Repository root
 * @returns Process exit code (0 = success)
 */
export async function runClerkAgentSkillsIfNeeded(root: string): Promise<number> {
  ensureClaudeSkillsLink(root);

  if (areClerkAgentSkillsInstalled(root)) {
    console.log("\n○ Clerk agent skills already installed — skip");
    return 0;
  }

  return runClerkSkillsAdd(root);
}

/**
 * Returns the shell command to restore Clerk skills manually.
 */
export function clerkSkillsInstallCommand(): string {
  const skills = CLERK_SETUP_SKILLS.map((s) => `--skill ${s}`).join(" ");
  return `bunx skills add clerk/skills -y -a ${CLERK_SETUP_AGENT} ${skills}`;
}
