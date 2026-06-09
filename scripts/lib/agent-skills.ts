/* eslint-disable no-console -- CLI output */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CONVEX_SKILLS_MARKER = ".agents/skills/convex/SKILL.md";
const CLERK_SKILLS_MARKER = ".agents/skills/clerk-react-patterns/SKILL.md";

const CLERK_SETUP_SKILLS = ["clerk-react-patterns", "clerk-testing", "clerk-backend-api"] as const;

/**
 * Installs Convex agent skills when not already present (best effort; optional).
 *
 * @param root - Repository root
 * @returns Process exit code (0 = success)
 */
export async function runConvexAgentSkillsIfNeeded(root: string): Promise<number> {
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
 * Installs Reactor-relevant Clerk agent skills when not already present (best effort; optional).
 *
 * @param root - Repository root
 * @returns Process exit code (0 = success)
 */
export async function runClerkAgentSkillsIfNeeded(root: string): Promise<number> {
  if (existsSync(resolve(root, CLERK_SKILLS_MARKER))) {
    console.log("\n○ Clerk agent skills already installed — skip");
    return 0;
  }

  const args = [
    "bunx",
    "skills",
    "add",
    "clerk/skills",
    "-y",
    "-a",
    "cursor",
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
