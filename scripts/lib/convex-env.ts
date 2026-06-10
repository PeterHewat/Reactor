/* eslint-disable no-console -- CLI wizard */
import { parseConvexProdDeploymentSlug } from "./convex-url";
import { CONVEX_DASHBOARD } from "./platform-urls";
import { readSpawnPipe } from "./spawn-io";

export type SetConvexEnvResult = {
  ok: boolean;
  prodDeploymentSlug?: string;
};

/**
 * Sets a Convex deployment environment variable via the CLI.
 *
 * @param root - Repository root
 * @param name - Variable name
 * @param value - Variable value
 * @param prod - When true, targets the production deployment
 */
export async function setConvexEnvVar(
  root: string,
  name: string,
  value: string,
  prod = false,
): Promise<SetConvexEnvResult> {
  const args = ["bunx", "convex", "env", "set", name, value];
  if (prod) {
    args.push("--prod");
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
  if (code === 0) {
    return {
      ok: true,
      prodDeploymentSlug: prod ? (parseConvexProdDeploymentSlug(combined) ?? undefined) : undefined,
    };
  }
  console.warn(`○ Could not set ${name} via CLI — use Convex dashboard`);
  console.log(
    `  ${CONVEX_DASHBOARD} → ${prod ? "Production" : "Development"} → Settings → Environment variables`,
  );
  return { ok: false };
}

/**
 * Reads a Convex deployment environment variable via the CLI.
 *
 * @param root - Repository root
 * @param name - Variable name
 * @param prod - When true, targets the production deployment
 */
export async function getConvexEnvVar(
  root: string,
  name: string,
  prod = false,
): Promise<string | null> {
  const args = ["bunx", "convex", "env", "get", name];
  if (prod) {
    args.push("--prod");
  }
  const proc = Bun.spawn(args, {
    cwd: root,
    stdout: "pipe",
    stderr: "ignore",
  });
  if ((await proc.exited) !== 0) {
    return null;
  }
  const text = await readSpawnPipe(proc.stdout);
  return text || null;
}
