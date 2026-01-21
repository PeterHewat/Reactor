/**
 * Convex Database Schema - EXAMPLE
 *
 * This file defines your database tables and their structure.
 *
 * SETUP INSTRUCTIONS:
 * 1. Run `npx convex dev` from the repository root to scaffold Convex
 * 2. Rename this file from schema.example.ts to schema.ts
 * 3. Modify the schema to match your domain
 *
 * @see https://docs.convex.dev/database/schemas
 */

// NOTE: Uncomment and modify after running `npx convex dev`
//
// import { defineSchema, defineTable } from "convex/server";
// import { v } from "convex/values";
//
// export default defineSchema({
//   /**
//    * Tasks table - A simple example to demonstrate Convex patterns.
//    * Replace or extend this with your own domain models.
//    */
//   tasks: defineTable({
//     /** Task title */
//     title: v.string(),
//     /** Task description (optional) */
//     description: v.optional(v.string()),
//     /** Whether the task is completed */
//     completed: v.boolean(),
//     /** User ID from Clerk (when auth is enabled) */
//     userId: v.optional(v.string()),
//     /** Creation timestamp */
//     createdAt: v.number(),
//     /** Last update timestamp */
//     updatedAt: v.number(),
//   })
//     .index("by_user", ["userId"])
//     .index("by_completed", ["completed"]),
// });

export {};
