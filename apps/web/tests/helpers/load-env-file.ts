import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Merges `KEY=value` lines from a dotenv file into `process.env` (does not override existing).
 *
 * @param cwd - Directory containing the env file
 * @param filename - Env file name (e.g. `.env`)
 */
export function loadEnvFile(cwd: string, filename: string): void {
  const path = resolve(cwd, filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    if (process.env[key] !== undefined) continue;
    let value = m[2]!.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
