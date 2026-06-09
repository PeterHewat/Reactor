/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import { isValidApexDomain, normalizeApexDomainInput } from "../../packages/config/validate-domain";
import { fetchGitHubRepoDescription } from "./github-repo-meta";
import { shouldOfferLicenseRemoval } from "./license-identity";
import { writeProductName } from "./product-name";
import { readProductTagline, writeProductTagline } from "./product-tagline";
import { promptLine } from "./prompt";
import { productNameFromRepo, type GitHubRepo } from "./repo-identity";
import {
  buildSetupConfig,
  readSetupConfig,
  writeSetupConfig,
  type SetupConfig,
} from "./setup-config";

/**
 * Prints derived hostnames from the apex domain.
 *
 * @param apexDomain - Apex domain
 */
export function printHostnameTable(apexDomain: string): void {
  const hostnames = deriveHostnames(apexDomain);
  console.log("\nHostnames");
  console.log(`  Web staging:           ${hostnames.webPreRelease}`);
  console.log(`  Web production:        ${hostnames.webProduction}`);
  console.log(`  Marketing staging:     ${hostnames.marketingPreRelease}`);
  console.log(`  Marketing production:  ${hostnames.marketingProduction}`);
}

/**
 * Persists identity config and applies product name / tagline files.
 *
 * @param root - Repository root
 * @param config - Setup config to write
 * @param apexDomain - Apex domain for hostname table
 */
function persistIdentityConfig(root: string, config: SetupConfig, apexDomain: string): void {
  writeSetupConfig(root, config);
  if (writeProductName(root, config.productName)) {
    console.log(`✓ Updated packages/config/product.ts → "${config.productName}"`);
  }
  if (writeProductTagline(root, config.productTagLine)) {
    console.log(`✓ Updated packages/config/product.ts tagline → "${config.productTagLine}"`);
  }
  console.log(`✓ Wrote .reactor/setup.json`);
  printHostnameTable(apexDomain);
}

/**
 * Runs interactive identity prompts and persists setup config + product name.
 * Re-runs skip prompts when `.reactor/setup.json` already has a valid apex domain.
 *
 * @param root - Repository root
 * @param github - Parsed GitHub remote, if any
 */
export async function runIdentityWizard(
  root: string,
  github: GitHubRepo | null,
): Promise<SetupConfig> {
  const existing = readSetupConfig(root);

  if (existing?.productName && existing.productTagLine && isValidApexDomain(existing.apexDomain)) {
    console.log("\nIdentity");
    console.log(`✓ ${existing.productName} @ ${existing.apexDomain} (from .reactor/setup.json)`);
    const refreshed = buildSetupConfig(
      existing.productName,
      existing.productTagLine,
      existing.apexDomain,
      github,
      existing,
      existing.removeMitLicense,
    );
    if (JSON.stringify(refreshed) !== JSON.stringify(existing)) {
      writeSetupConfig(root, refreshed);
    }
    return refreshed;
  }

  console.log("\nIdentity");
  const defaultName =
    existing?.productName ?? (github ? productNameFromRepo(github) : undefined) ?? "Reactor";
  const productName = await promptLine("Product name", { defaultValue: defaultName });

  const taglineFromFile = readProductTagline(root);
  const taglineFromGitHub = github ? await fetchGitHubRepoDescription(github) : null;
  const defaultTagline =
    existing?.productTagLine ?? taglineFromGitHub ?? taglineFromFile ?? "Modern Monorepo Starter";
  const productTagLine = await promptLine("Product tagline (PRODUCT_TAGLINE)", {
    defaultValue: defaultTagline,
  });

  const apexDefault =
    existing?.apexDomain && isValidApexDomain(existing.apexDomain)
      ? existing.apexDomain
      : undefined;

  let apexDomain = "";
  while (!isValidApexDomain(apexDomain)) {
    apexDomain = await promptLine("Apex domain", {
      defaultValue: apexDefault,
      required: true,
    });
    apexDomain = normalizeApexDomainInput(apexDomain);
    if (!isValidApexDomain(apexDomain)) {
      console.log("  Enter a valid apex domain — not www, not localhost.");
      apexDomain = "";
    }
  }

  const removeMitLicense = shouldOfferLicenseRemoval(github)
    ? (existing?.removeMitLicense ?? true)
    : existing?.removeMitLicense;

  const config = buildSetupConfig(
    productName,
    productTagLine,
    apexDomain,
    github,
    existing,
    removeMitLicense,
  );
  persistIdentityConfig(root, config, apexDomain);
  return config;
}
