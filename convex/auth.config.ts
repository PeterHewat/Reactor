import { requireEnv } from "./lib/env";

/**
 * Clerk + Convex auth configuration (committed default for the starter template).
 *
 * Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard to the **Issuer** URL from
 * Clerk → Configure → JWT templates → Convex preset (see docs/getting-started.md step 2).
 *
 * @see convex/auth.config.ts.example for a reference copy
 * @see https://docs.convex.dev/auth/clerk
 */
export default {
  providers: [
    {
      domain: requireEnv("CLERK_JWT_ISSUER_DOMAIN"),
      applicationID: "convex",
    },
  ],
};
