import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { shouldRebrandFromTemplate, type GitHubRepo } from "./repo-identity";
import type { SetupConfig } from "./setup-config";

const MIT_LICENSE_MARKER = "MIT License";
const PROPRIETARY_TEMPLATE_REL = ".reactor/LICENSE.proprietary.template";

/**
 * Whether setup should offer or apply MIT removal (forks and pre-remote clones).
 *
 * @param github - Parsed GitHub remote, if any
 */
export function shouldOfferLicenseRemoval(github: GitHubRepo | null): boolean {
  return !github || shouldRebrandFromTemplate(github);
}

/**
 * Returns whether `LICENSE` still contains the upstream MIT text.
 *
 * @param content - Current LICENSE file body
 */
export function isMitLicense(content: string): boolean {
  return content.includes(MIT_LICENSE_MARKER);
}

/**
 * Fills the proprietary license stub template.
 *
 * @param template - Raw template with `{{year}}` and `{{copyrightHolder}}`
 * @param copyrightHolder - Copyright line name (org or product)
 */
export function renderProprietaryLicense(template: string, copyrightHolder: string): string {
  const year = String(new Date().getFullYear());
  return template.replaceAll("{{year}}", year).replaceAll("{{copyrightHolder}}", copyrightHolder);
}

/**
 * Overwrites `LICENSE` and sets `package.json` `license` to `UNLICENSED`.
 *
 * @param root - Repository root
 * @param copyrightHolder - Copyright line name (org or product)
 * @returns Whether any file was updated
 */
export function applyProprietaryLicense(root: string, copyrightHolder: string): boolean {
  const licensePath = resolve(root, "LICENSE");
  const templatePath = resolve(root, PROPRIETARY_TEMPLATE_REL);
  if (!existsSync(templatePath)) {
    return false;
  }

  const template = readFileSync(templatePath, "utf8");
  const nextLicense = renderProprietaryLicense(template, copyrightHolder);
  let changed = false;

  if (!existsSync(licensePath) || readFileSync(licensePath, "utf8") !== nextLicense) {
    writeFileSync(licensePath, nextLicense);
    changed = true;
  }

  const pkgPath = resolve(root, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { license?: string };
    if (pkg.license !== "UNLICENSED") {
      pkg.license = "UNLICENSED";
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      changed = true;
    }
  }

  return changed;
}

/**
 * Applies proprietary licensing when setup config requests MIT removal.
 *
 * @param root - Repository root
 * @param config - Setup config with `removeMitLicense`
 * @param github - Parsed GitHub remote, if any
 */
export function applyLicenseFromConfig(
  root: string,
  config: Pick<SetupConfig, "removeMitLicense" | "productName" | "github">,
  github: GitHubRepo | null,
): boolean {
  if (!config.removeMitLicense || !shouldOfferLicenseRemoval(github)) {
    return false;
  }

  const licensePath = resolve(root, "LICENSE");
  if (existsSync(licensePath) && !isMitLicense(readFileSync(licensePath, "utf8"))) {
    return false;
  }

  const copyrightHolder = config.github?.org ?? github?.org ?? config.productName;
  return applyProprietaryLicense(root, copyrightHolder);
}
