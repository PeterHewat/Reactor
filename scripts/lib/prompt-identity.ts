/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import {
  hasApexDomain,
  isValidApexDomain,
  normalizeApexDomainInput,
} from "../../packages/config/validate-domain";
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
 * Prompts for an optional apex domain; empty input skips custom hostnames.
 *
 * @param defaultValue - Previous apex domain, if any
 */
async function promptOptionalApexDomain(defaultValue?: string): Promise<string | undefined> {
  while (true) {
    const raw = await promptLine("Apex domain (Enter to skip)", {
      defaultValue,
      displayDefault: defaultValue ?? "skip",
    });
    if (!raw.trim()) {
      return undefined;
    }
    const normalized = normalizeApexDomainInput(raw);
    if (isValidApexDomain(normalized)) {
      return normalized;
    }
    console.log("  Enter a valid apex domain (e.g. example.com), or press Enter to skip.");
  }
}

/**
 * Persists identity config and applies product name / tagline files.
 *
 * @param root - Repository root
 * @param config - Setup config to write
 */
function persistIdentityConfig(root: string, config: SetupConfig): void {
  writeSetupConfig(root, config);
  if (writeProductName(root, config.productName)) {
    console.log(`✓ Updated packages/config/product.ts → "${config.productName}"`);
  }
  if (writeProductTagline(root, config.productTagLine)) {
    console.log(`✓ Updated packages/config/product.ts tagline → "${config.productTagLine}"`);
  }
  console.log(`✓ Wrote .reactor/setup.json`);
  if (hasApexDomain(config.apexDomain)) {
    printHostnameTable(config.apexDomain!);
  } else {
    console.log(
      "\n○ No apex domain — custom hostnames deferred until you add one and re-run setup",
    );
  }
}

/**
 * Runs interactive identity prompts and persists setup config + product name.
 * Re-runs skip prompts when `.reactor/setup.json` already has product name and tagline.
 *
 * @param root - Repository root
 * @param github - Parsed GitHub remote, if any
 */
export async function runIdentityWizard(
  root: string,
  github: GitHubRepo | null,
): Promise<SetupConfig> {
  const existing = readSetupConfig(root);

  if (existing?.productName && existing.productTagLine && hasApexDomain(existing.apexDomain)) {
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

  if (existing?.productName && existing.productTagLine) {
    console.log("\nIdentity");
    console.log(`✓ ${existing.productName} (no apex domain yet — from .reactor/setup.json)`);
    const apexDomain = await promptOptionalApexDomain(existing.apexDomain);
    const config = buildSetupConfig(
      existing.productName,
      existing.productTagLine,
      apexDomain,
      github,
      existing,
      existing.removeMitLicense,
    );
    if (apexDomain && apexDomain !== existing.apexDomain) {
      persistIdentityConfig(root, config);
    } else if (JSON.stringify(config) !== JSON.stringify(existing)) {
      writeSetupConfig(root, config);
    }
    return config;
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

  const apexDomain = await promptOptionalApexDomain(apexDefault);

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
  persistIdentityConfig(root, config);
  return config;
}
