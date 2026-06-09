import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reads `PRODUCT_TAGLINE` from `packages/config/product.ts`.
 *
 * @param root - Repository root
 */
export function readProductTagline(root: string): string | null {
  const productPath = resolve(root, "packages/config/product.ts");
  if (!existsSync(productPath)) {
    return null;
  }
  const raw = readFileSync(productPath, "utf8");
  const match = raw.match(/export const PRODUCT_TAGLINE = "([^"]*)";/);
  return match?.[1] ?? null;
}

/**
 * Writes `PRODUCT_TAGLINE` in `packages/config/product.ts`.
 *
 * @param root - Repository root
 * @param productTagLine - Tagline string
 * @returns Whether the file was updated
 */
export function writeProductTagline(root: string, productTagLine: string): boolean {
  const productPath = resolve(root, "packages/config/product.ts");
  if (!existsSync(productPath)) {
    return false;
  }
  const raw = readFileSync(productPath, "utf8");
  const escaped = productTagLine.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const next = raw.replace(
    /export const PRODUCT_TAGLINE = "[^"]*";/,
    `export const PRODUCT_TAGLINE = "${escaped}";`,
  );
  if (next === raw) {
    return false;
  }
  writeFileSync(productPath, next);
  return true;
}
