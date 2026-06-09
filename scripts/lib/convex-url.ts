import {
  isPlaceholderEnvValue,
  isRealConvexDeployment,
  parseDotenvAssignmentValue,
} from "../../packages/config/env-placeholders";
import { readEnvFile } from "./env-file";

/**
 * Builds the public Convex URL from a `CONVEX_DEPLOYMENT` slug (`dev:happy-animal-123`).
 *
 * @param deployment - Value of `CONVEX_DEPLOYMENT`
 */
export function convexUrlFromDeployment(deployment: string): string | null {
  if (!isRealConvexDeployment(deployment)) {
    return null;
  }
  const trimmed = parseDotenvAssignmentValue(deployment);
  const slug = trimmed.replace(/^(dev|prod):/i, "");
  if (!slug || isPlaceholderEnvValue(slug)) {
    return null;
  }
  return `https://${slug}.convex.cloud`;
}

/**
 * Reads the dev Convex deployment URL from root `.env.local` when linked.
 *
 * @param root - Repository root
 */
export function readConvexUrlFromRootEnv(root: string): string | null {
  const rootEnv = readEnvFile(root, ".env.local");
  const deployment = rootEnv.CONVEX_DEPLOYMENT;
  if (!deployment) {
    return null;
  }
  return convexUrlFromDeployment(deployment);
}
