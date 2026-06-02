import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import { getOwnedTask } from "./tasks";

const taskId = "task_abc" as Id<"tasks">;

const ownedTask = {
  _id: taskId,
  _creationTime: 0,
  title: "Mine",
  description: undefined,
  completed: false,
  userId: "user_a",
  createdAt: 0,
  updatedAt: 0,
} satisfies Doc<"tasks">;

describe("getOwnedTask", () => {
  it("returns the task when the user owns it", async () => {
    const db = {
      get: async () => ownedTask,
    };

    await expect(getOwnedTask(db, taskId, "user_a")).resolves.toEqual(ownedTask);
  });

  it("throws when the task is missing", async () => {
    const db = { get: async () => null };

    await expect(getOwnedTask(db, taskId, "user_a")).rejects.toThrow(ConvexError);
    await expect(getOwnedTask(db, taskId, "user_a")).rejects.toThrow("Task not found");
  });

  it("throws when another user owns the task", async () => {
    const db = { get: async () => ownedTask };

    await expect(getOwnedTask(db, taskId, "user_b")).rejects.toThrow(ConvexError);
    await expect(getOwnedTask(db, taskId, "user_b")).rejects.toThrow("Not authorized");
  });
});
