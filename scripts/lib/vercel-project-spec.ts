import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type VercelAppSpec = {
  appDir: "apps/web" | "apps/marketing";
  suffix: "web" | "marketing";
  framework: string | null;
};

const APP_SPECS: VercelAppSpec[] = [
  { appDir: "apps/web", suffix: "web", framework: null },
  { appDir: "apps/marketing", suffix: "marketing", framework: "astro" },
];

/**
 * Reads install/build/output commands from an app's `vercel.json`.
 *
 * @param root - Repository root
 * @param appDir - App directory under the monorepo root
 */
export function readVercelJsonCommands(
  root: string,
  appDir: string,
): { installCommand?: string; buildCommand?: string; outputDirectory?: string } {
  const raw = readFileSync(resolve(root, appDir, "vercel.json"), "utf8");
  const json = JSON.parse(raw) as {
    installCommand?: string;
    buildCommand?: string;
    outputDirectory?: string;
  };
  return {
    installCommand: json.installCommand,
    buildCommand: json.buildCommand,
    outputDirectory: json.outputDirectory,
  };
}

/**
 * Vercel project specs for web and marketing apps.
 */
export function vercelAppSpecs(): VercelAppSpec[] {
  return APP_SPECS;
}

/**
 * Builds default Vercel project names from a repository slug.
 *
 * @param slug - Product slug (from setup product name, e.g. `foobar`)
 */
export function vercelProjectNames(slug: string): { web: string; marketing: string } {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    web: `${normalized}-web`,
    marketing: `${normalized}-marketing`,
  };
}
