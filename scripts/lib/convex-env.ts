/* eslint-disable no-console -- CLI wizard */
import { CONVEX_DASHBOARD } from "./platform-urls";

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
): Promise<boolean> {
  const args = ["bunx", "convex", "env", "set", name, value];
  if (prod) {
    args.push("--prod");
  }
  console.log(`\n→ ${args.join(" ")}`);
  const proc = Bun.spawn(args, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = (await proc.exited) ?? 1;
  if (code === 0) {
    return true;
  }
  console.warn(`○ Could not set ${name} via CLI — use Convex dashboard`);
  console.log(
    `  ${CONVEX_DASHBOARD} → ${prod ? "Production" : "Development"} → Settings → Environment variables`,
  );
  return false;
}
