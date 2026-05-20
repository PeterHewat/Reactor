import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Starter schema — extend or replace tables for your domain.
 *
 * @see https://docs.convex.dev/database/schemas
 */
export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_completed", ["completed"]),
});
