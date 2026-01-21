/**
 * Tasks API - Example Convex queries and mutations.
 *
 * This demonstrates common patterns for CRUD operations with Convex.
 *
 * SETUP INSTRUCTIONS:
 * 1. Run `npx convex dev` from the repository root to scaffold Convex
 * 2. Rename this file from tasks.example.ts to tasks.ts
 * 3. Uncomment the code below and modify for your domain
 *
 * @see https://docs.convex.dev/functions
 */

// NOTE: Uncomment after running `npx convex dev` and setting up schema.ts
//
// import { ConvexError, v } from "convex/values";
// import { mutation, query } from "./_generated/server";
//
// /**
//  * List all tasks, optionally filtered by completion status.
//  *
//  * @example
//  * // In a React component:
//  * const tasks = useQuery(api.tasks.list);
//  * const completedTasks = useQuery(api.tasks.list, { completed: true });
//  */
// export const list = query({
//   args: {
//     completed: v.optional(v.boolean()),
//   },
//   handler: async (ctx, args) => {
//     // Optional: Get authenticated user
//     // const identity = await ctx.auth.getUserIdentity();
//
//     let tasksQuery = ctx.db.query("tasks");
//
//     if (args.completed !== undefined) {
//       tasksQuery = tasksQuery.withIndex("by_completed", (q) =>
//         q.eq("completed", args.completed)
//       );
//     }
//
//     return await tasksQuery.order("desc").collect();
//   },
// });
//
// /**
//  * Get a single task by ID.
//  *
//  * @example
//  * const task = useQuery(api.tasks.get, { id: taskId });
//  */
// export const get = query({
//   args: {
//     id: v.id("tasks"),
//   },
//   handler: async (ctx, args) => {
//     const task = await ctx.db.get(args.id);
//     if (!task) {
//       throw new ConvexError("Task not found");
//     }
//     return task;
//   },
// });
//
// /**
//  * Create a new task.
//  *
//  * @example
//  * const createTask = useMutation(api.tasks.create);
//  * await createTask({ title: "Buy groceries" });
//  */
// export const create = mutation({
//   args: {
//     title: v.string(),
//     description: v.optional(v.string()),
//   },
//   handler: async (ctx, args) => {
//     // Optional: Get authenticated user
//     // const identity = await ctx.auth.getUserIdentity();
//     // if (!identity) throw new ConvexError("Not authenticated");
//
//     const now = Date.now();
//
//     const taskId = await ctx.db.insert("tasks", {
//       title: args.title,
//       description: args.description,
//       completed: false,
//       // userId: identity?.subject,
//       createdAt: now,
//       updatedAt: now,
//     });
//
//     return taskId;
//   },
// });
//
// /**
//  * Update an existing task.
//  *
//  * @example
//  * const updateTask = useMutation(api.tasks.update);
//  * await updateTask({ id: taskId, title: "Updated title", completed: true });
//  */
// export const update = mutation({
//   args: {
//     id: v.id("tasks"),
//     title: v.optional(v.string()),
//     description: v.optional(v.string()),
//     completed: v.optional(v.boolean()),
//   },
//   handler: async (ctx, args) => {
//     const { id, ...updates } = args;
//
//     const existing = await ctx.db.get(id);
//     if (!existing) {
//       throw new ConvexError("Task not found");
//     }
//
//     // Optional: Check ownership
//     // const identity = await ctx.auth.getUserIdentity();
//     // if (existing.userId && existing.userId !== identity?.subject) {
//     //   throw new ConvexError("Not authorized");
//     // }
//
//     await ctx.db.patch(id, {
//       ...updates,
//       updatedAt: Date.now(),
//     });
//
//     return id;
//   },
// });
//
// /**
//  * Toggle a task's completion status.
//  *
//  * @example
//  * const toggleTask = useMutation(api.tasks.toggle);
//  * await toggleTask({ id: taskId });
//  */
// export const toggle = mutation({
//   args: {
//     id: v.id("tasks"),
//   },
//   handler: async (ctx, args) => {
//     const task = await ctx.db.get(args.id);
//     if (!task) {
//       throw new ConvexError("Task not found");
//     }
//
//     await ctx.db.patch(args.id, {
//       completed: !task.completed,
//       updatedAt: Date.now(),
//     });
//
//     return args.id;
//   },
// });
//
// /**
//  * Delete a task.
//  *
//  * @example
//  * const deleteTask = useMutation(api.tasks.remove);
//  * await deleteTask({ id: taskId });
//  */
// export const remove = mutation({
//   args: {
//     id: v.id("tasks"),
//   },
//   handler: async (ctx, args) => {
//     const task = await ctx.db.get(args.id);
//     if (!task) {
//       throw new ConvexError("Task not found");
//     }
//
//     // Optional: Check ownership
//     // const identity = await ctx.auth.getUserIdentity();
//     // if (task.userId && task.userId !== identity?.subject) {
//     //   throw new ConvexError("Not authorized");
//     // }
//
//     await ctx.db.delete(args.id);
//
//     return args.id;
//   },
// });

export {};
