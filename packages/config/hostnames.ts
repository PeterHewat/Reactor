import { normalizeApexDomainInput } from "./validate-domain";

export type DerivedHostnames = {
  apex: string;
  webPreRelease: string;
  webProduction: string;
  marketingPreRelease: string;
  marketingProduction: string;
  clerkDevOrigins: string[];
  clerkProdOrigins: string[];
};

/**
 * Derives web, marketing, and Clerk origin hostnames from an apex domain.
 *
 * @param apexDomain - Apex domain (e.g. `example.com`)
 */
export function deriveHostnames(apexDomain: string): DerivedHostnames {
  const apex = normalizeApexDomainInput(apexDomain);
  return {
    apex,
    webPreRelease: `dev.${apex}`,
    webProduction: apex,
    marketingPreRelease: `dev.www.${apex}`,
    marketingProduction: `www.${apex}`,
    clerkDevOrigins: ["http://localhost:5173", `https://dev.${apex}`],
    clerkProdOrigins: [`https://${apex}`],
  };
}
