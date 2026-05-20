import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";
import { parseOptionalDescription, parseTitle } from "./lib/validation";

/**
 * Loads a task and verifies the caller owns it.
 *
 * @param ctx - Mutation context
 * @param taskId - Task document id
 * @param userId - Authenticated user's subject
 * @returns The task document
 * @throws ConvexError when the task is missing or not owned by the user
 */
async function getOwnedTask(
  ctx: { db: { get: (id: Id<"tasks">) => Promise<Doc<"tasks"> | null> } },
  taskId: Id<"tasks">,
  userId: string,
): Promise<Doc<"tasks">> {
  const task = await ctx.db.get(taskId);
  if (!task) {
    throw new ConvexError("Task not found");
  }
  if (task.userId !== userId) {
    throw new ConvexError("Not authorized");
  }
  return task;
}

/**
 * List tasks for the signed-in user, optionally filtered by completion status.
 *
 * @example
 * const tasks = useQuery(api.tasks.list, { completed: false });
 */
export const list = query({
  args: {
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    if (args.completed === undefined) {
      return tasks;
    }

    return tasks.filter((task) => task.completed === args.completed);
  },
});

/**
 * Create a task for the signed-in user.
 *
 * @example
 * const createTask = useMutation(api.tasks.create);
 * await createTask({ title: "Buy groceries" });
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const title = parseTitle(args.title);
    const description = parseOptionalDescription(args.description);
    const now = Date.now();

    return await ctx.db.insert("tasks", {
      title,
      description,
      completed: false,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a task owned by the signed-in user.
 *
 * @example
 * const updateTask = useMutation(api.tasks.update);
 * await updateTask({ id, title: "Updated title", completed: true });
 */
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const task = await getOwnedTask(ctx, args.id, identity.subject);

    const title = args.title !== undefined ? parseTitle(args.title) : task.title;
    const description =
      args.description !== undefined
        ? parseOptionalDescription(args.description)
        : task.description;

    await ctx.db.patch(args.id, {
      title,
      description,
      completed: args.completed ?? task.completed,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete a task owned by the signed-in user.
 *
 * @example
 * const removeTask = useMutation(api.tasks.remove);
 * await removeTask({ id });
 */
export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await getOwnedTask(ctx, args.id, identity.subject);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
