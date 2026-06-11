/* eslint-disable no-console -- CLI wizard */
import { parseConvexProdDeploymentSlug } from "./convex-url";
import { readEnvFile, upsertEnvKey } from "./env-file";
import { readSpawnPipe } from "./spawn-io";

const ROOT_ENV = ".env.local";

export type MintConvexDeployKeyResult = {
  key: string;
  prodDeploymentSlug?: string;
};

/**
 * Mints a Convex deploy key and returns stdout (the key).
 *
 * @param root - Repository root
 * @param name - Token label in the Convex dashboard
 * @param deployment - `dev` (default) or `prod`
 */
export async function mintConvexDeployKey(
  root: string,
  name: string,
  deployment: "dev" | "prod" = "dev",
): Promise<MintConvexDeployKeyResult | null> {
  const args = ["bunx", "convex", "deployment", "token", "create", name];
  if (deployment === "prod") {
    args.push("--deployment", "prod");
  }
  console.log(`\n→ ${args.join(" ")}`);
  const proc = Bun.spawn(args, {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    readSpawnPipe(proc.stdout),
    readSpawnPipe(proc.stderr),
    proc.exited,
  ]);
  const combined = `${stdout}\n${stderr}`.trim();
  if (combined) {
    for (const line of combined.split("\n")) {
      console.log(line);
    }
  }
  if (code !== 0) {
    return null;
  }
  const key = stdout.trim();
  if (!key) {
    return null;
  }
  return {
    key,
    prodDeploymentSlug:
      deployment === "prod" ? (parseConvexProdDeploymentSlug(combined) ?? undefined) : undefined,
  };
}

/**
 * Returns the dev Convex deploy key from root `.env.local`, minting and persisting when missing.
 *
 * @param root - Repository root
 * @param mintName - Token label when a new key is created
 */
export async function resolveDevConvexDeployKey(
  root: string,
  mintName = "reactor-dev-deploy",
): Promise<string | null> {
  const fromFile = readEnvFile(root, ROOT_ENV).CONVEX_DEPLOY_KEY?.trim();
  if (fromFile) {
    return fromFile;
  }

  const minted = await mintConvexDeployKey(root, mintName, "dev");
  if (!minted?.key) {
    return null;
  }

  upsertEnvKey(root, ROOT_ENV, "CONVEX_DEPLOY_KEY", minted.key);
  return minted.key;
}
