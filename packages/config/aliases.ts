import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(configDir, "../..");

const aliasTargets = {
  "@repo/utils": "packages/utils/src/index.ts",
  "@repo/ui-web": "packages/ui-web/src/index.ts",
  "@repo/test-utils": "packages/test-utils/src/index.ts",
  "@convex/api": "convex/_generated/api.js",
  "@convex/dataModel": "convex/_generated/dataModel.d.ts",
} as const;

const utilsSubpathTargets = {
  "@repo/utils/env": "packages/utils/src/env.ts",
  "@repo/utils/theme": "packages/utils/src/theme.ts",
  "@repo/utils/i18n": "packages/utils/src/i18n.ts",
  "@repo/utils/storage": "packages/utils/src/storage.ts",
  "@repo/utils/use-translation": "packages/utils/src/use-translation.ts",
} as const;

export type RepoAliasKey = keyof typeof aliasTargets;

function resolveRepoPaths(targets: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(targets).map(([key, rel]) => [key, path.resolve(repoRoot, rel)]),
  );
}

/**
 * Builds Vite/Vitest `resolve.alias` entries for selected workspace packages.
 *
 * @param keys - Package alias keys to include
 * @returns Map of alias → absolute path under the repo root
 *
 * @example
 * resolve: { alias: createRepoAliases(["@repo/utils", "@repo/ui-web"]) }
 */
export function createRepoAliases(keys: readonly RepoAliasKey[]): Record<string, string> {
  const selected = Object.fromEntries(keys.map((key) => [key, aliasTargets[key]])) as Record<
    string,
    string
  >;
  const aliases = resolveRepoPaths(selected);
  if (keys.includes("@repo/utils")) {
    return { ...resolveRepoPaths(utilsSubpathTargets), ...aliases };
  }
  return aliases;
}

/** Aliases used by `apps/web` (Vite + Vitest). */
export const webAliasKeys = [
  "@repo/utils",
  "@repo/ui-web",
  "@repo/test-utils",
  "@convex/api",
  "@convex/dataModel",
] as const satisfies readonly RepoAliasKey[];

/** Aliases used by `packages/ui-web` Vitest. */
export const uiWebAliasKeys = [
  "@repo/utils",
  "@repo/test-utils",
] as const satisfies readonly RepoAliasKey[];

/** Aliases used by `packages/utils` Vitest. */
export const utilsAliasKeys = ["@repo/test-utils"] as const satisfies readonly RepoAliasKey[];

export const dedupeReact = ["react", "react-dom"] as const;

export const dedupeWebVite = ["react", "react-dom", "zustand"] as const;
