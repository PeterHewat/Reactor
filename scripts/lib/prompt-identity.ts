/* eslint-disable no-console -- CLI wizard */
import { deriveHostnames } from "../../packages/config/hostnames";
import { isValidApexDomain, normalizeApexDomainInput } from "../../packages/config/validate-domain";
import { shouldOfferLicenseRemoval } from "./license-identity";
import { promptConfirm, promptLine } from "./prompt";
import { productNameFromRepo, type GitHubRepo } from "./repo-identity";
import { writeProductName } from "./product-name";
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
  console.log(`  Web pre-release:       ${hostnames.webPreRelease}`);
  console.log(`  Web production:        ${hostnames.webProduction}`);
  console.log(`  Marketing pre-release: ${hostnames.marketingPreRelease}`);
  console.log(`  Marketing production:  ${hostnames.marketingProduction}`);
}

/**
 * Runs interactive identity prompts and persists setup config + product name.
 * Re-runs always show previous answers as defaults (Enter to keep).
 *
 * @param root - Repository root
 * @param github - Parsed GitHub remote, if any
 */
export async function runIdentityWizard(
  root: string,
  github: GitHubRepo | null,
): Promise<SetupConfig> {
  const existing = readSetupConfig(root);

  console.log("\nIdentity");
  const defaultName =
    existing?.productName ?? (github ? productNameFromRepo(github) : undefined) ?? "Reactor";
  const productName = await promptLine("Product name", { defaultValue: defaultName });

  const apexDefault =
    existing?.apexDomain && isValidApexDomain(existing.apexDomain)
      ? existing.apexDomain
      : undefined;

  let apexDomain = "";
  while (!isValidApexDomain(apexDomain)) {
    apexDomain = await promptLine("Apex domain (e.g. example.com)", {
      defaultValue: apexDefault,
      required: apexDefault === undefined,
    });
    apexDomain = normalizeApexDomainInput(apexDomain);
    if (!isValidApexDomain(apexDomain)) {
      console.log("  Enter a valid apex domain (e.g. example.com) — not www, not localhost.");
      apexDomain = "";
    }
  }

  let removeMitLicense = existing?.removeMitLicense;
  if (shouldOfferLicenseRemoval(github)) {
    removeMitLicense = await promptConfirm("Remove MIT licence?", {
      defaultYes: existing?.removeMitLicense ?? true,
    });
  }

  const config = buildSetupConfig(productName, apexDomain, github, existing, removeMitLicense);
  writeSetupConfig(root, config);
  if (writeProductName(root, productName)) {
    console.log(`✓ Updated packages/config/product.ts → "${productName}"`);
  }
  console.log(`✓ Wrote .reactor/setup.json`);
  printHostnameTable(apexDomain);
  return config;
}
