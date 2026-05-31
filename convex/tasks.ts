import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";
import {
  buildTaskInsert,
  buildTaskPatch,
  filterTasksByCompleted,
  getOwnedTask,
} from "./model/tasks";

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

    return filterTasksByCompleted(tasks, args.completed);
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
    const now = Date.now();

    return await ctx.db.insert("tasks", buildTaskInsert(args, identity.subject, now));
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
    const task = await getOwnedTask(ctx.db, args.id, identity.subject);
    const now = Date.now();

    await ctx.db.patch(args.id, buildTaskPatch(task, args, now));

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
    await getOwnedTask(ctx.db, args.id, identity.subject);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
