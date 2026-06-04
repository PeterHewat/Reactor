import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseGitHubRemote,
  productNameFromRepo,
  shouldRebrandFromTemplate,
  TEMPLATE_PRODUCT_NAME,
  TEMPLATE_REPO_SLUG,
  type GitHubRepo,
} from "./repo-identity";

export type IdentityResult = {
  github: GitHubRepo;
  productName: string;
  rebranded: boolean;
  changes: string[];
};

/**
 * Resolves the GitHub repository from `origin` or `GITHUB_REPOSITORY` (Actions).
 *
 * @param root - Repository root
 */
export function resolveGitHubRepo(root: string): GitHubRepo | null {
  try {
    const remote = execSync("git remote get-url origin", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const fromRemote = parseGitHubRemote(remote);
    if (fromRemote) {
      return fromRemote;
    }
  } catch {
    // no origin remote
  }

  const actionsRepo = process.env.GITHUB_REPOSITORY;
  if (actionsRepo) {
    return parseGitHubRemote(`https://github.com/${actionsRepo}`);
  }

  return null;
}

/**
 * Applies product name and template rebranding from `git remote`.
 *
 * @param root - Repository root
 * @param github - Parsed GitHub repository
 */
export function applyIdentity(root: string, github: GitHubRepo): IdentityResult {
  const productName = productNameFromRepo(github);
  const rebranded = shouldRebrandFromTemplate(github);
  const changes: string[] = [];

  const productPath = resolve(root, "packages/config/product.ts");
  if (existsSync(productPath)) {
    const raw = readFileSync(productPath, "utf8");
    const current = raw.match(/export const PRODUCT_NAME = "([^"]*)";/)?.[1];
    const shouldUpdateProduct =
      rebranded &&
      (current === TEMPLATE_PRODUCT_NAME || current?.toLowerCase() === github.repo.toLowerCase());
    if (shouldUpdateProduct) {
      const next = raw.replace(
        /export const PRODUCT_NAME = "[^"]*";/,
        `export const PRODUCT_NAME = "${productName}";`,
      );
      if (next !== raw) {
        writeFileSync(productPath, next);
        changes.push("packages/config/product.ts");
      }
    }
  }

  if (rebranded) {
    const readmePath = resolve(root, "README.md");
    if (existsSync(readmePath)) {
      const raw = readFileSync(readmePath, "utf8");
      let next = raw.replaceAll(TEMPLATE_REPO_SLUG, `${github.org}/${github.repo}`);
      next = next.replaceAll(/PeterHewat\/Reactor/g, `${github.org}/${github.repo}`);
      if (currentProductStillTemplate(raw)) {
        next = next.replace(/^# Reactor\b/m, `# ${productName}`);
        next = next.replace(/\*\*Reactor\*\*/g, `**${productName}**`);
      }
      if (next !== raw) {
        writeFileSync(readmePath, next);
        changes.push("README.md");
      }
    }

    const pkgPath = resolve(root, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
      const slug = github.repo.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const nextName = `${slug}-monorepo`;
      if (pkg.name === "reactor-monorepo" && nextName !== pkg.name) {
        pkg.name = nextName;
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
        changes.push("package.json (name)");
      }
    }
  }

  return { github, productName, rebranded, changes };
}

function currentProductStillTemplate(readme: string): boolean {
  return readme.startsWith("# Reactor") || readme.includes("**Reactor** is a production-shaped");
}
