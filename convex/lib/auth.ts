import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Requires a signed-in user for queries and mutations.
 *
 * @param ctx - Convex query or mutation context
 * @returns Clerk/Convex identity (use `subject` as the user id)
 * @throws ConvexError when there is no authenticated user
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }
  return identity;
}
