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
 * Builds a Convex cloud URL for a deployment slug, preserving regional host suffixes.
 *
 * @param slug - Deployment name (e.g. `laudable-deer-836`)
 * @param referenceUrl - Existing Convex URL used to infer region (optional)
 */
export function convexUrlFromDeploymentSlug(slug: string, referenceUrl?: string | null): string {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    return "";
  }
  const regional = referenceUrl?.match(/^https:\/\/[^/]+\.([\w-]+\.convex\.cloud)\/?$/i);
  if (regional) {
    return `https://${trimmedSlug}.${regional[1]}`;
  }
  return `https://${trimmedSlug}.convex.cloud`;
}

/**
 * Parses a production deployment slug from Convex CLI stdout/stderr.
 *
 * @param text - Combined CLI output
 */
export function parseConvexProdDeploymentSlug(text: string): string | null {
  const match = text.match(/on prod deployment ([a-z0-9-]+)/i) ?? text.match(/for ([a-z0-9-]+)\./i);
  return match?.[1] ?? null;
}

/**
 * Reads the dev Convex deployment URL from root `.env.local` when linked.
 *
 * @param root - Repository root
 */
export function readConvexUrlFromRootEnv(root: string): string | null {
  const rootEnv = readEnvFile(root, ".env.local");
  const fromUrl = rootEnv.VITE_CONVEX_URL?.trim();
  if (fromUrl?.includes(".convex.cloud")) {
    return fromUrl;
  }
  const deployment = rootEnv.CONVEX_DEPLOYMENT;
  if (!deployment) {
    return null;
  }
  return convexUrlFromDeployment(deployment);
}
