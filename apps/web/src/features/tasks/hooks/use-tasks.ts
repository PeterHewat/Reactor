import type { Id } from "@convex/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { tasksConvexApi } from "../convex-api";

/**
 * Convex-backed tasks data and mutations for the sample vertical slice.
 *
 * @returns Task list (undefined while loading) and mutation helpers
 *
 * @example
 * const { tasks, createTask, toggleCompleted, removeTask } = useTasks();
 */
export function useTasks() {
  const tasks = useQuery(tasksConvexApi.list, {});
  const createTask = useMutation(tasksConvexApi.create);
  const updateTask = useMutation(tasksConvexApi.update);
  const removeTask = useMutation(tasksConvexApi.remove);

  const createFromForm = useCallback(
    async (formData: FormData) => {
      const title = String(formData.get("title") ?? "").trim();
      if (!title) return;
      await createTask({ title });
    },
    [createTask],
  );

  const toggleCompleted = useCallback(
    async (id: Id<"tasks">, completed: boolean) => {
      await updateTask({ id, completed: !completed });
    },
    [updateTask],
  );

  const deleteTask = useCallback(
    async (id: Id<"tasks">) => {
      await removeTask({ id });
    },
    [removeTask],
  );

  return {
    tasks,
    createFromForm,
    toggleCompleted,
    deleteTask,
  };
}
