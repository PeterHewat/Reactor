import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { parseOptionalDescription, parseTitle } from "../lib/validation";

type TaskDoc = Doc<"tasks">;

type TaskDbReader = {
  get: (id: Id<"tasks">) => Promise<TaskDoc | null>;
};

/**
 * Loads a task and verifies the caller owns it.
 *
 * @param db - Database reader
 * @param taskId - Task document id
 * @param userId - Authenticated user's subject
 * @returns The task document
 * @throws ConvexError when the task is missing or not owned by the user
 */
export async function getOwnedTask(
  db: TaskDbReader,
  taskId: Id<"tasks">,
  userId: string,
): Promise<TaskDoc> {
  const task = await db.get(taskId);
  if (!task) {
    throw new ConvexError("Task not found");
  }
  if (task.userId !== userId) {
    throw new ConvexError("Not authorized");
  }
  return task;
}

/**
 * Filters tasks by optional completion flag (client-side filter after index query).
 *
 * @param tasks - Tasks from the by_user index
 * @param completed - Optional completion filter
 * @returns Filtered task list
 */
export function filterTasksByCompleted(tasks: TaskDoc[], completed?: boolean): TaskDoc[] {
  if (completed === undefined) {
    return tasks;
  }
  return tasks.filter((task) => task.completed === completed);
}

/**
 * Builds insert payload for a new task.
 *
 * @param args - Raw create args
 * @param userId - Owner subject
 * @param now - Timestamp for createdAt/updatedAt
 * @returns Document fields for insert
 */
export function buildTaskInsert(
  args: { title: string; description?: string },
  userId: string,
  now: number,
): Omit<TaskDoc, "_id" | "_creationTime"> {
  return {
    title: parseTitle(args.title),
    description: parseOptionalDescription(args.description),
    completed: false,
    userId,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Builds patch fields for an update.
 *
 * @param task - Existing task
 * @param args - Partial update args
 * @param now - Timestamp for updatedAt
 * @returns Fields to pass to db.patch
 */
export function buildTaskPatch(
  task: TaskDoc,
  args: {
    title?: string;
    description?: string;
    completed?: boolean;
  },
  now: number,
): Pick<TaskDoc, "title" | "description" | "completed" | "updatedAt"> {
  const title = args.title !== undefined ? parseTitle(args.title) : task.title;
  const description =
    args.description !== undefined ? parseOptionalDescription(args.description) : task.description;

  return {
    title,
    description,
    completed: args.completed ?? task.completed,
    updatedAt: now,
  };
}
