import { requireEnv } from "./lib/env";

/**
 * Clerk + Convex JWT validation. Requires `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard.
 *
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
