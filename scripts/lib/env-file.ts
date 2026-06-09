import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDotenvAssignmentValue } from "../../packages/config/env-placeholders";

/**
 * Parses a dotenv file into a key/value record (no comments preserved).
 *
 * @param root - Repository root
 * @param relPath - Path relative to root
 */
export function readEnvFile(root: string, relPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  const abs = resolve(root, relPath);
  if (!existsSync(abs)) {
    return out;
  }
  const raw = readFileSync(abs, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      out[m[1]!] = parseDotenvAssignmentValue(m[2]!);
    }
  }
  return out;
}

/**
 * Sets or replaces one key in a dotenv file, preserving other lines when possible.
 *
 * @param root - Repository root
 * @param relPath - Path relative to root
 * @param key - Variable name
 * @param value - Variable value (unquoted unless it contains spaces)
 */
export function upsertEnvKey(root: string, relPath: string, key: string, value: string): void {
  const abs = resolve(root, relPath);
  const formatted = value.includes(" ") ? `"${value.replace(/"/g, '\\"')}"` : value;
  const line = `${key}=${formatted}`;

  if (!existsSync(abs)) {
    writeFileSync(abs, `${line}\n`);
    return;
  }

  const raw = readFileSync(abs, "utf8");
  const lines = raw.split("\n");
  let replaced = false;
  const next = lines.map((existing) => {
    if (existing.startsWith(`${key}=`)) {
      replaced = true;
      return line;
    }
    return existing;
  });
  if (!replaced) {
    const trimmed = raw.endsWith("\n") || raw.length === 0 ? raw : `${raw}\n`;
    writeFileSync(abs, `${trimmed}${line}\n`);
    return;
  }
  writeFileSync(abs, `${next.join("\n").replace(/\n?$/, "\n")}`);
}

/**
 * Sets multiple keys in a dotenv file.
 *
 * @param root - Repository root
 * @param relPath - Path relative to root
 * @param entries - Keys and values to upsert
 */
export function upsertEnvKeys(
  root: string,
  relPath: string,
  entries: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(entries)) {
    upsertEnvKey(root, relPath, key, value);
  }
}
