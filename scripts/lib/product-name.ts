import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Writes `PRODUCT_NAME` in `packages/config/product.ts`.
 *
 * @param root - Repository root
 * @param productName - Display name
 * @returns Whether the file was updated
 */
export function writeProductName(root: string, productName: string): boolean {
  const productPath = resolve(root, "packages/config/product.ts");
  if (!existsSync(productPath)) {
    return false;
  }
  const raw = readFileSync(productPath, "utf8");
  const escaped = productName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const next = raw.replace(
    /export const PRODUCT_NAME = "[^"]*";/,
    `export const PRODUCT_NAME = "${escaped}";`,
  );
  if (next === raw) {
    return false;
  }
  writeFileSync(productPath, next);
  return true;
}
