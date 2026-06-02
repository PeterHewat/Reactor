import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@repo/config/product";

/** Public site name used in titles and metadata. */
export const SITE_NAME = PRODUCT_NAME;

/** Short tagline for the marketing home page title. */
export const SITE_TAGLINE = PRODUCT_TAGLINE;

/**
 * Build a page `<title>` from a page-specific heading.
 *
 * @param pageTitle - Page-specific title segment
 * @returns Full document title, e.g. `"Blog | Reactor"`
 *
 * @example
 * pageTitle("Blog"); // "Blog | Reactor"
 */
export function pageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_NAME}`;
}
