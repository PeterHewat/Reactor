import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

test("create inserts a task", async () => {
  const t = convexTest(schema, modules);

  const id = await t.mutation(api.tasks.create, { title: "Buy groceries" });
  const tasks = await t.query(api.tasks.list, {});

  expect(tasks).toHaveLength(1);
  const task = tasks[0]!;
  expect(task._id).toEqual(id);
  expect(task.title).toBe("Buy groceries");
  expect(task.completed).toBe(false);
});

test("create rejects empty title", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.tasks.create, { title: "   " })).rejects.toThrow("Title is required");
});

test("list filters by completed", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.tasks.create, { title: "Open task" });
  const doneId = await t.mutation(api.tasks.create, { title: "Done task" });
  await t.run(async (ctx) => {
    await ctx.db.patch(doneId, { completed: true });
  });

  const open = await t.query(api.tasks.list, { completed: false });
  const done = await t.query(api.tasks.list, { completed: true });

  expect(open).toHaveLength(1);
  expect(open[0]!.title).toBe("Open task");
  expect(done).toHaveLength(1);
  expect(done[0]!.title).toBe("Done task");
});

test("createAuthenticated requires identity", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.tasks.createAuthenticated, { title: "Secret" })).rejects.toThrow(
    "Not authenticated",
  );
});

test("createAuthenticated sets userId from identity", async () => {
  const t = convexTest(schema, modules);
  const asUser = t.withIdentity({ subject: "user_abc" });

  await asUser.mutation(api.tasks.createAuthenticated, { title: "Mine" });
  const mine = await asUser.query(api.tasks.listMine, {});
  const all = await t.query(api.tasks.list, {});

  expect(mine).toHaveLength(1);
  expect(mine[0]!.userId).toBe("user_abc");
  expect(all).toHaveLength(1);
});
