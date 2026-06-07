/* eslint-disable no-console -- CLI wizard */
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
): Promise<string | null> {
  const args = ["bunx", "convex", "deployment", "token", "create", name];
  if (deployment === "prod") {
    args.push("--deployment", "prod");
  }
  console.log(`\n→ ${args.join(" ")}`);
  const proc = Bun.spawn(args, {
    cwd: root,
    stdout: "pipe",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) {
    return null;
  }
  const key = (await new Response(proc.stdout).text()).trim();
  return key || null;
}
