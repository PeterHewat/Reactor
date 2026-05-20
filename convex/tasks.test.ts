import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";
import { TASK_DESCRIPTION_MAX, TASK_TITLE_MAX } from "./lib/validation";

const userA = { subject: "user_a" };
const userB = { subject: "user_b" };

test("create inserts a task for the signed-in user", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  const id = await t.mutation(api.tasks.create, { title: "Buy groceries" });
  const tasks = await t.query(api.tasks.list, {});

  expect(tasks).toHaveLength(1);
  const task = tasks[0]!;
  expect(task._id).toEqual(id);
  expect(task.title).toBe("Buy groceries");
  expect(task.userId).toBe("user_a");
  expect(task.completed).toBe(false);
});

test("create requires authentication", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.tasks.create, { title: "Secret" })).rejects.toThrow(
    "Not authenticated",
  );
});

test("list requires authentication", async () => {
  const t = convexTest(schema, modules);

  await expect(t.query(api.tasks.list, {})).rejects.toThrow("Not authenticated");
});

test("create rejects empty title", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  await expect(t.mutation(api.tasks.create, { title: "   " })).rejects.toThrow("Title is required");
});

test("create rejects title over max length", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  await expect(
    t.mutation(api.tasks.create, { title: "x".repeat(TASK_TITLE_MAX + 1) }),
  ).rejects.toThrow(`Title must be at most ${TASK_TITLE_MAX} characters`);
});

test("list filters by completed for the current user only", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  await t.mutation(api.tasks.create, { title: "Open task" });
  const doneId = await t.mutation(api.tasks.create, { title: "Done task" });
  await t.mutation(api.tasks.update, { id: doneId, completed: true });

  const open = await t.query(api.tasks.list, { completed: false });
  const done = await t.query(api.tasks.list, { completed: true });

  expect(open).toHaveLength(1);
  expect(open[0]!.title).toBe("Open task");
  expect(done).toHaveLength(1);
  expect(done[0]!.title).toBe("Done task");
});

test("list does not return another user's tasks", async () => {
  const t = convexTest(schema, modules);
  const asA = t.withIdentity(userA);
  const asB = t.withIdentity(userB);

  await asA.mutation(api.tasks.create, { title: "User A task" });
  await asB.mutation(api.tasks.create, { title: "User B task" });

  const aTasks = await asA.query(api.tasks.list, {});
  const bTasks = await asB.query(api.tasks.list, {});

  expect(aTasks).toHaveLength(1);
  expect(aTasks[0]!.title).toBe("User A task");
  expect(bTasks).toHaveLength(1);
  expect(bTasks[0]!.title).toBe("User B task");
});

test("update modifies an owned task", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  const id = await t.mutation(api.tasks.create, { title: "Original" });
  await t.mutation(api.tasks.update, {
    id,
    title: "Updated",
    completed: true,
    description: "Notes",
  });

  const tasks = await t.query(api.tasks.list, {});
  expect(tasks[0]!.title).toBe("Updated");
  expect(tasks[0]!.completed).toBe(true);
  expect(tasks[0]!.description).toBe("Notes");
});

test("update rejects tasks owned by another user", async () => {
  const t = convexTest(schema, modules);
  const asA = t.withIdentity(userA);

  const id = await asA.mutation(api.tasks.create, { title: "Mine" });

  await expect(t.mutation(api.tasks.update, { id, title: "Hijacked" })).rejects.toThrow(
    "Not authenticated",
  );
  await expect(
    t.withIdentity(userB).mutation(api.tasks.update, { id, title: "Hijacked" }),
  ).rejects.toThrow("Not authorized");
});

test("remove deletes an owned task", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  const id = await t.mutation(api.tasks.create, { title: "Delete me" });
  await t.mutation(api.tasks.remove, { id });

  expect(await t.query(api.tasks.list, {})).toHaveLength(0);
});

test("remove rejects tasks owned by another user", async () => {
  const t = convexTest(schema, modules);
  const asA = t.withIdentity(userA);

  const id = await asA.mutation(api.tasks.create, { title: "Mine" });

  await expect(t.withIdentity(userB).mutation(api.tasks.remove, { id })).rejects.toThrow(
    "Not authorized",
  );
});

test("create rejects description over max length", async () => {
  const t = convexTest(schema, modules).withIdentity(userA);

  await expect(
    t.mutation(api.tasks.create, {
      title: "Ok",
      description: "x".repeat(TASK_DESCRIPTION_MAX + 1),
    }),
  ).rejects.toThrow(`Description must be at most ${TASK_DESCRIPTION_MAX} characters`);
});
