import { ConvexError } from "convex/values";

/** Maximum characters allowed for a task title. */
export const TASK_TITLE_MAX = 500;

/** Maximum characters allowed for a task description. */
export const TASK_DESCRIPTION_MAX = 2000;

/**
 * Validates and normalizes a task title.
 *
 * @param title - Raw title from the client
 * @returns Trimmed title
 * @throws ConvexError when empty or over the max length
 */
export function parseTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new ConvexError("Title is required");
  }
  if (trimmed.length > TASK_TITLE_MAX) {
    throw new ConvexError(`Title must be at most ${TASK_TITLE_MAX} characters`);
  }
  return trimmed;
}

/**
 * Validates an optional task description.
 *
 * @param description - Raw description or undefined
 * @returns Trimmed description, or undefined when empty
 * @throws ConvexError when over the max length
 */
export function parseOptionalDescription(description: string | undefined): string | undefined {
  if (description === undefined) {
    return undefined;
  }
  const trimmed = description.trim();
  if (trimmed.length > TASK_DESCRIPTION_MAX) {
    throw new ConvexError(`Description must be at most ${TASK_DESCRIPTION_MAX} characters`);
  }
  return trimmed || undefined;
}
