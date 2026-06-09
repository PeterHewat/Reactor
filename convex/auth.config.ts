/**
 * Clerk + Convex JWT validation. Requires `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard.
 *
 * During first-time setup the issuer may be unset — providers stay empty so `convex dev` can
 * link and push before setup runs `convex env set CLERK_JWT_ISSUER_DOMAIN`.
 *
 * @see https://docs.convex.dev/auth/clerk
 */
const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

export default {
  providers: issuerDomain
    ? [
        {
          domain: issuerDomain,
          applicationID: "convex",
        },
      ]
    : [],
};
