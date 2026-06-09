import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_PRODUCT_NAME } from "./repo-identity";

const TEMPLATE_README_CI_MARKER = "PeterHewat/Reactor/ci.yml";
const TEMPLATE_README_TAGLINE = "**Reactor** is a production-shaped";

/**
 * Replaces the template `# Reactor` heading when a custom product name is set.
 *
 * @param content - README body
 * @param productName - Display name from setup
 * @returns Updated README body
 */
export function replaceReadmeTitle(content: string, productName: string): string {
  if (
    productName === TEMPLATE_PRODUCT_NAME ||
    !content.startsWith(`# ${TEMPLATE_PRODUCT_NAME}\n`)
  ) {
    return content;
  }
  return `# ${productName}\n${content.slice(`# ${TEMPLATE_PRODUCT_NAME}\n`.length)}`;
}

/**
 * Removes the upstream template badge block and intro copy when still present.
 *
 * @param content - README body
 * @returns README without the template intro section
 */
export function stripTemplateReadmeIntro(content: string): string {
  const introStart = content.indexOf(TEMPLATE_README_CI_MARKER);
  if (introStart === -1) {
    return content;
  }

  const lineStart = content.lastIndexOf("\n", introStart) + 1;
  const taglineIndex = content.indexOf(TEMPLATE_README_TAGLINE, introStart);
  if (taglineIndex === -1) {
    return content;
  }

  const goodFitIndex = content.indexOf("**Good fit:**", taglineIndex);
  if (goodFitIndex === -1) {
    return content;
  }

  const goodFitLineEnd = content.indexOf("\n", goodFitIndex);
  const end =
    goodFitLineEnd === -1
      ? content.length
      : content[goodFitLineEnd + 1] === "\n"
        ? goodFitLineEnd + 2
        : goodFitLineEnd + 1;

  return content.slice(0, lineStart) + content.slice(end);
}

/**
 * Applies product-name rebranding to the root README (title + template intro).
 *
 * @param root - Repository root
 * @param productName - Display name from setup
 * @returns Whether README.md was updated
 */
export function applyReadmeIdentity(root: string, productName: string): boolean {
  const readmePath = resolve(root, "README.md");
  if (!existsSync(readmePath)) {
    return false;
  }

  const raw = readFileSync(readmePath, "utf8");
  const next = stripTemplateReadmeIntro(replaceReadmeTitle(raw, productName));
  if (next === raw) {
    return false;
  }

  writeFileSync(readmePath, next);
  return true;
}
