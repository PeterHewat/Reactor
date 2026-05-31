import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

/**
 * Convex-backed tasks data and mutations for the sample vertical slice.
 *
 * @returns Task list (undefined while loading) and mutation helpers
 *
 * @example
 * const { tasks, createTask, toggleCompleted, removeTask } = useTasks();
 */
export function useTasks() {
  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

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
