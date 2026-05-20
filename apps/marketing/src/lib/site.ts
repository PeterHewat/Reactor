/** Public site name used in titles and metadata. */
export const SITE_NAME = "Reactor";

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
