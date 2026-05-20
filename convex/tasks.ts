import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List tasks, optionally filtered by completion status.
 *
 * @example
 * const tasks = useQuery(api.tasks.list);
 */
export const list = query({
  args: {
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.completed === undefined) {
      return await ctx.db.query("tasks").order("desc").collect();
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_completed", (q) => q.eq("completed", args.completed!))
      .order("desc")
      .collect();
  },
});

/**
 * List tasks for the signed-in user (requires Clerk + Convex auth).
 *
 * @example
 * const myTasks = useQuery(api.tasks.listMine);
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/**
 * Create a task (no auth — starter sample).
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
    const title = args.title.trim();
    if (!title) {
      throw new ConvexError("Title is required");
    }

    const now = Date.now();

    return await ctx.db.insert("tasks", {
      title,
      description: args.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Create a task for the signed-in user (auth + ownership on `userId`).
 *
 * @example
 * const createTask = useMutation(api.tasks.createAuthenticated);
 */
export const createAuthenticated = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const title = args.title.trim();
    if (!title) {
      throw new ConvexError("Title is required");
    }

    const now = Date.now();

    return await ctx.db.insert("tasks", {
      title,
      description: args.description,
      completed: false,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
  },
});
